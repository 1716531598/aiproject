import { LinkScreen, SelectLang, SelectTheme } from '@/components/RightContent';
import { DEFAULT_THEME, PRIMARY_COLOR, THEME } from '@/constant/theme';
import { UserOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import Lease from '@ray/common/components/Lease';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { ConfigProvider, theme } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekDay from 'dayjs/plugin/weekday';
import defaultSettings from '../config/defaultSettings';
import {
  AvatarDropdown,
  AvatarName,
} from './components/RightContent/AvatarDropdown';
import { errorConfig } from './requestErrorConfig';
import { currentUser as queryCurrentUser } from './services/api';

// 注册插件
dayjs.extend(weekOfYear);
dayjs.extend(weekDay);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

// 设置本地化
dayjs.locale('zh-cn');
const loginPath = '/user/login';

const { darkAlgorithm, compactAlgorithm } = theme;
/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };
  const currentTheme = localStorage.getItem('app-theme') || DEFAULT_THEME;
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: { ...defaultSettings, ...THEME[currentTheme], currentTheme },
    };
  }
  return {
    fetchUserInfo,
    settings: { ...defaultSettings, ...THEME[currentTheme], currentTheme },
  };
}
const leaseData = {
  customer: '远江盛邦安全科技集团股份有限公司',
  date: '2025-10-31到期',
  remaining: '30',
};
export const rootContainer: RuntimeConfig['rootContainer'] = (container) => {
  const currentTheme = localStorage.getItem('app-theme') || 'default';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: PRIMARY_COLOR,
        },
      }}
    >
      {container}
    </ConfigProvider>
  );
};
const useStyles = createStyles(({ token, css }) => ({
  layoutReset: css`
    &.layout-reset {
      .ant-pro-sider-link {
        padding: 0 8px !important;
        margin-left: 6px;
      }
    }
    html:not([data-theme='light']) &.layout-reset {
      .ant-pro-base-menu-vertical-item-title-collapsed {
        color: ${token.colorTextLightSolid};
        opacity: 0.65;
      }
    }
  `,
}));
// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const currentTheme = initialState?.settings?.currentTheme || DEFAULT_THEME;
  const { styles } = useStyles();
  return {
    actionsRender: () => [
      <LinkScreen />,
      <SelectTheme
        key="SelectTheme"
        onThemeChange={async () => {
          const newInitialState = await getInitialState();
          setInitialState((prevState) => ({
            ...prevState,
            ...newInitialState,
          }));
        }}
      />,
      <SelectLang key="SelectLang" />,
    ],
    className: `layout-reset ${styles.layoutReset}`,
    avatarProps: {
      src: <UserOutlined />,
      title: <AvatarName />,
      style: {
        color: 'inherit',
      },
      render: (_, avatarChildren) => {
        return <AvatarDropdown menu>{avatarChildren}</AvatarDropdown>;
      },
    },
    onPageChange: () => {
      const { location } = history;
      if (location.pathname !== loginPath) {
        document.documentElement.setAttribute('data-theme', currentTheme);
      }
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    links: [<Lease data={leaseData} key="lease" />],
    menuHeaderRender: undefined,
    onCollapse: (collapsed: boolean) => {
      // 更新 initialState 中的 collapsed 状态
      setInitialState((prevState) => ({
        ...prevState,
        collapsed,
      }));
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};
