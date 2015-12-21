var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var vel=8;
var debug=false;

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
            console.log(json);
            setPlayersData(json,socket.id);
        }
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
        console.log(socket.id);
        deletePlayer(socket.id);
    });
    socket.join('sendAllData');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function setPlayersData(myData,socketID){
    var exist=false;
    for(var i=0;i<playersClient.length;i++){
        if(myData.id===playersClient[i].id){
            playersClient[i]=myData;
            playersServer[i].name=myData.name;
            exist=true;
            return;
        }
    }
    
    if(exist){
        return;
    }else{
        var playerServer={
            "id":0,
            "posx":500,
            "posy":500,
            "color":"",
            "name":"",
            "socketID":"",
            "shootRadius":0,
            "chargeRadius":0,
            "maxShootRadius":150,
            "shootFlag":false
        }
        playersClient.push(myData);
        playerServer.id=myData.id;
        playerServer.posx=500;
        playerServer.posy=500;
        playerServer.color=myData.color;
        playerServer.name=myData.name;
        playerServer.socketID=socketID;
        playersServer.push(playerServer);
        console.log(playersServer.length);

    }
}

function deletePlayer(socketID){
    for(var i=0;i<playersServer.length;i++){
        if(socketID===playersServer[i].socketID){
            playersServer.splice(i,1);  
            playersClient.splice(i,1);  
        }
    }
    console.log("Number of Players: "+playersServer.length);
}

setInterval(mainLoop,30);

var now, delta;
var then = new Date().getTime();

function mainLoop(){
    now=new Date().getTime();
    delta=now-then;

    for(var i=0;i<playersClient.length;i++){
          if(playersClient[i].flagDown){
              playersServer[i].posy+=calcSpeed(delta, vel);
          }
          if(playersClient[i].flagUp){ 
              playersServer[i].posy-=calcSpeed(delta, vel);;
          }
          if(playersClient[i].flagLeft){ 
              playersServer[i].posx-=calcSpeed(delta, vel);
          }
          if(playersClient[i].flagRight){ 
              playersServer[i].posx+=calcSpeed(delta, vel);
          } 
        if(playersServer[i].chargeRadius<playersServer[i].maxShootRadius){
            playersServer[i].chargeRadius+=0.5;
        }
        
        if(playersServer[i].shootFlag && playersServer[i].shootRadius<playersServer[i].chargeRadius){
            playersServer[i].shootRadius+=3;
            if(playersServer[i].shootRadius>playersServer[i].chargeRadius){
                playersServer[i].shootRadius=0;
                playersServer[i].chargeRadius=0;
                playersServer[i].shootFlag=false;
            }
        }
        
    }
    if(playersServer!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", playersServer); 
    }
    then = now;
}

var calcSpeed = function(del, speed) {
    return (speed * del) * (60 / 1000);
}
    