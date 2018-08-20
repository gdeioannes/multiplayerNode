/////CHAT
var id;
var playersFromServer = [];
var ligthPointsFromServer = [];
var radius = 10;
var color = getRandomColor();
var worldWidth = 0;
var worldHeight = 0;
var offsetWorldX = 0;
var offsetWorldY = 0;
var shootRadiusRatio = 0;
var flagStorage = false;
var flagHoldDirection = false;
var frontCircleSize = 0;
var timer;
var storageData = JSON.parse(localStorage.getItem("agileWars"));
var tagActiveFlag=true;

$(window).blur(function(){
    tagActiveFlag=false;
});

$(window).focus(function(){
    tagActiveFlag=true;
});


//SaveData
$("#play-container").hide();

if (storageData != null) {
    id = storageData.id;
    $('#u-name').val(storageData.name);
    $("#player-login-submit").hide();
    $("#play-container").show();
    $("#look-btn").hide();
}

$("#login-btn").click(function () {
    var storageData = {
        "id": 0,
        "name": ""
    };
    storageData.id = Math.round(Math.random() * 10000000000000000000);
    storageData.name = $('#user-name-login').val();
    localStorage.setItem("agileWars", JSON.stringify(storageData));
    $('#u-name').val($('#user-name-login').val());
    $("#player-login-submit").hide();
    $("#play-container").show();
    $("#look-btn").hide();
});

$("#look-btn").click(function () {
    $("#player-login-container").hide();
});

$("#clear-data-btn").click(function () {
    localStorage.clear();
    $("#player-login-submit").show();
    $("#play-container").hide();
    $("#look-btn").show();
});

$("#play-btn").click(function () {
    $("#player-login-container").hide();
    createPlayer();
    flagStorage = true;
    $("#look-btn").hide();
});



$('#toggle-btn').click(function () {
    $('#chat-container').slideToggle();
});

if ($('#u-name').val() == "") {
    $('#u-name').val("User" + Math.round(Math.random() * 1000));
}

///SEND DATA
var flagLeft = false;
var flagRight = false;
var flagUp = false;
var flagDown = false;
var shootFlag = false;
var moveFlag = false;
var flagStop = false;
var vel = 10;
var posx = 0;
var posy = 0;
var chatOverFlag = false;
var mousePosx = 0;
var mousePosy = 0;
var mousePosAimx = 0;
var mousePosAimy = 0;
var vfxCounter = 0;
var shootRadiusMax = 100;

var socket = io();

var dataChat = {
    "name": "",
    "message": ""
}

var dataPlayer = {
    "id": 0,
    "name": "",
    "flagRight": false,
    "flagLeft": false,
    "flagUp": false,
    "flagDown": false,
    "shootFlag": false,
    "moveFlag": false,
    "flagStop": false,
    "flagHoldDirection": false,
    "mousePosx": 0,
    "mousePosy": 0,
    "mousePosAimx": 0,
    "mousePosAimy": 0,
    "color": ""
}

$('form').submit(function () {
    dataChat.name = $('#u-name').val();
    dataChat.message = $('#m').val();
    var dataString = JSON.stringify(dataChat);
    socket.emit('send dataChat', dataChat);
    $('#m').val('');
    return false;
});

socket.on('send dataChat', function (receivedDataChat) {
    $('#messages').append($('<li><label>' + receivedDataChat.name + ': </label>' + receivedDataChat.message + '</li>'));
    $('#messages').scrollTop(100000000000000);
});



//GAME

//CREATE PLAYER
function createPlayer() {
    socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
}

$(window).keydown(function (e) {
    var key = e.which;
    controlMove(key, true);
    socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
});

$(window).keyup(function (e) {
    var key = e.which;
    controlMove(key, false)
    socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
    shootFlag = false;
});

function setDataForSending() {
    dataPlayer.id = id;
    dataPlayer.flagRight = flagRight;
    dataPlayer.flagLeft = flagLeft;
    dataPlayer.flagUp = flagUp;
    dataPlayer.flagDown = flagDown;
    dataPlayer.flagStop = flagStop;
    dataPlayer.shootFlag = shootFlag;
    dataPlayer.flagHoldDirection = flagHoldDirection;
    dataPlayer.moveFlag = moveFlag;
    dataPlayer.mousePosx = mousePosx;
    dataPlayer.mousePosy = mousePosy;
    dataPlayer.mousePosAimx = mousePosAimx;
    dataPlayer.mousePosAimy = mousePosAimy;
    dataPlayer.color = color;
    dataPlayer.name = $('#u-name').val();
    return dataPlayer;
}

socket.on('receive dataChat', function (receivedDataChat) {
    if(tagActiveFlag){
        $('#messages').append($('<li><label>' + receivedDataChat.name + ': </label>' + receivedDataChat.message + '</li>'));
        $('#messages').scrollTop(100000000000000000000000000000000000000000);
    }
});

socket.on('send allDataOfPLayer', function (allDataOfPLayer) {
    if(tagActiveFlag){
        playersFromServer = allDataOfPLayer;
        setPlayersScores();
    }
});

socket.on('send allDataOfStage', function (allDataOfStage) {
    if(tagActiveFlag){
        worldWidth = allDataOfStage.worldWidth;
        worldHeight = allDataOfStage.worldHeight;
        ligthPointsFromServer = allDataOfStage.ligthPoints;
        $("#timer").html(allDataOfStage.timer);
    }
});

function controlMove(key, state) {
    if (key == 32) {
        console.log("STOP:" + state);
        flagHoldDirection = state;
    }
}

$(window).mousedown(function (event) {
    switch (event.which) {
        case 1:
            //LEFT
            if (!chatOverFlag && flagStorage) {
                pos = getMousePos(canvas, event);
                shootFlag = true;
                socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
                shootFlag = false;
            }
            break;
        case 2:
            //MIDLE
            break;
        case 3:
            //RIGTH
            flagHoldDirection = true;
            console.log("MOUSE RIGTH DOWM");
            socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
            break;
        default:
            alert('You have a strange Mouse!');
    }
});

$(window).mouseup(function (event) {
    switch (event.which) {
        case 1:
            //LEFT
            break;
        case 2:
            //MIDLE
            break;
        case 3:
            //RIGTH
            flagHoldDirection = false;
            console.log("MOUSE RIGTH UP");
            socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
            break;
        default:
            alert('You have a strange Mouse!');
    }
});


var alphaCharge = 0.35;
var alphaShoot = 0.85;
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var gameScreenWidth = 1000;
var gameScreenHeight = 1000;
var canvasWindowRatio = 1;
var canvasCCSWidth = parseInt($("#myCanvas").css("width"));
var canvasCCSHeight = parseInt($("#myCanvas").css("height"));
var marginLeft = (window.innerWidth - canvasCCSWidth) / 2;
var marginTop = (window.innerHeight - canvasCCSHeight) / 2;

context.canvas.width = gameScreenWidth;
context.canvas.height = gameScreenHeight;

setCanvasCSSSize();

var screenModWidth = canvas.width;
var screenModHeight = canvas.height;

setFrontCircleSize();
setInterval(mainLoop, 30);

function mainLoop() {
    if(tagActiveFlag){
        context.canvas.width = context.canvas.width;
        if (!$("#black-circle").prop('checked')) {
            drawFront();
        }
        drawPattern();
        if (flagStorage) {
            worldMovement();
            drawLigthPoints();

            vfxCounter += 0.1;
            if (vfxCounter > 1000) {
                vfxCounter = 0;
            }
        }
    }
}

function drawLigthPoints() {
    for (var ii = 0; ii < ligthPointsFromServer.length; ii++) {
        drawRect(ligthPointsFromServer[ii]);
        drawCircleVFX(ligthPointsFromServer[ii].posx + offsetWorldX, ligthPointsFromServer[ii].posy + offsetWorldY, ligthPointsFromServer[ii].radius * 0.6, "#FFFFFF", 0.9, 0.8);
        drawCircleVFX(ligthPointsFromServer[ii].posx + offsetWorldX, ligthPointsFromServer[ii].posy + offsetWorldY, ligthPointsFromServer[ii].radius, "#FFFFFF", 0.65, 0.8);
        drawShadow(ligthPointsFromServer[ii].posx + offsetWorldX, ligthPointsFromServer[ii].posy + offsetWorldY);
        drawText("HP", 12, ligthPointsFromServer[ii].posx + offsetWorldX, ligthPointsFromServer[ii].posy + offsetWorldY);
    }
}

function worldMovement() {
    for (var i = 0; i < playersFromServer.length; i++) {

        if (playersFromServer[i].id == id) {

            var offset = 0.4;
            var offsetVel = 10;

            var movx = ((screenModWidth * 0.2) / (screenModWidth / 2 - (playersFromServer[i].posx + offsetWorldX)));
            var movy = ((screenModHeight * 0.2) / (screenModHeight / 2 - (playersFromServer[i].posy + offsetWorldY)));

            if (offsetWorldX > 0) {
                offsetWorldX = 0;;
            }
            if (offsetWorldY > 0) {
                offsetWorldY = 0;;
            }
            if (offsetWorldX < -worldWidth + screenModWidth) {
                offsetWorldX = -worldWidth + screenModWidth;
            }
            if (offsetWorldY < -worldHeight + screenModHeight) {
                offsetWorldY = -worldHeight + screenModHeight;
            }
            if (offsetWorldX <= 0) {
                offsetWorldX += offsetVel / movx;
            }
            if (offsetWorldY <= 0) {
                offsetWorldY += offsetVel / movy;
            }
            offsetWorldY += offsetVel / movy;

            shootRadiusRatio = ((100 * playersFromServer[i].shootRadius) / shootRadiusMax) / 100;

            drawCircle(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.4 * shootRadiusRatio, "#FFFFFF", 0.03);
            drawCircleStrokeDot(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.4, "#FFFFFF", 0.05);
            if (screenModHeight * 0.2 < screenModHeight * 0.4 * shootRadiusRatio) {
                drawCircleStrokeDot(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.2, "#FFFFFF", 0.05);
            } else {
                drawCircle(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.2, "#FFCC00", 0.3);
            }
            if (screenModHeight * 0.1 < screenModHeight * 0.4 * shootRadiusRatio) {
                drawCircleStrokeDot(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.1, "#FFFFFF", 0.05);
            } else {
                drawCircle(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.1, "#FF0000", 0.3);
            }

            drawLine(playersFromServer[i].posx + offsetWorldX, playersFromServer[i].posy + offsetWorldY, screenModWidth / 2, screenModHeight / 2, 0.25);
            drawCircle(screenModWidth / 2, screenModHeight / 2, 5, "#FFFFFF", 0.5);
        }


        for (var bulletNum = 0; bulletNum < playersFromServer[i].bullets.length; bulletNum++) {
            var playerBullet = playersFromServer[i].bullets[bulletNum];
            drawCircle(playerBullet.posx + offsetWorldX, playerBullet.posy + offsetWorldY, 15, playersFromServer[i].color, 1, 0.4);
        }
        
        var centerPoint = {
            "posx": screenModWidth / 2 - offsetWorldX,
            "posy": screenModHeight / 2 - offsetWorldY
        };
        
        if (lineDistance(centerPoint, playersFromServer[i]) - playersFromServer[i].lifeRadius < screenModHeight * 0.45) {
            drawCircleOrbiting(playersFromServer[i]);
            drawEntityPlayer(playersFromServer[i]);
        } else {
            var circleRadarRatio = (lineDistance(centerPoint, playersFromServer[i]) * 100 / (worldWidth)) / 100;
            var cpoints = calculatePointOfCircunference(playersFromServer[i].posx + offsetWorldX, playersFromServer[i].posy + offsetWorldY, screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.4);
            drawLine(cpoints.cpx, cpoints.cpy, screenModWidth / 2, screenModHeight / 2, 0.025);
            drawCircle(cpoints.cpx, cpoints.cpy, 20 * (1 - circleRadarRatio), playersFromServer[i].color, 1 * (1 - circleRadarRatio));
            drawText(playersFromServer[i].name, 12, cpoints.cpx, cpoints.cpy);

        }
    }
}

$(window).keydown(function (e) {
    var key = e.keyCode;
    controlMove(key, true);
});

$(window).keyup(function (e) {
    var key = e.keyCode;
    controlMove(key, false);
});


var saveMousePosx = 0;
var saveMousePosy = 0;
$(window).mousemove(function (e) {
    if (flagStorage) {
        setMoveStates(e);
    }
});

function setMoveStates(e) {
    if (flagStorage) {
        pos = getMousePos(canvas, e);
        if (flagHoldDirection) {
            mousePosx = saveMousePosx;
            mousePosy = saveMousePosy;
            mousePosAimx = pos.x;
            mousePosAimy = pos.y;

        } else {
            mousePosx = pos.x;
            mousePosy = pos.y;
            mousePosAimx = pos.x;
            mousePosAimy = pos.y;
            saveMousePosx = pos.x;
            saveMousePosy = pos.y;
        }
        socket.emit('send dataPlayer', JSON.stringify(setDataForSending()));
    }
}

function drawDoubleCircle(centerX, centerY, radius, color, alpha) {

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.5);
    context.beginPath();
    context.arc(0, 0, radius, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color, alpha);
    context.fill();
    context.restore();

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color, alpha);
    context.fill();
}

function drawCircle(centerX, centerY, radius, color, alpha) {

    context.beginPath();
    if (radius < 0) {
        radius = 0;
    }
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color, alpha);
    context.fill();
}

function drawCircleStroke(centerX, centerY, radius, color, alpha) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = hexToRgbA(color, alpha);
    context.stroke();
}

function drawCircleStrokeDot(centerX, centerY, radius, color, alpha) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 2;
    context.strokeStyle = hexToRgbA(color, alpha);
    context.stroke();
}

function drawCircleVFX(centerX, centerY, radius, color, alpha, mult) {
    var multi = mult + Math.abs(Math.cos(vfxCounter));
    context.beginPath();
    context.arc(centerX, centerY, radius * multi, 0, 2 * Math.PI, false);
    context.fillStyle = hexToRgbA(color, alpha);
    context.fill();
}

function drawText(text, fontsize, px, py) {
    context.font = fontsize + "px Arial";
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.fillText(text, px, py + (fontsize * 1.2) + radius);
}

img = new Image();
img2 = new Image();
img.src = 'img/background_game.jpg';
img2.src = 'img/background_game_offset.jpg';

function drawPattern() {
    // create pattern
    context.save();
    context.translate(offsetWorldX, offsetWorldY);
    var ptrn = context.createPattern(img2, 'repeat'); // Create a pattern with this image, and set it to "repeat".
    context.fillStyle = ptrn;
    context.fillRect(-worldWidth, -worldHeight, worldWidth * 4, worldHeight * 4); // context.fillRect(x, y, width, height);
    var ptrn = context.createPattern(img, 'repeat'); // Create a pattern with this image, and set it to "repeat".
    context.fillStyle = ptrn;
    context.fillRect(0, 0, worldWidth, worldHeight); // context.fillRect(x, y, width, height);
    context.restore();
}

imgShadow = new Image();
imgShadow.src = 'img/shadow.png';

function drawShadow(x, y) {
    context.drawImage(imgShadow, x - imgShadow.width / 2, y + radius * 1.05);
}

function hexToRgbA(hex, alpha) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    throw new Error('Bad Hex');
}

function getMousePos(canvas, evt) {
    var cssCanvasWidth = parseInt($("#myCanvas").css("width"));
    var cssCanvasHeight = parseInt($("#myCanvas").css("height"));

    var posxCorrected = (evt.clientX - marginLeft) * (gameScreenWidth / cssCanvasWidth);
    var posyCorrected = (evt.clientY - marginTop) * (gameScreenHeight / cssCanvasHeight);

    return {
        x: posxCorrected - offsetWorldX,
        y: posyCorrected - offsetWorldY
    };
}

function setPlayersScores() {
    $("#player-list").html("");
    $("#player-list").append("<li>SCORE BOARD</li>");
    playersFromServer = playersFromServer.sort(compare);
    for (var i = 0; i < playersFromServer.length; i++) {
        $("#player-list").append("<li>" + playersFromServer[i].name + ":" + playersFromServer[i].points + "</li>");
    }
}

function compare(a, b) {
    if (a.points > b.points)
        return -1;
    if (a.points < b.points)
        return 1;
    return 0;
}

$(window).resize(function () {
    setCanvasCSSSize();
    setFrontCircleSize();
});

function setCanvasCSSSize() {

    if (canvas.height > window.innerHeight && window.innerHeight < window.innerWidth) {
        $("#myCanvas").css("width", "auto");
        $("#myCanvas").css("height", canvas.height * (window.innerHeight / canvas.height));
        canvasWindowRatio = 1 + (1 - window.innerHeight / canvas.height);
    } else {
        if (canvas.width > window.innerWidth && window.innerHeight > window.innerWidth) {
            $("#myCanvas").css("height", "auto");
            $("#myCanvas").css("width", canvas.width * (window.innerWidth / canvas.width));
            canvasWindowRatio = 1 + (1 - window.innerWidth / canvas.width);
        }
    }

    canvasCCSWidth = parseInt($("#myCanvas").css("width"));
    canvasCCSHeight = parseInt($("#myCanvas").css("height"));
    marginLeft = (window.innerWidth - canvasCCSWidth) / 2;
    marginTop = (window.innerHeight - canvasCCSHeight) / 2;

    $("#myCanvas").css("left", marginLeft);
    $("#myCanvas").css("top", marginTop);

}

function setFrontCircleSize() {
    if (screenModWidth < screenModHeight) {
        frontCircleSize = screenModWidth;
    } else {
        frontCircleSize = screenModHeight;
    }
}

function drawEntityPlayer(player) {
    drawCircleVFX(player.posx + offsetWorldX, player.posy + offsetWorldY, radius, player.color, 0.85, 0.5);
    drawCircleVFX(player.posx + offsetWorldX, player.posy + offsetWorldY, radius * 0.7, player.color, 0.9, 0.5);
    drawDoubleCircle(player.posx2 + offsetWorldX, player.posy2 + offsetWorldY, player.lifeRadius, player.color, 0.2);
    drawShadow(player.posx + offsetWorldX, player.posy + offsetWorldY);
    drawText(player.name, 12, player.posx + offsetWorldX, player.posy + offsetWorldY);
}

function drawRect(object) {
    var rectWidth = object.radius / 8;
    context.beginPath();
    context.rect((object.posx + offsetWorldX) - rectWidth / 2, object.posy + offsetWorldY, rectWidth, object.radius * 2);
    context.fillStyle = 'white';
    context.fill();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function drawCircleOrbiting(player) {
    for (var i = 0; i < player.lifeRadius / 10; i++) {
        var angle = ((+player.lifeRadius + 100 * i) + vfxCounter) * Math.pow(-1, i);
        var velrad = 25 + 7 * i;

        cpx = player.posx2 + offsetWorldX + velrad * Math.cos(angle);
        cpy = player.posy2 + offsetWorldY + velrad * Math.sin(angle);
        drawDoubleCircle(cpx, cpy, 4, player.color, 0.15 * i);
        drawCircleStroke(player.posx2 + offsetWorldX, player.posy2 + offsetWorldY, velrad, player.color, 0.15 * i);
    }
}

function drawLine(x, y, x2, y2, a) {
    context.beginPath();
    context.strokeStyle = "rgba(255,255,255," + a + ")";
    context.lineWidth = 2;
    context.moveTo(x, y);
    context.lineTo(x2, y2);
    context.stroke();
}

function calculatePointOfCircunferenceForVel(x, y, cx, cy, velrad) {
    var maxVariableRadius = screenModHeight * 0.4 * shootRadiusRatio;

    var angle = Math.atan((y - cy) / (x - cx));
    var mult = 1;
    if (x - cx > 0) {
        mult = -1;
    } else {
        mult = 1;
    }

    cpx = cx + velrad * Math.cos(angle) * mult;
    cpy = cy + velrad * Math.sin(angle) * mult;
    if (lineDistance({
            "posx": x,
            "posy": y
        }, {
            "posx": cpx,
            "posy": cpy
        }) > maxVariableRadius) {
        cpx = cx + maxVariableRadius * Math.cos(angle) * mult * -1;
        cpy = cy + maxVariableRadius * Math.sin(angle) * mult * -1;
    } else {
        cpx = cx + velrad * Math.cos(angle) * mult * -1;
        cpy = cy + velrad * Math.sin(angle) * mult * -1;
    }

    return {
        "cpx": cpx,
        "cpy": cpy
    };
}

function lineDistance(point1, point2) {
    var xs = 0;
    var ys = 0;

    xs = point2.posx - point1.posx;
    xs = xs * xs;

    ys = point2.posy - point1.posy;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
}

function drawFront() {
    context.fillStyle = "#000"
    context.fillRect(0, 0, screenModWidth, screenModHeight)
    //context.globalCompositeOperation = "xor";
    context.beginPath();
    context.arc(screenModWidth / 2, screenModHeight / 2, frontCircleSize * 0.45, 0, 2 * Math.PI);
    context.clip();

}

function calculatePointOfCircunference(x, y, cx, cy, velrad) {
    var mult = 1;
    var angle = Math.atan((y - cy) / (x - cx));
    if (x - cx < 0) {
        mult = -1;
    }

    cpx = cx + velrad * Math.cos(angle) * mult;
    cpy = cy + velrad * Math.sin(angle) * mult;
    return {
        "cpx": cpx,
        "cpy": cpy
    };
}
