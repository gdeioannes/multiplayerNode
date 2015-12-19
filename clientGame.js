var playersArray=[];

var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

var centerX = canvas.width / 2;
var centerY = canvas.height / 2;
var radius = 10;





setInterval(mainLoop,30);

function mainLoop(){
  drawCircle(centerX,centerY,radius);  
    centerX++;
}

function drawCircle(centerX,centerY,radius){
  context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = 'green';
    context.fill();
    context.stroke();  
}