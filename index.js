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
    socket.on('send dataPlayer', function(myData){
        if(myData!=null){
            var json=JSON.parse(myData.toString());
            setPlayersData(json);
        }
    });
    socket.join('sendAllData');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function setPlayersData(myData){
    var exist=false;
    for(var i=0;i<players.length;i++){
        if(myData.id===players[i].id){
            players[i]=myData;
            exist=true;
            return;
        }
    }
    
    if(exist){
        return;
    }else{
        players.push(myData);
    }
}

setInterval(mainLoop,30);

function mainLoop(){

    for(var i=0;i<players.length;i++){
        if(players[i]!=null){ 
            if(players[i].posy==null || players[i].posy == undefined){
                players[i].posy=0;
            }
            if(players[i].posx==null || players[i].posx == undefined){
                players[i].posx=0;
            }
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
              players[i].posx+=vel;
          }  
        }
    }
    if(players!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", players); 
    }
}
    