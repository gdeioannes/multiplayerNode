/////CHAT
var id;
var playersFromServer=[];
var ligthPointsFromServer=[];
var radius = 10;
var color=getRandomColor();
var worldWidth=3000;
var worldHeight=3000;
var offsetWorldX=0;
var offsetWorldY=0;
var shootRadiusRatio=0;
var flagStorage=false;
//localStorage.clear();
var storageData=JSON.parse(localStorage.getItem("agileWars"));
console.log(storageData);
//SaveData
$("#play-container").hide();

if(storageData!=null){
    id=storageData.id;
    $('#u-name').val(storageData.name);
    $("#player-login-submit").hide();
    $("#play-container").show();
}

$("#login-btn").click(function(){
    var storageData={"id":0,"name":""};
    storageData.id=Math.round(Math.random()*10000000000000000000);
    storageData.name=$('#user-name-login').val();
    localStorage.setItem("agileWars",JSON.stringify(storageData));
    $('#u-name').val($('#user-name-login').val());
    $("#player-login-submit").hide();
    $("#play-container").show();
});

$("#clear-data-btn").click(function(){
    localStorage.clear();
    $("#player-login-submit").show();
    $("#play-container").hide();
});

$("#play-btn").click(function(){
    $("#player-login-container").hide();
    createPlayer();
    flagStorage=true;
});

if(id==null){
    
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
var shootRadiusMax=100;
    
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
function createPlayer(){
socket.emit('send dataPlayer',JSON.stringify(setDataForSending() ));
}
    
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
    if(!$("#black-circle").prop('checked')){
        drawFront();
    }
    drawPattern();
    if(flagStorage){
        worldMovement();

        for(var ii=0;ii<ligthPointsFromServer.length;ii++){
            drawRect(ligthPointsFromServer[ii]);
            drawCircleVFX(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY,ligthPointsFromServer[ii].radius*0.6,"#FFFFFF",0.9,0.8);
            drawCircleVFX(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY,ligthPointsFromServer[ii].radius,"#FFFFFF",0.65,0.8);
            drawShadow(ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY);
            drawText("Energy",12,ligthPointsFromServer[ii].posx+offsetWorldX,ligthPointsFromServer[ii].posy+offsetWorldY);
        }

        vfxCounter+=0.1;
        if(vfxCounter>1000){
            vfxCounter=0;
        }

    }

}

function worldMovement(){
    for(var i=0;i<playersFromServer.length;i++){
        
        if(playersFromServer[i].id==id){
            
            var offset=0.4;
            var offsetVel=10;
                    
            var movx=((window.innerWidth*0.2)/(window.innerWidth/2-(playersFromServer[i].posx+offsetWorldX)));
            var movy=((window.innerHeight*0.2)/(window.innerHeight/2-(playersFromServer[i].posy+offsetWorldY)));
 
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
            
            shootRadiusRatio=((100*playersFromServer[i].shootRadius)/shootRadiusMax)/100;
            
            drawCircle(canvas.width/2,canvas.height/2,canvas.height*0.4*shootRadiusRatio,"#FFFFFF",0.03);
            drawCircleStrokeDot(canvas.width/2,canvas.height/2,canvas.height*0.4,"#FFFFFF",0.05);
            if(canvas.height*0.2<canvas.height*0.4*shootRadiusRatio){
                drawCircleStrokeDot(canvas.width/2,canvas.height/2,canvas.height*0.2,"#FFFFFF",0.05);
            }else{
                drawCircle(canvas.width/2,canvas.height/2,canvas.height*0.2,"#FFCC00",0.3);  
            }
            if(canvas.height*0.1<canvas.height*0.4*shootRadiusRatio){
                drawCircleStrokeDot(canvas.width/2,canvas.height/2,canvas.height*0.1,"#FFFFFF",0.05);
            }else{
                drawCircle(canvas.width/2,canvas.height/2,canvas.height*0.1,"#FF0000",0.3);  
            }
            
            drawLine(playersFromServer[i].posx+offsetWorldX,playersFromServer[i].posy+offsetWorldY,canvas.width/2,canvas.height/2,0.25);
            drawCircle(canvas.width/2,canvas.height/2,5,"#FFFFFF",0.5);
        }
        
        
        for(var bulletNum=0;bulletNum<playersFromServer[i].bullets.length;bulletNum++){
            var playerBullet=playersFromServer[i].bullets[bulletNum];
            drawCircleVFX(playerBullet.posx+offsetWorldX,playerBullet.posy+offsetWorldY,10,playersFromServer[i].color,1,0.4);
        }
        var centerPoint={"posx":canvas.width/2-offsetWorldX,"posy":canvas.height/2-offsetWorldY};
        if(lineDistance(centerPoint,playersFromServer[i])<canvas.height*0.4){
            drawCircleOrbiting(playersFromServer[i]);
            drawEntityPlayer(playersFromServer[i]);    
        }else{
            var circleRadarRatio=(lineDistance(centerPoint,playersFromServer[i])*100/(worldWidth))/100;
            var cpoints=calculatePointOfCircunference(playersFromServer[i].posx+offsetWorldX,playersFromServer[i].posy+offsetWorldY,canvas.width/2,canvas.height/2,canvas.height*0.4);
            drawLine(cpoints.cpx,cpoints.cpy,canvas.width/2,canvas.height/2,0.025);
            drawCircle(cpoints.cpx,cpoints.cpy,20*(1-circleRadarRatio),playersFromServer[i].color,1*(1-circleRadarRatio));
            drawText(playersFromServer[i].name,12,cpoints.cpx,cpoints.cpy);
            
        }
            
        
        
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
    
function drawDoubleCircle(centerX,centerY,radius,color,alpha){
    
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

function drawCircle(centerX,centerY,radius,color,alpha){
    
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

function drawCircleStrokeDot(centerX,centerY,radius,color,alpha){     
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 2;
    context.strokeStyle = hexToRgbA(color,alpha);
    context.stroke();
}

function drawCircleVFX(centerX,centerY,radius,color,alpha,mult){
    var multi=mult+Math.abs(Math.cos(vfxCounter));
    //context.save();
    context.beginPath();
    //context.globalCompositeOperation = 'destination-out';
    context.arc(centerX, centerY, radius*multi, 0, 2 * Math.PI, false);
    //context.createRadialGradient(60,60,0,60,60,60);
    context.fillStyle = hexToRgbA(color,alpha);
    context.fill();
    //context.restore();
}

function drawText(text,fontsize,px,py){
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
    calculatePointOfCircunferenceForVel;
    var rect = canvas.getBoundingClientRect();
    var correctPoints=calculatePointOfCircunferenceForVel(evt.clientX,evt.clientY,canvas.width/2,canvas.height/2,lineDistance({"posx":canvas.width/2,"posy":canvas.height/2},{"posx":evt.clientX,"posy":evt.clientY}))
    return {
      x: (correctPoints.cpx - rect.left)-offsetWorldX,
      y: (correctPoints.cpy - rect.top)-offsetWorldY
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
    drawDoubleCircle(player.posx2+offsetWorldX,player.posy2+offsetWorldY,player.lifeRadius,player.color,0.2);
    drawShadow(player.posx+offsetWorldX,player.posy+offsetWorldY);
    drawText(player.name,12,player.posx+offsetWorldX,player.posy+offsetWorldY);
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
    for(var i=0;i<player.lifeRadius/10;i++){
        var angle=((+player.lifeRadius+100*i)+vfxCounter)*Math.pow(-1,i);
        var velrad=25+7*i;

        cpx = player.posx2+offsetWorldX + velrad * Math.cos(angle);
        cpy = player.posy2+offsetWorldY + velrad * Math.sin(angle);
        drawDoubleCircle(cpx,cpy,4,player.color,0.05*i);
        drawCircleStroke(player.posx2+offsetWorldX,player.posy2+offsetWorldY,velrad,player.color,0.05*i);
    }
}

function drawLine(x,y,x2,y2,a){
    context.beginPath();
    context.strokeStyle="rgba(255,255,255,"+a+")";
    context.lineWidth = 2;
    context.moveTo(x,y);
    context.lineTo(x2,y2);
    context.stroke();
}

function calculatePointOfCircunferenceForVel(x,y,cx,cy,velrad){
    var maxVariableRadius=canvas.height*0.4*shootRadiusRatio;
    
    var angle=Math.atan((y-cy)/(x-cx));
    var mult=1;
    if(x-cx>0){
        mult=-1;
    }else{
        mult=1;
    }

    cpx = cx + velrad * Math.cos(angle)*mult;
    cpy = cy + velrad * Math.sin(angle)*mult;
    if(lineDistance({"posx":x,"posy":y},{"posx":cpx,"posy":cpy})>maxVariableRadius){
        cpx = cx + maxVariableRadius * Math.cos(angle)*mult*-1;
        cpy = cy + maxVariableRadius * Math.sin(angle)*mult*-1;
    }else{
        cpx = cx + velrad * Math.cos(angle)*mult*-1;
        cpy = cy + velrad * Math.sin(angle)*mult*-1;
    }
    
    return {"cpx":cpx,"cpy":cpy};
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

function drawFront(){
    context.fillStyle="#000"
    context.fillRect(0,0,canvas.width,canvas.height)
    //context.globalCompositeOperation = "xor";
    context.beginPath();
    context.arc(canvas.width/2,canvas.height/2,canvas.height*0.45,0,2*Math.PI);
    context.clip();

}

function calculatePointOfCircunference(x,y,cx,cy,velrad){
    var mult=1;
    var angle=Math.atan((y-cy)/(x-cx));
    if(x-cx<0){
        mult=-1;
    }
    
    cpx = cx + velrad * Math.cos(angle)*mult;
    cpy = cy + velrad * Math.sin(angle)*mult;
    return {"cpx":cpx,"cpy":cpy};
}
