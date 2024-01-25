import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3002',
  },
});

const port = process.env.PORT || 8080;

app.use(express.json());

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
  });

  socket.on('ready', (roomID) => {
    socket.to(roomID).emit('ready');
  });

  socket.on('offer', (sdp, roomID) => {
    console.log('offer', sdp);
    socket.to(roomID).emit('offer', sdp);
  });

  socket.on('answer', (sdp, roomID) => {
    console.log('answer', sdp);
    socket.to(roomID).emit('answer', sdp);
  });

  socket.on('ice-candidate', (candidate, roomID) => {
    console.log('ice-candidate', candidate);
    socket.to(roomID).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected -' + socket.id);
    io.sockets.adapter.rooms.forEach((value, key) => {
      if (value.has(socket.id)) {
        io.to(key).emit('user-disconnected', socket.id);
      }
    });
  });
});

server.listen(port, () => {
  console.log('Server listening at http://localhost:' + port);
});
