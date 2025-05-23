/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  AreaSeries,
  Axis,
  BarSeries,
  Position,
  LineSeries,
  Settings,
  ScaleType,
  GeometryValue,
  XYChartSeriesIdentifier,
  SeriesNameFn,
  Fit,
  HorizontalAlignment,
  VerticalAlignment,
  LayoutDirection,
} from '@elastic/charts';
import { PaletteOutput } from 'src/plugins/charts/public';
import { calculateMinInterval, XYChart, XYChartRenderProps } from './expression';
import type { LensMultiTable } from '../../common';
import { layerTypes } from '../../common';
import { xyChart } from '../../common/expressions';
import {
  layerConfig,
  legendConfig,
  tickLabelsConfig,
  gridlinesConfig,
  XYArgs,
  LegendConfig,
  LayerArgs,
  AxesSettingsConfig,
  XYChartProps,
  labelsOrientationConfig,
  LabelsOrientationConfig,
} from '../../common/expressions';
import { Datatable, DatatableRow } from '../../../../../src/plugins/expressions/public';
import React from 'react';
import { shallow } from 'enzyme';
import { createMockExecutionContext } from '../../../../../src/plugins/expressions/common/mocks';
import { mountWithIntl } from '@kbn/test/jest';
import { chartPluginMock } from '../../../../../src/plugins/charts/public/mocks';
import { EmptyPlaceholder } from '../shared_components/empty_placeholder';
import { XyEndzones } from './x_domain';

const onClickValue = jest.fn();
const onSelectRange = jest.fn();

const chartSetupContract = chartPluginMock.createSetupContract();
const chartStartContract = chartPluginMock.createStartContract();

const chartsThemeService = chartSetupContract.theme;
const chartsActiveCursorService = chartStartContract.activeCursor;

const paletteService = chartPluginMock.createPaletteRegistry();

const mockPaletteOutput: PaletteOutput = {
  type: 'palette',
  name: 'mock',
  params: {},
};

const dateHistogramData: LensMultiTable = {
  type: 'lens_multitable',
  tables: {
    timeLayer: {
      type: 'datatable',
      rows: [
        {
          xAccessorId: 1585758120000,
          splitAccessorId: "Men's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585758360000,
          splitAccessorId: "Women's Accessories",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585758360000,
          splitAccessorId: "Women's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585759380000,
          splitAccessorId: "Men's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585759380000,
          splitAccessorId: "Men's Shoes",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585759380000,
          splitAccessorId: "Women's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585760700000,
          splitAccessorId: "Men's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585760760000,
          splitAccessorId: "Men's Clothing",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585760760000,
          splitAccessorId: "Men's Shoes",
          yAccessorId: 1,
        },
        {
          xAccessorId: 1585761120000,
          splitAccessorId: "Men's Shoes",
          yAccessorId: 1,
        },
      ],
      columns: [
        {
          id: 'xAccessorId',
          name: 'order_date per minute',
          meta: {
            type: 'date',
            field: 'order_date',
            source: 'esaggs',
            index: 'indexPatternId',
            sourceParams: {
              indexPatternId: 'indexPatternId',
              type: 'date_histogram',
              params: {
                field: 'order_date',
                timeRange: { from: '2020-04-01T16:14:16.246Z', to: '2020-04-01T17:15:41.263Z' },
                useNormalizedEsInterval: true,
                scaleMetricValues: false,
                interval: '1m',
                drop_partials: false,
                min_doc_count: 0,
                extended_bounds: {},
              },
            },
            params: { id: 'date', params: { pattern: 'HH:mm' } },
          },
        },
        {
          id: 'splitAccessorId',
          name: 'Top values of category.keyword',
          meta: {
            type: 'string',
            field: 'category.keyword',
            source: 'esaggs',
            index: 'indexPatternId',
            sourceParams: {
              indexPatternId: 'indexPatternId',
              type: 'terms',
              params: {
                field: 'category.keyword',
                orderBy: 'yAccessorId',
                order: 'desc',
                size: 3,
                otherBucket: false,
                otherBucketLabel: 'Other',
                missingBucket: false,
                missingBucketLabel: 'Missing',
              },
            },
            params: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
                parsedUrl: {
                  origin: 'http://localhost:5601',
                  pathname: '/jiy/app/kibana',
                  basePath: '/jiy',
                },
              },
            },
          },
        },
        {
          id: 'yAccessorId',
          name: 'Count of records',
          meta: {
            type: 'number',
            source: 'esaggs',
            index: 'indexPatternId',
            sourceParams: {
              indexPatternId: 'indexPatternId',
              params: {},
            },
            params: { id: 'number' },
          },
        },
      ],
    },
  },
  dateRange: {
    fromDate: new Date('2020-04-01T16:14:16.246Z'),
    toDate: new Date('2020-04-01T17:15:41.263Z'),
  },
};

const dateHistogramLayer: LayerArgs = {
  layerId: 'timeLayer',
  layerType: layerTypes.DATA,
  hide: false,
  xAccessor: 'xAccessorId',
  yScaleType: 'linear',
  xScaleType: 'time',
  isHistogram: true,
  splitAccessor: 'splitAccessorId',
  seriesType: 'bar_stacked',
  accessors: ['yAccessorId'],
  palette: mockPaletteOutput,
};

const createSampleDatatableWithRows = (rows: DatatableRow[]): Datatable => ({
  type: 'datatable',
  columns: [
    {
      id: 'a',
      name: 'a',
      meta: { type: 'number', params: { id: 'number', params: { pattern: '0,0.000' } } },
    },
    {
      id: 'b',
      name: 'b',
      meta: { type: 'number', params: { id: 'number', params: { pattern: '000,0' } } },
    },
    {
      id: 'c',
      name: 'c',
      meta: {
        type: 'date',
        field: 'order_date',
        sourceParams: { type: 'date-histogram', params: { interval: 'auto' } },
        params: { id: 'string' },
      },
    },
    { id: 'd', name: 'ColD', meta: { type: 'string' } },
  ],
  rows,
});

const sampleLayer: LayerArgs = {
  layerId: 'first',
  layerType: layerTypes.DATA,
  seriesType: 'line',
  xAccessor: 'c',
  accessors: ['a', 'b'],
  splitAccessor: 'd',
  columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
  xScaleType: 'ordinal',
  yScaleType: 'linear',
  isHistogram: false,
  palette: mockPaletteOutput,
};

const createArgsWithLayers = (layers: LayerArgs[] = [sampleLayer]): XYArgs => ({
  xTitle: '',
  yTitle: '',
  yRightTitle: '',
  legend: {
    type: 'lens_xy_legendConfig',
    isVisible: false,
    position: Position.Top,
  },
  valueLabels: 'hide',
  valuesInLegend: false,
  axisTitlesVisibilitySettings: {
    type: 'lens_xy_axisTitlesVisibilityConfig',
    x: true,
    yLeft: true,
    yRight: true,
  },
  tickLabelsVisibilitySettings: {
    type: 'lens_xy_tickLabelsConfig',
    x: true,
    yLeft: false,
    yRight: false,
  },
  labelsOrientation: {
    type: 'lens_xy_labelsOrientationConfig',
    x: 0,
    yLeft: -90,
    yRight: -45,
  },
  gridlinesVisibilitySettings: {
    type: 'lens_xy_gridlinesConfig',
    x: true,
    yLeft: false,
    yRight: false,
  },
  yLeftExtent: {
    mode: 'full',
    type: 'lens_xy_axisExtentConfig',
  },
  yRightExtent: {
    mode: 'full',
    type: 'lens_xy_axisExtentConfig',
  },
  layers,
});

function sampleArgs() {
  const data: LensMultiTable = {
    type: 'lens_multitable',
    tables: {
      first: createSampleDatatableWithRows([
        { a: 1, b: 2, c: 'I', d: 'Foo' },
        { a: 1, b: 5, c: 'J', d: 'Bar' },
      ]),
    },
    dateRange: {
      fromDate: new Date('2019-01-02T05:00:00.000Z'),
      toDate: new Date('2019-01-03T05:00:00.000Z'),
    },
  };

  const args: XYArgs = createArgsWithLayers();

  return { data, args };
}

function sampleArgsWithReferenceLine(value: number = 150) {
  const { data, args } = sampleArgs();

  return {
    data: {
      ...data,
      tables: {
        ...data.tables,
        referenceLine: {
          type: 'datatable',
          columns: [
            {
              id: 'referenceLine-a',
              meta: { params: { id: 'number' }, type: 'number' },
              name: 'Static value',
            },
          ],
          rows: [{ 'referenceLine-a': value }],
        },
      },
    } as LensMultiTable,
    args: {
      ...args,
      layers: [
        ...args.layers,
        {
          layerType: layerTypes.REFERENCELINE,
          accessors: ['referenceLine-a'],
          layerId: 'referenceLine',
          seriesType: 'line',
          xScaleType: 'linear',
          yScaleType: 'linear',
          palette: mockPaletteOutput,
          isHistogram: false,
          hide: true,
          yConfig: [{ axisMode: 'left', forAccessor: 'referenceLine-a', type: 'lens_xy_yConfig' }],
        },
      ],
    } as XYArgs,
  };
}

describe('xy_expression', () => {
  describe('configs', () => {
    test('legendConfig produces the correct arguments', () => {
      const args: LegendConfig = {
        isVisible: true,
        position: Position.Left,
      };

      const result = legendConfig.fn(null, args, createMockExecutionContext());

      expect(result).toEqual({
        type: 'lens_xy_legendConfig',
        ...args,
      });
    });

    test('layerConfig produces the correct arguments', () => {
      const args: LayerArgs = {
        layerId: 'first',
        layerType: layerTypes.DATA,
        seriesType: 'line',
        xAccessor: 'c',
        accessors: ['a', 'b'],
        splitAccessor: 'd',
        xScaleType: 'linear',
        yScaleType: 'linear',
        isHistogram: false,
        palette: mockPaletteOutput,
      };

      const result = layerConfig.fn(null, args, createMockExecutionContext());

      expect(result).toEqual({
        type: 'lens_xy_layer',
        ...args,
      });
    });
  });

  test('tickLabelsConfig produces the correct arguments', () => {
    const args: AxesSettingsConfig = {
      x: true,
      yLeft: false,
      yRight: false,
    };

    const result = tickLabelsConfig.fn(null, args, createMockExecutionContext());

    expect(result).toEqual({
      type: 'lens_xy_tickLabelsConfig',
      ...args,
    });
  });

  test('gridlinesConfig produces the correct arguments', () => {
    const args: AxesSettingsConfig = {
      x: true,
      yLeft: false,
      yRight: false,
    };

    const result = gridlinesConfig.fn(null, args, createMockExecutionContext());

    expect(result).toEqual({
      type: 'lens_xy_gridlinesConfig',
      ...args,
    });
  });

  test('labelsOrientationConfig produces the correct arguments', () => {
    const args: LabelsOrientationConfig = {
      x: 0,
      yLeft: -90,
      yRight: -45,
    };

    const result = labelsOrientationConfig.fn(null, args, createMockExecutionContext());

    expect(result).toEqual({
      type: 'lens_xy_labelsOrientationConfig',
      ...args,
    });
  });

  describe('xyChart', () => {
    test('it renders with the specified data and args', () => {
      const { data, args } = sampleArgs();
      const result = xyChart.fn(data, args, createMockExecutionContext());

      expect(result).toEqual({
        type: 'render',
        as: 'lens_xy_chart_renderer',
        value: { data, args },
      });
    });
  });

  describe('XYChart component', () => {
    let getFormatSpy: jest.Mock;
    let convertSpy: jest.Mock;
    let defaultProps: Omit<XYChartRenderProps, 'data' | 'args'>;

    const dataWithoutFormats: LensMultiTable = {
      type: 'lens_multitable',
      tables: {
        first: {
          type: 'datatable',
          columns: [
            { id: 'a', name: 'a', meta: { type: 'number' } },
            { id: 'b', name: 'b', meta: { type: 'number' } },
            { id: 'c', name: 'c', meta: { type: 'string' } },
            { id: 'd', name: 'd', meta: { type: 'string' } },
          ],
          rows: [
            { a: 1, b: 2, c: 'I', d: 'Row 1' },
            { a: 1, b: 5, c: 'J', d: 'Row 2' },
          ],
        },
      },
    };
    const dataWithFormats: LensMultiTable = {
      type: 'lens_multitable',
      tables: {
        first: {
          type: 'datatable',
          columns: [
            { id: 'a', name: 'a', meta: { type: 'number' } },
            { id: 'b', name: 'b', meta: { type: 'number' } },
            { id: 'c', name: 'c', meta: { type: 'string' } },
            { id: 'd', name: 'd', meta: { type: 'string', params: { id: 'custom' } } },
          ],
          rows: [
            { a: 1, b: 2, c: 'I', d: 'Row 1' },
            { a: 1, b: 5, c: 'J', d: 'Row 2' },
          ],
        },
      },
    };

    const getRenderedComponent = (data: LensMultiTable, args: XYArgs) => {
      return shallow(<XYChart {...defaultProps} data={data} args={args} />);
    };

    beforeEach(() => {
      convertSpy = jest.fn((x) => x);
      getFormatSpy = jest.fn();
      getFormatSpy.mockReturnValue({ convert: convertSpy });

      defaultProps = {
        formatFactory: getFormatSpy,
        timeZone: 'UTC',
        renderMode: 'view',
        chartsThemeService,
        chartsActiveCursorService,
        paletteService,
        minInterval: 50,
        onClickValue,
        onSelectRange,
        syncColors: false,
        useLegacyTimeAxis: false,
      };
    });

    test('it renders line', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'line' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(LineSeries)).toHaveLength(2);
      expect(component.find(LineSeries).at(0).prop('yAccessors')).toEqual(['a']);
      expect(component.find(LineSeries).at(1).prop('yAccessors')).toEqual(['b']);
    });

    describe('date range', () => {
      const timeSampleLayer: LayerArgs = {
        layerId: 'first',
        layerType: layerTypes.DATA,
        seriesType: 'line',
        xAccessor: 'c',
        accessors: ['a', 'b'],
        splitAccessor: 'd',
        columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
        xScaleType: 'time',
        yScaleType: 'linear',
        isHistogram: false,
        palette: mockPaletteOutput,
      };
      const multiLayerArgs = createArgsWithLayers([
        timeSampleLayer,
        {
          ...timeSampleLayer,
          layerId: 'second',
          seriesType: 'bar',
          xScaleType: 'time',
        },
      ]);
      test('it uses the full date range', () => {
        const { data, args } = sampleArgs();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={{
              ...data,
              dateRange: {
                fromDate: new Date('2019-01-02T05:00:00.000Z'),
                toDate: new Date('2019-01-03T05:00:00.000Z'),
              },
            }}
            args={{
              ...args,
              layers: [{ ...args.layers[0], seriesType: 'line', xScaleType: 'time' }],
            }}
            minInterval={undefined}
          />
        );
        expect(component.find(Settings).prop('xDomain')).toMatchInlineSnapshot(`
          Object {
            "max": 1546491600000,
            "min": 1546405200000,
            "minInterval": undefined,
          }
        `);
      });

      test('it uses passed in minInterval', () => {
        const data: LensMultiTable = {
          type: 'lens_multitable',
          tables: {
            first: createSampleDatatableWithRows([{ a: 1, b: 2, c: 'I', d: 'Foo' }]),
            second: createSampleDatatableWithRows([]),
          },
        };

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={{
              ...data,
              dateRange: {
                fromDate: new Date('2019-01-02T05:00:00.000Z'),
                toDate: new Date('2019-01-03T05:00:00.000Z'),
              },
            }}
            args={multiLayerArgs}
          />
        );

        // real auto interval is 30mins = 1800000
        expect(component.find(Settings).prop('xDomain')).toMatchInlineSnapshot(`
          Object {
            "max": 1546491600000,
            "min": 1546405200000,
            "minInterval": 50,
          }
        `);
      });

      describe('endzones', () => {
        const { args } = sampleArgs();
        const data: LensMultiTable = {
          type: 'lens_multitable',
          tables: {
            first: createSampleDatatableWithRows([
              { a: 1, b: 2, c: new Date('2021-04-22').valueOf(), d: 'Foo' },
              { a: 1, b: 2, c: new Date('2021-04-23').valueOf(), d: 'Foo' },
              { a: 1, b: 2, c: new Date('2021-04-24').valueOf(), d: 'Foo' },
            ]),
          },
          dateRange: {
            // first and last bucket are partial
            fromDate: new Date('2021-04-22T12:00:00.000Z'),
            toDate: new Date('2021-04-24T12:00:00.000Z'),
          },
        };
        const timeArgs: XYArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              seriesType: 'line',
              xScaleType: 'time',
              isHistogram: true,
              splitAccessor: undefined,
            },
          ],
        };

        test('it extends interval if data is exceeding it', () => {
          const component = shallow(
            <XYChart
              {...defaultProps}
              minInterval={24 * 60 * 60 * 1000}
              data={data}
              args={timeArgs}
            />
          );

          expect(component.find(Settings).prop('xDomain')).toEqual({
            // shortened to 24th midnight (elastic-charts automatically adds one min interval)
            max: new Date('2021-04-24').valueOf(),
            // extended to 22nd midnight because of first bucket
            min: new Date('2021-04-22').valueOf(),
            minInterval: 24 * 60 * 60 * 1000,
          });
        });

        test('it renders endzone component bridging gap between domain and extended domain', () => {
          const component = shallow(
            <XYChart
              {...defaultProps}
              minInterval={24 * 60 * 60 * 1000}
              data={data}
              args={timeArgs}
            />
          );

          expect(component.find(XyEndzones).dive().find('Endzones').props()).toEqual(
            expect.objectContaining({
              domainStart: new Date('2021-04-22T12:00:00.000Z').valueOf(),
              domainEnd: new Date('2021-04-24T12:00:00.000Z').valueOf(),
              domainMin: new Date('2021-04-22').valueOf(),
              domainMax: new Date('2021-04-24').valueOf(),
            })
          );
        });

        test('should pass enabled histogram mode and min interval to endzones component', () => {
          const component = shallow(
            <XYChart
              {...defaultProps}
              minInterval={24 * 60 * 60 * 1000}
              data={data}
              args={timeArgs}
            />
          );

          expect(component.find(XyEndzones).dive().find('Endzones').props()).toEqual(
            expect.objectContaining({
              interval: 24 * 60 * 60 * 1000,
              isFullBin: false,
            })
          );
        });

        test('should pass disabled histogram mode and min interval to endzones component', () => {
          const component = shallow(
            <XYChart
              {...defaultProps}
              minInterval={24 * 60 * 60 * 1000}
              data={data}
              args={{
                ...args,
                layers: [
                  {
                    ...args.layers[0],
                    seriesType: 'bar',
                    xScaleType: 'time',
                    isHistogram: true,
                  },
                ],
              }}
            />
          );

          expect(component.find(XyEndzones).dive().find('Endzones').props()).toEqual(
            expect.objectContaining({
              interval: 24 * 60 * 60 * 1000,
              isFullBin: true,
            })
          );
        });

        test('it does not render endzones if disabled via settings', () => {
          const component = shallow(
            <XYChart
              {...defaultProps}
              minInterval={24 * 60 * 60 * 1000}
              data={data}
              args={{ ...timeArgs, hideEndzones: true }}
            />
          );

          expect(component.find(XyEndzones).length).toEqual(0);
        });
      });
    });

    describe('y axis extents', () => {
      test('it passes custom y axis extents to elastic-charts axis spec', () => {
        const { data, args } = sampleArgs();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={data}
            args={{
              ...args,
              yLeftExtent: {
                type: 'lens_xy_axisExtentConfig',
                mode: 'custom',
                lowerBound: 123,
                upperBound: 456,
              },
            }}
          />
        );
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: 123,
          max: 456,
        });
      });

      test('it passes fit to bounds y axis extents to elastic-charts axis spec', () => {
        const { data, args } = sampleArgs();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={data}
            args={{
              ...args,
              yLeftExtent: {
                type: 'lens_xy_axisExtentConfig',
                mode: 'dataBounds',
              },
            }}
          />
        );
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: true,
          min: NaN,
          max: NaN,
        });
      });

      test('it does not allow fit for area chart', () => {
        const { data, args } = sampleArgs();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={data}
            args={{
              ...args,
              yLeftExtent: {
                type: 'lens_xy_axisExtentConfig',
                mode: 'dataBounds',
              },
              layers: [
                {
                  ...args.layers[0],
                  seriesType: 'area',
                },
              ],
            }}
          />
        );
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: NaN,
          max: NaN,
        });
      });

      test('it does not allow positive lower bound for bar', () => {
        const { data, args } = sampleArgs();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={data}
            args={{
              ...args,
              yLeftExtent: {
                type: 'lens_xy_axisExtentConfig',
                mode: 'custom',
                lowerBound: 123,
                upperBound: 456,
              },
              layers: [
                {
                  ...args.layers[0],
                  seriesType: 'bar',
                },
              ],
            }}
          />
        );
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: NaN,
          max: NaN,
        });
      });

      test('it does include referenceLine values when in full extent mode', () => {
        const { data, args } = sampleArgsWithReferenceLine();

        const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: 0,
          max: 150,
        });
      });

      test('it should ignore referenceLine values when set to custom extents', () => {
        const { data, args } = sampleArgsWithReferenceLine();

        const component = shallow(
          <XYChart
            {...defaultProps}
            data={data}
            args={{
              ...args,
              yLeftExtent: {
                type: 'lens_xy_axisExtentConfig',
                mode: 'custom',
                lowerBound: 123,
                upperBound: 456,
              },
            }}
          />
        );
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: 123,
          max: 456,
        });
      });

      test('it should work for negative values in referenceLines', () => {
        const { data, args } = sampleArgsWithReferenceLine(-150);

        const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);
        expect(component.find(Axis).find('[id="left"]').prop('domain')).toEqual({
          fit: false,
          min: -150,
          max: 5,
        });
      });
    });

    test('it has xDomain undefined if the x is not a time scale or a histogram', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{
            ...data,
            dateRange: {
              fromDate: new Date('2019-01-02T05:00:00.000Z'),
              toDate: new Date('2019-01-03T05:00:00.000Z'),
            },
          }}
          args={{
            ...args,
            layers: [{ ...args.layers[0], seriesType: 'line', xScaleType: 'linear' }],
          }}
        />
      );
      const xDomain = component.find(Settings).prop('xDomain');
      expect(xDomain).toEqual(undefined);
    });

    test('it uses min interval if interval is passed in and visualization is histogram', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          minInterval={101}
          data={data}
          args={{
            ...args,
            layers: [
              { ...args.layers[0], seriesType: 'line', xScaleType: 'linear', isHistogram: true },
            ],
          }}
        />
      );
      expect(component.find(Settings).prop('xDomain')).toEqual({
        minInterval: 101,
        min: NaN,
        max: NaN,
      });
    });

    test('disabled legend extra by default', () => {
      const { data, args } = sampleArgs();
      const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);
      expect(component.find(Settings).at(0).prop('showLegendExtra')).toEqual(false);
    });

    test('ignores legend extra for ordinal chart', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart {...defaultProps} data={data} args={{ ...args, valuesInLegend: true }} />
      );
      expect(component.find(Settings).at(0).prop('showLegendExtra')).toEqual(false);
    });

    test('shows legend extra for histogram chart', () => {
      const { args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={dateHistogramData}
          args={{
            ...args,
            layers: [dateHistogramLayer],
            valuesInLegend: true,
          }}
        />
      );
      expect(component.find(Settings).at(0).prop('showLegendExtra')).toEqual(true);
    });

    test('it renders bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'bar' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(2);
      expect(component.find(BarSeries).at(0).prop('yAccessors')).toEqual(['a']);
      expect(component.find(BarSeries).at(1).prop('yAccessors')).toEqual(['b']);
    });

    test('it renders area', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'area' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(AreaSeries)).toHaveLength(2);
      expect(component.find(AreaSeries).at(0).prop('yAccessors')).toEqual(['a']);
      expect(component.find(AreaSeries).at(1).prop('yAccessors')).toEqual(['b']);
    });

    test('it renders horizontal bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'bar_horizontal' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(2);
      expect(component.find(BarSeries).at(0).prop('yAccessors')).toEqual(['a']);
      expect(component.find(BarSeries).at(1).prop('yAccessors')).toEqual(['b']);
      expect(component.find(Settings).prop('rotation')).toEqual(90);
    });

    test('it renders regular bar empty placeholder for no results', () => {
      const { data, args } = sampleArgs();

      // send empty data to the chart
      data.tables.first.rows = [];

      const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);

      expect(component.find(BarSeries)).toHaveLength(0);
      expect(component.find(EmptyPlaceholder).prop('icon')).toBeDefined();
    });

    test('onBrushEnd returns correct context data for date histogram data', () => {
      const { args } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={dateHistogramData}
          args={{
            ...args,
            layers: [dateHistogramLayer],
          }}
        />
      );
      wrapper.find(Settings).first().prop('onBrushEnd')!({ x: [1585757732783, 1585758880838] });

      expect(onSelectRange).toHaveBeenCalledWith({
        column: 0,
        table: dateHistogramData.tables.timeLayer,
        range: [1585757732783, 1585758880838],
        timeFieldName: 'order_date',
      });
    });

    test('onBrushEnd returns correct context data for number histogram data', () => {
      const { args } = sampleArgs();

      const numberLayer: LayerArgs = {
        layerId: 'numberLayer',
        layerType: layerTypes.DATA,
        hide: false,
        xAccessor: 'xAccessorId',
        yScaleType: 'linear',
        xScaleType: 'linear',
        isHistogram: true,
        seriesType: 'bar_stacked',
        accessors: ['yAccessorId'],
        palette: mockPaletteOutput,
      };

      const numberHistogramData: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          numberLayer: {
            type: 'datatable',
            rows: [
              {
                xAccessorId: 5,
                yAccessorId: 1,
              },
              {
                xAccessorId: 7,
                yAccessorId: 1,
              },
              {
                xAccessorId: 8,
                yAccessorId: 1,
              },
              {
                xAccessorId: 10,
                yAccessorId: 1,
              },
            ],
            columns: [
              {
                id: 'xAccessorId',
                name: 'bytes',
                meta: { type: 'number' },
              },
              {
                id: 'yAccessorId',
                name: 'Count of records',
                meta: { type: 'number' },
              },
            ],
          },
        },
        dateRange: {
          fromDate: new Date('2020-04-01T16:14:16.246Z'),
          toDate: new Date('2020-04-01T17:15:41.263Z'),
        },
      };

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={numberHistogramData}
          args={{
            ...args,
            layers: [numberLayer],
          }}
        />
      );

      wrapper.find(Settings).first().prop('onBrushEnd')!({ x: [5, 8] });

      expect(onSelectRange).toHaveBeenCalledWith({
        column: 0,
        table: numberHistogramData.tables.numberLayer,
        range: [5, 8],
        timeFieldName: undefined,
      });
    });

    test('onBrushEnd is not set on non-interactive mode', () => {
      const { args, data } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart {...defaultProps} data={data} args={args} interactive={false} />
      );

      expect(wrapper.find(Settings).first().prop('onBrushEnd')).toBeUndefined();
    });

    test('allowBrushingLastHistogramBin is true for date histogram data', () => {
      const { args } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={dateHistogramData}
          args={{
            ...args,
            layers: [dateHistogramLayer],
          }}
        />
      );
      expect(wrapper.find(Settings).at(0).prop('allowBrushingLastHistogramBin')).toEqual(true);
    });

    test('onElementClick returns correct context data', () => {
      const geometry: GeometryValue = { x: 5, y: 1, accessor: 'y1', mark: null, datum: {} };
      const series = {
        key: 'spec{d}yAccessor{d}splitAccessors{b-2}',
        specId: 'd',
        yAccessor: 'd',
        splitAccessors: {},
        seriesKeys: [2, 'd'],
      };

      const { args, data } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                layerId: 'first',
                layerType: layerTypes.DATA,
                isHistogram: true,
                seriesType: 'bar_stacked',
                xAccessor: 'b',
                yScaleType: 'linear',
                xScaleType: 'time',
                splitAccessor: 'b',
                accessors: ['d'],
                columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
                palette: mockPaletteOutput,
              },
            ],
          }}
        />
      );

      wrapper.find(Settings).first().prop('onElementClick')!([
        [geometry, series as XYChartSeriesIdentifier],
      ]);

      expect(onClickValue).toHaveBeenCalledWith({
        data: [
          {
            column: 1,
            row: 1,
            table: data.tables.first,
            value: 5,
          },
          {
            column: 1,
            row: 0,
            table: data.tables.first,
            value: 2,
          },
        ],
      });
    });

    test('onElementClick returns correct context data for date histogram', () => {
      const geometry: GeometryValue = {
        x: 1585758120000,
        y: 1,
        accessor: 'y1',
        mark: null,
        datum: {},
      };
      const series = {
        key: 'spec{d}yAccessor{d}splitAccessors{b-2}',
        specId: 'd',
        yAccessor: 'yAccessorId',
        splitAccessors: {},
        seriesKeys: ['yAccessorId'],
      };

      const { args } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={dateHistogramData}
          args={{
            ...args,
            layers: [dateHistogramLayer],
          }}
        />
      );

      wrapper.find(Settings).first().prop('onElementClick')!([
        [geometry, series as XYChartSeriesIdentifier],
      ]);

      expect(onClickValue).toHaveBeenCalledWith({
        data: [
          {
            column: 0,
            row: 0,
            table: dateHistogramData.tables.timeLayer,
            value: 1585758120000,
          },
        ],
        timeFieldName: 'order_date',
      });
    });

    test('onElementClick returns correct context data for numeric histogram', () => {
      const { args } = sampleArgs();

      const numberLayer: LayerArgs = {
        layerId: 'numberLayer',
        layerType: layerTypes.DATA,
        hide: false,
        xAccessor: 'xAccessorId',
        yScaleType: 'linear',
        xScaleType: 'linear',
        isHistogram: true,
        seriesType: 'bar_stacked',
        accessors: ['yAccessorId'],
        palette: mockPaletteOutput,
      };

      const numberHistogramData: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          numberLayer: {
            type: 'datatable',
            rows: [
              {
                xAccessorId: 5,
                yAccessorId: 1,
              },
              {
                xAccessorId: 7,
                yAccessorId: 1,
              },
              {
                xAccessorId: 8,
                yAccessorId: 1,
              },
              {
                xAccessorId: 10,
                yAccessorId: 1,
              },
            ],
            columns: [
              {
                id: 'xAccessorId',
                name: 'bytes',
                meta: { type: 'number' },
              },
              {
                id: 'yAccessorId',
                name: 'Count of records',
                meta: { type: 'number' },
              },
            ],
          },
        },
        dateRange: {
          fromDate: new Date('2020-04-01T16:14:16.246Z'),
          toDate: new Date('2020-04-01T17:15:41.263Z'),
        },
      };
      const geometry: GeometryValue = {
        x: 5,
        y: 1,
        accessor: 'y1',
        mark: null,
        datum: {},
      };
      const series = {
        key: 'spec{d}yAccessor{d}splitAccessors{b-2}',
        specId: 'd',
        yAccessor: 'yAccessorId',
        splitAccessors: {},
        seriesKeys: ['yAccessorId'],
      };

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={numberHistogramData}
          args={{
            ...args,
            layers: [numberLayer],
          }}
        />
      );

      wrapper.find(Settings).first().prop('onElementClick')!([
        [geometry, series as XYChartSeriesIdentifier],
      ]);

      expect(onClickValue).toHaveBeenCalledWith({
        data: [
          {
            column: 0,
            row: 0,
            table: numberHistogramData.tables.numberLayer,
            value: 5,
          },
        ],
        timeFieldName: undefined,
      });
    });

    test('returns correct original data for ordinal x axis with special formatter', () => {
      const geometry: GeometryValue = { x: 'BAR', y: 1, accessor: 'y1', mark: null, datum: {} };
      const series = {
        key: 'spec{d}yAccessor{d}splitAccessors{b-2}',
        specId: 'd',
        yAccessor: 'a',
        splitAccessors: {},
        seriesKeys: ['a'],
      };

      const { args, data } = sampleArgs();

      convertSpy.mockImplementation((x) => (typeof x === 'string' ? x.toUpperCase() : x));

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                layerId: 'first',
                layerType: layerTypes.DATA,
                seriesType: 'line',
                xAccessor: 'd',
                accessors: ['a', 'b'],
                columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
                xScaleType: 'ordinal',
                yScaleType: 'linear',
                isHistogram: false,
                palette: mockPaletteOutput,
              },
            ],
          }}
        />
      );

      wrapper.find(Settings).first().prop('onElementClick')!([
        [geometry, series as XYChartSeriesIdentifier],
      ]);

      expect(onClickValue).toHaveBeenCalledWith({
        data: [
          {
            column: 3,
            row: 1,
            table: data.tables.first,
            value: 'Bar',
          },
        ],
      });
    });

    test('sets up correct yScaleType equal to binary_linear for bytes formatting', () => {
      const { args, data } = sampleArgs();
      data.tables.first.columns[0].meta = {
        type: 'number',
        params: { id: 'bytes', params: { pattern: '0,0.00b' } },
      };

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                layerId: 'first',
                layerType: layerTypes.DATA,
                seriesType: 'line',
                xAccessor: 'd',
                accessors: ['a', 'b'],
                columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
                xScaleType: 'ordinal',
                yScaleType: 'linear',
                isHistogram: false,
                palette: mockPaletteOutput,
              },
            ],
          }}
        />
      );

      expect(wrapper.find(LineSeries).at(0).prop('yScaleType')).toEqual('linear_binary');
    });

    test('allowBrushingLastHistogramBin should be fakse for ordinal data', () => {
      const { args, data } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                layerId: 'first',
                layerType: layerTypes.DATA,
                seriesType: 'line',
                xAccessor: 'd',
                accessors: ['a', 'b'],
                columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
                xScaleType: 'ordinal',
                yScaleType: 'linear',
                isHistogram: false,
                palette: mockPaletteOutput,
              },
            ],
          }}
        />
      );

      expect(wrapper.find(Settings).at(0).prop('allowBrushingLastHistogramBin')).toEqual(false);
    });

    test('onElementClick is not triggering event on non-interactive mode', () => {
      const { args, data } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart {...defaultProps} data={data} args={args} interactive={false} />
      );

      expect(wrapper.find(Settings).first().prop('onElementClick')).toBeUndefined();
    });

    test('legendAction is not triggering event on non-interactive mode', () => {
      const { args, data } = sampleArgs();

      const wrapper = mountWithIntl(
        <XYChart {...defaultProps} data={data} args={args} interactive={false} />
      );

      expect(wrapper.find(Settings).first().prop('legendAction')).toBeUndefined();
    });

    test('it renders stacked bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'bar_stacked' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(2);
      expect(component.find(BarSeries).at(0).prop('stackAccessors')).toHaveLength(1);
      expect(component.find(BarSeries).at(1).prop('stackAccessors')).toHaveLength(1);
    });

    test('it renders stacked area', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'area_stacked' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(AreaSeries)).toHaveLength(2);
      expect(component.find(AreaSeries).at(0).prop('stackAccessors')).toHaveLength(1);
      expect(component.find(AreaSeries).at(1).prop('stackAccessors')).toHaveLength(1);
    });

    test('it renders stacked horizontal bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [{ ...args.layers[0], seriesType: 'bar_horizontal_stacked' }],
          }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(2);
      expect(component.find(BarSeries).at(0).prop('stackAccessors')).toHaveLength(1);
      expect(component.find(BarSeries).at(1).prop('stackAccessors')).toHaveLength(1);
      expect(component.find(Settings).prop('rotation')).toEqual(90);
    });

    test('it renders stacked bar empty placeholder for no results', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                ...args.layers[0],
                xAccessor: undefined,
                splitAccessor: 'e',
                seriesType: 'bar_stacked',
              },
            ],
          }}
        />
      );

      expect(component.find(BarSeries)).toHaveLength(0);
      expect(component.find(EmptyPlaceholder).prop('icon')).toBeDefined();
    });

    test('it passes time zone to the series', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart {...defaultProps} data={data} args={args} timeZone="CEST" />
      );
      expect(component.find(LineSeries).at(0).prop('timeZone')).toEqual('CEST');
      expect(component.find(LineSeries).at(1).prop('timeZone')).toEqual('CEST');
    });

    test('it applies histogram mode to the series for single series', () => {
      const { data, args } = sampleArgs();
      const firstLayer: LayerArgs = {
        ...args.layers[0],
        accessors: ['b'],
        seriesType: 'bar',
        isHistogram: true,
      };
      delete firstLayer.splitAccessor;
      const component = shallow(
        <XYChart {...defaultProps} data={data} args={{ ...args, layers: [firstLayer] }} />
      );
      expect(component.find(BarSeries).at(0).prop('enableHistogramMode')).toEqual(true);
    });

    test('it does not apply histogram mode to more than one bar series for unstacked bar chart', () => {
      const { data, args } = sampleArgs();
      const firstLayer: LayerArgs = { ...args.layers[0], seriesType: 'bar', isHistogram: true };
      delete firstLayer.splitAccessor;
      const component = shallow(
        <XYChart {...defaultProps} data={data} args={{ ...args, layers: [firstLayer] }} />
      );
      expect(component.find(BarSeries).at(0).prop('enableHistogramMode')).toEqual(false);
      expect(component.find(BarSeries).at(1).prop('enableHistogramMode')).toEqual(false);
    });

    test('it applies histogram mode to more than one the series for unstacked line/area chart', () => {
      const { data, args } = sampleArgs();
      const firstLayer: LayerArgs = { ...args.layers[0], seriesType: 'line', isHistogram: true };
      delete firstLayer.splitAccessor;
      const secondLayer: LayerArgs = { ...args.layers[0], seriesType: 'line', isHistogram: true };
      delete secondLayer.splitAccessor;
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [firstLayer, secondLayer] }}
        />
      );
      expect(component.find(LineSeries).at(0).prop('enableHistogramMode')).toEqual(true);
      expect(component.find(LineSeries).at(1).prop('enableHistogramMode')).toEqual(true);
    });

    test('it applies histogram mode to the series for stacked series', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [
              {
                ...args.layers[0],
                seriesType: 'bar_stacked',
                isHistogram: true,
              },
            ],
          }}
        />
      );
      expect(component.find(BarSeries).at(0).prop('enableHistogramMode')).toEqual(true);
      expect(component.find(BarSeries).at(1).prop('enableHistogramMode')).toEqual(true);
    });

    test('it does not apply histogram mode for splitted series', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{
            ...args,
            layers: [{ ...args.layers[0], seriesType: 'bar', isHistogram: true }],
          }}
        />
      );
      expect(component.find(BarSeries).at(0).prop('enableHistogramMode')).toEqual(false);
      expect(component.find(BarSeries).at(1).prop('enableHistogramMode')).toEqual(false);
    });

    describe('y axes', () => {
      test('single axis if possible', () => {
        const args = createArgsWithLayers();

        const component = getRenderedComponent(dataWithoutFormats, args);
        const axes = component.find(Axis);
        expect(axes).toHaveLength(2);
      });

      test('multiple axes because of config', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a', 'b'],
              yConfig: [
                {
                  forAccessor: 'a',
                  axisMode: 'left',
                },
                {
                  forAccessor: 'b',
                  axisMode: 'right',
                },
              ],
            },
          ],
        } as XYArgs;

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const axes = component.find(Axis);
        expect(axes).toHaveLength(3);
        expect(component.find(LineSeries).at(0).prop('groupId')).toEqual(
          axes.at(1).prop('groupId')
        );
        expect(component.find(LineSeries).at(1).prop('groupId')).toEqual(
          axes.at(2).prop('groupId')
        );
      });

      test('multiple axes because of incompatible formatters', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['c', 'd'],
            },
          ],
        } as XYArgs;

        const component = getRenderedComponent(dataWithFormats, newArgs);
        const axes = component.find(Axis);
        expect(axes).toHaveLength(3);
        expect(component.find(LineSeries).at(0).prop('groupId')).toEqual(
          axes.at(1).prop('groupId')
        );
        expect(component.find(LineSeries).at(1).prop('groupId')).toEqual(
          axes.at(2).prop('groupId')
        );
      });

      test('single axis despite different formatters if enforced', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['c', 'd'],
              yConfig: [
                {
                  forAccessor: 'c',
                  axisMode: 'left',
                },
                {
                  forAccessor: 'd',
                  axisMode: 'left',
                },
              ],
            },
          ],
        } as XYArgs;

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const axes = component.find(Axis);
        expect(axes).toHaveLength(2);
      });
    });

    describe('y series coloring', () => {
      test('color is applied to chart for multiple series', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              splitAccessor: undefined,
              accessors: ['a', 'b'],
              yConfig: [
                {
                  forAccessor: 'a',
                  color: '#550000',
                },
                {
                  forAccessor: 'b',
                  color: '#FFFF00',
                },
              ],
            },
            {
              ...args.layers[0],
              splitAccessor: undefined,
              accessors: ['c'],
              yConfig: [
                {
                  forAccessor: 'c',
                  color: '#FEECDF',
                },
              ],
            },
          ],
        } as XYArgs;

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        expect(
          (component.find(LineSeries).at(0).prop('color') as Function)!({
            yAccessor: 'a',
            seriesKeys: ['a'],
          })
        ).toEqual('#550000');
        expect(
          (component.find(LineSeries).at(1).prop('color') as Function)!({
            yAccessor: 'b',
            seriesKeys: ['b'],
          })
        ).toEqual('#FFFF00');
        expect(
          (component.find(LineSeries).at(2).prop('color') as Function)!({
            yAccessor: 'c',
            seriesKeys: ['c'],
          })
        ).toEqual('#FEECDF');
      });
      test('color is not applied to chart when splitAccessor is defined or when yConfig is not configured', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              yConfig: [
                {
                  forAccessor: 'a',
                  color: '#550000',
                },
              ],
            },
            {
              ...args.layers[0],
              splitAccessor: undefined,
              accessors: ['c'],
            },
          ],
        } as XYArgs;

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        expect(
          (component.find(LineSeries).at(0).prop('color') as Function)!({
            yAccessor: 'a',
            seriesKeys: ['a'],
          })
        ).toEqual('blue');
        expect(
          (component.find(LineSeries).at(1).prop('color') as Function)!({
            yAccessor: 'c',
            seriesKeys: ['c'],
          })
        ).toEqual('blue');
      });
    });

    describe('provides correct series naming', () => {
      const nameFnArgs = {
        seriesKeys: [],
        key: '',
        specId: 'a',
        yAccessor: '',
        splitAccessors: new Map(),
      };

      test('simplest xy chart without human-readable name', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              splitAccessor: undefined,
              columnToLabel: '',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn = component.find(LineSeries).prop('name') as SeriesNameFn;

        // In this case, the ID is used as the name. This shouldn't happen in practice
        expect(nameFn({ ...nameFnArgs, seriesKeys: ['a'] }, false)).toEqual('');
        expect(nameFn({ ...nameFnArgs, seriesKeys: ['nonsense'] }, false)).toEqual('');
      });

      test('simplest xy chart with empty name', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              splitAccessor: undefined,
              columnToLabel: '{"a":""}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn = component.find(LineSeries).prop('name') as SeriesNameFn;

        // In this case, the ID is used as the name. This shouldn't happen in practice
        expect(nameFn({ ...nameFnArgs, seriesKeys: ['a'] }, false)).toEqual('');
        expect(nameFn({ ...nameFnArgs, seriesKeys: ['nonsense'] }, false)).toEqual('');
      });

      test('simplest xy chart with human-readable name', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              splitAccessor: undefined,
              columnToLabel: '{"a":"Column A"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn = component.find(LineSeries).prop('name') as SeriesNameFn;

        expect(nameFn({ ...nameFnArgs, seriesKeys: ['a'] }, false)).toEqual('Column A');
      });

      test('multiple y accessors', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a', 'b'],
              splitAccessor: undefined,
              columnToLabel: '{"a": "Label A"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn1 = component.find(LineSeries).at(0).prop('name') as SeriesNameFn;
        const nameFn2 = component.find(LineSeries).at(1).prop('name') as SeriesNameFn;

        // This accessor has a human-readable name
        expect(nameFn1({ ...nameFnArgs, seriesKeys: ['a'] }, false)).toEqual('Label A');
        // This accessor does not
        expect(nameFn2({ ...nameFnArgs, seriesKeys: ['b'] }, false)).toEqual('');
        expect(nameFn1({ ...nameFnArgs, seriesKeys: ['nonsense'] }, false)).toEqual('');
      });

      test('split series without formatting and single y accessor', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              splitAccessor: 'd',
              columnToLabel: '{"a": "Label A"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn = component.find(LineSeries).prop('name') as SeriesNameFn;

        expect(nameFn({ ...nameFnArgs, seriesKeys: ['split1', 'a'] }, false)).toEqual('split1');
      });

      test('split series with formatting and single y accessor', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a'],
              splitAccessor: 'd',
              columnToLabel: '{"a": "Label A"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithFormats, newArgs);
        const nameFn = component.find(LineSeries).prop('name') as SeriesNameFn;

        convertSpy.mockReturnValueOnce('formatted');
        expect(nameFn({ ...nameFnArgs, seriesKeys: ['split1', 'a'] }, false)).toEqual('formatted');
        expect(getFormatSpy).toHaveBeenCalledWith({ id: 'custom' });
      });

      test('split series without formatting with multiple y accessors', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a', 'b'],
              splitAccessor: 'd',
              columnToLabel: '{"a": "Label A","b": "Label B"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithoutFormats, newArgs);
        const nameFn1 = component.find(LineSeries).at(0).prop('name') as SeriesNameFn;
        const nameFn2 = component.find(LineSeries).at(0).prop('name') as SeriesNameFn;

        expect(nameFn1({ ...nameFnArgs, seriesKeys: ['split1', 'a'] }, false)).toEqual(
          'split1 - Label A'
        );
        expect(nameFn2({ ...nameFnArgs, seriesKeys: ['split1', 'b'] }, false)).toEqual(
          'split1 - Label B'
        );
      });

      test('split series with formatting with multiple y accessors', () => {
        const args = createArgsWithLayers();
        const newArgs = {
          ...args,
          layers: [
            {
              ...args.layers[0],
              accessors: ['a', 'b'],
              splitAccessor: 'd',
              columnToLabel: '{"a": "Label A","b": "Label B"}',
            },
          ],
        };

        const component = getRenderedComponent(dataWithFormats, newArgs);
        const nameFn1 = component.find(LineSeries).at(0).prop('name') as SeriesNameFn;
        const nameFn2 = component.find(LineSeries).at(1).prop('name') as SeriesNameFn;

        convertSpy.mockReturnValueOnce('formatted1').mockReturnValueOnce('formatted2');
        expect(nameFn1({ ...nameFnArgs, seriesKeys: ['split1', 'a'] }, false)).toEqual(
          'formatted1 - Label A'
        );
        expect(nameFn2({ ...nameFnArgs, seriesKeys: ['split1', 'b'] }, false)).toEqual(
          'formatted2 - Label B'
        );
      });
    });

    test('it set the scale of the x axis according to the args prop', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], xScaleType: 'ordinal' }] }}
        />
      );
      expect(component.find(LineSeries).at(0).prop('xScaleType')).toEqual(ScaleType.Ordinal);
      expect(component.find(LineSeries).at(1).prop('xScaleType')).toEqual(ScaleType.Ordinal);
    });

    test('it set the scale of the y axis according to the args prop', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], yScaleType: 'sqrt' }] }}
        />
      );
      expect(component.find(LineSeries).at(0).prop('yScaleType')).toEqual(ScaleType.Sqrt);
      expect(component.find(LineSeries).at(1).prop('yScaleType')).toEqual(ScaleType.Sqrt);
    });

    test('it gets the formatter for the x axis', () => {
      const { data, args } = sampleArgs();

      shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      expect(getFormatSpy).toHaveBeenCalledWith({ id: 'string' });
    });

    test('it gets the formatter for the y axis if there is only one accessor', () => {
      const { data, args } = sampleArgs();

      shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{ ...args, layers: [{ ...args.layers[0], accessors: ['a'] }] }}
        />
      );
      expect(getFormatSpy).toHaveBeenCalledWith({
        id: 'number',
        params: { pattern: '0,0.000' },
      });
    });

    test('it should pass the formatter function to the axis', () => {
      const { data, args } = sampleArgs();

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const tickFormatter = instance.find(Axis).first().prop('tickFormat');

      if (!tickFormatter) {
        throw new Error('tickFormatter prop not found');
      }

      tickFormatter('I');

      expect(convertSpy).toHaveBeenCalledWith('I');
    });

    test('it should set the tickLabel visibility on the x axis if the tick labels is hidden', () => {
      const { data, args } = sampleArgs();

      args.tickLabelsVisibilitySettings = {
        x: false,
        yLeft: true,
        yRight: true,
        type: 'lens_xy_tickLabelsConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).first().prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          visible: false,
        },
      });
    });

    test('it should set the tickLabel visibility on the y axis if the tick labels is hidden', () => {
      const { data, args } = sampleArgs();

      args.tickLabelsVisibilitySettings = {
        x: true,
        yLeft: false,
        yRight: false,
        type: 'lens_xy_tickLabelsConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).at(1).prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          visible: false,
        },
      });
    });

    test('it should set the tickLabel visibility on the x axis if the tick labels is shown', () => {
      const { data, args } = sampleArgs();

      args.tickLabelsVisibilitySettings = {
        x: true,
        yLeft: true,
        yRight: true,
        type: 'lens_xy_tickLabelsConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).first().prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          visible: true,
        },
      });
    });

    test('it should set the tickLabel orientation on the x axis', () => {
      const { data, args } = sampleArgs();

      args.labelsOrientation = {
        x: -45,
        yLeft: 0,
        yRight: -90,
        type: 'lens_xy_labelsOrientationConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).first().prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          rotation: -45,
        },
      });
    });

    test('it should set the tickLabel visibility on the y axis if the tick labels is shown', () => {
      const { data, args } = sampleArgs();

      args.tickLabelsVisibilitySettings = {
        x: false,
        yLeft: true,
        yRight: true,
        type: 'lens_xy_tickLabelsConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).at(1).prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          visible: true,
        },
      });
    });

    test('it should set the tickLabel orientation on the y axis', () => {
      const { data, args } = sampleArgs();

      args.labelsOrientation = {
        x: -45,
        yLeft: -90,
        yRight: -90,
        type: 'lens_xy_labelsOrientationConfig',
      };

      const instance = shallow(<XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />);

      const axisStyle = instance.find(Axis).at(1).prop('style');

      expect(axisStyle).toMatchObject({
        tickLabel: {
          rotation: -90,
        },
      });
    });

    test('it should remove invalid rows', () => {
      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: {
            type: 'datatable',
            columns: [
              { id: 'a', name: 'a', meta: { type: 'number' } },
              { id: 'b', name: 'b', meta: { type: 'number' } },
              { id: 'c', name: 'c', meta: { type: 'string' } },
            ],
            rows: [
              { a: undefined, b: 2, c: 'I', d: 'Row 1' },
              { a: 1, b: 5, c: 'J', d: 'Row 2' },
            ],
          },
          second: {
            type: 'datatable',
            columns: [
              { id: 'a', name: 'a', meta: { type: 'number' } },
              { id: 'b', name: 'b', meta: { type: 'number' } },
              { id: 'c', name: 'c', meta: { type: 'string' } },
            ],
            rows: [
              { a: undefined, b: undefined, c: undefined },
              { a: undefined, b: undefined, c: undefined },
            ],
          },
        },
      };

      const args: XYArgs = {
        xTitle: '',
        yTitle: '',
        yRightTitle: '',
        legend: { type: 'lens_xy_legendConfig', isVisible: false, position: Position.Top },
        valueLabels: 'hide',
        tickLabelsVisibilitySettings: {
          type: 'lens_xy_tickLabelsConfig',
          x: true,
          yLeft: true,
          yRight: true,
        },
        gridlinesVisibilitySettings: {
          type: 'lens_xy_gridlinesConfig',
          x: true,
          yLeft: false,
          yRight: false,
        },
        labelsOrientation: {
          type: 'lens_xy_labelsOrientationConfig',
          x: 0,
          yLeft: 0,
          yRight: 0,
        },
        yLeftExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        yRightExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        layers: [
          {
            layerId: 'first',
            layerType: layerTypes.DATA,
            seriesType: 'line',
            xAccessor: 'a',
            accessors: ['c'],
            splitAccessor: 'b',
            columnToLabel: '',
            xScaleType: 'ordinal',
            yScaleType: 'linear',
            isHistogram: false,
            palette: mockPaletteOutput,
          },
          {
            layerId: 'second',
            layerType: layerTypes.DATA,
            seriesType: 'line',
            xAccessor: 'a',
            accessors: ['c'],
            splitAccessor: 'b',
            columnToLabel: '',
            xScaleType: 'ordinal',
            yScaleType: 'linear',
            isHistogram: false,
            palette: mockPaletteOutput,
          },
        ],
      };

      const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);

      const series = component.find(LineSeries);

      // Only one series should be rendered, even though 2 are configured
      // This one series should only have one row, even though 2 are sent
      expect(series.prop('data')).toEqual([{ a: 1, b: 5, c: 'J', d: 'Row 2' }]);
    });

    test('it should not remove rows with falsy but non-undefined values', () => {
      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: {
            type: 'datatable',
            columns: [
              { id: 'a', name: 'a', meta: { type: 'number' } },
              { id: 'b', name: 'b', meta: { type: 'number' } },
              { id: 'c', name: 'c', meta: { type: 'number' } },
            ],
            rows: [
              { a: 0, b: 2, c: 5 },
              { a: 1, b: 0, c: 7 },
            ],
          },
        },
      };

      const args: XYArgs = {
        xTitle: '',
        yTitle: '',
        yRightTitle: '',
        legend: { type: 'lens_xy_legendConfig', isVisible: false, position: Position.Top },
        valueLabels: 'hide',
        tickLabelsVisibilitySettings: {
          type: 'lens_xy_tickLabelsConfig',
          x: true,
          yLeft: false,
          yRight: false,
        },
        gridlinesVisibilitySettings: {
          type: 'lens_xy_gridlinesConfig',
          x: true,
          yLeft: false,
          yRight: false,
        },
        labelsOrientation: {
          type: 'lens_xy_labelsOrientationConfig',
          x: 0,
          yLeft: 0,
          yRight: 0,
        },
        yLeftExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        yRightExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        layers: [
          {
            layerId: 'first',
            layerType: layerTypes.DATA,
            seriesType: 'line',
            xAccessor: 'a',
            accessors: ['c'],
            splitAccessor: 'b',
            columnToLabel: '',
            xScaleType: 'ordinal',
            yScaleType: 'linear',
            isHistogram: false,
            palette: mockPaletteOutput,
          },
        ],
      };

      const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);

      const series = component.find(LineSeries);

      expect(series.prop('data')).toEqual([
        { a: 0, b: 2, c: 5 },
        { a: 1, b: 0, c: 7 },
      ]);
    });

    test('it should show legend for split series, even with one row', () => {
      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: {
            type: 'datatable',
            columns: [
              { id: 'a', name: 'a', meta: { type: 'number' } },
              { id: 'b', name: 'b', meta: { type: 'number' } },
              { id: 'c', name: 'c', meta: { type: 'string' } },
            ],
            rows: [{ a: 1, b: 5, c: 'J' }],
          },
        },
      };

      const args: XYArgs = {
        xTitle: '',
        yTitle: '',
        yRightTitle: '',
        legend: { type: 'lens_xy_legendConfig', isVisible: true, position: Position.Top },
        valueLabels: 'hide',
        tickLabelsVisibilitySettings: {
          type: 'lens_xy_tickLabelsConfig',
          x: true,
          yLeft: false,
          yRight: false,
        },
        gridlinesVisibilitySettings: {
          type: 'lens_xy_gridlinesConfig',
          x: true,
          yLeft: false,
          yRight: false,
        },
        labelsOrientation: {
          type: 'lens_xy_labelsOrientationConfig',
          x: 0,
          yLeft: 0,
          yRight: 0,
        },
        yLeftExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        yRightExtent: {
          mode: 'full',
          type: 'lens_xy_axisExtentConfig',
        },
        layers: [
          {
            layerId: 'first',
            layerType: layerTypes.DATA,
            seriesType: 'line',
            xAccessor: 'a',
            accessors: ['c'],
            splitAccessor: 'b',
            columnToLabel: '',
            xScaleType: 'ordinal',
            yScaleType: 'linear',
            isHistogram: false,
            palette: mockPaletteOutput,
          },
        ],
      };

      const component = shallow(<XYChart {...defaultProps} data={data} args={args} />);

      expect(component.find(Settings).prop('showLegend')).toEqual(true);
    });

    test('it should always show legend if showSingleSeries is set', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{
            ...args,
            layers: [{ ...args.layers[0], accessors: ['a'], splitAccessor: undefined }],
            legend: { ...args.legend, isVisible: true, showSingleSeries: true },
          }}
        />
      );

      expect(component.find(Settings).prop('showLegend')).toEqual(true);
    });

    test('it should populate the correct legendPosition if isInside is set', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{
            ...args,
            layers: [{ ...args.layers[0], accessors: ['a'], splitAccessor: undefined }],
            legend: { ...args.legend, isVisible: true, isInside: true },
          }}
        />
      );

      expect(component.find(Settings).prop('legendPosition')).toEqual({
        vAlign: VerticalAlignment.Top,
        hAlign: HorizontalAlignment.Right,
        direction: LayoutDirection.Vertical,
        floating: true,
        floatingColumns: 1,
      });
    });

    test('it not show legend if isVisible is set to false', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{
            ...args,
            legend: { ...args.legend, isVisible: false },
          }}
        />
      );

      expect(component.find(Settings).prop('showLegend')).toEqual(false);
    });

    test('it should show legend on right side', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{
            ...args,
            legend: { ...args.legend, position: 'top' },
          }}
        />
      );

      expect(component.find(Settings).prop('legendPosition')).toEqual('top');
    });

    test('it should apply the fitting function to all non-bar series', () => {
      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: createSampleDatatableWithRows([
            { a: 1, b: 2, c: 'I', d: 'Foo' },
            { a: 1, b: 5, c: 'J', d: 'Bar' },
          ]),
        },
      };

      const args: XYArgs = createArgsWithLayers([
        { ...sampleLayer, accessors: ['a'] },
        { ...sampleLayer, seriesType: 'bar', accessors: ['a'] },
        { ...sampleLayer, seriesType: 'area', accessors: ['a'] },
        { ...sampleLayer, seriesType: 'area_stacked', accessors: ['a'] },
      ]);

      const component = shallow(
        <XYChart
          {...defaultProps}
          data={{ ...data }}
          args={{ ...args, fittingFunction: 'Carry' }}
        />
      );

      expect(component.find(LineSeries).prop('fit')).toEqual({ type: Fit.Carry });
      expect(component.find(BarSeries).prop('fit')).toEqual(undefined);
      expect(component.find(AreaSeries).at(0).prop('fit')).toEqual({ type: Fit.Carry });
      expect(component.find(AreaSeries).at(0).prop('stackAccessors')).toEqual([]);
      expect(component.find(AreaSeries).at(1).prop('fit')).toEqual({ type: Fit.Carry });
      expect(component.find(AreaSeries).at(1).prop('stackAccessors')).toEqual(['c']);
    });

    test('it should apply None fitting function if not specified', () => {
      const { data, args } = sampleArgs();

      args.layers[0].accessors = ['a'];

      const component = shallow(
        <XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />
      );

      expect(component.find(LineSeries).prop('fit')).toEqual({ type: Fit.None });
    });

    test('it should apply the xTitle if is specified', () => {
      const { data, args } = sampleArgs();

      args.xTitle = 'My custom x-axis title';

      const component = shallow(
        <XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />
      );

      expect(component.find(Axis).at(0).prop('title')).toEqual('My custom x-axis title');
    });

    test('it should hide the X axis title if the corresponding switch is off', () => {
      const { data, args } = sampleArgs();

      args.axisTitlesVisibilitySettings = {
        x: false,
        yLeft: true,
        yRight: true,
        type: 'lens_xy_axisTitlesVisibilityConfig',
      };

      const component = shallow(
        <XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />
      );

      const axisStyle = component.find(Axis).first().prop('style');

      expect(axisStyle).toMatchObject({
        axisTitle: {
          visible: false,
        },
      });
    });

    test('it should show the X axis gridlines if the setting is on', () => {
      const { data, args } = sampleArgs();

      args.gridlinesVisibilitySettings = {
        x: true,
        yLeft: false,
        yRight: false,
        type: 'lens_xy_gridlinesConfig',
      };

      const component = shallow(
        <XYChart {...defaultProps} data={{ ...data }} args={{ ...args }} />
      );

      expect(component.find(Axis).at(0).prop('gridLine')).toMatchObject({
        visible: true,
      });
    });

    test('it should format the boolean values correctly', () => {
      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: {
            type: 'datatable',
            columns: [
              {
                id: 'a',
                name: 'a',
                meta: { type: 'number', params: { id: 'number', params: { pattern: '0,0.000' } } },
              },
              {
                id: 'b',
                name: 'b',
                meta: { type: 'number', params: { id: 'number', params: { pattern: '000,0' } } },
              },
              {
                id: 'c',
                name: 'c',
                meta: {
                  type: 'boolean',
                  params: { id: 'boolean' },
                },
              },
            ],
            rows: [
              { a: 5, b: 2, c: 0 },
              { a: 19, b: 5, c: 1 },
            ],
          },
        },
        dateRange: {
          fromDate: new Date('2019-01-02T05:00:00.000Z'),
          toDate: new Date('2019-01-03T05:00:00.000Z'),
        },
      };
      const timeSampleLayer: LayerArgs = {
        layerId: 'first',
        layerType: layerTypes.DATA,
        seriesType: 'line',
        xAccessor: 'c',
        accessors: ['a', 'b'],
        xScaleType: 'ordinal',
        yScaleType: 'linear',
        isHistogram: false,
        palette: mockPaletteOutput,
      };
      const args = createArgsWithLayers([timeSampleLayer]);

      const getCustomFormatSpy = jest.fn();
      getCustomFormatSpy.mockReturnValue({ convert: jest.fn((x) => Boolean(x)) });

      const component = shallow(
        <XYChart
          {...defaultProps}
          formatFactory={getCustomFormatSpy}
          data={{ ...data }}
          args={{ ...args }}
        />
      );

      expect(component.find(LineSeries).at(1).prop('data')).toEqual([
        {
          a: 5,
          b: 2,
          c: false,
        },
        {
          a: 19,
          b: 5,
          c: true,
        },
      ]);
    });
  });

  describe('calculateMinInterval', () => {
    let xyProps: XYChartProps;

    beforeEach(() => {
      xyProps = sampleArgs();
      xyProps.args.layers[0].xScaleType = 'time';
    });
    it('should use first valid layer and determine interval', async () => {
      xyProps.data.tables.first.columns[2].meta.source = 'esaggs';
      xyProps.data.tables.first.columns[2].meta.sourceParams = {
        type: 'date_histogram',
        params: {
          used_interval: '5m',
        },
      };
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(5 * 60 * 1000);
    });

    it('should return interval of number histogram if available on first x axis columns', async () => {
      xyProps.args.layers[0].xScaleType = 'linear';
      xyProps.data.tables.first.columns[2].meta = {
        source: 'esaggs',
        type: 'number',
        field: 'someField',
        sourceParams: {
          type: 'histogram',
          params: {
            interval: 'auto',
            used_interval: 5,
          },
        },
      };
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(5);
    });

    it('should return undefined if data table is empty', async () => {
      xyProps.data.tables.first.rows = [];
      xyProps.data.tables.first.columns[2].meta.source = 'esaggs';
      xyProps.data.tables.first.columns[2].meta.sourceParams = {
        type: 'date_histogram',
        params: {
          used_interval: '5m',
        },
      };
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(undefined);
    });

    it('should return undefined if interval can not be checked', async () => {
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(undefined);
    });

    it('should return undefined if date column is not found', async () => {
      xyProps.data.tables.first.columns.splice(2, 1);
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(undefined);
    });

    it('should return undefined if x axis is not a date', async () => {
      xyProps.args.layers[0].xScaleType = 'ordinal';
      xyProps.data.tables.first.columns.splice(2, 1);
      const result = await calculateMinInterval(xyProps);
      expect(result).toEqual(undefined);
    });
  });
});
