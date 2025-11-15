import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface PageTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

interface PageTitleProviderProps {
  children: ReactNode;
}

export const PageTitleProvider: React.FC<PageTitleProviderProps> = ({ children }) => {
  const [title, setTitle] = useState<string>('Queue Management System');

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitle = (): PageTitleContextType => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return context;
};