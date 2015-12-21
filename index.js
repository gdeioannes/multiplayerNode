var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var vel=15;
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
            setPlayersData(json,socket.id);
        }
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
        console.log(socket.id);
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
            "posx":200,
            "posy":200,
            "color":"",
            "name":"",
            "socketID":""
        }
        playersClient.push(myData);
        playerServer.id=myData.id;
        playerServer.posx=0;
        playerServer.posy=0;
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

function mainLoop(){

    for(var i=0;i<playersClient.length;i++){
          if(playersClient[i].flagDown){
              playersServer[i].posy+=vel;
          }
          if(playersClient[i].flagUp){ 
              playersServer[i].posy-=vel;
          }
          if(playersClient[i].flagLeft){ 
              playersServer[i].posx-=vel;
          }
          if(playersClient[i].flagRight){ 
              playersServer[i].posx+=vel;
          }  
    }
    if(playersServer!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", playersServer); 
    }
}
    