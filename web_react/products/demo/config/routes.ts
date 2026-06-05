const commonRelativeUrl = '../../../../common/src/pages';
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: `${commonRelativeUrl}/Login`,
      },
    ],
  },
  {
    path: '/common',
    name: 'common',
    icon: 'dashboard',
    routes: [
      {
        path: '/common',
        redirect: '/common/dashboard',
      },
      {
        path: '/common/dashboard',
        name: 'dashboard',
        icon: 'dashboard',
        component: `${commonRelativeUrl}/Dashboard`,
        access: 'canDashboard',
      },
      {
        name: 'user',
        icon: 'team',
        path: '/common/user/management',
        component: `${commonRelativeUrl}/User`,
        access: 'canUser',
      },
      {
        name: 'role',
        icon: 'safety',
        path: '/common/role',
        component: `${commonRelativeUrl}/Role`,
        access: 'canUser',
      },
      {
        name: 'auditlog',
        icon: 'audit',
        path: '/common/auditlog',
        component: `${commonRelativeUrl}/Auditlog`,
        access: 'canAuditlog',
      },
    ],
  },
  {
    path: '/issue',
    name: '问题管理',
    icon: 'bug',
    routes: [
      {
        path: '/issue',
        redirect: '/issue/bugs',
      },
      {
        path: '/issue/bugs',
        name: '网上问题',
        component: `${commonRelativeUrl}/Issue/BugList`,
        access: 'canIssue',
      },
      {
        path: '/issue/bugs/import',
        name: '禅道导入',
        component: `${commonRelativeUrl}/Issue/BugImport`,
        access: 'canIssue',
      },
      {
        path: '/issue/bugs/:id',
        name: '问题详情',
        hideInMenu: true,
        component: `${commonRelativeUrl}/Issue/BugList/Detail`,
        access: 'canIssue',
      },
      {
        path: '/issue/responsibility',
        name: '责任分配',
        component: `${commonRelativeUrl}/Issue/Responsibility`,
        access: 'canIssue',
      },
      {
        path: '/issue/poc',
        name: 'PoC 风险',
        component: `${commonRelativeUrl}/Issue/PocList`,
        access: 'canIssue',
      },
      {
        path: '/issue/poc/:id',
        name: 'PoC 详情',
        hideInMenu: true,
        component: `${commonRelativeUrl}/Issue/PocList/Detail`,
        access: 'canIssue',
      },
      {
        path: '/issue/todos',
        name: '全部 TODO',
        component: `${commonRelativeUrl}/Issue/TodoList`,
        access: 'canIssue',
      },
      {
        path: '/issue/statistic',
        name: '统计分析',
        component: `${commonRelativeUrl}/Issue/Statistic`,
        access: 'canIssue',
      },
      {
        path: '/issue/overdue',
        name: '超期分析',
        component: `${commonRelativeUrl}/Issue/Overdue`,
        access: 'canIssue',
      },
      {
        path: '/issue/admin',
        name: '系统管理',
        routes: [
          {
            path: '/issue/admin/products',
            name: '产品管理',
            component: `${commonRelativeUrl}/Issue/Product`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/modules',
            name: '模块管理',
            component: `${commonRelativeUrl}/Issue/Module`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/staffs',
            name: '人员档案',
            component: `${commonRelativeUrl}/Issue/Staff`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/versions',
            name: '版本管理',
            component: `${commonRelativeUrl}/Issue/Version`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/assessment',
            name: '考核配置',
            component: `${commonRelativeUrl}/Issue/Assessment`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/issue-types',
            name: '问题类型',
            component: `${commonRelativeUrl}/Issue/IssueType`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/email-config',
            name: '邮件配置',
            component: `${commonRelativeUrl}/Issue/EmailConfig`,
            access: 'canIssue',
          },
          {
            path: '/issue/admin/sync-logs',
            name: '同步日志',
            component: `${commonRelativeUrl}/Issue/SyncLog`,
            access: 'canIssue',
          },
        ],
      },
    ],
  },
  {
    path: '/',
    redirect: '/user/login',
  },
  {
    path: '*',
    layout: false,
    component: './preview/exception/404',
  },
];
