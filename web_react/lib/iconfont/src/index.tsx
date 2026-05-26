import iconfontJs from '!!raw-loader!../assets/iconfont.js';
import { createFromIconfontCN } from '@ant-design/icons';
// 使用：
// import IconFont from '@ray/iconfont';
// <IconFont type='anticon-xitongguanli' className='xxx-xxx' />
const IconFont = createFromIconfontCN({
  scriptUrl: `data:text/javascript;charset=utf-8,${encodeURIComponent(
    iconfontJs,
  )}`,
});
export default IconFont;
