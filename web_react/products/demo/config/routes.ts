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
    path: '/',
    redirect: '/user/login',
  },
  {
    path: '*',
    layout: false,
    component: './preview/exception/404',
  },
];
