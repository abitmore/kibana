/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import './histogram.scss';
import moment, { unitOfTime } from 'moment-timezone';
import React, { useCallback, useMemo } from 'react';
import { EuiLoadingChart, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import dateMath from '@elastic/datemath';
import {
  Axis,
  BrushEndListener,
  XYBrushEvent,
  Chart,
  ElementClickListener,
  HistogramBarSeries,
  Position,
  ScaleType,
  Settings,
  TooltipType,
  XYChartElementEvent,
  GridLineStyle,
  AxisStyle,
  RecursivePartial,
} from '@elastic/charts';
import { IUiSettingsClient } from 'kibana/public';
import {
  CurrentTime,
  Endzones,
  getAdjustedInterval,
  renderEndzoneTooltip,
} from '../../../../../../../charts/public';
import { DataCharts$, DataChartsMessage } from '../../services/use_saved_search';
import { FetchStatus } from '../../../../types';
import { DiscoverServices } from '../../../../../build_services';
import { useDataState } from '../../utils/use_data_state';
import { LEGACY_TIME_AXIS } from '../../../../../../../charts/common';

export interface DiscoverHistogramProps {
  savedSearchData$: DataCharts$;
  timefilterUpdateHandler: (ranges: { from: number; to: number }) => void;
  services: DiscoverServices;
}

function getTimezone(uiSettings: IUiSettingsClient) {
  if (uiSettings.isDefault('dateFormat:tz')) {
    const detectedTimezone = moment.tz.guess();
    if (detectedTimezone) return detectedTimezone;
    else return moment().format('Z');
  } else {
    return uiSettings.get('dateFormat:tz', 'Browser');
  }
}

export function DiscoverHistogram({
  savedSearchData$,
  timefilterUpdateHandler,
  services,
}: DiscoverHistogramProps) {
  const chartTheme = services.theme.useChartsTheme();
  const chartBaseTheme = services.theme.useChartsBaseTheme();

  const dataState: DataChartsMessage = useDataState(savedSearchData$);

  const uiSettings = services.uiSettings;
  const timeZone = getTimezone(uiSettings);
  const { chartData, fetchStatus } = dataState;

  const onBrushEnd = useCallback(
    ({ x }: XYBrushEvent) => {
      if (!x) {
        return;
      }
      const [from, to] = x;
      timefilterUpdateHandler({ from, to });
    },
    [timefilterUpdateHandler]
  );

  const onElementClick = useCallback(
    (xInterval: number): ElementClickListener =>
      ([elementData]) => {
        const startRange = (elementData as XYChartElementEvent)[0].x;

        const range = {
          from: startRange,
          to: startRange + xInterval,
        };

        timefilterUpdateHandler(range);
      },
    [timefilterUpdateHandler]
  );

  const { timefilter } = services.data.query.timefilter;

  const { from, to } = timefilter.getAbsoluteTime();
  const dateFormat = useMemo(() => uiSettings.get('dateFormat'), [uiSettings]);

  const toMoment = useCallback(
    (datetime: moment.Moment | undefined) => {
      if (!datetime) {
        return '';
      }
      if (!dateFormat) {
        return String(datetime);
      }
      return datetime.format(dateFormat);
    },
    [dateFormat]
  );

  const timeRangeText = useMemo(() => {
    const timeRange = {
      from: dateMath.parse(from),
      to: dateMath.parse(to, { roundUp: true }),
    };
    return `${toMoment(timeRange.from)} - ${toMoment(timeRange.to)}`;
  }, [from, to, toMoment]);

  if (!chartData && fetchStatus === FetchStatus.LOADING) {
    return (
      <div className="dscHistogram" data-test-subj="discoverChart">
        <div className="dscChart__loading">
          <EuiText size="xs" color="subdued">
            <EuiLoadingChart mono size="l" />
            <EuiSpacer size="s" />
            <FormattedMessage id="discover.loadingChartResults" defaultMessage="Loading chart" />
          </EuiText>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  const formatXValue = (val: string) => {
    const xAxisFormat = chartData.xAxisFormat.params!.pattern;
    return moment(val).format(xAxisFormat);
  };

  const data = chartData.values;
  const isDarkMode = uiSettings.get('theme:darkMode');

  /*
   * Deprecation: [interval] on [date_histogram] is deprecated, use [fixed_interval] or [calendar_interval].
   * see https://github.com/elastic/kibana/issues/27410
   * TODO: Once the Discover query has been update, we should change the below to use the new field
   */
  const { intervalESValue, intervalESUnit, interval } = chartData.ordered;
  const xInterval = interval.asMilliseconds();

  const xValues = chartData.xAxisOrderedValues;
  const lastXValue = xValues[xValues.length - 1];

  const domain = chartData.ordered;
  const domainStart = domain.min.valueOf();
  const domainEnd = domain.max.valueOf();

  const domainMin = Math.min(data[0]?.x, domainStart);
  const domainMax = Math.max(domainEnd - xInterval, lastXValue);

  const xDomain = {
    min: domainMin,
    max: domainMax,
    minInterval: getAdjustedInterval(
      xValues,
      intervalESValue,
      intervalESUnit as unitOfTime.Base,
      timeZone
    ),
  };
  const tooltipProps = {
    headerFormatter: renderEndzoneTooltip(xInterval, domainStart, domainEnd, formatXValue),
    type: TooltipType.VerticalCursor,
  };

  const xAxisFormatter = services.data.fieldFormats.deserialize(chartData.yAxisFormat);

  const useLegacyTimeAxis = uiSettings.get(LEGACY_TIME_AXIS, false);
  const gridLineStyle: RecursivePartial<GridLineStyle> = useLegacyTimeAxis
    ? {}
    : { strokeWidth: 0.1, stroke: isDarkMode ? 'white' : 'black' };
  const verticalAxisStyle: RecursivePartial<AxisStyle> = useLegacyTimeAxis
    ? {}
    : {
        axisLine: {
          visible: false,
        },
        tickLabel: {
          fontSize: 11,
        },
      };
  const xAxisStyle: RecursivePartial<AxisStyle> = useLegacyTimeAxis
    ? {}
    : {
        axisLine: {
          stroke: isDarkMode ? 'lightgray' : 'darkgray',
          strokeWidth: 1,
        },
        tickLine: {
          size: 12,
          strokeWidth: 0.15,
          stroke: isDarkMode ? 'white' : 'black',
          padding: -10,
          visible: true,
        },
        tickLabel: {
          fontSize: 11,
          padding: 0,
          alignment: {
            vertical: Position.Bottom,
            horizontal: Position.Left,
          },
          offset: {
            x: 1.5,
            y: 0,
          },
        },
      };

  return (
    <React.Fragment>
      <div className="dscHistogram" data-test-subj="discoverChart" data-time-range={timeRangeText}>
        <Chart size="100%">
          <Settings
            xDomain={xDomain}
            onBrushEnd={onBrushEnd as BrushEndListener}
            onElementClick={onElementClick(xInterval)}
            tooltip={tooltipProps}
            theme={chartTheme}
            baseTheme={chartBaseTheme}
            allowBrushingLastHistogramBin={true}
          />
          <Axis
            id="discover-histogram-left-axis"
            position={Position.Left}
            ticks={2}
            integersOnly
            tickFormat={(value) => xAxisFormatter.convert(value)}
            gridLine={gridLineStyle}
            style={verticalAxisStyle}
          />
          <Axis
            id="discover-histogram-bottom-axis"
            position={Position.Bottom}
            tickFormat={formatXValue}
            timeAxisLayerCount={useLegacyTimeAxis ? 0 : 2}
            gridLine={gridLineStyle}
            style={xAxisStyle}
          />
          <CurrentTime isDarkMode={isDarkMode} domainEnd={domainEnd} />
          <Endzones
            isDarkMode={isDarkMode}
            domainStart={domainStart}
            domainEnd={domainEnd}
            interval={xDomain.minInterval}
            domainMin={xDomain.min}
            domainMax={xDomain.max}
          />
          <HistogramBarSeries
            id="discover-histogram"
            minBarHeight={2}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={data}
            yNice
            timeZone={timeZone}
            name={chartData.yAxisLabel}
          />
        </Chart>
      </div>
      <EuiText size="xs" className="dscHistogramTimeRange" textAlign="center">
        {timeRangeText}
      </EuiText>
    </React.Fragment>
  );
}
