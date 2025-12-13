import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { RefreshCw } from "lucide-react";

export type ModelType = "mnist" | "emnist" | "fashion-mnist" | "cifar-10";

interface CanvasProps {
  selectedModel: ModelType;
}

const EMNIST_BYCLASS_LABELS: Record<number, string> = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "A",
  11: "B",
  12: "C",
  13: "D",
  14: "E",
  15: "F",
  16: "G",
  17: "H",
  18: "I",
  19: "J",
  20: "K",
  21: "L",
  22: "M",
  23: "N",
  24: "O",
  25: "P",
  26: "Q",
  27: "R",
  28: "S",
  29: "T",
  30: "U",
  31: "V",
  32: "W",
  33: "X",
  34: "Y",
  35: "Z",
  36: "a",
  37: "b",
  38: "c",
  39: "d",
  40: "e",
  41: "f",
  42: "g",
  43: "h",
  44: "i",
  45: "j",
  46: "k",
  47: "l",
  48: "m",
  49: "n",
  50: "o",
  51: "p",
  52: "q",
  53: "r",
  54: "s",
  55: "t",
  56: "u",
  57: "v",
  58: "w",
  59: "x",
  60: "y",
  61: "z",
};

const FASHION_MNIST_LABELS: Record<number, string> = {
  0: "T-shirt/top",
  1: "Trouser",
  2: "Pullover",
  3: "Dress",
  4: "Coat",
  5: "Sandal",
  6: "Shirt",
  7: "Sneaker",
  8: "Bag",
  9: "Ankle boot",
};

const CIFAR10_LABELS: Record<number, string> = {
  0: "airplane",
  1: "automobile",
  2: "bird",
  3: "cat",
  4: "deer",
  5: "dog",
  6: "frog",
  7: "horse",
  8: "ship",
  9: "truck",
};

const MODEL_CONFIG = {
  mnist: {
    path: "res/sveltnet_mnist_aug_9954/model.json",
    channels: 1,
    size: 28,
  },
  emnist: {
    path: "res/sveltnet_emnist_aug_8769/model.json",
    channels: 1,
    size: 28,
  },
  "fashion-mnist": {
    path: "res/sveltnet_fashion_mnist_aug_9350/model.json",
    channels: 1,
    size: 28,
  },
  "cifar-10": {
    path: "res/sveltnet_cifar10_aug_8493/model.json",
    channels: 3,
    size: 32,
  },
} as const;

export const Canvas = ({ selectedModel }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasImageRef = useRef<string | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (canvasContainerRef.current && !containerSize) {
      const width = canvasContainerRef.current.offsetWidth;
      const height = canvasContainerRef.current.offsetHeight;
      setContainerSize({ width, height });
    }
  }, [containerSize]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 12;
    context.strokeStyle = "#000000";
    contextRef.current = context;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (canvasImageRef.current) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = canvasImageRef.current;
    }
  };

  useEffect(() => {
    setupCanvas();

    const handleResize = () => {
      if (canvasRef.current && contextRef.current) {
        canvasImageRef.current = canvasRef.current.toDataURL();
      }
      setupCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    if (!contextRef.current) return;

    const { x, y } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !contextRef.current) return;

    const { x, y } = getCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (contextRef.current) {
      contextRef.current.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    canvasImageRef.current = null;
  };

  // TF.js Helpers
  function canvasToGrayscaleTensor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const grayData = new Uint8Array(canvas.width * canvas.height);

    for (let i = 0; i < canvas.width * canvas.height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      grayData[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return tf.tensor3d(grayData, [canvas.height, canvas.width, 1], "int32");
  }

  // Prediction Logic
  const handlePredict = async () => {
    setIsPredicting(true);
    setPrediction(null);

    const canvas = canvasRef.current!;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d")!;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // white background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // EMNIST needs horizontal flip
    if (selectedModel === "emnist") {
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
    }

    tempCtx.drawImage(canvas, 0, 0);

    try {
      const config = MODEL_CONFIG[selectedModel];
      const model = await tf.loadGraphModel(config.path);

      let tensor: tf.Tensor3D;

      if (config.channels === 1) {
        tensor = canvasToGrayscaleTensor(tempCanvas);
      } else {
        tensor = tf.browser.fromPixels(tempCanvas);
      }

      tensor = tf.image.resizeNearestNeighbor(tensor, [
        config.size,
        config.size,
      ]);
      tensor = tensor.toFloat().div(tf.scalar(255));

      if (config.channels === 3) {
        const mean = tf.tensor1d([0.485, 0.456, 0.406]);
        const std = tf.tensor1d([0.229, 0.224, 0.225]);
        tensor = tensor.sub(mean).div(std);
      } else {
        tensor = tf.sub(tf.scalar(1.0), tensor); // inverted grayscale
      }

      tensor = tensor.transpose([2, 0, 1]).expandDims(0);

      const result = model.predict(tensor) as tf.Tensor;
      const probs = result.softmax()
      const data = await probs.data();

      const maxVal = Math.max(...data);
      const maxIndex = data.indexOf(maxVal);

      let label = "";

      if (selectedModel === "fashion-mnist") {
        label = FASHION_MNIST_LABELS[maxIndex];
      } else if (selectedModel === "cifar-10") {
        label = CIFAR10_LABELS[maxIndex];
      } else {
        label = EMNIST_BYCLASS_LABELS[maxIndex];
      }

      setPrediction(`${label} (${(maxVal * 100).toFixed(2)}%)`);
    } catch (err) {
      console.error(err);
      setPrediction("Error running model");
    }

    setIsPredicting(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div
        ref={canvasContainerRef}
        className="relative w-[80%] aspect-square bg-white rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.15)] 
                  overflow-hidden border-4 border-indigo-100/50 transition-all duration-300 hover:shadow-[0_0_60px_rgba(99,102,241,0.25)]"
        style={
          containerSize
            ? {
                width: `${containerSize.width}px`,
                height: `${containerSize.height}px`,
              }
            : undefined
        }
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none cursor-crosshair"
        />
      </div>

      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={clearCanvas}
          className="group flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl shadow-sm 
                   hover:bg-indigo-50 active:bg-indigo-100 transition-all duration-200 ease-in-out
                   border-2 border-indigo-100"
        >
          <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
          <span>Clear</span>
        </button>

        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-sm
                    hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 
                    transition-all duration-200 ease-in-out font-medium
                    ${isPredicting ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          {isPredicting ? "✨ Predicting..." : "✨ Predict"}
        </button>
      </div>
      {/* Display prediction result */}
      {prediction !== null && (
        <div className="mt-4 text-xl font-semibold text-indigo-600">
          Predicted: {prediction}
        </div>
      )}
    </div>
  );
};
