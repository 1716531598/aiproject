登录页面，包含登陆表单（用户名|密码|验证码）及通用样式完整功能
## API

引入方式:product/xx/config/routes.ts
{
    name: 'login',
    path: '/user/login',
    component: `../../../../common/src/pages/Login`,
},

2.
    ├── index.less      # 页面样式
    ├── service.ts      # 接口api配置
    ├── index.tsx       # 页面