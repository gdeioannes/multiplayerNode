var express= require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var playersAi=[];
var vel=4;
var velShoot=15;
var velcharge=2;
var minRadius=20;
var debug=false;
var ligthPoints=[];
var maxShootRadius=100;

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

function createBullet(posx,posy,life,velx,vely){
    var bullet={
        "posx":posx,
        "posy":posy,
        "velx":velx,
        "vely":vely,
        "radius":10,
        "life":life
    }
    return (bullet);
}

function setLigthPointData(){
    
    var ligthPoint={
        "posx":200+Math.round(Math.random()*1200),
        "posy":100+Math.round(Math.random()*800),
        "radius":10+Math.round(Math.random()*10)
    }
    ligthPoints.push(ligthPoint);
    //console.log("Create Ligth Point " +ligthPoints.length);
}

function createLigthsPoints(){
    //console.log("Create Ligth Point");
    for(var a=0;a<10;a++){
        //console.log("Create Ligth Point " +a);
        setLigthPointData();
        
    }
    //console.log(ligthPoints);
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
            "id":myData.id,
            "posx":100+Math.round(Math.random()*600),
            "posy":100+Math.round(Math.random()*500),
            "posx2":100+Math.round(Math.random()*500),
            "posy2":100+Math.round(Math.random()*500),
            "color":myData.color,
            "name":myData.name,
            "socketID":socketID,
            "shootRadius":0,
            "chargeRadius":minRadius,
            "maxShootRadius":maxShootRadius,
            "shootFlag":false,
            "points":0,
            "bullets":[]
        }
        playersClient.push(myData);
        playersServer.push(playerServer);
        console.log(playersServer.length);

    }
}


// AI PLAYERS
createAiPlayers();

function setAiPLayer(a){
    if(a==null){
        a="new";
    }
    var xnum=100+Math.round(Math.random()*1000);
    var ynum=100+Math.round(Math.random()*600);
    var aiPlayer={
        "id":"AI",
        "posx":xnum,
        "posy":ynum,
        "posx2":xnum,
        "posy2":ynum,
        "color":getRandomColor(),
        "name":"AI Player "+a,
        "movePosx":100+Math.round(Math.random()*1000),
        "movePosy":100+Math.round(Math.random()*600),
        "shootRadius":0,
        "chargeRadius":minRadius,
        "maxShootRadius":maxShootRadius,
        "bullets":[],
        "shootFlag":false,
        "chargeRadius":minRadius
    }
    playersAi.push(aiPlayer);
}

function createAiPlayers(){
    for(var a=0;a<5;a++){
        setAiPLayer(a);
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
    
    //MOVE AI
    for(var numAI=0;numAI<playersAi.length;numAI++){
        var playerAI=playersAi[numAI];
        playerAI.posx+=((playerAI.movePosx-playerAI.posx)/850)*delta;
        playerAI.posy+=((playerAI.movePosy-playerAI.posy)/850)*delta;
        
        //MOVEMENT ENERGY BALL
        playerAI.posx2+=((playerAI.posx-playerAI.posx2)/100)*delta;
        playerAI.posy2+=((playerAI.posy-playerAI.posy2)/100)*delta;
    }
    
    //CHECK PLAYERS STATES
    for(var i=0;i<playersClient.length;i++){
        
        //MOVEMENT CHARACTER 
        playersServer[i].posx+=((playersClient[i].mousePosx-playersServer[i].posx)/(20*playersServer[i].chargeRadius))*delta;
        playersServer[i].posy+=((playersClient[i].mousePosy-playersServer[i].posy)/(20*playersServer[i].chargeRadius))*delta;
        
        
        
        //MOVEMENT ENERGY BALL
        playersServer[i].posx2+=((playersServer[i].posx-playersServer[i].posx2)/100)*delta;
        playersServer[i].posy2+=((playersServer[i].posy-playersServer[i].posy2)/100)*delta;
        
    
    //SHOOT LOGIC
    if(playersServer[i].shootFlag && playersServer[i].shootRadius<playersServer[i].chargeRadius && playersServer[i].chargeRadius>0){
        
        //playersServer[i].shootRadius+=velShoot;
        var circlePoint=calculatePointOfCircunference(playersClient[i].mousePosx,playersClient[i].mousePosy,playersServer[i].posx,playersServer[i].posy,0.8);
        var velx=(circlePoint.cpx-playersServer[i].posx);
        var vely=(circlePoint.cpy-playersServer[i].posy);
        playersServer[i].chargeRadius-=1;
        playersServer[i].bullets.push(createBullet(playersServer[i].posx,playersServer[i].posy,playersServer[i].chargeRadius,velx,vely));
        console.log("PUSH BULLET");
        
        playersServer[i].shootFlag=false;
 
    }
        
    //BULLET LOGIC
    for(var bulletNum=0;bulletNum<playersServer[i].bullets.length;bulletNum++){
        var bullet=playersServer[i].bullets[bulletNum];
           bullet.posx+=bullet.velx*delta;
           bullet.posy+=bullet.vely*delta;
           bullet.life--;
           if(bullet.life<0){
               playersServer[i].bullets.splice(bulletNum,1);
           }
        for(var ii=0;ii<playersServer.length;ii++){
            if(lineDistance({"x":playersServer[ii].posx2,"y":playersServer[ii].posy2},{"x":bullet.posx,"y":bullet.posy})-minRadius<bullet.life && ii!=i){
                playersServer[i].points++;
                playersServer[ii].posx=100+Math.round(Math.random()*600);
                playersServer[ii].posy=100+Math.round(Math.random()*500);
                playersServer[ii].posx2=playersServer[ii].posx;
                playersServer[ii].posy2=playersServer[ii].posy;
                playersServer[i].bullets.splice(bulletNum,1);
                console.log("Kill!!"+playersServer[i].name );
                
            }
        }
        for(var iii=0;iii<playersAi.length;iii++){
            var playerAI=playersAi[iii];
            if(lineDistance({"x":playerAI.posx2,"y":playerAI.posy2},{"x":bullet.posx,"y":bullet.posy})-minRadius<bullet.life){
                playersServer[i].points++;
                playersAi.splice(iii,1);
                playersServer[i].bullets.splice(bulletNum,1);
                setAiPLayer();
                break;
            }
        }
    }

    //LIGTH POINTS LOGIC
    for(var iii=0;iii<ligthPoints.length;iii++){
        if(lineDistance({"x":playersServer[i].posx,"y":playersServer[i].posy},{"x":ligthPoints[iii].posx,"y":ligthPoints[iii].posy})-minRadius<minRadius){
            playersServer[i].chargeRadius++;
            ligthPoints.splice(iii,1);
            setLigthPointData();
        }       

    }
    }
    //SEND DATA TO CLIENT
    if(playersServer!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", playersServer); 
        io.sockets.in('sendAllData').emit("send allDataOfStage", ligthPoints); 
        
    }
    if(playersAi!=null){
         io.sockets.in('sendAllData').emit("send allDataOfAi", playersAi); 
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
    
function calculatePointOfCircunference(x,y,cx,cy,velrad){
    var angle=Math.atan((y-cy)/(x-cx));
    var mult=1;
    if(x-cx>0){
        mult=1;
    }else{
        mult=-1;
    }
    console.log("ANGLE:"+angle);
    cpx = cx + velrad * Math.cos(angle)*mult;
    cpy = cy + velrad * Math.sin(angle)*mult;
    return {"cpx":cpx,"cpy":cpy};
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
