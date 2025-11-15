import { useEffect } from 'react';
import { usePageTitle } from '../contexts/PageTitleContext';

export const useSetPageTitle = (title: string) => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(title);
    
    return () => {
      setTitle('Queue Management System');
    };
  }, [title, setTitle]);
};