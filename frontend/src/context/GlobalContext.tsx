import React, { createContext, useContext, useState } from 'react';

type GlobalContextType = {
  symbol: string;
  setSymbol: (sym: string) => void;
  theme: string;
  setTheme: (t: string) => void;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [symbol, setSymbol] = useState('TSLA');
  const [theme, setTheme] = useState('dark');

  return (
    <GlobalContext.Provider value={{ symbol, setSymbol, theme, setTheme }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobalContext must be used within GlobalProvider");
  return context;
};
