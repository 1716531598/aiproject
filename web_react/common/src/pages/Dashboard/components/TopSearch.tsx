import { InfoCircleOutlined } from '@ant-design/icons';
import { Area } from '@ant-design/plots';
import { Card, Col, Row, Table, Tag, Tooltip, theme } from 'antd';
import numeral from 'numeral';
import React from 'react';
import type { DataItem } from '../data';
import NumberInfo from './NumberInfo';

const TopSearch = ({
  loading,
  visitData2,
  searchData,
  dropdownGroup,
}: {
  loading: boolean;
  visitData2: DataItem[];
  dropdownGroup: React.ReactNode;
  searchData: DataItem[];
}) => {
  const { token } = theme.useToken();
  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: '15%',
    },
    {
      title: '资产名称',
      dataIndex: 'keyword',
      ellipsis: true,
      key: 'keyword',
      width: '20%',
      render: (text: React.ReactNode) => (
        <a style={{ color: token.colorPrimary }}>{text}</a>
      ),
    },
    {
      title: '资产类型',
      width: '25%',
      dataIndex: 'range',
      render: (
        text: React.ReactNode,
        record: {
          status: number;
        },
      ) => {
        const map = ['全网IPv4', '全网IPv6', '重点审计资产	'];
        return <Tag>{map[Math.floor(Math.random() * 3)]}</Tag>;
      },
    },
    {
      title: '资产属性',
      dataIndex: 'range',
      width: '25%',
      ellipsis: true,
      render: (
        text: React.ReactNode,
        record: {
          status: number;
        },
      ) => {
        const map = [
          '中国 / 陕西省 / 西安市',
          '中国 / 北京市',
          '中国 / 四川省 / 成都市',
        ];
        return map[Math.floor(Math.random() * 3)];
      },
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: '15%',
      sorter: (
        a: {
          count: number;
        },
        b: {
          count: number;
        },
      ) => a.count - b.count,
    },
  ];
  return (
    <Card
      loading={loading}
      variant="borderless"
      title="防护资产统计"
      extra={dropdownGroup}
      style={{
        height: '100%',
      }}
    >
      <Row gutter={68}>
        <Col
          sm={12}
          xs={24}
          style={{
            marginBottom: 24,
          }}
        >
          <NumberInfo
            subTitle={
              <span>
                防护日志数
                <Tooltip title="指标说明">
                  <InfoCircleOutlined
                    style={{
                      marginLeft: 8,
                    }}
                  />
                </Tooltip>
              </span>
            }
            gap={8}
            total={numeral(12321).format('0,0')}
            status="up"
            subTotal={
              <>
                <span>防护：86%</span>
                <span style={{ marginLeft: 16 }}>访问：14%</span>
              </>
            }
          />
          <Area
            xField="x"
            yField="y"
            shapeField="smooth"
            height={45}
            axis={false}
            padding={-12}
            style={{
              // fill: 'linear-gradient(-90deg, white 0%, #6294FA 100%)',
              // fillOpacity: 0.4,
              fill: '#6294FA',
            }}
            data={visitData2}
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
        </Col>
        <Col
          sm={12}
          xs={24}
          style={{
            marginBottom: 24,
          }}
        >
          <NumberInfo
            subTitle={
              <span>
                防护资产数
                <Tooltip title="指标说明">
                  <InfoCircleOutlined
                    style={{
                      marginLeft: 8,
                    }}
                  />
                </Tooltip>
              </span>
            }
            total={numeral(1560).format('0,0')}
            status="down"
            subTotal={
              <>
                <span>IPv4：72%</span>
                <span style={{ marginLeft: 16 }}>IPv6：28%</span>
              </>
            }
            gap={8}
          />
          <Area
            xField="x"
            yField="y"
            shapeField="smooth"
            height={45}
            padding={-12}
            style={{
              // fill: 'linear-gradient(-90deg, white 0%, #6294FA 100%)',
              fill: '#6294FA',
              // fillOpacity: 0.4,
            }}
            data={visitData2}
            axis={false}
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
        </Col>
      </Row>
      <Table<any>
        rowKey={(record) => record.index}
        size="small"
        columns={columns}
        dataSource={searchData}
        pagination={{
          style: {
            marginBottom: 0,
          },
          pageSize: 5,
        }}
      />
    </Card>
  );
};
export default TopSearch;
