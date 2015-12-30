/////CHAT
var id;
var playersFromServer=[];
var ligthPointsFromServer=[];
var radius = 10;
var color=getRandomColor();
var worldWidth=2000;
var worldHeight=2000;
var offsetWorldX=0;
var offsetWorldY=0;

if(id==null){
    id=Math.round(Math.random()*100000000000);
}

$('#messages').scrollTop(1000000000000000000000000000000000000000000000000000000000000000);    
$('#toggle-btn').click(function(){
$('#chat-container').slideToggle();
});  

if($('#u-name').val()==""){
    $('#u-name').val("User"+Math.round(Math.random()*1000));
}
    
///SEND DATA
var flagLeft=false;
var flagRight=false;
var flagUp=false;
var flagDown=false;
var shootFlag=false;
var moveFlag=false;
var flagStop=false;
var vel=10;
var posx=0;
var posy=0;
var chatOverFlag=false;
var mousePosx=0;
var mousePosy=0;
var vfxCounter=0;
    
var socket = io();

  var dataChat={
      "name":"",
      "message":""
  }
  
  var dataPlayer={
      "id":0,
      "name":"",
      "flagRight":false,
      "flagLeft":false,
      "flagUp":false,
      "flagDown":false,
      "shootFlag":false,
      "moveFlag":false,
      "flagStop":false,
      "mousePosx":0,
      "mousePosy":0,
      "color":""
  } 
    
  $('form').submit(function(){
    dataChat.name=$('#u-name').val();
    dataChat.message=$('#m').val();
    var dataString=JSON.stringify(dataChat);
    socket.emit('send dataChat',dataChat );
    $('#m').val('');
    return false;
  });
  
  socket.on('send dataChat', function(receivedDataChat){
    $('#messages').append($('<li><label>'+receivedDataChat.name+': </label>'+receivedDataChat.message+'</li>'));
    $('#messages').scrollTop(100000000000000000000000000000000000000000);
  });
    

    
//GAME
    
//CREATE PLAYER    
socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));

$(window).keydown(function(e){
   var key=e.which;
    controlMove(key,true); 
    socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));
});
    
$(window).keyup(function(e){
   var key=e.which;
    controlMove(key,false)
    socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));
    shootFlag=false;
});
    
function setDataForSending(){
    dataPlayer.id=id;
    dataPlayer.flagRight=flagRight;
    dataPlayer.flagLeft=flagLeft;
    dataPlayer.flagUp=flagUp;
    dataPlayer.flagDown=flagDown;
    dataPlayer.flagStop=flagStop;
    dataPlayer.shootFlag=shootFlag;
    dataPlayer.moveFlag=moveFlag;
    dataPlayer.mousePosx=mousePosx;
    dataPlayer.mousePosy=mousePosy;
    dataPlayer.color=color;
    dataPlayer.name=$('#u-name').val();
    return dataPlayer;
}
    

    
  socket.on('receive dataChat', function(receivedDataChat){
    $('#messages').append($('<li><label>'+receivedDataChat.name+': </label>'+receivedDataChat.message+'</li>'));
    $('#messages').scrollTop(100000000000000000000000000000000000000000);
  });
    
  socket.on('send allDataOfPLayer', function(allDataOfPLayer){
    playersFromServer=allDataOfPLayer;
    setPlayersScores();
  });
    
  socket.on('send allDataOfStage', function(allDataOfStage){
    ligthPointsFromServer=allDataOfStage;
  });

function controlMove(key,state){
    if(key==32){
        console.log("STOP:"+state);
        flagStop=state;
    }
}
    
$("#chat-container").mouseenter(function(){
    chatOverFlag=true;
}); 

$("#chat-container").mouseout(function(){
    chatOverFlag=false;
});     

$(window).click(function(e){
     if(!chatOverFlag){
         pos=getMousePos(canvas,e);
        shootFlag=true;
         socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));
         shootFlag=false;
    }
 }); 

function setOffSet(){
    var offset=canvas.width;
}

var alphaCharge=0.35;
var alphaShoot=0.85;
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

setInterval(mainLoop,30);

function mainLoop(){
    context.canvas.width=context.canvas.width;
    drawPattern();

    for(var i=0;i<playersFromServer.length;i++){
        drawCircleOrbiting(playersFromServer[i]);
        drawEntityPlayer(playersFromServer[i]);
        for(var bulletNum=0;bulletNum<playersFromServer[i].bullets.length;bulletNum++){
            var playerBullet=playersFromServer[i].bullets[bulletNum];
            drawCircleVFX(playerBullet.posx+offsetWorldX,playerBullet.posy+offsetWorldY,10,playersFromServer[i].color,1,0.4);
        }
        if(playersFromServer[i].id==id){
            
            var offset=0.4;
            var offsetVel=10;
                    
            var movx=((window.innerWidth/2)/(window.innerWidth/2-(playersFromServer[i].posx+offsetWorldX)));
            var movy=((window.innerHeight/2)/(window.innerHeight/2-(playersFromServer[i].posy+offsetWorldY)));
            
            //console.log("MOVX:"+movx+" MOVY:"+movy+" OFFSETX:"+Math.round(offsetWorldX)+" OFFSETY:"+Math.round(offsetWorldY));
            
            if(offsetWorldX>0){
                offsetWorldX=0;;
            }
            if(offsetWorldY>0){
                offsetWorldY=0;;
            }
            if(offsetWorldX<-worldWidth+window.innerWidth){
                offsetWorldX=-worldWidth+window.innerWidth;
            }
            if(offsetWorldY<-worldHeight+window.innerHeight){
                offsetWorldY=-worldHeight+window.innerHeight;
            }
            if(offsetWorldX<=0){
                offsetWorldX+=offsetVel/movx;
            }
            if(offsetWorldY<=0){
                offsetWorldY+=offsetVel/movy;
            }
            offsetWorldY+=offsetVel/movy;
        }
        
    }
    
    for(var ii=0;ii<ligthPointsFromServer.length;ii++){
        drawRect(ligthPointsFromServer[ii]);
        drawCircleVFX(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY,ligthPointsFromServer[ii].radius*0.6,"#FFFFFF",0.9,0.8);
        drawCircleVFX(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY,ligthPointsFromServer[ii].radius,"#FFFFFF",0.65,0.8);
        drawShadow(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY);
        drawText("Energy",ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY);
    }

    vfxCounter+=0.1;
    if(vfxCounter>1000){
        vfxCounter=0;
    }
}

$(window).keydown(function(e){
    var key=e.keyCode;
    controlMove(key,true);
});

$(window).keyup(function(e){
    var key=e.keyCode;
    controlMove(key,false);
});



$(window).mousemove(function(e){
    pos=getMousePos(canvas,e);
    mousePosx=pos.x;
    mousePosy=pos.y;
    socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));
});
    
function drawCircle(centerX,centerY,radius,color,alpha){
    
    context.save();
    context.translate(centerX,centerY);
    context.scale(1, 0.5);
    context.beginPath();
    context.arc(0, 0,radius, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color,alpha);
    context.fill();
    context.restore();
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color,alpha);
    context.fill(); 
}

function drawCircleStroke(centerX,centerY,radius,color,alpha){
        
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = hexToRgbA(color,alpha);
    context.stroke();
}

function drawCircleVFX(centerX,centerY,radius,color,alpha,mult){
    var multi=mult+Math.abs(Math.cos(vfxCounter));
    context.beginPath();
    context.arc(centerX, centerY, radius*multi, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color,alpha);
    context.fill(); 
}

function drawText(text,px,py){
    var fontsize=15;
    context.font = fontsize+"px Arial";
    context.fillStyle = "#FFFFFF";
    context.textAlign="center";
    context.fillText(text,px,py+(fontsize*1.2)+radius);
}
    
img = new Image();
img2 = new Image();
img.src = 'img/background_game.jpg';   
img2.src = 'img/background_game_offset.jpg';   
function drawPattern(){
    // create pattern
    context.save();
    context.translate(offsetWorldX, offsetWorldY); 
    var ptrn = context.createPattern(img2, 'repeat'); // Create a pattern with this image, and set it to "repeat".
    context.fillStyle = ptrn;
    context.fillRect(-worldWidth, -worldHeight, worldWidth*4, worldHeight*4); // context.fillRect(x, y, width, height);
    var ptrn = context.createPattern(img, 'repeat'); // Create a pattern with this image, and set it to "repeat".
    context.fillStyle = ptrn;
    context.fillRect(0,0, worldWidth, worldHeight); // context.fillRect(x, y, width, height);
    context.restore();
}

imgShadow = new Image();
imgShadow.src = 'img/shadow.png';   
function drawShadow(x,y){
    context.drawImage(imgShadow,x-imgShadow.width/2,y+radius*1.05);
}

function hexToRgbA(hex,alpha){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    throw new Error('Bad Hex');
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left)-offsetWorldX,
      y: (evt.clientY - rect.top)-offsetWorldY
    };
}
    
function setPlayersScores(){
    $("#player-list").html("");
    $("#player-list").append("<li>Points</li>");
    
    for(var i=0;i<playersFromServer.length;i++){
        $("#player-list").append("<li>"+playersFromServer[i].name+":"+playersFromServer[i].points+"</li>");
    }

}

$(window).resize(function(){
    context.canvas.width  = window.innerWidth;
    context.canvas.height = window.innerHeight;
});

function drawEntityPlayer(player){
    drawCircleVFX(player.posx+offsetWorldX,player.posy+offsetWorldY,radius,player.color,0.85,0.8);
    drawCircleVFX(player.posx+offsetWorldX,player.posy+offsetWorldY,radius*0.7,player.color,0.9,0.8);
    //drawCircle(player.posx2+offsetWorldX,player.posy2+offsetWorldY,player.shootRadius,player.color,alphaShoot);
    drawCircle(player.posx2+offsetWorldX,player.posy2+offsetWorldY,player.chargeRadius,player.color,0.2);
    drawShadow(player.posx+offsetWorldX,player.posy+offsetWorldY);
    drawText(player.name,player.posx+offsetWorldX,player.posy+offsetWorldY);
}

function drawRect(object){
      var rectWidth=object.radius/8;
      context.beginPath();
      context.rect((object.posx+offsetWorldX)-rectWidth/2, object.posy+offsetWorldY,rectWidth,object.radius*2);
      context.fillStyle = 'white';
      context.fill();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function drawCircleOrbiting(player){
    for(var i=0;i<player.chargeRadius/10;i++){
        var angle=((+player.chargeRadius+100*i)+vfxCounter)*Math.pow(-1,i);
        var velrad=25+7*i;

        cpx = player.posx2+offsetWorldX + velrad * Math.cos(angle);
        cpy = player.posy2+offsetWorldY + velrad * Math.sin(angle);
        drawCircle(cpx,cpy,4,player.color,0.05*i);
        drawCircleStroke(player.posx2+offsetWorldX,player.posy2+offsetWorldY,velrad,player.color,0.05*i);
    }
}