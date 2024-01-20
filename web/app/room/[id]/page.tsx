'use client';
import { SocketContextValue, useSocket } from '@/components/providers/Socket';
import { FC, useEffect } from 'react';

type pageProps = {
  params: {
    id: string;
  };
};

const page: FC<pageProps> = ({ params: { id } }) => {
  const { socket } = useSocket() as SocketContextValue;

  useEffect(() => {
    socket.on('user:joined', (data) => {
      console.log(data);
    });

    return () => {
      socket.off('user:joined');
    };
  }, [socket]);
  return <div>page</div>;
};

export default page;
