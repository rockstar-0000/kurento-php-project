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
    sendClearDrawn();
}

/* Draw on canvas */

function drawOnCanvas(color, plots) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(plots[0].x, plots[0].y);

    sendColor(color);
    startPlot(plots[0]);
    for (var i = 1; i < plots.length; i++) {
        ctx.lineTo(plots[i].x, plots[i].y);
        sendPlot(plots[i]);
    }
    ctx.stroke();

    endPlot();
}

function sendColor(color) {
    // Sender of the message (after 'session.connect')
    session.signal({
        data: color,  // Any string (optional)
        to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
        type: whitBoardColor            // The type of message (optional)
    })
        .then(() => {
            console.log("send white board draw plots");
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
            console.log("send white board draw plots");
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
            console.log("send white board draw plots");
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
            console.log("send white board draw plots");
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
            console.log("send white board draw plots");
        })
        .catch(error => {
            console.error(error);
        });
}

function setDrawColor(message) {
    ctx.strokeStyle = message;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = ctx.lineJoin = 'round';
}

function startDrawPlot(message) {
    var res;
    var x, y;
    res = message.split("-");
    x = parseInt(res[0]);
    y = parseInt(res[1]);
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function setDrawPlot(message) {
    var res;
    var x, y;
    res = message.split("-");
    x = parseInt(res[0]);
    y = parseInt(res[1]);
    ctx.lineTo(x, y);
}

function endDrawPlot() {
    ctx.stroke();
}

function clearDrawPlot() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawFromStream(message) {
    if (!message || message.plots.length < 1) return;
    drawOnCanvas(message.color, message.plots);
}

var isActive = false;
var plots = [];

function draw(e) {
    e.preventDefault(); // prevent continuous touch event process e.g. scrolling!
    if (!isActive) return;

    var x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
    var y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);

    plots.push({ x: (x << 0), y: (y << 0) }); // round numbers for touch screens

    drawOnCanvas(color, plots);
}

function startDraw(e) {
    e.preventDefault();
    if (isDrawFlag === true) {
        isActive = true;
    }
}

function endDraw(e) {
    e.preventDefault();
    isActive = false;
    plots = [];
}

stopDraw();