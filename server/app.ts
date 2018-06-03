import { Server } from 'net';

const express = require('express');
const socket = require('socket.io');

const app = express();
const server: Server = app.listen(8080, function () {
  console.log('server is running on port 8080')
});
const io = socket(server);
let gameState = null;

io.on('connection', (socket) => {
  io.emit('RECEIVE_MESSAGE', gameState);

  socket.on('SEND_MESSAGE', function (state) {
    gameState = state.state;
    io.emit('RECEIVE_MESSAGE', state.state);
    console.dir(gameState);
  });
});
