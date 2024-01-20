'use client';

import { SocketContextValue, useSocket } from '@/components/providers/Socket';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formSchema } from '@/schema/form';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      roomId: 0,
    },
  });

  const { socket } = useSocket() as SocketContextValue;
  const router = useRouter();

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      const { username, roomId } = values;
      socket.emit('room:join', { username, roomId });
      router.push(`/room/${roomId}`);
    },
    [socket]
  );

  return (
    <main className="flex flex-col justify-center items-center gap-8 min-h-screen">
      <h1 className="text-xl font-bold">Join a Room</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-xs w-full"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room ID</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </main>
  );
}
