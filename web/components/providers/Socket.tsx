'use client';
import { FC, createContext, useContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketProps = {
  children: React.ReactNode;
};

export type SocketContextValue = {
  socket: Socket;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = () => useContext(SocketContext);

const SocketProvider: FC<SocketProps> = ({ children }) => {
  const socket = useMemo(() => io('http://localhost:8080'), []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
