/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get } from 'lodash';
import type * as estypes from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { ElasticsearchClient } from 'src/core/server';
import {
  transformError,
  getIndexExists,
  getPolicyExists,
  setPolicy,
  createBootstrapIndex,
} from '@kbn/securitysolution-es-utils';
import type {
  SecuritySolutionApiRequestHandlerContext,
  SecuritySolutionPluginRouter,
} from '../../../../types';
import { DETECTION_ENGINE_INDEX_URL } from '../../../../../common/constants';
import { buildSiemResponse } from '../utils';
import {
  getSignalsTemplate,
  SIGNALS_TEMPLATE_VERSION,
  createBackwardsCompatibilityMapping,
} from './get_signals_template';
import { ensureMigrationCleanupPolicy } from '../../migrations/migration_cleanup';
import signalsPolicy from './signals_policy.json';
import { templateNeedsUpdate } from './check_template_version';
import { getIndexVersion } from './get_index_version';
import { isOutdated } from '../../migrations/helpers';

export const createIndexRoute = (router: SecuritySolutionPluginRouter) => {
  router.post(
    {
      path: DETECTION_ENGINE_INDEX_URL,
      validate: false,
      options: {
        tags: ['access:securitySolution'],
      },
    },
    async (context, _, response) => {
      const siemResponse = buildSiemResponse(response);

      try {
        const siemClient = context.securitySolution?.getAppClient();
        if (!siemClient) {
          return siemResponse.error({ statusCode: 404 });
        }
        await createDetectionIndex(context.securitySolution);
        return response.ok({ body: { acknowledged: true } });
      } catch (err) {
        const error = transformError(err);
        return siemResponse.error({
          body: error.message,
          statusCode: error.statusCode,
        });
      }
    }
  );
};

export const createDetectionIndex = async (
  context: SecuritySolutionApiRequestHandlerContext
): Promise<void> => {
  const config = context.getConfig();
  const esClient = context.core.elasticsearch.client.asCurrentUser;
  const siemClient = context.getAppClient();
  const spaceId = context.getSpaceId();
  const index = siemClient.getSignalsIndex();

  const indexExists = await getIndexExists(esClient, index);
  const { ruleRegistryEnabled } = config.experimentalFeatures;

  // If using the rule registry implementation, we don't want to create new .siem-signals indices -
  // only create/update resources if there are existing indices
  if (ruleRegistryEnabled && !indexExists) {
    return;
  }

  await ensureMigrationCleanupPolicy({ alias: index, esClient });
  const policyExists = await getPolicyExists(esClient, index);
  if (!policyExists) {
    await setPolicy(esClient, index, signalsPolicy);
  }

  const ruleDataService = context.getRuleDataService();
  const aadIndexAliasName = ruleDataService.getResourceName(`security.alerts-${spaceId}`);

  if (await templateNeedsUpdate({ alias: index, esClient })) {
    await esClient.indices.putIndexTemplate({
      name: index,
      body: getSignalsTemplate(index, spaceId, aadIndexAliasName) as Record<string, unknown>,
    });
  }
  // Check if the old legacy siem signals template exists and remove it
  try {
    await esClient.indices.deleteTemplate({ name: index });
  } catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
  }

  if (indexExists) {
    await addFieldAliasesToIndices({ esClient, index });
    // The internal user is used here because Elasticsearch requires the PUT alias requestor to have 'manage' permissions
    // for BOTH the index AND alias name. However, through 7.14 admins only needed permissions for .siem-signals (the index)
    // and not .alerts-security.alerts (the alias). From the security solution perspective, all .siem-signals-<space id>-*
    // indices should have an alias to .alerts-security.alerts-<space id> so it's safe to add those aliases as the internal user.
    await addIndexAliases({
      esClient: context.core.elasticsearch.client.asInternalUser,
      index,
      aadIndexAliasName,
    });
    const indexVersion = await getIndexVersion(esClient, index);
    if (isOutdated({ current: indexVersion, target: SIGNALS_TEMPLATE_VERSION })) {
      await esClient.indices.rollover({ alias: index });
    }
  } else {
    await createBootstrapIndex(esClient, index);
  }
};

const addFieldAliasesToIndices = async ({
  esClient,
  index,
}: {
  esClient: ElasticsearchClient;
  index: string;
}) => {
  const { body: indexMappings } = await esClient.indices.get({ index });
  for (const [indexName, mapping] of Object.entries(indexMappings)) {
    const currentVersion: number | undefined = get(mapping.mappings?._meta, 'version');
    const body = createBackwardsCompatibilityMapping(currentVersion ?? 0);
    await esClient.indices.putMapping({
      index: indexName,
      body,
      allow_no_indices: true,
    } as estypes.IndicesPutMappingRequest);
  }
};

const addIndexAliases = async ({
  esClient,
  index,
  aadIndexAliasName,
}: {
  esClient: ElasticsearchClient;
  index: string;
  aadIndexAliasName: string;
}) => {
  const { body: indices } = await esClient.indices.getAlias({ name: index });
  const aliasActions = {
    actions: Object.keys(indices).map((concreteIndexName) => {
      return {
        add: {
          index: concreteIndexName,
          alias: aadIndexAliasName,
          is_write_index: false,
        },
      };
    }),
  };
  await esClient.indices.updateAliases({ body: aliasActions });
};
