import { EllipsisOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { GridContent } from '@ant-design/pro-components';
import { loadThemeColor } from '@ray/common/hooks/useThemeColor';
import { useRequest } from '@umijs/max';
import { Badge, Card, Col, Dropdown, Row, Table } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import dayjs from 'dayjs';
import type { FC } from 'react';
import { Suspense, useState } from 'react';
import IntroduceRow from './components/IntroduceRow';
import PageLoading from './components/PageLoading';
import ProportionSales from './components/ProportionSales';
import SalesCard from './components/SalesCard';
import { StatusPie } from './components/StatusPie';
import TopSearch from './components/TopSearch';
import * as Constants from './constant';
import type { AnalysisData } from './data';
import { fakeChartData } from './service';
import styles from './style.less';
type AnalysisProps = {
  dashboardAndanalysis: AnalysisData;
  loading: boolean;
};
type SalesType = 'all' | 'online' | 'stores';
const Analysis: FC<AnalysisProps> = () => {
  // const { styles } = useStyles();
  const [salesType, setSalesType] = useState<SalesType>('all');
  const [currentTabKey, setCurrentTabKey] = useState<string>('');
  const [activeType, setActiveType] = useState<
    'today' | 'week' | 'month' | 'year' | 'custom'
  >('year');
  const [rangeValue, setRangeValue] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs().endOf('year'),
  ]);
  const rangePresets = [
    { label: '今日', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: '本周', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    {
      label: '本月',
      value: [dayjs().startOf('month'), dayjs().endOf('month')],
    },
    { label: '本年', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];
  const { loading, data } = useRequest(fakeChartData);
  const handleRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    if (dates?.[0] && dates?.[1]) {
      setRangeValue(dates);
    }
  };

  const handleQuickSelect = (presetIndex: number) => {
    setRangeValue(
      rangePresets[presetIndex].value as [dayjs.Dayjs, dayjs.Dayjs],
    );
  };

  const dropdownGroup = (
    <span className={styles.iconGroup}>
      <Dropdown
        menu={{
          items: [
            {
              key: '1',
              label: '操作一',
            },
            {
              key: '2',
              label: '操作二',
            },
          ],
        }}
        placement="bottomRight"
      >
        <EllipsisOutlined />
      </Dropdown>
    </span>
  );
  const handleChangeSalesType = (e: RadioChangeEvent) => {
    setSalesType(e.target.value);
  };
  const handleTabChange = (key: string) => {
    setCurrentTabKey(key);
  };

  const unitConversion = (value) => {
    if (value < 1024) return `${value}KB`;
    if (value >= 1024 && value < 1024 * 1024)
      return `${(value / 1024).toFixed(2)}M`;
    return `${(value / (1024 * 1024)).toFixed(2)}G`;
  };

  const totalConut = (res) => {
    const total = res?.reduce((pre, now) => now.value + pre, 0);
    const value = res?.find((item) => item.label == '已用')?.value;
    if (total && value) return `${((value / total) * 100).toFixed(2)}%`;
  };

  const RateData = [
    {
      x: '上行流量',
      y: Constants.flowData.up_flow_propotion,
      flow: Constants.flowData.up_flow,
      rateName: '最大速率',
      up_max_rate: `${Constants.flowData.up_max_rate}Mbps`,
    },
    {
      x: '下行流量',
      y: 1 - Constants.flowData.up_flow_propotion,
      flow: Constants.flowData.down_flow,
      rateName: '最大速率',
      up_max_rate: `${Constants.flowData.down_max_rate}Mbps`,
    },
  ];
  const activeKey =
    currentTabKey || (data?.offlineData?.[0] && data?.offlineData[0].name) || '';

  const colors = loadThemeColor();
  return (
    <GridContent style={{ overflowX: 'hidden' }}>
      <>
        <Suspense fallback={<PageLoading />}>
          <IntroduceRow loading={loading} visitData={data?.visitData || []} />
        </Suspense>

        <Suspense fallback={null}>
          <SalesCard
            salesData={data?.salesData || []}
            loading={loading}
            activeType={activeType}
            rangeValue={rangeValue}
            handleRangeChange={handleRangeChange}
            handleQuickSelect={handleQuickSelect}
            rangePresets={rangePresets}
          />
        </Suspense>

        <Row
          gutter={[12, 12]}
          style={{
            marginTop: 12,
            display: 'flex',
          }}
        >
          <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <Suspense fallback={null}>
              <TopSearch
                loading={loading}
                visitData2={data?.visitData2 || []}
                searchData={data?.searchData || []}
                dropdownGroup={dropdownGroup}
              />
            </Suspense>
          </Col>
          <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <Suspense fallback={null}>
              <ProportionSales
                dropdownGroup={dropdownGroup}
                salesType={salesType}
                loading={loading}
                handleChangeSalesType={handleChangeSalesType}
              />
            </Suspense>
          </Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            <Card title="接口信息" loading={loading}>
              <div
                style={{ height: 200, overflow: 'hidden' }}
                className={styles.antTableScroll}
              >
                <Table
                  rowKey={(record) => record.index}
                  columns={[
                    {
                      title: '接口名称',
                      dataIndex: 'index',
                      ellipsis: true,
                    },
                    {
                      title: '物理状态',
                      dataIndex: 'state',
                      ellipsis: true,
                      render: (text) => (
                        <Badge
                          color={text == 1 ? 'blue' : 'red'}
                          text={text == 1 ? 'up' : 'down'}
                        />
                      ),
                    },
                    {
                      title: '接收速率',
                      dataIndex: 'receive',
                      ellipsis: true,
                    },
                    {
                      title: '发送速率',
                      dataIndex: 'send',
                      ellipsis: true,
                    },
                  ]}
                  dataSource={Constants.interfaceData}
                  size="small"
                  pagination={false}
                />
              </div>
            </Card>
          </Col>
          <Col xl={8} lg={12} md={12} sm={12} xs={12}>
            <Card title="系统状态" loading={loading}>
              <Row style={{ height: 200 }}>
                <StatusPie
                  props={{
                    data: Constants.systemStatus.cpu,
                    subTitle: 'CPU',
                    color: [colors.blue, '#F0F2F5'],
                    total: () => {
                      const values = Constants.systemStatus.cpu?.find(
                        (item) => item.label == '已用',
                      );
                      if (values?.value) return `${values?.value}%`;
                    },
                    valueFormat: unitConversion,
                  }}
                />
                <StatusPie
                  props={{
                    data: Constants.systemStatus.ram,
                    subTitle: '内存',
                    color: [colors.lakeGreen, '#F0F2F5'],
                    total: totalConut(Constants.systemStatus.ram),
                    valueFormat: unitConversion,
                  }}
                />
                <StatusPie
                  props={{
                    data: Constants.systemStatus.log,
                    subTitle: '日志空间',
                    color: [colors.green, '#F0F2F5'],
                    total: totalConut(Constants.systemStatus.log),
                    valueFormat: unitConversion,
                  }}
                />
              </Row>
            </Card>
          </Col>
          <Col xl={8} lg={12} md={12} sm={12} xs={12}>
            <Card title="总流量统计" loading={loading}>
              <Row>
                <Col span={13}>
                  <Pie
                    height={200}
                    radius={1}
                    autoFit={true}
                    legend={false}
                    innerRadius={0.7}
                    angleField="y"
                    colorField="x"
                    tooltip={(x) => {
                      return { data: x };
                    }}
                    interaction={{
                      tooltip: {
                        render: (e, { items }) => {
                          return (
                            <>
                              {items.map((item) => {
                                const { data, color } = item;
                                return (
                                  <div
                                    key={data.x}
                                    style={{
                                      margin: 0,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <div>
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          width: 6,
                                          height: 6,
                                          borderRadius: '50%',
                                          backgroundColor: color,
                                          marginRight: 6,
                                        }}
                                      ></span>
                                      <span>{data.x}</span>
                                    </div>
                                    <b>{data.flow}</b>
                                  </div>
                                );
                              })}
                            </>
                          );
                        },
                        css: {
                          '.g2-tooltip': {
                            background: `var(--main-bg-color)`,
                            color: `var(--main-font-color)`,
                          },
                        },
                      },
                    }}
                    style={{
                      stroke: 'transparent',
                      inset: 0.4,
                    }}
                    scale={{
                      color: {
                        range: [colors.blue, colors.lakeGreen],
                      },
                    }}
                    annotations={[
                      {
                        type: 'text',
                        style: {
                          text: `总流量`,
                          x: '50%',
                          y: '42%',
                          textAlign: 'center',
                          fontSize: 12,
                          fill: colors.secfontColor,
                        },
                      },
                      {
                        type: 'text',
                        style: {
                          text: Constants.flowData.total_flow,
                          x: '50%',
                          y: '55%',
                          textAlign: 'center',
                          fontSize: 14,
                          fontStyle: 'bold',
                          fill: colors.fontColor,
                        },
                      },
                    ]}
                    data={RateData}
                    label={false}
                  />{' '}
                </Col>
                <Col span={11}>
                  <div
                    style={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {RateData.map((item, i) => (
                        <li
                          key={item.x}
                          style={{
                            display: 'flex',
                            height: 'auto',
                            marginBottom: 16,
                          }}
                        >
                          <span
                            className={styles.dot}
                            style={{
                              backgroundColor: ['#3aa0ff', '#36cbcb'][i],
                              top: 8,
                            }}
                          />
                          <div>
                            <div style={{ marginBottom: 5 }}>
                              {item.x}：{item.flow}
                            </div>
                            <div>
                              {item.rateName}：{item.up_max_rate}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        {/* <Suspense fallback={null}>
          <OfflineData
            activeKey={activeKey}
            loading={loading}
            offlineData={data?.offlineData || []}
            offlineChartData={data?.offlineChartData || []}
            handleTabChange={handleTabChange}
          />
        </Suspense> */}
      </>
    </GridContent>
  );
};
export default Analysis;
