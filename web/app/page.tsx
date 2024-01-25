'use client';

import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const createRoom = useCallback(() => {
    const id = uuidv4();
    router.push(`/room/${id}`);
  }, [router]);

  return (
    <main className="flex justify-center items-center min-h-screen">
      <section className="flex flex-col gap-8">
        <div className='space-y-2'>
        <h1 className="text-3xl font-bold">Start a <span className='text-green-500'>Stream!</span></h1>
          <p className='text-sm dark:text-gray-400 text-gray-500'>Create a room by clicking the button below</p>
        </div>
        <Button variant="outline" onClick={createRoom} className='font-bold'>
          Create Room
        </Button>
      </section>
    </main>
  );
}
