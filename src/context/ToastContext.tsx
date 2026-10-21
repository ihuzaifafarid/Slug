import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastData, ToastNotification } from '../components/Toast';

interface ToastContextValue {
  showToast: (data: Omit<ToastData, 'id'>) => void;
  showCopySlugToast: (slug: string) => void;
  showCopyUrlToast: (url: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  const showToast = useCallback((data: Omit<ToastData, 'id'>) => {
    setActiveToast({
      ...data,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    });
  }, []);

  const showCopySlugToast = useCallback((slug: string) => {
    const clean = slug.trim();
    showToast({
      title: 'Slug copied to clipboard',
      snippet: clean ? `/${clean}` : undefined,
      type: 'success',
      actionType: 'slug',
      duration: 3200,
    });
  }, [showToast]);

  const showCopyUrlToast = useCallback((url: string) => {
    showToast({
      title: 'Full URL copied to clipboard',
      snippet: url,
      type: 'success',
      actionType: 'url',
      duration: 3200,
    });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showCopySlugToast, showCopyUrlToast, hideToast }}>
      {children}
      <ToastNotification toast={activeToast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
