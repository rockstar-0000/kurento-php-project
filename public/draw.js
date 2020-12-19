/* Canvas */
var canvas = document.getElementById('drawCanvas');
var ctx = canvas.getContext('2d');
var color = "red";
var lineWidth = '3';
var isDrawFlag = false;
// var color = document.querySelector(':checked').getAttribute('data-color');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.9;

ctx.strokeStyle = color;
ctx.lineWidth = lineWidth;
ctx.lineCap = ctx.lineJoin = 'round';

/* Mouse and touch events */

// document.getElementById('colorSwatch').addEventListener('click', function() {
// 	color = document.querySelector(':checked').getAttribute('data-color');
// }, false);

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

function drawBoard() {
    isDrawFlag = true;
    $('#draw_start_button').attr('disabled', true);
    $('#draw_stop_button').attr('disabled', false);
    startCanvasStream();
}

function stopDraw() {
    isDrawFlag = false;
    $('#draw_start_button').attr('disabled', false);
    $('#draw_stop_button').attr('disabled', true);
}

function clearDraw() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}
/* Draw on canvas */

function drawOnCanvas(color, plots) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(plots[0].x, plots[0].y);

    for (var i = 1; i < plots.length; i++) {
        ctx.lineTo(plots[i].x, plots[i].y);
    }
    ctx.stroke();
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