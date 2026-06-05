import { BarChartOutlined, BugOutlined, CheckCircleOutlined, FieldTimeOutlined, ProjectOutlined, ReloadOutlined } from '@ant-design/icons';
import { Column, Line, Pie } from '@ant-design/plots';
import { history } from '@umijs/max';
import { Button, Card, Col, DatePicker, Empty, Radio, Row, Select, Space, Statistic, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  apiStatisticByProduct,
  apiStatisticByResolver,
  apiStatisticByType,
  apiStatisticByVersion,
  apiStatisticOverview,
  apiStatisticResolveTrend,
} from './service';

const { RangePicker } = DatePicker;

const RANGE_OPTIONS = [
  { label: '近30天', value: '30' },
  { label: '近90天', value: '90' },
  { label: '近半年', value: '180' },
  { label: '今年', value: 'year' },
  { label: '自定义', value: 'custom' },
];

const resolveRange = (mode: string, customRange: any[]) => {
  if (mode === 'custom') {
    return {
      start_date: customRange?.[0]?.format('YYYY-MM-DD'),
      end_date: customRange?.[1]?.format('YYYY-MM-DD'),
    };
  }
  if (mode === 'year') {
    return {
      start_date: dayjs().startOf('year').format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
    };
  }
  const days = Number(mode || 30);
  return {
    start_date: dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  };
};

const toPercent = (value: number) => `${((value || 0) * 100).toFixed(1)}%`;

const StatisticPage = () => {
  const [rangeMode, setRangeMode] = useState('30');
  const [customRange, setCustomRange] = useState<any[]>([]);
  const [productId, setProductId] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>({});
  const [byProduct, setByProduct] = useState<any[]>([]);
  const [byVersion, setByVersion] = useState<any[]>([]);
  const [byResolver, setByResolver] = useState<any[]>([]);
  const [byType, setByType] = useState<any[]>([]);
  const [resolveTrend, setResolveTrend] = useState<any[]>([]);

  const rangePayload = useMemo(() => resolveRange(rangeMode, customRange), [rangeMode, customRange]);
  const productOptions = useMemo(
    () =>
      byProduct
        .filter((item) => item.product_id)
        .map((item) => ({ label: item.product_name, value: item.product_id })),
    [byProduct],
  );

  const loadData = async () => {
    if (rangeMode === 'custom' && (!customRange?.[0] || !customRange?.[1])) {
      return;
    }
    setLoading(true);
    try {
      const [
        { data: overviewData = {} },
        { data: productData = [] },
        { data: versionData = [] },
        { data: resolverData = [] },
        { data: typeData = [] },
        { data: trendData = [] },
      ] = await Promise.all([
        apiStatisticOverview(rangePayload),
        apiStatisticByProduct(rangePayload),
        apiStatisticByVersion({ ...rangePayload, product_id: productId }),
        apiStatisticByResolver({ ...rangePayload, product_id: productId }),
        apiStatisticByType({ ...rangePayload, product_id: productId }),
        apiStatisticResolveTrend({ ...rangePayload, product_id: productId }),
      ]);
      setOverview(overviewData);
      setByProduct(productData);
      setByVersion(versionData);
      setByResolver(resolverData);
      setByType(typeData);
      setResolveTrend(trendData);
    } catch (error: any) {
      message.error(error?.message || '统计数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rangePayload.start_date, rangePayload.end_date, productId]);

  const productChartConfig = {
    data: byProduct,
    xField: 'product_name',
    yField: 'total',
    height: 280,
    autoFit: true,
    axis: {
      x: { labelAutoRotate: true },
      y: { title: '问题数' },
    },
    tooltip: {
      title: 'product_name',
      items: [
        { field: 'total', name: '问题总数' },
        { field: 'resolved', name: '已解决' },
        { field: 'active', name: '未解决' },
      ],
    },
    onReady: ({ chart }: any) => {
      chart.on('element:click', (event: any) => {
        const item = event?.data?.data;
        if (item?.product_id) {
          history.push(`/issue/bugs?product_id=${item.product_id}`);
        }
      });
    },
  };

  const versionChartConfig = {
    data: byVersion,
    xField: 'version',
    yField: 'total',
    height: 280,
    autoFit: true,
    axis: {
      x: { labelAutoRotate: true },
      y: { title: '问题数' },
    },
    tooltip: {
      title: 'version',
      items: [
        { field: 'product_name', name: '产品' },
        { field: 'total', name: '问题总数' },
        { field: 'resolved', name: '已解决' },
        { field: 'active', name: '未解决' },
      ],
    },
    onReady: ({ chart }: any) => {
      chart.on('element:click', (event: any) => {
        const item = event?.data?.data;
        if (item?.product_id) {
          history.push(`/issue/bugs?product_id=${item.product_id}&affect_version=${encodeURIComponent(item.version)}`);
        }
      });
    },
  };

  const resolverChartConfig = {
    data: byResolver,
    xField: 'staff_name',
    yField: 'total',
    height: 280,
    autoFit: true,
    axis: {
      x: { labelAutoRotate: true },
      y: { title: '问题数' },
    },
    tooltip: {
      title: 'staff_name',
      items: [
        { field: 'total', name: '负责总数' },
        { field: 'resolved', name: '已解决' },
        { field: 'active', name: '未解决' },
      ],
    },
    onReady: ({ chart }: any) => {
      chart.on('element:click', (event: any) => {
        const item = event?.data?.data;
        if (item?.staff_id) {
          history.push(`/issue/bugs?staff_id=${item.staff_id}`);
        }
      });
    },
  };

  const typePieConfig = {
    data: byType,
    angleField: 'total',
    colorField: 'type_name',
    height: 280,
    autoFit: true,
    innerRadius: 0.55,
    label: {
      text: 'type_name',
      position: 'outside',
    },
    tooltip: {
      title: 'type_name',
      items: [
        { field: 'total', name: '问题数' },
        { field: 'ratio', name: '占比', valueFormatter: (value: number) => toPercent(value) },
      ],
    },
    onReady: ({ chart }: any) => {
      chart.on('element:click', (event: any) => {
        const item = event?.data?.data;
        if (item?.issue_type_id) {
          history.push(`/issue/bugs?issue_type_id=${item.issue_type_id}`);
        }
      });
    },
  };

  const trendChartConfig = {
    data: resolveTrend.map((item) => ({
      ...item,
      rate_percent: Number(((item.resolve_rate || 0) * 100).toFixed(2)),
    })),
    xField: 'month',
    yField: 'rate_percent',
    colorField: 'product_name',
    height: 320,
    autoFit: true,
    axis: {
      y: { title: '解决率 %' },
    },
    tooltip: {
      title: 'month',
      items: [
        { field: 'product_name', name: '产品' },
        { field: 'rate_percent', name: '解决率' },
        { field: 'total', name: '问题总数' },
        { field: 'resolved', name: '已解决' },
      ],
    },
    onReady: ({ chart }: any) => {
      chart.on('element:click', (event: any) => {
        const item = event?.data?.data;
        if (item?.product_id) {
          history.push(`/issue/bugs?product_id=${item.product_id}`);
        }
      });
    },
  };

  const productColumns = [
    { title: '产品', dataIndex: 'product_name' },
    { title: '问题总数', dataIndex: 'total', width: 110, sorter: (a: any, b: any) => a.total - b.total },
    { title: '已解决', dataIndex: 'resolved', width: 100 },
    { title: '未解决', dataIndex: 'active', width: 100 },
    { title: '解决率', dataIndex: 'resolve_rate', width: 100, render: (value: number) => toPercent(value) },
    {
      title: '操作',
      width: 90,
      render: (_: any, record: any) =>
        record.product_id ? (
          <a onClick={() => history.push(`/issue/bugs?product_id=${record.product_id}`)}>查看</a>
        ) : (
          <Tag>无产品</Tag>
        ),
    },
  ];

  const versionColumns = [
    { title: '产品', dataIndex: 'product_name', width: 150 },
    { title: '影响版本', dataIndex: 'version' },
    { title: '问题总数', dataIndex: 'total', width: 110, sorter: (a: any, b: any) => a.total - b.total },
    { title: '已解决', dataIndex: 'resolved', width: 100 },
    { title: '未解决', dataIndex: 'active', width: 100 },
    { title: '解决率', dataIndex: 'resolve_rate', width: 100, render: (value: number) => toPercent(value) },
  ];

  const resolverColumns = [
    { title: '责任人', dataIndex: 'staff_name' },
    { title: '负责总数', dataIndex: 'total', width: 110, sorter: (a: any, b: any) => a.total - b.total },
    { title: '已解决', dataIndex: 'resolved', width: 100 },
    { title: '未解决', dataIndex: 'active', width: 100 },
    { title: '解决率', dataIndex: 'resolve_rate', width: 100, render: (value: number) => toPercent(value) },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card bodyStyle={{ padding: 16 }}>
        <Space wrap>
          <Radio.Group
            options={RANGE_OPTIONS}
            optionType="button"
            buttonStyle="solid"
            value={rangeMode}
            onChange={(event) => setRangeMode(event.target.value)}
          />
          {rangeMode === 'custom' && <RangePicker value={customRange as any} onChange={(value) => setCustomRange((value || []) as any[])} />}
          <Select
            allowClear
            showSearch
            placeholder="按产品筛选版本"
            optionFilterProp="label"
            options={productOptions}
            value={productId}
            style={{ minWidth: 180 }}
            onChange={setProductId}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadData}>
            刷新
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="问题总数" value={overview.bug_total || 0} prefix={<BugOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="已解决" value={overview.bug_resolved || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="未解决" value={overview.bug_active || 0} prefix={<FieldTimeOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="解决率" value={toPercent(overview.resolve_rate)} prefix={<BarChartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="PoC 项目总数" value={overview.poc_total || 0} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="PoC 已关闭" value={overview.poc_closed || 0} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="PoC 进行中" value={overview.poc_active || 0} valueStyle={{ color: '#0958d9' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="按产品统计" bodyStyle={{ minHeight: 320 }}>
            {byProduct.length ? <Column {...productChartConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="按版本统计" bodyStyle={{ minHeight: 320 }}>
            {byVersion.length ? <Column {...versionChartConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="责任人排名" bodyStyle={{ minHeight: 320 }}>
            {byResolver.length ? <Column {...resolverChartConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="问题类型占比" bodyStyle={{ minHeight: 320 }}>
            {byType.length ? <Pie {...typePieConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>

      <Card title="解决率趋势" bodyStyle={{ minHeight: 360 }}>
        {resolveTrend.length ? <Line {...trendChartConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Table
            rowKey={(record: any) => record.product_id || record.product_name}
            loading={loading}
            columns={productColumns}
            dataSource={byProduct}
            pagination={false}
            size="middle"
          />
        </Col>
        <Col xs={24} lg={12}>
          <Table
            rowKey={(record: any) => `${record.product_id || 0}-${record.version}`}
            loading={loading}
            columns={versionColumns}
            dataSource={byVersion}
            pagination={false}
            size="middle"
          />
        </Col>
      </Row>

      <Table
        rowKey={(record: any) => record.staff_id || record.staff_name}
        loading={loading}
        columns={resolverColumns}
        dataSource={byResolver}
        pagination={false}
        size="middle"
      />
    </Space>
  );
};

export default StatisticPage;
