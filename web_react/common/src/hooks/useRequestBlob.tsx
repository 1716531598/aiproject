import signature from '@ray/common/utils/chengyan/signature';
import { removeEndWith } from '@ray/common/utils/utils';
import { formatMessage } from '@umijs/max';
import { message } from 'antd';

/**
 * @desc:这是一个文件下载组件调用方法
 * @param:参数说明
 *    _url: 接口地址
 *    filename: 文件名称
 *    params: 请求参数{}
 *
 */

const useRequestBlob = () => {
  const requestBlob = (_url, params, options) => {
    let url = removeEndWith(_url, '/');
    const { filename, callbackFinished } = options;
    const send_params = JSON.parse(JSON.stringify(params));
    if (params?.mvFileName) {
      delete send_params?.filename;
      delete send_params?.mvFileName;
    }
    const server = signature({ url, body: send_params });
    return new Promise((resolve) => {
      fetch(url, server)
        .then((response) => {
          const contentType = response.headers.get('Content-Type');
          //不管成功失败 到下载文件的接口都应该删除 否则可能导致再次循环
          localStorage.removeItem(filename);
          if (response.status >= 400) {
            message.error(formatMessage({ id: 'export false' }));
            resolve(false);
            return false;
          }
          if (response.headers.get('status-info') === 'false') {
            response.json().then((text) => {
              message.error(
                text?.msg ||
                  formatMessage({ id: response.headers.get('msg_type') }) ||
                  formatMessage({ id: 'export false' }),
              );
            });
            resolve(false);
            return false;
          } else {
            if (contentType === 'application/json') {
              response.json().then((text) => {
                message.error(
                  text?.msg || formatMessage({ id: 'export false' }),
                );
              });
              resolve(false);
              return false;
            } else {
              response.blob().then((blob: any) => {
                if (blob.success === false) {
                  message.error(formatMessage({ id: 'export false' }));
                  resolve(false);
                  return false;
                }
                let strFileName = filename;
                //content-disposition：attachment;filename*=UTF-8''blackiplist.zip
                const disposition = response.headers.get('content-disposition');
                if (disposition) {
                  if (disposition?.includes('filename')) {
                    //截取文件名
                    if (disposition?.includes('filename=')) {
                      strFileName = disposition.split('filename=').slice(-1);
                    } else {
                      strFileName = disposition
                        .split("filename*=UTF-8''")
                        .slice(-1);
                      strFileName = decodeURIComponent(strFileName);
                    }
                  } else {
                    //filename+suffix
                    strFileName =
                      strFileName + '.' + disposition.split('.').slice(-1);
                  }
                } else {
                  message.error(formatMessage({ id: 'export false' }));
                  resolve(false);
                  return false;
                }

                if (window.navigator.msSaveOrOpenBlob) {
                  //兼容ie
                  navigator.msSaveBlob(blob, strFileName);
                } else {
                  const blobUrl = window.URL.createObjectURL(blob);
                  const aElement = document.createElement('a');
                  document.body.appendChild(aElement);
                  aElement.style.display = 'none';
                  aElement.href = blobUrl;
                  aElement.download = strFileName;
                  aElement.click();
                  document.body.removeChild(aElement);
                }
                resolve(true);
                return true;
              });
              //执行完成回调
              callbackFinished?.();
              resolve(true);
              return true;
            }
          }
        })
        .catch((error) => {
          console.log(error);
          message.error(formatMessage({ id: 'export false' }));
          resolve(false);
          return false;
        });
    });
  };
  return requestBlob;
};

export default useRequestBlob;
