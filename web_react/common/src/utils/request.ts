//import fetch from 'dva/fetch'
import { formatMessage, getDvaApp, history } from '@umijs/max';
import { message, notification } from 'antd';
import signature from './signature';
import { createRequestLock } from './utilFn';
import { codeMessage, removeEndWith } from './utils';

//query show message
const showUrlMessage_arry = [
  'POST /api/v1/webkeeperlog/query',
  'POST /api/v1/webprobesvr/result/query',
  'POST /api/v1/webkeyword/webkeyworddict/query',
  'POST /api/v1/webweakpwd/webweakpwddict/query',
  'POST /api/v1/report/reportlist/query',
  'POST /api/v1/logsystem/atklog/query',
  'POST /api/v1/gatewayagent/tproxy',
  'POST /api/v1/websensitive/privatedict/query',
  'POST /api/v1/webtamper/refresh/query',
  'POST /api/v1/webtamper/compare/query',
];

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} _url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(_url, option) {
  const { getReqLock, setReqLock, releaseLock, abortRequest } =
    createRequestLock();
  option.url = removeEndWith(_url, '/');
  let url = removeEndWith(_url, '/');
  let _signal;
  if (option.controlReq) {
    const controller = new AbortController();
    const { signal } = controller;
    _signal = signal;
    window.g_reqCancelController = controller;
  }

  const reqLockStates = getReqLock(url, option);
  if (reqLockStates) {
    abortRequest(url);
  }
  const controller = new AbortController();
  const { signal } = controller;
  _signal = signal;
  setReqLock(url, true, option, controller);
  const _server = signature({ ...option, body: option.body || {} });
  return fetch(url, { ..._server, signal: _signal })
    .then((response: any) => {
      if (url === '/api/cms/user/login') {
        sessionStorage.setItem(
          'x-csrftoken',
          response.headers.get('x-csrftoken'),
        );
      }

      if (option.method === 'DELETE' || response.status === 204) {
        return response.text();
      }
      if (response.status !== 200 && url === '/api/v1/system/store/alarm/query')
        return;
      return response.json();
    })
    .then((response) => {
      //response.error_code=10040
      // if(response.status!==200&&url=='/api/v1/system/store/alarm/query') return
      if ([10010, 10210, 10230, 10170, 10190].includes(response.error_code)) {
        message.error(response.msg);
        return;
      } else if ([10000, 10040, 10050, 10140].includes(response.error_code)) {
        history.push({ pathname: '/user/login' }, 'tokenout');
        return;
      } else if (response.error_code === 10150) {
        history.push('/exception/nolicense');
        return;
      } else if (
        (response.error_code === 10160 &&
          showUrlMessage_arry.indexOf(response.request) > -1) ||
        response.showErrorMsg
      ) {
        message.error(response.msg);
        return;
      } else if (response.error_code === 10180) {
        if (url !== '/exception/factoryreset') {
          history.push('/exception/factoryreset');
        }
        return;
      }
      if (option?.showMsg) {
        message[response?.msgType]?.(response?.msg);
      }
      return response;
    })
    .then((response) => {
      return response;
    })
    .catch((e) => {
      const status = e.name;
      // environment should not be used
      if ([422, 401].includes(status)) {
        // DELETE and 204 do not return data by default
        // using .json will report an error.
        if (
          //接口401清除cookies
          status === 401
        ) {
          document.cookie = '';
          //获取production和验证码接口重载页面
          if (
            [
              '/api/cms/production',
              '/api/cms/captcha',
              '/api/v1/upgradelogin/status',
            ].includes(url)
          ) {
            logout({
              logout_type: 'indexlogout',
            }).then(() => {
              window.location.reload();
            });
          }
        }
        history.push({ pathname: '/user/login' }, 'tokenout');
        return;
      }
      if (status === 403) {
        history.push('/exception/403');
        return;
      }
      if (status === 423) {
        history.push('/exception/logout');
        return;
      }
      if (status < 504 && status > 500) {
        return;
      }
      if (status === 504) {
        if (url === '/api/v1/system/tcpdump/package') {
          return;
        }
        notification.error({
          placement: 'bottomRight',
          duration: null,
          message: `${formatMessage({
            id: 'Gateway timeout',
          })} ${status}: ${url}`,
        });
        getDvaApp()._store.dispatch({
          type: 'systemloading/stopLoading',
        });
      }
      if ((status >= 404 && status < 422) || status === 500) {
        notification.error({
          placement: 'bottomRight',
          duration: null,
          message: `${status}:${url} `,
          description: codeMessage[status],
        });
      }
    })
    .finally(() => {
      releaseLock(url);
    });
}
