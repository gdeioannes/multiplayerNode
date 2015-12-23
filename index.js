var express= require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var vel=4;
var velShoot=10;
var velcharge=2;
var minRadius=20;
var debug=false;
var ligthPoints=[];


process.env.PWD = process.cwd()
// Then
app.use(express.static(process.env.PWD + '/'));

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
        deletePlayer(socket.id);
    });
    socket.join('sendAllData');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


//LIGTH POINTS
createLigthsPoints();
var maxLigthPoints=15;

function setLigthPointData(){
    
    var ligthPoint={
        "posx":Math.round(Math.random()*1000),
        "posy":Math.round(Math.random()*1000),
        "radius":10+Math.round(Math.random()*10)
    }
    ligthPoints.push(ligthPoint);
    console.log("Create Ligth Point " +ligthPoints.length);
}

function createLigthsPoints(){
    console.log("Create Ligth Point");
    for(var a=0;a<10;a++){
        console.log("Create Ligth Point " +a);
        setLigthPointData();
        
    }
    console.log(ligthPoints);
}
//////

function setPlayersData(myData,socketID){
    var exist=false;
    for(var i=0;i<playersClient.length;i++){
        if(myData.id===playersClient[i].id){
            playersClient[i]=myData;
            playersServer[i].name=myData.name;
            if(!playersServer[i].shootFlag){
                playersServer[i].shootFlag=myData.shootFlag;
            }
            exist=true;
            return;
        }
    }
    
    if(exist){
        return;
    }else{
        var playerServer={
            "id":0,
            "posx":0,
            "posy":0,
            "posx2":0,
            "posy2":0,
            "color":"",
            "name":"",
            "socketID":"",
            "shootRadius":0,
            "chargeRadius":minRadius,
            "maxShootRadius":100,
            "shootFlag":false,
            "points":0
        }
        playersClient.push(myData);
        playerServer.id=myData.id;
        playerServer.posx=100+Math.round(Math.random()*600);
        playerServer.posy=100+Math.round(Math.random()*500);
        playerServer.posx2=playerServer.posx;
        playerServer.posy2=playerServer.posy;
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
        playersServer[i].posx+=((playersClient[i].mousePosx-playersServer[i].posx)/750)*delta;
        playersServer[i].posy+=((playersClient[i].mousePosy-playersServer[i].posy)/750)*delta;
        
        playersServer[i].posx2+=((playersServer[i].posx-playersServer[i].posx2)/100)*delta;
        playersServer[i].posy2+=((playersServer[i].posy-playersServer[i].posy2)/100)*delta;
        
     if(playersServer[i].chargeRadius<playersServer[i].maxShootRadius){
            playersServer[i].chargeRadius+=velcharge;
        }
        


    if(playersServer[i].shootFlag && playersServer[i].shootRadius<playersServer[i].chargeRadius){
        playersServer[i].shootRadius+=velShoot;
        
        for(var ii=0;ii<playersClient.length;ii++){
                if(lineDistance({"x":playersServer[i].posx2,"y":playersServer[i].posy2},{"x":playersServer[ii].posx2,"y":playersServer[ii].posy2})-minRadius<playersServer[i].shootRadius && i!=ii){
                        playersServer[i].points++;
                        playersServer[ii].points--;
                        playersServer[ii].posx=100+Math.round(Math.random()*600);
                        playersServer[ii].posy=100+Math.round(Math.random()*500);
                        playersServer[ii].posx2=playersServer[ii].posx;
                        playersServer[ii].posy2=playersServer[ii].posy;
                        console.log("POINTS!!"+playersServer[i].name );
                   }
            }
        
        if(playersServer[i].shootRadius>=playersServer[i].chargeRadius){
            playersServer[i].shootRadius=0;
            playersServer[i].chargeRadius=minRadius;
            playersServer[i].shootFlag=false;
            console.log("Shoot End");
            console.log(playersServer[i].id);
            
        }
    }
        }
    
    if(playersServer!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", playersServer); 
        io.sockets.in('sendAllData').emit("send allDataOfStage", ligthPoints); 
    }
    then = now;
}

var calcSpeed = function(del, speed) {
    return (speed * del) * (60 / 1000);
}

function lineDistance( point1, point2 )
{
  var xs = 0;
  var ys = 0;
 
  xs = point2.x - point1.x;
  xs = xs * xs;
 
  ys = point2.y - point1.y;
  ys = ys * ys;
 
  return Math.sqrt( xs + ys );
}
    