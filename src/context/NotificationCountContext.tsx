import React, { createContext, useContext, useState } from 'react';

interface NotificationCountContextProps {
  count: number;
  setCount: (count: number) => void;
}

const NotificationCountContext = createContext<NotificationCountContextProps>({
  count: 0,
  setCount: () => {},
});

export const NotificationCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  return (
    <NotificationCountContext.Provider value={{ count, setCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
};

export const useNotificationCount = () => useContext(NotificationCountContext); 