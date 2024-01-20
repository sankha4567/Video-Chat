import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './types';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: 'http://localhost:3002',
  },
});

const port = process.env.PORT || 8080;

app.use(express.json());

const usernameToSocketIdMap: Map<string, string> = new Map();
const socketIdToUsernameMap: Map<string, string> = new Map();

io.on('connect', (socket) => {
  console.log('Socket connected: ' + socket.id);

  socket.on('room:join', ({ username, roomId }) => {
    usernameToSocketIdMap.set(username, socket.id);
    socketIdToUsernameMap.set(socket.id, username);

    socket.join(roomId);

    io.to(roomId).emit('user:joined', { message: `${username} joined the room` });
  });
});

server.listen(port, () => {
  console.log('Server listening at http://localhost:' + port);
});
