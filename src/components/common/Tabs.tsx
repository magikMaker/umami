'use client';
import classNames from 'classnames';
import { type ReactNode, useState } from 'react';
import styles from './Tabs.module.css';

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

/**
 * Simple tabs component.
 */
export function Tabs({ items }: { items: TabItem[] }) {
  const [activeTab, setActiveTab] = useState(items[0]?.value || '');

  const activeItem = items.find(item => item.value === activeTab);

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList}>
        {items.map(item => (
          <button
            key={item.value}
            type="button"
            className={classNames(styles.tab, {
              [styles.active]: item.value === activeTab,
            })}
            onClick={() => setActiveTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>{activeItem?.content}</div>
    </div>
  );
}
