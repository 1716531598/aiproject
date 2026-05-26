import React, { useState } from 'react';
import { Tabs, Skeleton } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

interface PageHeaderProps {
  title?: string;
  logo?: React.ReactNode;
  action?: React.ReactNode;
  content?: React.ReactNode;
  extraContent?: React.ReactNode;
  tabList?: { tab: string; key: string }[];
  className?: string;
  tabActiveKey?: string;
  tabDefaultActiveKey?: string;
  tabBarExtraContent?: React.ReactNode;
  loading?: boolean;
  wide?: boolean;
  hiddenBreadcrumb?: boolean;
  onTabChange?: (key: string) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  logo,
  action,
  content,
  extraContent,
  tabList,
  className,
  tabDefaultActiveKey,
  tabBarExtraContent,
  loading = false,
  wide = false,
  onTabChange,
}) => {
  const [activeKey, setActiveKey] = useState(tabDefaultActiveKey);
  const handleTabChange = (key: string) => {
    onTabChange?.(key);
    setActiveKey(key);
  };

  const clsString = classNames(styles.pageHeader, className);

  // 如果没有标签页且标题不是'show'，则不渲染
  if ((!tabList || !tabList.length) && title !== 'show') {
    return null;
  }

  return (
    <div className={clsString}>
      <div className={wide ? styles.wide : ''}>
        <Skeleton
          loading={loading}
          title={false}
          active
          paragraph={{ rows: 3 }}
          avatar={{ size: 'large', shape: 'circle' }}
        >
          <div className={styles.detail}>
            {logo && <div className={styles.logo}>{logo}</div>}
            <div className={styles.main}>
              <div className={styles.row}>
                {title && title !== 'show' && <h1 className={styles.title}>{title}</h1>}
                {action && <div className={styles.action}>{action}</div>}
              </div>
              <div className={styles.row}>
                {content && <div className={styles.content}>{content}</div>}
                {extraContent && <div className={styles.extraContent}>{extraContent}</div>}
              </div>
            </div>
          </div>
          {tabList && tabList.length > 0 && (
            <Tabs
              className={styles.tabs}
              activeKey={activeKey}
              onChange={handleTabChange}
              tabBarExtraContent={tabBarExtraContent}
              items={tabList}
            />
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default PageHeader;
