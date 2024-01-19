import express, { Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('Socket connected: ' + socket.id);
});

server.listen(port, () => {
  console.log('Server listening at http://localhost:' + port);
});
