'use client';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import styles from './Badge.module.css';

/**
 * Simple badge component with color variants.
 */
export function Badge({
  children,
  color = 'gray',
  size = 'md',
  variant = 'solid',
}: {
  children: ReactNode;
  color?: string;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'outline' | 'dot';
}) {
  return (
    <span
      className={classNames(styles.badge, styles[color], styles[size], {
        [styles.outline]: variant === 'outline',
        [styles.dot]: variant === 'dot',
      })}
    >
      {children}
    </span>
  );
}
