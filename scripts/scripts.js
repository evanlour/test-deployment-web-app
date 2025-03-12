const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.querySelector('.clear-button');
const submitButton = document.querySelector('.predict-button')

let drawing = false; // Flag to track whether the user is drawing

// Set initial drawing properties
ctx.lineWidth = 3; // Set line width
ctx.lineCap = 'round'; // Round line cap for smoother curves
ctx.strokeStyle = '#000'; // Black color for the line

// Start drawing when mouse or touch is pressed down
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('touchstart', startDrawing); // For touch devices

// Draw while the mouse moves or touch moves (if the button is held down)
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', drawTouch); // For touch devices

// Stop drawing when the mouse button is released or touch ends
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchend', stopDrawingTouch); // For touch devices

// Stop drawing if mouse or touch leaves the canvas (optional)
canvas.addEventListener('mouseleave', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawingTouch); // For touch devicesFlag to track if we're drawing

// Start drawing function
function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  const mousePos = getMousePosition(e);
  ctx.moveTo(mousePos.x, mousePos.y);
  e.preventDefault(); // Prevent default behavior (e.g., scrolling on touch)
}

// Draw function for mouse
function draw(e) {
  if (drawing) {
    const mousePos = getMousePosition(e);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();
  }
}

// Draw function for touch
function drawTouch(e) {
  if (drawing) {
    const touchPos = getTouchPosition(e);
    ctx.lineTo(touchPos.x, touchPos.y);
    ctx.stroke();
  }
  e.preventDefault(); // Prevent default behavior (e.g., scrolling on touch)
}

// Stop drawing function for mouse
function stopDrawing() {
  drawing = false;
}

// Stop drawing function for touch
function stopDrawingTouch() {
  drawing = false;
}

// Helper function to get mouse position relative to canvas
function getMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// Helper function to get touch position relative to canvas
function getTouchPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const touch = e.touches[0]; // Get the first touch point
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  };
}

clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
});

submitButton.addEventListener('click', () => {
  const can = document.getElementById('drawing-canvas');
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  resDiv = document.querySelector('.result-text').textContent = "";

  // Set tempCanvas size to match the original canvas
  tempCanvas.width = can.width;
  tempCanvas.height = can.height;

  // Fill background with white to remove transparency
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the original canvas onto tempCanvas (forcing RGB)
  tempCtx.drawImage(can, 0, 0);

  // Convert to base64 PNG (now guaranteed to be RGB)
  const dataURL = tempCanvas.toDataURL('image/png');
  fetch('https://letterandtextrecognition.loca.lt/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',  // Send data as JSON
    },
    body: JSON.stringify({
      image: dataURL,  // Send the base64 encoded image as part of the JSON
    }),
  })
  .then(response => response.json())
  .then(data => {
    console.log(data)
    resDiv = document.querySelector('.result-text').textContent = "Predicted result: " + data['prediction'];
  })
  .catch(error => console.error('Error:', error));
});
