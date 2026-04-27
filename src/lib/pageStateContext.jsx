/**
 * Global page state context — resets all collapsible card states when page changes.
 * Components subscribe to know the current page and close themselves accordingly.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const PageStateContext = createContext({ currentPage: '', pageKey: 0 });

export function PageStateProvider({ currentPage, children }) {
  const [pageKey, setPageKey] = useState(0);
  const [prevPage, setPrevPage] = useState(currentPage);

  useEffect(() => {
    if (currentPage !== prevPage) {
      setPageKey(k => k + 1);
      setPrevPage(currentPage);
    }
  }, [currentPage]);

  return (
    <PageStateContext.Provider value={{ currentPage, pageKey }}>
      {children}
    </PageStateContext.Provider>
  );
}

export function usePageState() {
  return useContext(PageStateContext);
}

/**
 * Hook: returns an open/closed state that auto-resets to `defaultOpen`
 * whenever the page changes.
 */
export function usePageResetState(defaultOpen = false) {
  const { pageKey } = usePageState();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [pageKey]);

  return [open, setOpen];
}