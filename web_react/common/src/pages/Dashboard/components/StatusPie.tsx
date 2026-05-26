import { Pie } from '@ant-design/plots';
import { loadThemeColor } from '@ray/common/hooks/useThemeColor';
import { Col } from 'antd';
import styles from '../style.less';

export const StatusPie = ({ props }) => {
  const { subTitle, total, data, color, valueFormat } = props;
  const colors = loadThemeColor();
  return (
    <Col span={8}>
      <Pie
        height={128}
        radius={1}
        autoFit={true}
        legend={false}
        style={{
          stroke: 'transparent',
          inset: 0.4,
        }}
        tooltip={(label, value) => {
          return { label, value };
        }}
        interaction={{
          tooltip: {
            render: (e, { items }) => {
              return (
                <>
                  {items.map((item) => {
                    const { label, value, color } = item;
                    return (
                      <div
                        key={label.label}
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
                          <span>{label.label}</span>
                        </div>
                        <b>{valueFormat(label.value)}</b>
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
        innerRadius={0.8}
        angleField="value"
        colorField="label"
        scale={{
          color: {
            range: color,
          },
        }}
        annotations={[
          {
            type: 'text',
            style: {
              text: subTitle,
              x: '50%',
              y: '40%',
              textAlign: 'center',
              fill: colors.secfontColor,
              fontSize: 12,
            },
          },
          {
            type: 'text',
            style: {
              text: total,
              x: '50%',
              y: '60%',
              textAlign: 'center',
              fontSize: 14,
              fill: colors.fontColor,
              fontStyle: 'bold',
            },
          },
        ]}
        data={data}
        label={false}
      />
      <ul
        style={{
          marginTop: 16,
          display: 'grid',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {data.map((item, i) => (
          <li
            key={item.label}
            // onClick={() => this.handleLegendClick(item, i)}
            style={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
            title={`${item.label}：${
              valueFormat ? valueFormat(item.value) : item.value
            }`}
          >
            <span
              className={styles.dot}
              style={{
                backgroundColor: color[i],
              }}
            />
            <span>{item.label}：</span>
            <span>{valueFormat ? valueFormat(item.value) : item.value}</span>
          </li>
        ))}
      </ul>
    </Col>
  );
};
