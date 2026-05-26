import { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

async function getFakeCaptcha(req: Request, res: Response) {
  await waitTime(2000);
  return res.json('captcha-xxx');
}

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

/**
 * 当前用户的权限，如果为空代表没登录
 * current user access， if is '', user need login
 * 如果是 pro 的预览，默认是有权限的
 */
let access =
  ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';
let roleType = 1;

const getAccess = () => {
  return access;
};

// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 支持值为 Object 和 Array
  'GET /api/mock/currentUser': (req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        data: {
          isLogin: false,
        },
        errorCode: '401',
        errorMessage: '请先登录！',
        success: true,
      });
      return;
    }
    res.send({
      success: true,
      data: {
        name: getAccess(),
        role_type: roleType,
        avatar:
          'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        userid: '00000001',
        email: 'antdesign@alipay.com',
        signature: '海纳百川，有容乃大',
        title: '交互专家',
        group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
        tags: [
          {
            key: '0',
            label: '很有想法的',
          },
          {
            key: '1',
            label: '专注设计',
          },
          {
            key: '2',
            label: '辣~',
          },
          {
            key: '3',
            label: '大长腿',
          },
          {
            key: '4',
            label: '川妹子',
          },
          {
            key: '5',
            label: '海纳百川',
          },
        ],
        notifyCount: 12,
        unreadCount: 11,
        country: 'China',
        access: getAccess(),
        geographic: {
          province: {
            label: '浙江省',
            key: '330000',
          },
          city: {
            label: '杭州市',
            key: '330100',
          },
        },
        address: '西湖区工专路 77 号',
        phone: '0752-268888888',
      },
    });
  },
  // GET POST 可省略
  'GET /api/users': [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ],
  'POST /api/mock/login/account': async (req: Request, res: Response) => {
    const { password, username, type } = req.body;
    await waitTime(500);
    if (password === 'Test@123' && username === 'admin') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      roleType = 1;
      return;
    }
    if (password === 'Test@123' && username === 'user') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'user',
      });
      access = 'user';
      roleType = 2;
      return;
    }
    if (password === 'Test@123' && username === 'audit') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'audit',
      });
      access = 'audit';
      roleType = 3;
      return;
    }
    if (type === 'mobile') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }

    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
    access = 'guest';
  },
  'POST /api/mock/login/outLogin': (req: Request, res: Response) => {
    access = '';
    res.send({ data: {}, success: true });
  },
  'POST /api/register': (req: Request, res: Response) => {
    res.send({ status: 'ok', currentAuthority: 'user', success: true });
  },
  'GET /api/500': (req: Request, res: Response) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (req: Request, res: Response) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (req: Request, res: Response) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (req: Request, res: Response) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },
  'POST  /api/v1/auth/createcode': (req: Request, res: Response) => {
    res.send({
      code: 200,
      data: {
        imgCode:
          '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',
      },
      msg: '创建验证码成功',
      msgType: 'success',
    });
  },
};
