/* Canvas */
var canvas = document.getElementById('drawCanvas');
var ctx = canvas.getContext('2d');
var color = "red";
var lineWidth = '3';
var isDrawFlag = true;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.9;

ctx.strokeStyle = color;
ctx.lineWidth = lineWidth;
ctx.lineCap = ctx.lineJoin = 'round';

/* Mouse and touch events */
var isTouchSupported = 'ontouchstart' in window;
var isPointerSupported = navigator.pointerEnabled;
var isMSPointerSupported = navigator.msPointerEnabled;

var downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : 'mousedown'));
var moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove'));
var upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));

window.addEventListener("resize", displayWindowSize);
canvas.addEventListener(downEvent, startDraw, false);
canvas.addEventListener(moveEvent, draw, false);
canvas.addEventListener(upEvent, endDraw, false);

function displayWindowSize() {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;
    const context = canvas.getContext('2d');
    let temp = context.getImageData(0, 0, canvas.width, canvas.height)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.9;

    var ratio1 = oldWidth / canvas.width;
    var ratio2 = oldHeight / canvas.height;
    context.putImageData(temp, 0, 0)
    context.scale(ratio1, ratio2);
    context.lineWidth = lineWidth;
}

function clickedWhiteBoardBtn() {
    if (isDrawFlag) {
        stopDraw();
    }
    else {
        drawBoard();
    }
}

function drawBoard() {
    isDrawFlag = true;
    $('#draw_play_button').removeClass("btn-success");
    $('#draw_play_button').addClass("btn-warning");
    $('#draw_play_button').text("Stop Draw");
}

function stopDraw() {
    isDrawFlag = false;
    $('#draw_play_button').removeClass("btn-warning");
    $('#draw_play_button').addClass("btn-success");
    $('#draw_play_button').text("Start Draw");
}

function clearDraw() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    localUser.plotsArray = [];
    sendClearDrawn();
}

/* Draw on canvas and send points on whiteboard to other users */
function drawOnCanvas(color, userPlots) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(userPlots[0].x, userPlots[0].y);

    sendColor(color);
    startPlot(userPlots[0]);
    for (var i = 1; i < userPlots.length; i++) {
        ctx.lineTo(userPlots[i].x, userPlots[i].y);
        sendPlot(userPlots[i]);
    }
    ctx.stroke();

    endPlot();
}

/* send functions for whiteboard*/
function sendColor(color) {
    // Sender of the message (after 'session.connect')
    session.signal({
        data: color,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardColor            // The type of message (optional)
    })
        .then(() => {
        })
        .catch(error => {
            console.error(error);
        });
}

function startPlot(plot) {
    session.signal({
        data: plot.x + '-' + plot.y,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardStart            // The type of message (optional)
    })
        .then(() => {            
        })
        .catch(error => {
            console.error(error);
        });
}

function sendPlot(plot) {
    session.signal({
        data: plot.x + '-' + plot.y,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardPlot            // The type of message (optional)
    })
        .then(() => {
        })
        .catch(error => {
            console.error(error);
        });
}

function endPlot() {
    var emputy;
    session.signal({
        data: emputy,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardEnd            // The type of message (optional)
    })
        .then(() => {
        })
        .catch(error => {
            console.error(error);
        });
}

function sendClearDrawn() {
    var emputy;
    session.signal({
        data: emputy,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardClear           // The type of message (optional)
    })
        .then(() => {
        })
        .catch(error => {
            console.error(error);
        });
}

/* draw functions with whiteboard message sent*/
function setDrawColor(remoteUserId, message) {
    if (currentUser.id == remoteUserId) {
        ctx.strokeStyle = message;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = ctx.lineJoin = 'round';
    }

    for(var i=0; i<remoteUserList.length; i++){
        if(remoteUserList[i].id == remoteUserId){
            remoteUserList[i].color = message;
            break;
        }
    }
}

function startDrawPlot(remoteUserId, message) {
    var res;
    var x, y;
    res = message.split("-");
    x = parseInt(res[0]);
    y = parseInt(res[1]);
    if (currentUser.id == remoteUserId) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    for(var i=0; i<remoteUserList.length; i++){
        if(remoteUserList[i].id == remoteUserId){
            var startPlots = [];
            var point = { x: (x << 0), y: (y << 0) };
            startPlots.push(point);
            remoteUserList[i].plotsArray.push(startPlots);
            break;
        }
    }
}

function setDrawPlot(remoteUserId, message) {
    var res;
    var x, y;
    res = message.split("-");
    x = parseInt(res[0]);
    y = parseInt(res[1]);
    if (currentUser.id == remoteUserId) {
        ctx.lineTo(x, y);
    }

    for(var i=0; i<remoteUserList.length; i++){
        if(remoteUserList[i].id == remoteUserId){
            var point = { x: (x << 0), y: (y << 0) };
            var lastIndex = remoteUserList[i].plotsArray.length - 1;
            if(lastIndex >= 0){
                remoteUserList[i].plotsArray[lastIndex].push(point);
            }
            break;
        }
    }
}

function endDrawPlot(remoteUserId) {
    if (currentUser.id == remoteUserId) {
        ctx.stroke();
    }
}

function clearDrawPlot() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawFromStream(message) {
    if (!message || message.plots.length < 1) return;
    drawOnCanvas(message.color, message.plots);
}

/*redraw whiteboard when selected user changed */
function reDrawPlot(color, plotsArray) {
    clearDrawPlot();

    ctx.strokeStyle = color;
    for (var i = 0; i < plotsArray.length; i++) {
        var userPlots = plotsArray[i];
        if (userPlots.length > 0) {
            ctx.beginPath();
            ctx.moveTo(userPlots[0].x, userPlots[0].y);

            for (var j = 1; j < userPlots.length; j++) {
                ctx.lineTo(userPlots[j].x, userPlots[j].y);
            }
            ctx.stroke();
        }
    }
}

/* mouse event function*/
var isActive = false;
var plots = [];

function draw(e) {
    e.preventDefault(); // prevent continuous touch event process e.g. scrolling!
    if (!isActive) return;

    var x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
    var y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);
    var point = { x: (x << 0), y: (y << 0) };
    plots.push(point); // round numbers for touch screens
    // localUser.plots.push(point);

    drawOnCanvas(color, plots);
}

function startDraw(e) {
    e.preventDefault();
    if (isDrawFlag === true && isLocalUserWhiteBoard == true) {
        isActive = true;
    }
}

function endDraw(e) {
    e.preventDefault();
    isActive = false;
    localUser.plotsArray.push(plots);
    plots = [];
}

stopDraw();