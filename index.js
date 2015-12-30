var express= require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var AIVars=[];
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
        "life":55
    }
    return (bullet);
}

function setLigthPointData(posx,posy){
    
    var ligthPoint={
        "posx":posx,
        "posy":posy,
        "radius":10+Math.round(Math.random()*10),
        "life":300+Math.round(Math.random()*200)
    }
    ligthPoints.push(ligthPoint);
}

function createLigthsPoints(){
    for(var a=0;a<10;a++){
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
            playersServer[i].flagStop=myData.flagStop;
            exist=true;
            return;
        }
    }
    
    if(exist){
        return;
    }else{  
        playersClient.push(myData);
        //ADD USER
        setPlayer(myData,socketID,"USER");
        console.log(playersServer.length);
    }
}
    
function setPlayer(myData,socketID,type){
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
            "flagStop":false,
            "chargeRadius":minRadius*2,
            "maxShootRadius":maxShootRadius,
            "shootFlag":false,
            "points":0,
            "bullets":[],
            "type":type
        }
    playersServer.push(playerServer);
    AIVars.push(setAIVars());
}

function setAIPlayer(){
    var data={
        "name":"USer"+Math.round(Math.random()*999),
        "color":getRandomColor(),
        "id":Math.round(Math.random()*1000000000000),
        "mousePosx":generateRandomPosition().w,
        "mousePosy":generateRandomPosition().h,
    }
    console.log(data.color);
    playersClient.push(data);
    setPlayer(data,"SOCKET ID","NPC");
    setAIVars();
}

function setAIVars(){
    var aiVar={
        "shootCounter":0,
        "shootCounterMax":50+Math.round(Math.random()*100),
        "moveCounter":0,
        "moveCounterMax":0
    }
    return aiVar;
}

putAIPlayers();
function putAIPlayers(){
    for(var numAI=0;numAI<20;numAI++){
        setAIPlayer();
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

    
    //CHECK PLAYERS STATES
    for(var i=0;i<playersClient.length;i++){
        var player=playersServer[i];
        //MOVEMENT CHARACTER 
        console.log(playersClient[i].flagStop);
        if(!playersClient[i].flagStop){
            playersServer[i].posx+=((playersClient[i].mousePosx-playersServer[i].posx)/750)*delta;
            playersServer[i].posy+=((playersClient[i].mousePosy-playersServer[i].posy)/750)*delta;
        }
        //MOVEMENT ENERGY BALL
        playersServer[i].posx2+=((playersServer[i].posx-playersServer[i].posx2)/70)*delta;
        playersServer[i].posy2+=((playersServer[i].posy-playersServer[i].posy2)/70)*delta;
        
        
        if(player.type=="NPC"){
            var aiPlayerVars=AIVars[i];
            var multx=200;
            var multy=200;
            aiPlayerVars.shootCounter++;
            if(aiPlayerVars.shootCounter>aiPlayerVars.shootCounterMax){
                aiPlayerVars.shootCounter=0;
                aiPlayerVars.shootCounterMax=50+Math.round(Math.random()*70);
                var prey=AIatack(playersServer[i]);
                var circlePoint=calculatePointOfCircunference(playersServer[prey].posx,playersServer[prey].posy,playersServer[i].posx,playersServer[i].posy,0.8);
                var velx=(circlePoint.cpx-playersServer[i].posx);
                var vely=(circlePoint.cpy-playersServer[i].posy);
                playersServer[i].bullets.push(createBullet(playersServer[i].posx,playersServer[i].posy,velx,vely));
                if(playersClient[i].mousePosx<worldWidth/5){
                    multx*=-1;
                }
                if(playersClient[i].mousePosy<worldHeight/5){
                    multy*=-1;
                }
                if(playersClient[i].mousePosx>(worldWidth/5)*4){
                    multx*=-1;
                }
                if(playersClient[i].mousePosy>(worldHeight/5)*4){
                    multy*=-1;
                }
                playersClient[i].mousePosx-=velx*multx;
                playersClient[i].mousePosy-=vely*multy;
                
            }
        }
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
            if(lineDistance(playersServer[ii],bullet)-minRadius<minRadius && ii!=i){
                killPlayer(playersServer[i],playersServer[ii],bulletNum,playersClient[ii])
            }
        }
    }

    //LIGTH POINTS LOGIC
    for(var iii=0;iii<ligthPoints.length;iii++){
        if(lineDistance(playersServer[i],ligthPoints[iii])-minRadius<playersServer[i].chargeRadius){
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
    then = now;
    
    for(var numLigthPoint=0;numLigthPoint<ligthPoints.length;numLigthPoint++){
        var ligthPoint=ligthPoints[numLigthPoint];
        ligthPoint.life--;
        if(ligthPoint.life<=0){
            ligthPoints.splice(numLigthPoint,1);
            break;
        }
    }
}

function killPlayer(shootingPlayer,player,bulletNum,playerClient){
    if(player.chargeRadius<=minRadius){
        playerClient.mousePosx=generateRandomPosition().w;
        playerClient.mousePosy=generateRandomPosition().h;
        setLigthPointData(player.posx,player.posy);
        player.posx=playerClient.mousePosx;
        player.posy=playerClient.mousePosy;
        player.posx2=playerClient.mousePosx;
        player.posy2=playerClient.mousePosy;
        player.chargeRadius=minRadius*2;
        shootingPlayer.points++;
    }else{
        player.chargeRadius-=10;
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
 
  xs = point2.posx - point1.posx;
  xs = xs * xs;
 
  ys = point2.posy - point1.posy;
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

function AIatack(shooter){
    var saveDistance=worldWidth*1000;
    var savePlayerNum=0;
    for(var playerNum=0;playerNum<playersServer.length;playerNum++){
        var player=playersServer[playerNum];
        if(player.id!=shooter.id){
                if(lineDistance(player,shooter)<saveDistance){
                    saveDistance=lineDistance(player,shooter);
                    savePlayerNum=playerNum; 
                }
        }
    }
    return savePlayerNum;
}