用户管理，包含用户列表、新增用户、编辑、删除、重置密码、搜索、排序
## API

引入方式:product/xx/config/routes.ts
{
    name: 'user',
    icon: 'team',
    path: '/user/management',
    component: `../../../../common/src/pages/user`,
},

2.
    ├── service.ts      # 接口api配置
    ├── index.tsx       # 页面