import { showTotal } from '@ray/common/utils/utilFn';
export const defaultIllegalchar = [
  '`',
  '|',
  '&',
  'bash ',
  'sh ',
  'wget ',
  ';',
  '<',
  '>',
  '../',
  "'",
  '?',
  '+',
  '$',
];

export const PAGINATION_PROPS = {
  hideOnSinglePage: false,
  showSizeChanger: true,
  showQuickJumper: true,
  defaultCurrent: 1,
  pageSizeOptions: [5, 10, 20, 50],
  defaultPageSize: 10,
  showTotal,
  size: 'default',
  showTitle: false,
};

export const PAGINATION_SIMPLE_PROPS = {
  hideOnSinglePage: false,
  showSizeChanger: false,
  showQuickJumper: false,
  defaultCurrent: 1,
  pageSizeOptions: [5, 10, 20, 50],
  defaultPageSize: 5,
  size: 'small',
  showTitle: false,
  simple: { readOnly: true },
  showTotal: false,
};
