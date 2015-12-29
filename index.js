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
var worldWidth=2000;
var worldHeight=2000;
var offsetWorldX=300;
var offsetWorldY=300;

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

function createBullet(posx,posy,velx,vely){
    var bullet={
        "posx":posx,
        "posy":posy,
        "velx":velx,
        "vely":vely,
        "radius":20,
        "life":100
    }
    return (bullet);
}

function setLigthPointData(posx,posy){
    
    var ligthPoint={
        "posx":posx,
        "posy":posy,
        "radius":10+Math.round(Math.random()*10)
    }
    ligthPoints.push(ligthPoint);
}

function createLigthsPoints(){
    for(var a=0;a<0;a++){
        setLigthPointData(generateRandomPosition().w,generateRandomPosition().h); 
    }
}


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
            "posx":generateRandomPosition().w,
            "posy":generateRandomPosition().h,
            "posx2":generateRandomPosition().w,
            "posy2":generateRandomPosition().h,
            "color":myData.color,
            "name":myData.name,
            "socketID":socketID,
            "shootRadius":0,
            "chargeRadius":minRadius*2,
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
    var xnum=generateRandomPosition().w;
    var ynum=generateRandomPosition().h;
    var aiPlayer={
        "id":"AI",
        "posx":xnum,
        "posy":ynum,
        "posx2":xnum,
        "posy2":ynum,
        "color":getRandomColor(),
        "name":"USer"+(Math.round(Math.random()*999)),
        "movePosx":generateRandomPosition().w,
        "movePosy":generateRandomPosition().h,
        "shootRadius":1,
        "chargeRadius":minRadius,
        "maxShootRadius":maxShootRadius,
        "bullets":[],
        "shootFlag":false,
        "avoidBulletID":"false",
        "chargeRadius":minRadius,
        "moveCounter":0,
        "points":Math.round(Math.random()*10),
        "maxMoveCounter":100+Math.random()*200
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
        
        //MOVEMENT RANDOM
        playerAI.posx2+=((playerAI.posx-playerAI.posx2)/100)*delta;
        playerAI.posy2+=((playerAI.posy-playerAI.posy2)/100)*delta;
        playerAI.moveCounter++
        if(playerAI.moveCounter>playerAI.maxMoveCounter){
            playerAI.movePosx=generateRandomPosition().w;
            playerAI.movePosy=generateRandomPosition().h;
            playerAI.maxMoveCounter=100+Math.random()*200;
            playerAI.moveCounter=0;
        }
        if(playerAI.avoidBullet){
            playerAI.moveCounter=0;
        }
    }
    
    //CHECK PLAYERS STATES
    for(var i=0;i<playersClient.length;i++){
        
        //MOVEMENT CHARACTER 
        playersServer[i].posx+=((playersClient[i].mousePosx-playersServer[i].posx)/1000)*delta;
        playersServer[i].posy+=((playersClient[i].mousePosy-playersServer[i].posy)/1000)*delta;

        //MOVEMENT ENERGY BALL
        playersServer[i].posx2+=((playersServer[i].posx-playersServer[i].posx2)/100)*delta;
        playersServer[i].posy2+=((playersServer[i].posy-playersServer[i].posy2)/100)*delta;
        
    //SHOOT LOGIC
    //if(playersServer[i].shootFlag && playersServer[i].shootRadius<playersServer[i].chargeRadius && playersServer[i].chargeRadius>minRadius){
    if(playersServer[i].shootFlag){    
        //playersServer[i].shootRadius+=velShoot;
        var circlePoint=calculatePointOfCircunference(playersClient[i].mousePosx,playersClient[i].mousePosy,playersServer[i].posx,playersServer[i].posy,0.8);
        var velx=(circlePoint.cpx-playersServer[i].posx);
        var vely=(circlePoint.cpy-playersServer[i].posy);
        //playersServer[i].chargeRadius-=1;
        playersServer[i].bullets.push(createBullet(playersServer[i].posx,playersServer[i].posy,velx,vely));
        //console.log("PUSH BULLET");
        playersServer[i].shootFlag=false;
 
    }
        
    //BULLET LOGIC
    for(var bulletNum=0;bulletNum<playersServer[i].bullets.length;bulletNum++){
        var bullet=playersServer[i].bullets[bulletNum];
           bullet.posx+=bullet.velx*delta;
           bullet.posy+=bullet.vely*delta;
           bullet.life-=3;
           if(bullet.life<0){
               playersServer[i].bullets.splice(bulletNum,1);
           }
        
        //PLAYER HIT
        for(var ii=0;ii<playersServer.length;ii++){
            if(lineDistance({"x":playersServer[ii].posx2,"y":playersServer[ii].posy2},{"x":bullet.posx,"y":bullet.posy})-minRadius<minRadius && ii!=i){
                killPlayer(playersServer[i],playersServer[ii],bulletNum)
            }
        }
        
        //AI SCAPE LOGIC
        for(var iii=0;iii<playersAi.length;iii++){
            var playerAI=playersAi[iii];
            if(lineDistance({"x":playerAI.posx2,"y":playerAI.posy2},{"x":bullet.posx,"y":bullet.posy})-minRadius<bullet.life){
                killPlayer(playersServer[i],playerAI,bulletNum);
                break;
            }else{
                if(lineDistance({"x":playerAI.posx2,"y":playerAI.posy2},{"x":bullet.posx,"y":bullet.posy})-minRadius<bullet.life*8 && !playerAI.avoidBullet){
                    playerAI.movePosx=generateRandomPositionFromPosition(playerAI.movePosx);
                    playerAI.movePosy=generateRandomPositionFromPosition(playerAI.movePosy);
                    playerAI.avoidBullet=true;
                }else{
                    if(Math.abs(playerAI.movePosx-playerAI.posx)<50 && Math.abs(playerAI.movePosy-playerAI.posy)<50 && playerAI.avoidBullet){
                        playerAI.avoidBullet=false;
                    }
                }
            }
        }
    }

    //LIGTH POINTS LOGIC
    for(var iii=0;iii<ligthPoints.length;iii++){
        if(lineDistance({"x":playersServer[i].posx,"y":playersServer[i].posy},{"x":ligthPoints[iii].posx,"y":ligthPoints[iii].posy})-minRadius<playersServer[i].chargeRadius){
            playersServer[i].chargeRadius++;
            ligthPoints.splice(iii,1);
            //setLigthPointData();
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

function killPlayer(shootingPlayer,player,bulletNum){
    shootingPlayer.points++;
    console.log("SET LIGTH POINT");
    if(player.chargeRadius<=0){
    setLigthPointData(player.posx,player.posy);
    player.posx=generateRandomPosition().w;
    player.posy=generateRandomPosition().h;
    player.posx2=player.posx;
    player.posy2=player.posy;
    }else{
        player.chargeRadius-=2;
    }    
    shootingPlayer.bullets.splice(bulletNum,1);
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

function generateRandomPosition(){
    var w=offsetWorldX+(Math.round((Math.random()*worldWidth)-offsetWorldX));
    var h=offsetWorldY+(Math.round((Math.random()*worldHeight)-offsetWorldY));
    return {"w":w,"h":h};
}

function generateRandomPositionFromPosition(pos){
    var range=800;
    return (pos+(range-Math.round(Math.random()*range*2)));
}