import { FormattedMessage, Link, Outlet } from '@umijs/max';
import { createContext, useContext } from 'react';
import PageHeader from '../PageHeader';
import styles from './index.less';

const MenuContext = createContext();

const PageHeaderWrapper = ({
  contentWidth,
  wrapperClassName,
  top,
  ...restProps
}) => {
  const gridContentClassName = `${styles.main} ${
    contentWidth === 'Fixed' ? styles.wide : ''
  }`;
  const menuContextValue = useContext(MenuContext);

  return (
    <div style={{ margin: '-16px -24px' }} className={wrapperClassName}>
      <PageHeader
        wide={contentWidth === 'Fixed'}
        home={<FormattedMessage id="menu.home" defaultMessage="Home" />}
        {...menuContextValue}
        key="pageheader"
        {...restProps}
        linkElement={Link}
        itemRender={(item) =>
          item.locale ? (
            <FormattedMessage id={item.locale} defaultMessage={item.title} />
          ) : (
            item.title
          )
        }
      />
      <div className={styles.content}>
        <div className={gridContentClassName}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default PageHeaderWrapper;
