import { Pie } from '@ant-design/plots';
import { loadThemeColor } from '@ray/common/hooks/useThemeColor';
import { Card, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import React from 'react';
import type { DataItem } from '../data';
// import useStyles from '../style.style';
import styles from '../style.less';
const { Text } = Typography;
const dataPie = [
  {
    x: 'Nmap',
    type: 234,
    y: 27501,
  },
  {
    x: '系统扫描工具',
    type: 227,
    y: 13852,
  },
  {
    x: 'POC脆弱性',
    type: 229,
    y: 13728,
  },
  {
    x: 'SNMP',
    type: 232,
    y: 9554,
  },
  {
    x: 'Zmap',
    type: 225,
    y: 6451,
  },
  {
    x: 'Masscan',
    type: 226,
    y: 6433,
  },
  {
    x: '跨平台通信协议',
    type: 235,
    y: 4912,
  },
  {
    x: '通用工控协议',
    type: 236,
    y: 4749,
  },
  {
    x: 'DayDayMap',
    type: 215,
    y: 5856,
  },
  {
    x: '其他探测平台',
    type: 220,
    y: 3474,
  },
  {
    x: 'WEB扫描工具',
    type: 228,
    y: 1883,
  },
  {
    x: 'Shodan',
    type: 218,
    y: 1672,
  },
];
const ProportionSales = ({
  dropdownGroup,
  salesType,
  loading,
  salesPieData,
  handleChangeSalesType,
}: {
  loading: boolean;
  dropdownGroup: React.ReactNode;
  salesType: 'all' | 'online' | 'stores';
  salesPieData: DataItem[];
  handleChangeSalesType?: (e: RadioChangeEvent) => void;
}) => {
  const colors = loadThemeColor();
  return (
    <Card
      loading={loading}
      className={styles.salesCard}
      variant="borderless"
      title="规则类型统计"
      style={{ height: '100%' }}
      styles={{
        body: {
          paddingRight: 12,
        },
      }}
    >
      <div>
        <Pie
          height={404}
          radius={0.8}
          autoFit={true}
          innerRadius={0.6}
          angleField="y"
          colorField="x"
          data={dataPie}
          tooltip={(x) => {
            return { x };
          }}
          interaction={{
            tooltip: {
              css: {
                '.g2-tooltip': {
                  background: `var(--main-bg-color)`,
                  color: `var(--main-font-color)`,
                },
              },
              render: (e, { items }) => {
                return (
                  <>
                    {items.map((item) => {
                      const { x, color } = item;
                      return (
                        <div
                          key={x.x}
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
                            <span>{x.x}</span>
                          </div>
                          <b>{x.y}</b>
                        </div>
                      );
                    })}
                  </>
                );
              },
            },
          }}
          style={{
            stroke: 'transparent',
            inset: 0.4,
          }}
          scale={{
            color: {
              range: [
                colors.blue,
                colors.lakeGreen,
                colors.green,
                colors.yellow,
                colors.red,
                colors.purple,
                '#FFAB67',
                '#A7E1FC',
                '#3BA272',
                '#FAC858',
                '#ee7053ff',
                '#C7F1E0',
                // '#5370C6',
                // '#91CC75',
                // '#FAC858',
                // '#A7E1FC',
                // '#48C4CC',
                // '#5370C6',
                // '#5B8FF9',
                // '#3BA272',
                // '#73C0DE',
                // '#FFAB67',
                // '#EB7E65',
                // '#C7F1E0',
                // '#73A0FA',
                // '#73c0de',
                // '#5370C6',
                // '#C6D8FC',
                // '#C7F1E0',
                // '#EB7E65',
                // '#73A0FA',
                // '#48C4CC',
                // '#EE6666',
                // '#FCA5C9',
              ],
            },
          }}
          legend={{
            color: {
              width: 250,
              crossPadding: 130,
              title: false,
              position: 'right',
              rowPadding: 5,
              itemLabelLineHeight: 24,
              itemLabelFontSize: 14,
              itemValueFontSize: 14,
              itemLabelFill: colors.fontColor,
              itemValueFill: colors.fontColor,
              itemValueText: (datum, index, data) => {
                const item = dataPie.filter((i) => i.x == datum.label)[0];
                return item ? `${item.y.toLocaleString()}` : '0';
              },
            },
          }}
          label={{
            position: 'spider',
            fill: colors.fontColor,
            connectorStroke: colors.fontColor,
            text: (item) => `${item.x}`,
          }}
        />
      </div>
    </Card>
  );
};
export default ProportionSales;
