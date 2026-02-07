const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushBtn = document.getElementById('brushBtn');
const fillBtn = document.getElementById('fillBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const brushSizeInput = document.getElementById('brushSize');

let drawing = false;
let currentTool = 'brush';
let currentColor = colorPicker.value;
let brushSize = parseInt(brushSizeInput.value);
let lastX = null;
let lastY = null;

// Update currently picked color
colorPicker.addEventListener('input', e => currentColor = e.target.value);

// Select painting tool
brushBtn.addEventListener('click', () => selectTool('brush'));
fillBtn.addEventListener('click', () => selectTool('fill'));

// Clear canvas
clearBtn.addEventListener('click', clearCanvas);

// Export canvas
exportBtn.addEventListener('click', exportToText);

// Select brush size
brushSizeInput.addEventListener('input', e => brushSize = parseInt(e.target.value));

// Draw with mouse
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

// Draw with touch
canvas.addEventListener('touchstart', e => handleTouch(e, startDrawing));
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', e => handleTouch(e, draw));

// Fill tool
canvas.addEventListener('touchstart', handleFill);
canvas.addEventListener('click', handleFill);

// Reset canvas on document ready
document.addEventListener('DOMContentLoaded', clearCanvas);

// Select the current tool
function selectTool(tool) {
  currentTool = tool;
  brushBtn.classList.toggle('active', tool === 'brush');
  fillBtn.classList.toggle('active', tool === 'fill');
}

// Coordinate conversion
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e.touches) e = e.touches[0];
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  return { x, y };
}

// Initial drawing setup
function startDrawing(e) {
  if (currentTool !== 'brush') return;
  drawing = true;
  const { x, y } = getCanvasCoords(e);
  lastX = x;
  lastY = y;
  drawPixel(x, y);
}

// Reset drawing state after touchend or mouseup
function stopDrawing() {
  drawing = false;
  lastX = null;
  lastY = null;
}

// Called on "dragging" the brush
function draw(e) {
  if (!drawing || currentTool !== 'brush') return;
  e.preventDefault();
  const { x, y } = getCanvasCoords(e);
  drawLine(lastX, lastY, x, y);
  lastX = x;
  lastY = y;
}

// Draw a dot of a brush stroke
function drawPixel(x, y) {
  ctx.fillStyle = currentColor;
  const radius = brushSize / 2;
  const r2 = radius * radius;

  // get bounding box of the circle
  const startX = Math.floor(x - radius);
  const endX = Math.ceil(x + radius);
  const startY = Math.floor(y - radius);
  const endY = Math.ceil(y + radius);

  // draw pixels within the circle
  for (let px = startX; px <= endX; px++) {
    for (let py = startY; py <= endY; py++) {
      const dx = px - x;
      const dy = py - y;
      if (dx*dx + dy*dy <= r2) {
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}

// Draw a thick line between points using Bresenham
function drawLine(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawPixel(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx)  { err += dx; y0 += sy; }
  }
}

// Fill tool
function handleFill(e) {
  if (currentTool !== 'fill') return;
  const { x, y } = getCanvasCoords(e);
  floodFill(x, y, hexToRgba(currentColor));
}

// Clear canvas
function clearCanvas() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Touch helper
function handleTouch(e, handler) {
  e.preventDefault();
  handler(e);
}

// Export image to text
function exportToText() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  let output = new Object();
  output.width = width;
  output.height = height;
  output.pixels = [];

  for (let y = 0; y < height; y++) {
    let row = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      row.push(rgbToHex(r, g, b));
    }
    output.pixels.push(row);
  }

  fetch('/save-file', {
    method: "POST", 
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(output)})

}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgba(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

// Fill color is RGBA
function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // multiply by 4 since these are RGBA values
  const startPos = (y * width + x) * 4;
  const startColor = data.slice(startPos, startPos + 4);
  if (colorMatch(startColor, fillColor)) return;

  const stack = [[x, y]];

  while (stack.length) {
    const [cx, cy] = stack.pop();
    const currentPos = (cy * width + cx) * 4;
    const currentColor = data.slice(currentPos, currentPos + 4);

    if (!colorMatch(currentColor, startColor)) continue;

    data[currentPos] = fillColor[0];
    data[currentPos + 1] = fillColor[1];
    data[currentPos + 2] = fillColor[2];
    data[currentPos + 3] = fillColor[3];

    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx < width - 1) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy < height - 1) stack.push([cx, cy + 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}
