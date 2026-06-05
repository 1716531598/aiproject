import { UploadOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Col, message, Row, Statistic, Upload } from 'antd';
import { useState } from 'react';
import { apiBugImport } from './service';

const BugImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>();

  const upload = async () => {
    if (!file) {
      message.error('请选择 CSV 文件');
      return;
    }
    setLoading(true);
    const { code = 470, msg = '', msgType = 'info', data = {} } = await apiBugImport(file);
    setLoading(false);
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      setResult(data);
    }
  };

  const failedRows = [
    ...(result?.failed || []).map((item: any) => ({ ...item, type: '映射失败' })),
    ...(result?.parse_failed || []).map((item: any) => ({ ...item, type: '解析失败' })),
  ];

  return (
    <PageContainer>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="新增" value={result?.new_count || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="更新" value={result?.update_count || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="失败" value={result?.fail_count || 0} />
        </Col>
      </Row>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Upload
          accept=".csv"
          maxCount={1}
          beforeUpload={(selectedFile) => {
            setFile(selectedFile);
            return false;
          }}
          onRemove={() => setFile(null)}
        >
          <Button icon={<UploadOutlined />}>选择 CSV</Button>
        </Upload>
        <Button type="primary" loading={loading} disabled={!file} onClick={upload}>
          开始导入
        </Button>
      </div>
      <ProTable
        rowKey={(record) => `${record.type}-${record.row}-${record.bug_id || ''}`}
        headerTitle="失败明细"
        search={false}
        pagination={false}
        dataSource={failedRows}
        columns={[
          { title: '类型', dataIndex: 'type', width: 120 },
          { title: '行号', dataIndex: 'row', width: 100 },
          { title: 'Bug 编号', dataIndex: 'bug_id', width: 160 },
          { title: '产品', dataIndex: 'product_name', width: 200 },
          { title: '原因', dataIndex: 'reason', ellipsis: true },
        ]}
        options={{ reload: false, setting: false, density: false }}
      />
    </PageContainer>
  );
};

export default BugImport;
