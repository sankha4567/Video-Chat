'use client';
import { FC, createContext, useContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketProps = {
  children: React.ReactNode;
};

type SocketContextValue = {
  socket: Socket;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return { socket };
};

const SocketProvider: FC<SocketProps> = ({ children }) => {
  const socket = useMemo(
    () =>
      io({
        host: 'localhost',
        port: 3000,
      }),
    []
  );

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;