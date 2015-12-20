var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var players=[];
var vel=10;

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
    socket.on('send dataChat', function(data){
        console.log(data);
        io.emit('send dataChat', data);
    });
    socket.on('send dataPlayer', function(data){
        if(data!=null){
            setPlayersData(data);
        }
    });
    socket.join('sendAllData');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function setPlayersData(myData){
    console.log(myData);
    var exist=false;
    for(var i=0;i<players.length;i++){
        console.log("Sended Data:"+myData.id+"  |  Received Data:"+players[i].id);
        if(myData.id===players[i].id){
            players[i]=myData;
            console.log("Data Exist");
            console.log(myData);
            exist=true;
            return;
        }
    }
    
    if(exist){
        return;
    }else{
        players.push(myData);
        console.log("Data Push");
        console.log(myData);
        console.log(myData.id);
    }
}

setInterval(mainLoop,1500);

function mainLoop(){

    for(var i=0;i<players.length;i++){
        if(players[i]!=null){    
          if(players[i].flagDown){
              players[i].posy+=vel;
          }
          if(players[i].flagUp){ 
              players[i].posy-=vel;
          }
          if(players[i].flagLeft){ 
              players[i].posx-=vel;
          }
          if(players[i].flagRight){ 
              players[i].posx=vel;
          }  
        }
    }
    if(players!=null){
        //console.log("Sended Data");
        //console.log(players);
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", players); 
    }
}
    