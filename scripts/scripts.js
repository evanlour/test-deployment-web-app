const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.querySelector('.clear-button');
const submitButton = document.querySelector('.predict-button')

let drawing = false; // Flag to track whether the user is drawing

// Set initial drawing properties
ctx.lineWidth = 3; // Set line width
ctx.lineCap = 'round'; // Round line cap for smoother curves
ctx.strokeStyle = '#000'; // Black color for the line

// Start drawing when mouse is pressed down
canvas.addEventListener('mousedown', (e) => {
  drawing = true; // Start drawing
  ctx.beginPath(); // Start a new path for the line
  ctx.moveTo(getMousePosition(e).x, getMousePosition(e).y); // Move to the mouse position
});

// Draw while the mouse moves (if the mouse button is held down)
canvas.addEventListener('mousemove', (e) => {
  if (drawing) {
    const mousePos = getMousePosition(e); // Get the mouse position
    ctx.lineTo(mousePos.x, mousePos.y); // Draw a line to the mouse position
    ctx.stroke(); // Render the line on the canvas
  }
});

// Stop drawing when the mouse button is released
canvas.addEventListener('mouseup', () => {
  drawing = false; // Stop drawing
});

// Stop drawing if mouse leaves the canvas (optional)
canvas.addEventListener('mouseleave', () => {
  drawing = false; // Stop drawing if the mouse leaves the canvas
});

// Helper function to get mouse position relative to canvas
function getMousePosition(e) {
  const rect = canvas.getBoundingClientRect(); // Get canvas position on the screen
  const scaleX = canvas.width / rect.width; // Scale factor for width
  const scaleY = canvas.height / rect.height; // Scale factor for height
  return {
    x: (e.clientX - rect.left) * scaleX, // Mouse x relative to canvas, adjusted for scaling
    y: (e.clientY - rect.top) * scaleY,  // Mouse y relative to canvas, adjusted for scaling
  };
}

clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
});

submitButton.addEventListener('click', () => {
  const can = document.getElementById('drawing-canvas');
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

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
    console.log(data);  // Handle server response here
  })
  .catch(error => console.error('Error:', error));
});
