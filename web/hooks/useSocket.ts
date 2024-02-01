import { useEffect, useRef } from 'react';

const useSocket = () => {
  const socket = useRef<boolean>(false);

  useEffect(() => {
    if (!socket.current) {
      const socketInit = async () => {
        await fetch('/api/socket');
      };
      try {
        socketInit();
        socket.current = true;
      } catch (error) {
        console.log(error);
      }
    }
  }, []);
};

export default useSocket;