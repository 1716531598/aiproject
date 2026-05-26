import { formatMessage } from '@umijs/max';
import { RangePickerProps } from 'antd/lib/date-picker';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
export const tableSorter = (key) => (a, b) => {
  return a[key] - b[key] > 0 ? -1 : a[key] - b[key] < 0 ? 1 : 0;
};

export const options2Obj = (array, key = 'label') =>
  array.reduce((p, { value, ...i }) => ({ ...p, [value]: i[key] }), {});

export const obj2Options = (obj: {
  [key: string | number]: string | number;
}): { label: string | number; value: string | number }[] => {
  if (obj && Object.keys(obj).length > 0) {
    return Object.entries(obj).map(([value, label]) => ({
      label: label,
      value: value,
    }));
  } else {
    return [];
  }
};

export const arrobj2Options = (array, labelKey, valueKey) => {
  if (array) {
    return array.map((item) => ({
      label: item[labelKey],
      value: item[valueKey],
    }));
  } else {
    return [];
  }
};

export const riskLevelColorMap = {
  0: 'rgb(241,39,67)',
  1: 'rgb(245,154,35)',
  2: 'rgb(56,117,237)',
};

// 处理表单数据   1.数组 rangePicker时间处理   2.switch  true/false ->1/0
export const handleFormatParams = (
  params = {} as any,
  switchAry = [] as string[],
) => {
  return Object.keys(params).reduce((res, key) => {
    let value = params[key];
    if (value === null || value === '' || value === undefined) {
      return res;
    } else if (Array.isArray(value) && key.includes('&')) {
      const keys = key.split('&');
      return {
        ...res,
        ...Object.fromEntries(keys.map((k, index) => [k, value[index]])),
      };
    } else if (switchAry?.includes(key)) {
      return {
        ...res,
        [key]: value ? 1 : 0,
      };
    } else if (Object.prototype.toString.call(value) === '[object Object]') {
      //递归对象
      return { ...res, [key]: handleFormatParams(value, switchAry) };
    }
    return { ...res, [key]: value };
  }, {});
};

export const disabledFutureDate = (current) => {
  return current > moment().endOf('day');
};

export const disabledBeforeDate = (current) => {
  if (current !== null) {
    return moment().isAfter(current);
  } else {
    return true;
  }
};

export const datePickerDisabledDate = (current, limitdays, dates) => {
  const disabledStarDay = new Date('1970-01-01 00:00:00');
  const disabledEndDay = new Date('10000-01-01 00:00:00');
  let endTime =
    current && (current < disabledStarDay || current >= disabledEndDay);
  if (!limitdays || !dates || dates.length === 0) {
    return endTime;
  }
  const tooLate =
    dates[0] && current && current.diff(dates[0], 'days') > limitdays;
  const tooEarly = dates[1] && dates[1].diff(current, 'days') > limitdays;
  return tooEarly || tooLate || endTime;
};

//预设常用日期范围
export const datePickerRanges = (): RangePickerProps['ranges'] => ({
  [formatMessage({ id: 'button-today' })]: [
    moment().startOf('day'),
    moment().endOf('day'),
  ],
  [formatMessage({ id: 'button-yesterday' })]: [
    moment().subtract(1, 'days').startOf('day'),
    moment().subtract(1, 'days').endOf('day'),
  ],
  [formatMessage({ id: 'button-latest-Week' })]: [
    moment().subtract(6, 'days').startOf('day'),
    moment().endOf('day'),
  ],
  [formatMessage({ id: 'button-this-month' })]: [
    moment().startOf('month'),
    moment().endOf('day'),
  ],
});

export const removeObjEmptyKeyFunc = (values) => {
  return Object.keys(values).reduce((acc, key) => {
    if (
      values[key] !== null &&
      values[key] !== undefined &&
      values[key] !== ''
    ) {
      acc[key] = values[key];
    }
    return acc;
  }, {});
};

export const createRequestLock = () => {
  const lockPool = (window as any).g_reqLockControllerObj || {};

  //获取锁状态，若锁定，则cancel上次请求，保留最新请求
  const getReqLock = (url: string, params: any = {}) => {
    if (lockPool[url] && isEqual(lockPool[url]?.params, params)) {
      return lockPool[url]?.lock || false;
    } else {
      return false;
    }
  };
  //设置锁状态
  const setReqLock = (
    url: string,
    state: boolean,
    params: any,
    // timestamp: number,
    controller?: AbortController,
  ) => {
    lockPool[url] = {
      lock: state,
      params: params,
      // timestamp: timestamp,
      controller: controller || lockPool[url]?.controller,
    };
    (window as any).g_reqLockControllerObj = lockPool;
    return true;
  };
  //中断请求
  const abortRequest = (url: string) => {
    if (lockPool[url]?.controller) {
      lockPool[url]?.controller?.abort();
    }
  };

  const releaseLock = (url: string): void => {
    if (lockPool[url]) {
      delete lockPool[url];
    }
    if (lockPool[url]?.controller) {
      lockPool[url]?.controller?.abort();
    }
    (window as any).g_reqLockControllerObj = lockPool;
  };

  return { getReqLock, setReqLock, abortRequest, releaseLock };
};

export const showTotal = (total: number) => {
  return `总计：${total}`;
};

export const transformSort = (input) => {
  const entries = Object.entries(input);
  if (entries.length === 0) {
    return { sortField: '', sortOrder: '' }; // 或 throw new Error("Empty input")
  }

  const [key, value] = entries[0];
  return {
    sortField: key,
    sortOrder: value === 'ascend' ? 'asc' : 'desc',
  };
};
