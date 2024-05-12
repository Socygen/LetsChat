
io.on('connect', onConnect);

function onConnect(socket){

  socket.emit('hello', 'can you hear me?', 1, 2, 'abc');

  socket.broadcast.emit('broadcast', 'hello friends!');

  socket.to('game').emit('nice game', "let's play a game");

  socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");

  io.in('game').emit('big-announcement', 'the game will start soon');

  io.of('myNamespace').emit('bigger-announcement', 'the tournament will start soon');

  io.of('myNamespace').to('room').emit('event', 'message');

  io.to(`${socketId}`).emit('hey', 'I just met you');

  socket.emit('question', 'do you think so?', function (answer) {});

  socket.compress(false).emit('uncompressed', "that's rough");

  socket.volatile.emit('maybe', 'do you really need it?');

  socket.binary(false).emit('what', 'I have no binaries!');

  io.local.emit('hi', 'my lovely babies');

  io.emit('an event sent to all connected clients');

};