'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

export interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export const AnimatedTabs = ({ tabs, defaultTab, onChange, children }: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const groupId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const getTabId = (tabId: string) => `${groupId}-${tabId}-tab`;
  const getPanelId = (tabId: string) => `${groupId}-${tabId}-panel`;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (currentIndex < 0) return;

    const lastIndex = tabs.length - 1;
    const targetIndexByKey: Record<string, number> = {
      ArrowRight: currentIndex === lastIndex ? 0 : currentIndex + 1,
      ArrowDown: currentIndex === lastIndex ? 0 : currentIndex + 1,
      ArrowLeft: currentIndex === 0 ? lastIndex : currentIndex - 1,
      ArrowUp: currentIndex === 0 ? lastIndex : currentIndex - 1,
      Home: 0,
      End: lastIndex,
    };

    const targetIndex = targetIndexByKey[event.key];
    if (targetIndex === undefined) return;

    event.preventDefault();
    const targetTab = tabs[targetIndex];
    handleTabChange(targetTab.id);
    tabRefs.current[targetTab.id]?.focus();
  };

  return (
    <div className={cn('space-y-6')}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          'relative flex gap-2 overflow-x-auto pb-1',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[tab.id] = element;
            }}
            id={getTabId(tab.id)}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            aria-controls={getPanelId(tab.id)}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, tab.id)}
            className={cn(
              'relative min-h-10 shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
              activeTab === tab.id
                ? 'text-(--background)'
                : 'bg-(--surface) border border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-muted)'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId={`${groupId}-active-tab`}
                className={cn('absolute inset-0 bg-(--accent) rounded-xl')}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={cn('relative z-10')}>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab || 'empty-tab'}
          id={getPanelId(activeTab)}
          role="tabpanel"
          aria-labelledby={getTabId(activeTab)}
          tabIndex={0}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children(activeTab)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
