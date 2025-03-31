import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow requests only from your frontend
    methods: ['GET', 'POST'], // Allowed HTTP methods
  },
});

const PORT = 3000;

// Enable CORS for Express routes
app.use(cors());

// Store peer IDs mapped to socket IDs
const peers: Record<string, string> = {};

io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id); //a user connected

  // Handle peer ID registration
  socket.on('peer-id', (peerId: string) => {
    console.log(`Peer ID received: ${peerId} from socket: ${socket.id}`);
    peers[socket.id] = peerId;
  });

  // Handle request for peer ID
  socket.on('get-peer-id', (callback: (peerId: string | null) => void) => {
    const peerId = peers[socket.id];
    if (peerId) {
      callback(peerId);
    } else {
      callback(null);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete peers[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});