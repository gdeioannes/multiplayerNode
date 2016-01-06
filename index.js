var express= require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var receivedData;
var playersClient=[];
var playersServer=[];
var AIVars=[];
var minRadius=30;
var shootRadiusMax=100;
var worldWidth=3000;
var worldHeight=3000;
var offsetWorldX=300;
var offsetWorldY=300;
var aiNumber=120;
var numClusterOfLigth=8;
var numLigthPerCluster=6;
var clusterRadius=400;

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

var worldData={
    "worldWidth":worldWidth,
    "worldHeight":worldHeight,
    "offsetWorldX":offsetWorldX,
    "offsetWorldY":offsetWorldY,
    "ligthPoints":[]
}
//LIGTH POINTS

function createBullet(posx,posy,velx,vely){
    var bullet={
        "posx":posx,
        "posy":posy,
        "velx":velx,
        "vely":vely,
        "radius":20,
        "life":40
    }
    return (bullet);
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
            "shootRadius":100,
            "flagStop":false,
            "lifeRadius":minRadius,
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
        "flagStop":false,
        "flagHoldDirection":false
    }
    playersClient.push(data);
    setPlayer(data,"SOCKET ID","NPC");
    setAIVars();
}

function setAIVars(){
    var aiVar={
        "shootCounter":0,
        "shootCounterMax":50+Math.round(Math.random()*100),
        "moveCounter":0,
        "moveCounterMax":0,
        "energyCounter":0,
        "energyCounterMax":0,
        "energyFlag":false,
        "shootDistanceNow":200+Math.round(Math.random()*400),
        "shootInitiative":0.5+Math.random()*5
    }
    return aiVar;
}

putAIPlayers();
function putAIPlayers(){
    for(var numAI=0;numAI<aiNumber;numAI++){
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
var speedDivider=750;
function mainLoop(){
    now=new Date().getTime();
    delta=now-then;
    
    //CHECK PLAYERS STATES
    for(var i=0;i<playersClient.length;i++){
        var player=playersServer[i];
        //MOVEMENT CHARACTER 
        if(playersClient[i].flagStop){
            speedDivider=1100;
        }else{
            speedDivider=600;   
        }
        
        playersServer[i].posx+=((playersClient[i].mousePosx-playersServer[i].posx)/speedDivider)*delta;
        playersServer[i].posy+=((playersClient[i].mousePosy-playersServer[i].posy)/speedDivider)*delta;
            
        //MOVEMENT ENERGY BALL
        playersServer[i].posx2+=((playersServer[i].posx-playersServer[i].posx2)/70)*delta;
        playersServer[i].posy2+=((playersServer[i].posy-playersServer[i].posy2)/70)*delta;
        
        if(playersServer[i].shootRadius<shootRadiusMax){
            playersServer[i].shootRadius+=shootRadiusMax/500;
        }
        
        //NPC LOGIC
        if(player.type=="NPC"){
            NPClogic(i);
        }
        
        //SHOOT LOGIC
        if(playersServer[i].shootFlag && playersServer[i].shootRadius>shootRadiusMax*0.22){    
            var circlePoint=calculatePointOfCircunference(playersClient[i].mousePosAimx,playersClient[i].mousePosAimy,playersServer[i].posx,playersServer[i].posy,0.8);
            var velx=(circlePoint.cpx-playersServer[i].posx)/1.3;
            var vely=(circlePoint.cpy-playersServer[i].posy)/1.3;
            playersServer[i].bullets.push(createBullet(playersServer[i].posx,playersServer[i].posy,velx,vely));
            playersServer[i].shootFlag=false;
            playersServer[i].shootRadius-=(shootRadiusMax*3)/(playersServer[i].shootRadius);
            if(playersServer[i].shootRadius<0){
                playersServer[i].shootRadius=0;
            }
        }
        
        //BULLET LOGIC
        for(var bulletNum=0;bulletNum<playersServer[i].bullets.length;bulletNum++){
            var bullet=playersServer[i].bullets[bulletNum];
               bullet.posx+=bullet.velx*delta;
               bullet.posy+=bullet.vely*delta;
               //bullet.life-=3;
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
        
        if((numClusterOfLigth*numLigthPerCluster)-numLigthPerCluster>worldData.ligthPoints.length){
            circularLigthsSet(numLigthPerCluster,300);
        }
        //LIGTH POINTS LOGIC
        for(var iii=0;iii<worldData.ligthPoints.length;iii++){
            if(lineDistance(playersServer[i],worldData.ligthPoints[iii])-minRadius<playersServer[i].lifeRadius){
                if(playersServer[i].type=="NPC"){
                    if(AIVars[i].energyFlag){
                        AIVars[i].energyFlag=false;
                    }
                }
                playersServer[i].lifeRadius+=20/playersServer[i].lifeRadius;
                worldData.ligthPoints.splice(iii,1);
            }       

        }
        
    }
    //SEND DATA TO CLIENT
    if(playersServer!=null){
        io.sockets.in('sendAllData').emit("send allDataOfPLayer", playersServer); 
        io.sockets.in('sendAllData').emit("send allDataOfStage", worldData); 
    }
    then = now;
    
    for(var numLigthPoint=0;numLigthPoint<worldData.ligthPoints.length;numLigthPoint++){
        var ligthPoint=worldData.ligthPoints[numLigthPoint];
        if(ligthPoint.life!=-1){
            ligthPoint.life--;
            if(ligthPoint.life<=0 ){
                worldData.ligthPoints.splice(numLigthPoint,1);
                break;
            }
        }
    }
}

function NPClogic(i){
    var shootNowFlag=false;
    var aiPlayerVars=AIVars[i];
    var multx=200;
    var multy=200;
    if(!aiPlayerVars.energyFlag){
        aiPlayerVars.shootCounter++;
        aiPlayerVars.energyCounter++;
    }else{
        aiPlayerVars.energyCounter++;
    }
    
    for(var playerNum=0;playerNum<playersServer.length;playerNum++){
        if(i!=playerNum){
            if(lineDistance(playersServer[i],playersServer[playerNum])<aiPlayerVars.shootDistanceNow){
                if(Math.round(Math.random()*100)<aiPlayerVars.shootInitiative){
                    aiPlayerVars.shootDistanceNow=200+Math.round(Math.random()*400);
                    shootNowFlag=true;
                }
            }
        }
    }
    
    if(aiPlayerVars.shootCounter>aiPlayerVars.shootCounterMax || shootNowFlag){
        shootNowFlag=false;
        aiPlayerVars.shootCounter=0;
        aiPlayerVars.shootCounterMax=30+Math.round(Math.random()*50);
        var prey=AiGetPlayerToShoot(playersServer[i]);
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
    
    if(aiPlayerVars.energyCounter>=aiPlayerVars.energyCounterMax){
        aiPlayerVars.energyFlag=true;
        aiPlayerVars.energyCounter=0;
        aiPlayerVars.energyCounterMax=30+Math.round(Math.random()*60);
        var energyNum=AIGetCloserEnergy(playersServer[i]);
        var circlePoint=calculatePointOfCircunference(worldData.ligthPoints[energyNum].posx,worldData.ligthPoints[energyNum].posy,playersServer[i].posx,playersServer[i].posy,0.8);
        var velx=(circlePoint.cpx-playersServer[i].posx);
        var vely=(circlePoint.cpy-playersServer[i].posy);
        playersClient[i].mousePosx+=velx*lineDistance(worldData.ligthPoints[energyNum],playersServer[i]);
        playersClient[i].mousePosy+=vely*lineDistance(worldData.ligthPoints[energyNum],playersServer[i]);
    }
}

function killPlayer(shootingPlayer,player,bulletNum,playerClient){
    if(player.lifeRadius<=minRadius){
        playerClient.mousePosx=generateRandomPosition().w;
        playerClient.mousePosy=generateRandomPosition().h;
        setLigthPointData(player.posx,player.posy,300+Math.round(Math.random()*200));
        player.posx=playerClient.mousePosx;
        player.posy=playerClient.mousePosy;
        player.posx2=playerClient.mousePosx;
        player.posy2=playerClient.mousePosy;
        player.lifeRadius=minRadius;
        shootingPlayer.points++;
    }else{
        player.lifeRadius-=10;
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

function AiGetPlayerToShoot(shooter){
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

function AIGetCloserEnergy(aiPlayer){
    var saveDistance=worldWidth*1000;
    var saveLigthNum=0;
    for(var ligthNum=0;ligthNum<worldData.ligthPoints.length;ligthNum++){
        var light=worldData.ligthPoints[ligthNum];
        if(lineDistance(light,aiPlayer)<saveDistance){
            saveDistance=lineDistance(light,aiPlayer);
            saveLigthNum=ligthNum; 
        }
    }
    return saveLigthNum;
}

for(var k=0;k<numClusterOfLigth;k++){
    circularLigthsSet(numLigthPerCluster,300);
}

function circularLigthsSet(rep,velrad){
    var cx=(velrad)+(Math.random()*(worldWidth-velrad*1.2));
    var cy=(velrad)+(Math.random()*(worldHeight-velrad*1.2));
    
    for(var repNum=0;repNum<rep;repNum++){
        var x=offsetWorldX+velrad+Math.round(Math.random()*worldWidth-(offsetWorldX*2)-(velrad*2));
        var y=offsetWorldY+velrad+Math.round(Math.random()*worldHeight-(offsetWorldY*2)-(velrad*2));
        var angle=Math.atan((y-cy)/(x-cx));
        var velRad2=Math.random()*velrad;
        var mult=1;
        if(x-cx>0){
            mult=1;
        }else{
            mult=-1;
        }
        cpx = cx + velRad2 * Math.cos(angle)*mult;
        cpy = cy + velRad2 * Math.sin(angle)*mult;
        setLigthPointData(cpx,cpy,-1);
    }
}

function setLigthPointData(posx,posy,life){
    
    var ligthPoint={
        "posx":posx,
        "posy":posy,
        "radius":10+Math.round(Math.random()*10),
        "life":life
    }
    worldData.ligthPoints.push(ligthPoint);
}