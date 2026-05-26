// lib/iconfont/src/index.d.ts
import { createFromIconfontCN } from '@ant-design/icons';

// 声明iconfont.js模块类型
declare module '*.js';

// 扩展IconFontProps以支持自定义图标
declare module '@ant-design/icons/lib/components/IconFont' {
  interface IconFontProps<T extends string = string> {
    /**
     * 图标类型
     * @example 'anticon-xitongguanli'
     */
    type: T;

    /**
     * 自定义类名
     */
    className?: string;

    /**
     * 自定义样式
     */
    style?: React.CSSProperties;

    /**
     * 点击事件
     */
    onClick?: React.MouseEventHandler<HTMLElement>;
  }
}

// 导出IconFont组件类型
declare const IconFont: ReturnType<typeof createFromIconfontCN>;
export default IconFont;