import { CaretDownOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Button, notification } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';

const useStyles = createStyles(({ token, css }) => ({
  leaseNotificationLight: css`
    background-color: #f5f7f9 !important;
    padding: 8px 8px 8px 12px !important;
    bottom: -42px;
    position: inherit;

    .ant-notification-notice-close {
      top: 8px !important;
      right: 8px !important;
    }

    .ant-notification-notice-message,
    .ant-notification-notice-description {
      margin-inline-start: 48px !important;
    }

    .ant-notification-notice-description {
      margin-top: 0px !important;
    }
  `,

  leaseNotificationDark: css`
    border-top: 1px solid rgba(250, 250, 250, 0.2);
    background-color: var(--sider-color) !important;
    color: var(--sider-font-color) !important;
    padding: 16px 16px !important;
    bottom: -42px;
    position: inherit;

    .ant-notification-notice-close {
      top: 8px !important;
      right: 8px !important;
      color: var(--sider-font-color) !important;
    }

    .ant-notification-notice-message {
      margin-bottom: 2px;
      font-weight: 500;
      color: var(--sider-font-color) !important;
    }

    .ant-notification-notice-description {
      font-weight: 500;
      margin-top: 0px !important;
    }
  `,

  btnIconStyle: css`
    .ant-btn-icon {
      margin: auto;
    }
  `,

  content: css`
    display: flex;
    flex-direction: column;
    color: var(--font-color) !important;
  `,
}));

const IMG = {
  lease: (
    <svg viewBox="0 0 1024 1024" width="24" height="24">
      <path
        d="M576 576m-384 0a384 384 0 1 0 768 0 384 384 0 1 0-768 0Z"
        fill="#4366B0"
        fillOpacity="0.1"
      ></path>
      <path
        d="M512 128a384 384 0 0 0-271.52 655.52 384 384 0 1 0 543.04-543.04A381.472 381.472 0 0 0 512 128m0-64a448 448 0 1 1-448 448 448 448 0 0 1 448-448z"
        fill="#4366B0"
      ></path>
      <path
        d="M470.4 553.6c-9.6-14.336-56.32-73.6-70.656-90.112v-8.704h70.272v-35.84H400v-84.48a479.2 479.2 0 0 0 70.144-20.992l-22.4-30.208a778.464 778.464 0 0 1-162.944 40.32 216.64 216.64 0 0 1 11.264 29.696c21.504-3.2 44.544-6.144 67.584-10.752v76.288h-84.608v35.84h79.36a540.448 540.448 0 0 1-85.504 160.768 209.472 209.472 0 0 1 19.456 34.816 558.4 558.4 0 0 0 71.168-132.608v224.768h36.48v-237.568a1397.44 1397.44 0 0 1 48 78.336z m66.56 39.424h121.856v98.176h-121.728z m121.856-252.8v88.576h-121.728v-88.576z m0 218.112h-121.728v-94.976h121.856z m38.4 133.12V304.64h-197.504v386.56h-51.2v35.84h296.448v-35.84z"
        fill="#4366B0"
      ></path>
    </svg>
  ),
  leaseLogo: (
    <svg viewBox="0 0 1024 1024" width="18" height="18">
      <path
        d="M576 576m-384 0a384 384 0 1 0 768 0 384 384 0 1 0-768 0Z"
        fill="#a6adb4"
        fillOpacity="0.1"
      ></path>
      <path
        d="M512 128a384 384 0 0 0-271.52 655.52 384 384 0 1 0 543.04-543.04A381.472 381.472 0 0 0 512 128m0-64a448 448 0 1 1-448 448 448 448 0 0 1 448-448z"
        fill="#a6adb4"
      ></path>
      <path
        d="M470.4 553.6c-9.6-14.336-56.32-73.6-70.656-90.112v-8.704h70.272v-35.84H400v-84.48a479.2 479.2 0 0 0 70.144-20.992l-22.4-30.208a778.464 778.464 0 0 1-162.944 40.32 216.64 216.64 0 0 1 11.264 29.696c21.504-3.2 44.544-6.144 67.584-10.752v76.288h-84.608v35.84h79.36a540.448 540.448 0 0 1-85.504 160.768 209.472 209.472 0 0 1 19.456 34.816 558.4 558.4 0 0 0 71.168-132.608v224.768h36.48v-237.568a1397.44 1397.44 0 0 1 48 78.336z m66.56 39.424h121.856v98.176h-121.728z m121.856-252.8v88.576h-121.728v-88.576z m0 218.112h-121.728v-94.976h121.856z m38.4 133.12V304.64h-197.504v386.56h-51.2v35.84h296.448v-35.84z"
        fill="#a6adb4"
      ></path>
    </svg>
  ),
  trial: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="9" fill="#1684FC" fillOpacity="0.1" />
      <path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0-2a11 11 0 1 1 0 22 11 11 0 0 1 0-22z"
        fill="#1684FC"
      />
      <text
        x="12"
        y="13"
        fontFamily="SimHei"
        fontSize="12"
        textAnchor="middle"
        fill="#1684FC"
        dominantBaseline="middle"
      >
        测
      </text>
    </svg>
  ),
  trialLogo: (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <circle cx="12" cy="12" r="9" fill="#a6adb4" fillOpacity="0.1" />
      <path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0-2a11 11 0 1 1 0 22 11 11 0 0 1 0-22z"
        fill="#a6adb4"
      />
      <text
        x="12"
        y="13"
        fontFamily="SimHei"
        fontSize="12"
        textAnchor="middle"
        fill="#a6adb4"
        dominantBaseline="middle"
      >
        测
      </text>
    </svg>
  ),
};

const Lease = ({ data, type = 'trial', theme = 'dark' }) => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const collapsed = initialState?.collapsed || false;
  const [currentTheme, setCurrentTheme] = useState(
    initialState?.settings?.currentTheme || 'dark',
  );
  const [notificationApi, contextHolder] = notification.useNotification();
  const notificationKeyRef = useRef<string>('');
  const isFirstRender = useRef(true);

  const { customer = '', date = '', remaining = '' } = data;

  const openNotification = () => {
    if (notificationKeyRef.current) {
      notificationApi.destroy(notificationKeyRef.current);
    }

    const key = `${type}-${Date.now()}`;
    notificationKeyRef.current = key;

    const savedTheme = currentTheme;
    let actualTheme = theme;
    if (savedTheme && savedTheme === 'light') {
      actualTheme = 'light';
    }
    notificationApi.open({
      key,
      message: `${type === 'lease' ? '租赁' : '测试'}授权`,
      description: (
        <div className={styles.content}>
          <span>
            {date}（剩余{remaining}天）
          </span>
        </div>
      ),
      placement: 'bottomLeft',
      duration: 0,
      icon: actualTheme === 'light' && (
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
        >
          <path
            d="M945.980952 780.190476H975.238095a48.761905 48.761905 0 0 1 48.761905 48.761905v146.285714a48.761905 48.761905 0 0 1-48.761905 48.761905H536.380952a48.761905 48.761905 0 0 1-48.761904-48.761905v-146.285714a48.761905 48.761905 0 0 1 48.761904-48.761905h47.835429l79.725714-105.569524a146.285714 146.285714 0 1 1 191.878095-7.119238L945.980952 780.190476z m-186.075428-59.977143L711.92381 780.190476h93.257142l-45.275428-59.977143zM585.142857 877.714286v48.761904h341.333333v-48.761904H585.142857z m-170.666667 48.761904v97.52381H48.761905a48.761905 48.761905 0 0 1-48.761905-48.761905V48.761905a48.761905 48.761905 0 0 1 48.761905-48.761905h780.190476a48.761905 48.761905 0 0 1 48.761905 48.761905v316.952381h-97.52381V97.52381H97.52381v828.95238h316.95238z m341.333334-316.95238a48.761905 48.761905 0 1 0 0-97.52381 48.761905 48.761905 0 0 0 0 97.52381zM170.666667 658.285714h195.047619v97.52381H170.666667v-97.52381z m0-195.047619h341.333333v97.52381H170.666667v-97.52381z m0-195.047619h341.333333v97.52381H170.666667v-97.52381z"
            fill="#4366B0"
          ></path>
        </svg>
      ),
      style: {
        width: 260,
        left: -28,
        overflow: 'hidden',
      },
      bottom: 0,
      closeIcon: <CaretDownOutlined />,
      className:
        actualTheme === 'light'
          ? styles.leaseNotificationLight
          : styles.leaseNotificationDark,
    });
  };

  const closeNotification = () => {
    if (notificationKeyRef.current) {
      notificationApi.destroy(notificationKeyRef.current);
      notificationKeyRef.current = '';
    }
  };

  useEffect(() => {
    openNotification();

    return () => {
      closeNotification();
    };
  }, [currentTheme]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      setCurrentTheme(e.detail.theme || 'dark');
    };
    window.addEventListener('app-theme', handleThemeChange);

    return () => {
      window.removeEventListener('app-theme', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    closeNotification();

    if (!collapsed) {
      setTimeout(() => {
        openNotification();
      }, 100);
    }
  }, [collapsed]);

  const btnStyle = {
    dark: {
      background: 'transparent',
      color: '#4366B0',
      borderColor: '#fafafa82',
    },
    light: {
      background: '#fafafa',
      color: '#000',
      borderColor: '#d9d9d9',
    },
  };

  return (
    <>
      {contextHolder}
      {collapsed ? (
        IMG[`${type}Logo`]
      ) : (
        <Button
          style={{
            display: 'flex',
            alignItems: 'center',
            ...btnStyle[theme],
          }}
          shape="round"
          className={styles.btnIconStyle}
          onClick={() => {
            closeNotification();
            setTimeout(() => {
              openNotification();
            }, 100);
          }}
          icon={IMG[type]}
        >
          <div style={{ marginLeft: 8 }}>授权剩余{remaining}天</div>
        </Button>
      )}
    </>
  );
};

export default Lease;
