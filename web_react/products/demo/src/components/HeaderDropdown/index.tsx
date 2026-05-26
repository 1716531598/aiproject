import { Dropdown } from 'antd';
import type { DropDownProps } from 'antd/es/dropdown';
import React from 'react';
import classNames from 'classnames';

export type HeaderDropdownProps = {
  overlayClassName?: string;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter';
} & Omit<DropDownProps, 'overlay'>;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ overlayClassName: cls, ...restProps }) => {
  return <Dropdown overlayClassName={classNames(cls)} {...restProps} />;
};

export default HeaderDropdown;
