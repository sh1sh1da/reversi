import { Server } from 'net';

const express = require('express');
const socket = require('socket.io');

const app = express();
const server: Server = app.listen(8080, function () {
  console.log('server is running on port 8080')
});
const io = socket(server);
let gameState = null;

let loggedInUsers: string[] = [];

io.on('connection', (socket) => {
  io.emit('RECEIVE_MESSAGE', gameState);
  io.emit('LOGGED_IN_USERS', loggedInUsers);

  socket.on('LOGIN', function (userInfo, ack) {
    if (userInfo.name === '' || loggedInUsers.includes(userInfo.name)) {
      ack({ errorMessage: 'error' });
    }
    loggedInUsers.push(userInfo.name);
    socket.user = userInfo.name;
    io.emit('LOGGED_IN_USERS', loggedInUsers);
    console.log(loggedInUsers);
  })

  socket.on('SEND_MESSAGE', function (state) {
    gameState = state.state;
    io.emit('RECEIVE_MESSAGE', state.state);
    console.dir(gameState);
  });

  socket.on('disconnect', () => {
    loggedInUsers = loggedInUsers.filter(u => u !== socket.user)
  });
});
