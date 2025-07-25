const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.querySelector('.clear-button');
const uploadButton = document.querySelector('.upload-button');
const submitButton = document.querySelector('.predict-button');
const uploadImage = document.querySelector('.upload-image');

let drawing = false; // Flag to track whether the user is drawing

const EMNIST_BYCLASS_LABELS = {
    0: '0',  1: '1',  2: '2',  3: '3',  4: '4',  5: '5',  6: '6',  7: '7',  8: '8',  9: '9',
    10: 'A', 11: 'B', 12: 'C', 13: 'D', 14: 'E', 15: 'F', 16: 'G', 17: 'H', 18: 'I', 19: 'J',
    20: 'K', 21: 'L', 22: 'M', 23: 'N', 24: 'O', 25: 'P', 26: 'Q', 27: 'R', 28: 'S', 29: 'T',
    30: 'U', 31: 'V', 32: 'W', 33: 'X', 34: 'Y', 35: 'Z',
    36: 'a', 37: 'b', 38: 'c', 39: 'd', 40: 'e', 41: 'f', 42: 'g', 43: 'h', 44: 'i', 45: 'j',
    46: 'k', 47: 'l', 48: 'm', 49: 'n', 50: 'o', 51: 'p', 52: 'q', 53: 'r', 54: 's', 55: 't',
    56: 'u', 57: 'v', 58: 'w', 59: 'x', 60: 'y', 61: 'z'
}

const FASHION_MNIST_LABELS = {0: 'T-shirt/top', 1: 'Trouser', 2: 'Pullover', 3: 'Dress', 4: 'Coat', 5: 'Sandal', 6: 'Shirt', 7: 'Sneaker', 8: 'Bag', 9: 'Ankle boot'}
const CIFAR10_LABELS = {0: 'airplane', 1: 'automobile', 2: 'bird', 3: 'cat', 4: 'deer', 5: 'dog', 6: 'frog', 7: 'horse', 8: 'ship', 9: 'truck'}

// Set initial drawing properties
ctx.lineWidth = 15; // Set line width
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

function canvasToGrayscaleTensor(canvas) {
  // Extract image data (RGBA)
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data; // Uint8ClampedArray

  // Create a new Uint8Array for grayscale values
  const grayData = new Uint8Array(canvas.width * canvas.height);

  for (let i = 0; i < canvas.width * canvas.height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Use luminance formula to convert to grayscale
    grayData[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Create tensor from grayscale data, shape [height, width, 1]
  return tf.tensor3d(grayData, [canvas.height, canvas.width, 1], 'int32');
}

clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
});

uploadButton.addEventListener('click', () => uploadImage.click());
uploadImage.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Clear canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Resize image if needed to fit the canvas
      let scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      let x = (canvas.width / 2) - (img.width / 2) * scale;
      let y = (canvas.height / 2) - (img.height / 2) * scale;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
});

submitButton.addEventListener('click', async () => {
  // await tf.setBackend('cpu');
  // await tf.ready();
  current_canvas = document.getElementById('drawing-canvas');
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  // Set tempCanvas size to match the original canvas
  tempCanvas.width = current_canvas.width;
  tempCanvas.height = current_canvas.height;

  // Fill background with white to remove transparency
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the original canvas onto tempCanvas (forcing RGB)
  // tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  // tempCtx.rotate(Math.PI / 2);
  // tempCtx.scale(-1, 1); // flip horizontally after rotation

// Draw image, centered with offset because of transforms
  // tempCtx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
  const modelKey = document.getElementById('modelSelect').value;
  if(modelKey === 'model2') {
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
  }
  tempCtx.drawImage(current_canvas, 0, 0);
//tempCtx.scale(-1, 1);
  // tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  // tempCtx.rotate(Math.PI / 2); // 90 degrees in radians MNIST
  // tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);

  try {
    // Adjust the URLs to your actual model locations
    const modelPaths = {
      model1: { path: 'res/sveltnet_mnist_aug_9954/model.json', channels:1, size:28},
      model2: { path: 'res/sveltnet_emnist_aug_8769/model.json', channels:1, size:28},
      model3: { path: 'res/sveltnet_fashion_mnist_aug_9350/model.json', channels:1, size:28},
      model4: { path: 'res/sveltnet_cifar10_aug_8493/model.json', channels: 3, size:32}
    };

    const model = await tf.loadGraphModel(modelPaths[modelKey].path);
    const mean = tf.tensor1d([0.485, 0.456, 0.406]);
    const std = tf.tensor1d([0.229, 0.224, 0.225]);
    // console.log("Input shape:", model.inputs[0].shape);
    channels = modelPaths[modelKey].channels;
    size = modelPaths[modelKey].size;
    // Preprocess the image
    //const imageData = temp_ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    //console.log('Canvas pixels sample:', imageData.data.slice(0, 20));
    let imgTensor = tf.browser.fromPixels(tempCanvas);
    if(channels === 1){
      imgTensor = canvasToGrayscaleTensor(tempCanvas);
    }

    imgTensor = tf.image.resizeNearestNeighbor(imgTensor, [size, size]);
    imgTensor = imgTensor.toFloat().div(tf.scalar(255));
    if(channels === 3) {
      imgTensor = imgTensor.sub(mean)
      imgTensor = imgTensor.div(std)
    }else{
      imgTensor = tf.sub(tf.scalar(1.0), imgTensor);
    }
    imgTensor = imgTensor.transpose([2, 0, 1]);
    imgTensor = imgTensor.expandDims(0);
    console.log("Tensor shape from canvas:", imgTensor.shape);

    const prediction = await model.predict(imgTensor).data();
    console.log("Prediction:", prediction);

    const maxVal = Math.max(...prediction);
    const maxIndex = prediction.indexOf(maxVal);

    console.log(`Predicted class: ${maxIndex} with confidence ${maxVal.toFixed(4)}`);
    if(modelKey === 'model3') {
      document.querySelector('.result-text').textContent = `Predicted: ${FASHION_MNIST_LABELS[maxIndex]} with confidence ${maxVal.toFixed(4)}`;
    }else if(modelKey === 'model4') {
      document.querySelector('.result-text').textContent = `Predicted: ${CIFAR10_LABELS[maxIndex]} with confidence ${maxVal.toFixed(4)}`;
    } else {
      document.querySelector('.result-text').textContent = `Predicted: ${EMNIST_BYCLASS_LABELS[maxIndex]} with confidence ${maxVal.toFixed(4)}`;
    }
  } catch (err) {
    console.error(err);
    resultDiv.textContent = 'Error loading or running model.';
  }
});