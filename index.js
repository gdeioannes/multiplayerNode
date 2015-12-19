var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('send dataChat', function(data){
      console.log(data);
    io.emit('send dataChat', data);
  });
  socket.on('send dataPlayer', function(data){
      console.log(data);
    io.emit('send dataPlayer', data);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});