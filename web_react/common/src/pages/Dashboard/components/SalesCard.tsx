import { Column } from '@ant-design/plots';
import { loadThemeColor } from '@ray/common/hooks/useThemeColor';
import { Card, Col, DatePicker, Row, Tabs } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker/generatePicker';
import dayjs from 'dayjs';
import numeral from 'numeral';
import type { DataItem } from '../data';
// import useStyles from '../style.style';
import { createStyles } from 'antd-style';
import styles from '../style.less';
const useStyles = createStyles(({ token, css }) => ({
  salesExtraWrap: css`
    display: flex;
    align-items: center;
  `,
  salesExtra: css`
    display: inline-block;

    a {
      margin-right: 24px;
      color: var(--main-font-color);
      text-decoration: none;
      cursor: pointer;

      &:hover,
      &.active {
        color: ${token.colorPrimary} !important;
      }

      &.active {
        font-weight: 500;
      }
    }
  `,
  rankList: css`
    padding: 0 72px 0 0;
    @media screen and (max-width: ${token.screenLG}px) {
      padding: 0 72px 24px 72px;
    }
    @media screen and (max-width: ${token.screenMD}px) {
      padding: 0 72px 24px 72px;
    }
    @media screen and (max-width: ${token.screenSM}px) {
      padding: 0 72px 24px 72px;
    }
  `,
}));
export type TimeType = 'today' | 'week' | 'month' | 'year';
const { RangePicker } = DatePicker;

const rankingListData: {
  title: string;
  total: number;
}[] = [];

for (let i = 0; i < 7; i += 1) {
  rankingListData.push({
    title: `172.${i * 7}.${i}8.${i * 5}`,
    total: `${10 - i}2323${i}`,
    key: i,
  });
}

const SalesCard = ({
  salesData = [],
  loading,
  activeType,
  rangeValue,
  handleRangeChange,
  handleQuickSelect,
  rangePresets,
}: {
  rangePickerValue: RangePickerProps<dayjs.Dayjs>['value'];
  isActive: (key: TimeType) => string;
  salesData: DataItem[];
  loading: boolean;
  handleRangePickerChange: RangePickerProps<dayjs.Dayjs>['onChange'];
  selectDate: (key: TimeType) => void;
}) => {
  // const { styles } = useStyles();
  const { styles: styled } = useStyles();
  const colors = loadThemeColor();
  const dateFormat = 'YYYY-MM-DD';
  return (
    <Card
      loading={loading}
      variant="borderless"
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div className={styles.salesCard}>
        <Tabs
          tabBarExtraContent={
            <div className={styled.salesExtraWrap}>
              <div className={styled.salesExtra}>
                {rangePresets.map((preset, index) => (
                  <a
                    key={preset.label}
                    className={
                      rangeValue[0]?.isSame(preset.value[0]) &&
                      rangeValue[1]?.isSame(preset.value[1])
                        ? 'active'
                        : ''
                    }
                    onClick={() => handleQuickSelect(index)}
                  >
                    {preset.label}
                  </a>
                ))}
              </div>
              <RangePicker
                value={rangeValue}
                onChange={handleRangeChange}
                style={{ width: 256 }}
              />
            </div>
          }
          size="large"
          tabBarStyle={{
            marginBottom: 24,
          }}
          items={[
            {
              key: 'sales',
              label: '源IP分布',
              children: (
                <Row>
                  <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                    <div className={styles.salesBar}>
                      <Column
                        height={300}
                        data={salesData}
                        xField="x"
                        yField="y"
                        autoFit={true}
                        paddingBottom={12}
                        colorField={colors.blue}
                        axis={{
                          x: {
                            title: false,
                            label: true,
                            labelFill: colors.fontColor,
                          },
                          y: {
                            title: false,
                            gridLineDash: null,
                            gridStroke: '#ccc',
                            labelFill: colors.fontColor,
                          },
                        }}
                        scale={{
                          x: { paddingInner: 0.4 },
                        }}
                        tooltip={{
                          name: 'IP地址',
                          channel: 'y',
                        }}
                        interaction={{
                          tooltip: {
                            css: {
                              '.g2-tooltip': {
                                background: `var(--main-bg-color)`,
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-title': {
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-list-item': {
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-list-item-value': {
                                color: `var(--main-font-color)`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </Col>
                  <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                    <div className={styles.salesRank}>
                      <h4 className={styles.rankingTitle}>IP地址排名</h4>
                      <ul className={styles.rankingList}>
                        {rankingListData.map((item, i) => (
                          <li key={item.title}>
                            <span
                              className={`${styles.rankingItemNumber} ${styles.rankingItemNumberActive}`}
                            >
                              {i + 1}
                            </span>
                            <span
                              className={styles.rankingItemTitle}
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span>{numeral(item.total).format('0,0')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'views',
              label: '目的IP分布',
              children: (
                <Row>
                  <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                    <div className={styles.salesBar}>
                      <Column
                        height={300}
                        data={salesData}
                        xField="x"
                        yField="y"
                        autoFit={true}
                        colorField={loadThemeColor().blue}
                        paddingBottom={12}
                        axis={{
                          x: {
                            title: false,
                            labelFill: colors.fontColor,
                          },
                          y: {
                            title: false,
                            labelFill: colors.fontColor,
                          },
                        }}
                        scale={{
                          x: { paddingInner: 0.4 },
                        }}
                        tooltip={{
                          name: 'IP地址',
                          channel: 'y',
                        }}
                        interaction={{
                          tooltip: {
                            css: {
                              '.g2-tooltip': {
                                background: `var(--main-bg-color)`,
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-title': {
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-list-item': {
                                color: `var(--main-font-color)`,
                              },
                              '.g2-tooltip-list-item-value': {
                                color: `var(--main-font-color)`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </Col>
                  <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                    <div className={styles.salesRank}>
                      <h4 className={styles.rankingTitle}>IP地址排名</h4>
                      <ul className={styles.rankingList}>
                        {rankingListData.map((item, i) => (
                          <li key={item.title}>
                            <span
                              className={`${styles.rankingItemNumber} ${styles.rankingItemNumberActive}`}
                            >
                              {i + 1}
                            </span>
                            <span
                              className={styles.rankingItemTitle}
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span>{numeral(item.total).format('0,0')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </div>
    </Card>
  );
};
export default SalesCard;
