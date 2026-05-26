export default {
  'POST /api/mock/user/query': (req, res) => {
    res.send({
      code: 200,
      data: {
        aaData: [
          {
            errcount: 5,
            id: 2,
            is_login: 1,
            name: 'admin',
            parentName: 'superman',
            role_type: 1,
            timeout: 30,
          },
          {
            errcount: 5,
            id: 5,
            is_login: 1,
            name: 'user',
            parentName: 'admin',
            role_type: 2,
            timeout: 30,
          },
          {
            errcount: 5,
            id: 4,
            is_login: 1,
            name: 'audit',
            parentName: 'admin',
            role_type: 3,
            timeout: 30,
          },
        ],
        count: 10,
        page: 1,
        total: 3,
      },
      msg: '',
      msgType: 'success',
    });
  },
  'POST /api/v1/user/add': (req, res) => {
    res.send({
      msg: '新建成功',
      msgType: 'success',
      code: 200,
      data: {},
    });
  },
  'POST  /api/v1/user/resetpwd': (req, res) => {
    res.send({
      msg: '当前用户密码已重置',
      msgType: 'success',
      code: 200,
      data: {},
    });
  },
  'POST  /api/mock/user/delete': (req, res) => {
    res.send({
      msg: '删除用户成功',
      msgType: 'success',
      code: 200,
      data: {},
    });
  },
};
