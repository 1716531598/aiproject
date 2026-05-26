import { InfoCircleOutlined } from '@ant-design/icons';
import { Area, Column } from '@ant-design/plots';
import { loadThemeColor } from '@ray/common/hooks/useThemeColor';
import { Badge, Col, Progress, Row, Space, Tooltip } from 'antd';
import numeral from 'numeral';
import type { DataItem } from '../data';
// import useStyles from '../style.style';
import { ChartCard, Field } from './Charts';
import Trend from './Trend';
const topColResponsiveProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  style: {
    marginBottom: 12,
  },
};
const IntroduceRow = ({
  loading,
  visitData,
}: {
  loading: boolean;
  visitData: DataItem[];
}) => {
  // const { styles } = useStyles();
  return (
    <Row gutter={[12, 12]}>
      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          title="总日志量"
          action={
            <Tooltip title="总日志量是防护日志与访问日志总和">
              <InfoCircleOutlined />
            </Tooltip>
          }
          loading={loading}
          total={numeral(126560).format('0,0')}
          footer={
            <Field
              label="近一个月日志量："
              value={`${numeral(1423).format('0,0')}`}
            />
          }
          contentHeight={46}
        >
          <Trend
            flag="up"
            style={{
              marginRight: 16,
            }}
          >
            <Badge
              color="#a677e8"
              text={`防护日志：${numeral(97661).format('0,0')}`}
            />
          </Trend>
          <Trend flag="down">
            <Badge
              color={loadThemeColor().blue}
              text={`访问日志：${numeral(28899).format('0,0')}`}
            />
          </Trend>
        </ChartCard>
      </Col>

      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          loading={loading}
          title="防护次数"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={numeral(8846).format('0,0')}
          footer={
            <Field label="本月防护次数：" value={numeral(1234).format('0,0')} />
          }
          contentHeight={46}
        >
          <Area
            xField="x"
            yField="y"
            shapeField="smooth"
            height={46}
            axis={false}
            style={{
              // fill: 'linear-gradient(-90deg, white 0%, #975FE4 100%)',
              fill: '#975fe4',
              //fillOpacity: 0.6,
              width: '100%',
            }}
            padding={-20}
            data={visitData}
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
                            <b>{data.y}</b>
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
          />
        </ChartCard>
      </Col>
      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          loading={loading}
          title="资产总数"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={numeral(6560).format('0,0')}
          footer={
            <Space size={24}>
              <Field label="IP地址：" value={numeral(3000).format('0,0')} />
              <Field label="IP网段：" value={numeral(1602).format('0,0')} />
            </Space>
          }
          contentHeight={46}
        >
          <Column
            xField="x"
            yField="y"
            padding={-20}
            axis={false}
            height={46}
            colorField={loadThemeColor().blue}
            data={visitData}
            scale={{ x: { paddingInner: 0.4 } }}
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
                            <b>{data.y}</b>
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
          />
        </ChartCard>
      </Col>
      <Col {...topColResponsiveProps}>
        <ChartCard
          loading={loading}
          variant="borderless"
          title="任务统计"
          action={
            <Tooltip title="检测任务完成率">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total="78%"
          footer={
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Trend
                flag="up"
                style={{
                  marginRight: 16,
                }}
              >
                任务总数：213
              </Trend>
              <Trend flag="down">已完成：166</Trend>
            </div>
          }
          contentHeight={46}
        >
          <Progress
            percent={78}
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
            status="active"
          />
        </ChartCard>
      </Col>
    </Row>
  );
};
export default IntroduceRow;
