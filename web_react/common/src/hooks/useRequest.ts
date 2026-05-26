import { useRequest as _useRequest } from 'ahooks';
import { Options, Result, Service } from 'ahooks/lib/useRequest/src/types';
import request from '../utils/chengyan/request';

export type CommonRes<T> = {
  data: T;
  msg: string;
  success: boolean;
  msgType: 'success' | 'error';
};

export default function useRequest<
  TData extends Record<string, unknown>,
  TParams extends any[],
>(
  server: { url: string; body?: any },
  options?: Options<CommonRes<TData>, TParams> & { showMsg?: boolean },
): Result<CommonRes<TData>, TParams> {
  const { url, body = {} } = server;
  const { showMsg, ...rest } = options || {};
  const _request: Service<any, any> = async (p) => {
    return request(url, { body: p || body, showMsg });
  };
  return _useRequest(_request, { debounceWait: 300, manual: true, ...rest });
}
