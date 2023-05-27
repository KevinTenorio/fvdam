import { createContext, useContext, useState, useMemo } from 'react';

const AppContext = createContext<any>(null);

// Updates the typescript Array type to include the toSpliced method.
declare global {
  interface Array<T> {
    toSpliced(index: number, deleteCount?: number): T[];
  }
}

// Provider component that must be used as parent for the App component.
export function AppProvider({ children }: any) {
  // Global application variables
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>([]);

  // Function to manage the global loading state. To start loading pass the message you want to display. To finish loading pass the same message and the false status.
  const setLoading = (message: string, status = true) => {
    if (status) {
      setLoadingMessages((prev: string[]) => [...prev, message]);
    } else {
      setLoadingMessages((prev: string[]) =>
        prev
          .slice(
            0,
            prev.findIndex((item) => item === message)
          )
          .concat(prev.slice(prev.findIndex((item) => item === message) + 1, prev.length))
      );
    }
  };

  // Function to control the global error state. To start the error pass the message you want to display. To finish the error pass the same message and the false status.
  const setError = (message: any, status = true) => {
    if (status) {
      setErrorMessages((prev: any[]) => [...prev, message]);
    } else {
      setErrorMessages((prev: any[]) =>
        prev
          .slice(
            0,
            prev.findIndex((item) => item === message)
          )
          .concat(prev.slice(prev.findIndex((item) => item === message) + 1, prev.length))
      );
    }
  };

  // Memoification of the global variables. Important to avoid unnecessary re-renders. Should be used in every context component.
  const value = useMemo(
    () => ({
      setError,
      errorMessages,
      loadingMessages,
      setLoading
    }),
    [loadingMessages, errorMessages]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the global variables. Should be used in every component that needs to access the global variables.
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}
