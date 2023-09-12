// No context ficam states que são usados em vários componentes filhos para evitar prop drilling
// Para evitar rerenderizações desnecessárias, usa-se o useMemo

import { createContext, useContext, useState, useMemo } from 'react';

const [FTName]Context = createContext<any>(null);

// Provider component that must be used as parent for the component.
export function [FTName]Provider({ children }: any) {
  const [message, setMessage] = useState<string>(' with context');

  // Memoification of the global variables. Important to avoid unnecessary re-renders. Should be used in every context component.
  const value = useMemo(
    () => ({
      message,
      setMessage
    }),
    [message]
  );

  return <[FTName]Context.Provider value={value}>{children}</[FTName]Context.Provider>;
}

export interface I[FTName]Context {
  message: string;
  setMessage: (value: string) => void;
}

// Hook to use the global variables. Should be used in every component that needs to access the global variables.
export function use[FTName]Context() {
  const context = useContext([FTName]Context);
  if (!context) {
    throw new Error('use[FTName]Context must be used within a [FTName]Provider');
  }
  return context;
}
