const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server);
const rooms = io.of('/').adapter.rooms;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// User selection 
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  console.log(username);
  if(!username) {
    return next(new Error('Invalid Username'));
  }
  socket.username = username;
  next();
})

io.on('connection', (socket) => {
    const users = [];
    for (let [id, socket] of io.of('/').sockets) {
      users.push({
        userID: id,
        username: socket.username
      });
    }

    socket.broadcast.emit('user connected', {
      userID: socket.id,
      username: socket.username,
    });
    // Need to connect to a room
    // No need. Only to send messages to another user?

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });

    socket.on('chat message', ({content, to}) => {
        socket.to(to).emit('chat message', {
          content: content,
          from: socket.id
        });
    })

    socket.on('typing', (id) => {
        socket.broadcast.emit('typing', id);
    })
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});