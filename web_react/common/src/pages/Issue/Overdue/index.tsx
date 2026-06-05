import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { apiOverdueAnalysisSave, apiOverdueExport, apiOverdueQuery } from './service';

const LEVEL_OPTIONS = [
  { label: '全部超期', value: 'all' },
  { label: '超期180天', value: '180' },
  { label: '超期360天', value: '360' },
];

const severityColor = {
  1: 'red',
  2: 'orange',
  3: 'blue',
  4: 'default',
};

const OverduePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>();
  const [detailRecord, setDetailRecord] = useState<any>();
  const [level, setLevel] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data = [] } = await apiOverdueQuery({});
      setRows(data);
    } catch (error: any) {
      message.error(error?.message || '超期数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      analysis: record.analysis,
      improvement: record.improvement,
    });
  };

  const saveAnalysis = async () => {
    const values = await form.validateFields();
    const { code = 470, msg = '', msgType = 'info' } = await apiOverdueAnalysisSave({
      product_id: editing.product_id,
      version: editing.version,
      ...values,
    });
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg || '保存完成');
    if (code === 200) {
      setEditing(undefined);
      loadData();
    }
  };

  const downloadExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await apiOverdueExport({});
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const detailBugs = useMemo(() => {
    const bugs = detailRecord?.bugs || [];
    if (level === '360') {
      return bugs.filter((bug: any) => bug.overdue_days >= 360);
    }
    if (level === '180') {
      return bugs.filter((bug: any) => bug.overdue_days >= 180);
    }
    return bugs;
  }, [detailRecord, level]);

  const columns = [
    { title: '产品', dataIndex: 'product_name', width: 160 },
    { title: '版本', dataIndex: 'version', width: 140 },
    { title: '超期问题总数', dataIndex: 'overdue_total', width: 130, sorter: (a: any, b: any) => a.overdue_total - b.overdue_total },
    { title: '超期180天', dataIndex: 'overdue_180', width: 120 },
    { title: '超期360天', dataIndex: 'overdue_360', width: 120 },
    { title: '问题分析', dataIndex: 'analysis', ellipsis: true },
    { title: '改进措施', dataIndex: 'improvement', ellipsis: true },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <a
            onClick={() => {
              setDetailRecord(record);
              setLevel('all');
            }}
          >
            明细
          </a>
          <a onClick={() => openEdit(record)}>编辑</a>
        </Space>
      ),
    },
  ];

  const bugColumns = [
    { title: 'Bug 编号', dataIndex: 'bug_id', width: 130 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      render: (value: number) => <Tag color={severityColor[value] || 'default'}>P{value}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_date', width: 180 },
    { title: '超期天数', dataIndex: 'overdue_days', width: 100, sorter: (a: any, b: any) => a.overdue_days - b.overdue_days },
  ];

  return (
    <>
      <Table
        rowKey={(record: any) => `${record.product_id}-${record.version}`}
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        title={() => (
          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>超期问题分析</strong>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={downloadExport}>
              导出
            </Button>
          </Space>
        )}
      />

      <Modal title="超期问题明细" open={!!detailRecord} width={900} footer={null} onCancel={() => setDetailRecord(undefined)}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select options={LEVEL_OPTIONS} value={level} style={{ width: 160 }} onChange={setLevel} />
          <Table rowKey="id" columns={bugColumns} dataSource={detailBugs} pagination={{ pageSize: 10 }} size="small" />
        </Space>
      </Modal>

      <Modal
        title="编辑问题分析"
        open={!!editing}
        onOk={saveAnalysis}
        onCancel={() => setEditing(undefined)}
        okText="保存"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="问题分析" name="analysis">
            <Input.TextArea rows={4} placeholder="填写版本级超期问题原因分析" />
          </Form.Item>
          <Form.Item label="改进措施" name="improvement">
            <Input.TextArea rows={4} placeholder="填写改进措施和后续处理计划" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OverduePage;
