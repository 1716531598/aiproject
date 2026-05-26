import {
  CopyrightOutlined,
  LockOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { history, useIntl, useModel } from '@umijs/max';
import { Col, message, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import loginVideo from '../../assets/login.mp4';
import styles from './index.less';
import { apiGetCode, login } from './service';

const Login: React.FC = () => {
  const [type] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const [code, setCode] = useState('');

  const intl = useIntl();

  const loadCode = async () => {
    const { data = {} } = await apiGetCode();
    setCode(data?.imgCode);
  };

  useEffect(() => {
    loadCode();
  }, []);

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const msg = await login({ ...values, type });
      if (msg.status === 'ok') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        history.push('/common/dashboard');
        return;
      }
      message.error('账户或密码错误(admin/Test@123)');
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      loadCode();
      message.error(defaultLoginFailureMessage);
    }
  };

  return (
    <div className={styles.container}>
      <video autoPlay muted loop className={styles.video} playsInline>
        <source src={loginVideo} type="video/mp4" />
      </video>
      <div className={styles.banner}>
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: 410,
            width: 410,
            margin: '28px 0px 0px',
          }}
          title="盛邦安全前端统一框架"
          initialValues={{
            autoLogin: true,
          }}
          actions={[
            <div
              style={{ textAlign: 'center', color: '#807e7eff', marginTop: 32 }}
              key="copyright"
            >
              <CopyrightOutlined key="icon" style={{ marginRight: 4 }} />
              2025 远江盛邦安全科技集团股份有限公司
            </div>,
          ]}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
              }}
              placeholder="用户名: admin"
              rules={[
                {
                  required: true,
                  message: '请输入用户名',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder="密码: Test@123"
              rules={[
                {
                  required: true,
                  message: '请输入密码',
                },
              ]}
            />
          </>
          <Row style={{ position: 'relative' }}>
            <Col span={24}>
              <ProFormText
                name="imgCode"
                fieldProps={{
                  size: 'large',
                  prefix: <SafetyOutlined />,
                }}
                placeholder="请输入验证码"
                rules={[
                  {
                    required: true,
                    message: '请输入验证码',
                    min: 4,
                  },
                ]}
              />
            </Col>
            {code && (
              <div onClick={() => loadCode()} className={styles.verificateCode}>
                <img
                  className={styles.inputStyle}
                  src={`data:image/jpeg;base64,${code}`}
                  alt=""
                />
              </div>
            )}
          </Row>
        </LoginForm>
      </div>
    </div>
  );
};

export default Login;
