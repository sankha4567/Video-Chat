import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as IOServer } from 'socket.io';
import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false
  }
};

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const PORT = 8080;
const userToRoomMap = new Map<string, Set<string>>();

export default function SocketHandler(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    res
      .status(200)
      .json({ success: true, message: 'Socket is already running', socket: `:${PORT}` });
    return;
  }

  console.log('Starting Socket.IO server on port:', PORT);
  const io = new Server({
    path: '/api/socket',
    addTrailingSlash: false,
    cors: { origin: '*' }
  }).listen(PORT);

  io.on('connection', (socket) => {
    console.log('Socket connected -' + socket.id);

    socket.on('room-join', (roomID) => {
      const room = io.sockets.adapter.rooms.get(roomID);

      if (room === undefined) {
        socket.join(roomID);
        socket.emit('room-created');
      } else if (room.size === 1) {
        socket.join(roomID);
        socket.emit('room-joined');
      } else {
        socket.emit('room-full');
      }

      if (!userToRoomMap.has(socket.id)) {
        userToRoomMap.set(socket.id, new Set([roomID]));
      } else {
        userToRoomMap.get(socket.id)?.add(roomID);
      }
    });

    socket.on('ready', (roomID) => {
      socket.to(roomID).emit('ready');
    });

    socket.on('message', (message, roomID) => {
      socket.to(roomID).emit('message', message);
    });

    socket.on('id2Content', (id2Content, roomID) => {
      console.log('id2Content', id2Content);
      socket.to(roomID).emit('id2Content', id2Content);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected -' + socket.id);
      const rooms = userToRoomMap.get(socket.id);
      if (rooms) {
        rooms.forEach((roomID) => {
          socket.to(roomID).emit('user-disconnected', socket.id);
        });
      }

      userToRoomMap.delete(socket.id);
    });
  });

  res.socket.server.io = io;
  res.status(201).json({ success: true, message: 'Socket is started', socket: `:${PORT}` });
}
