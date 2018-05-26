var express = require('express');
var app = express();

server = app.listen(8080, function () {
  console.log('server is running on port 8080')
});

var socket = require('socket.io');
io = socket(server);

let gameState = null;

io.on('connection', (socket) => {
  io.emit('RECEIVE_MESSAGE', gameState);

  socket.on('SEND_MESSAGE', function (state) {
    gameState = state.state;
    io.emit('RECEIVE_MESSAGE', state.state);
    console.dir(gameState);
  });
});
