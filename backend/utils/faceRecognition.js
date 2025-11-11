const faceapi = require("@vladmandic/face-api");
const canvas = require("canvas");
const { Canvas, Image, ImageData } = canvas;
const path = require("path");
const sharp = require("sharp");
const tf = require('@tensorflow/tfjs-node');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Valid embedding dimensions
const validDimensions = [128, 512]; // ✅ Removed 10 (softmax output), use 128 (embedding layer)

// ===== INTERNAL STATE =====
let modelsLoaded = false;
let modelLoadingPromise = null;
let customModel = null; // ✅ Custom model state
let useCustomByDefault = false; // ✅ Custom model preference

function logDuration(startTime, message) {
  const duration = Date.now() - startTime;
  console.log(`[FACE] ${message}: ${duration}ms`);
  return duration;
}

/**
 * Load face recognition models with optional custom model
 * @param {Object} options - Optional configuration
 * @param {string} options.customModelPath - Path to custom model.json (optional)
 * @param {boolean} options.preferCustom - Use custom model by default (optional)
 */
async function loadModels(options = {}) {
  const overallStart = Date.now();

  if (modelsLoaded) {
    console.log("[FACE] Models already loaded");
    return;
  }

  if (modelLoadingPromise) {
    console.log("[FACE] Waiting for models to finish loading...");
    return modelLoadingPromise;
  }

  // ✅ Parse options
  const { customModelPath, preferCustom = false } = options;

  console.log("\n========== LOADING FACE MODELS ==========");
  console.log(`[${new Date().toISOString()}] Starting model loading...`);

  modelLoadingPromise = (async () => {
    try {
      const MODEL_PATH = path.join(__dirname, 'models');
      console.log(`[FACE] Model path: ${MODEL_PATH}`);

      // Load TinyFaceDetector
      console.log("\n[FACE] Loading Tiny Face Detector...");
      const tinyStart = Date.now();
      await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
      logDuration(tinyStart, "  Tiny Face Detector loaded");

      // Load FaceRecognitionNet
      console.log("\n[FACE] Loading Face Recognition Net...");
      const recognitionStart = Date.now();
      await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
      logDuration(recognitionStart, "  Face Recognition Net loaded");

      // Load FaceLandmark68Net
      console.log("\n[FACE] Loading Face Landmark 68 Net...");
      const landmarkStart = Date.now();
      await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
      logDuration(landmarkStart, "  Face Landmark 68 Net loaded");

      // ✅ Load custom model (if provided)
      if (customModelPath) {
        console.log("\n[FACE] 🎯 Loading CUSTOM model...");
        const customStart = Date.now();

        try {
          // ✅ Load model and CREATE EMBEDDING EXTRACTOR (layer before softmax)
          const fullModel = await tf.loadLayersModel('http://localhost:8001/model.json');
          
          // ✅ Extract from "embedding" layer (128D linear) instead of "dense" layer (10D softmax)
          const embeddingLayer = fullModel.getLayer('embedding');
          customModel = tf.model({
            inputs: fullModel.inputs,
            outputs: embeddingLayer.output
          });
          
          useCustomByDefault = preferCustom;

          logDuration(customStart, "  ✅ Custom model loaded");
          console.log(`  Input: ${customModel.inputs[0].shape}`);
          console.log(`  Output: ${customModel.outputs[0].shape} (embedding layer)`);
          console.log(`  Default: ${preferCustom ? 'CUSTOM' : 'PRE-TRAINED'}`);
        } catch (err) {
          console.log(JSON.stringify(err, null, 2));
          console.log(`  ⚠️ Custom model failed: ${err.message}`);
          console.log(`  → Fallback to pre-trained`);
          customModel = null;
          useCustomByDefault = false;
        }
      }

      modelsLoaded = true;

      const totalDuration = logDuration(overallStart, "\n[FACE] All models loaded");
      console.log(`[FACE] Total time: ${(totalDuration / 1000).toFixed(2)}s`);
      console.log("=========================================\n");

      return true;
    } catch (error) {
      console.error("\n[FACE] Error loading models:", error);
      logDuration(overallStart, "  Failed after");
      console.log("=========================================\n");
      modelLoadingPromise = null;
      throw new Error("Failed to load face recognition models");
    }
  })();

  return modelLoadingPromise;
}

/**
 * Extract face embedding from image buffer
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Optional configuration
 * @param {boolean} options.useCustomModel - Override default model choice
 * @returns {Promise<Array<number>>} Face descriptor (128 or 10 dimensions)
 */
async function extractFaceEmbedding(buffer, options = {}) {
  console.log("\n========== EXTRACTING FACE EMBEDDING ==========");
  const overallStart = Date.now();
  console.log(`[${new Date().toISOString()}] Starting extraction...`);

  if (!modelsLoaded) {
    console.log("[FACE] Models not loaded");
    throw new Error("Models not loaded yet. Call loadModels() first");
  }

  // ✅ Detect which model to use
  let useCustom;
  if (typeof options === 'boolean') {
    useCustom = options; // Backward compatible
  } else {
    useCustom = options.useCustomModel !== undefined
      ? options.useCustomModel
      : useCustomByDefault;
  }

  // Fallback if custom not available
  if (useCustom && !customModel) {
    console.log("[FACE] ⚠️ Custom model not available, using pre-trained");
    useCustom = false;
  }

  console.log(`[FACE] Using: ${useCustom ? 'CUSTOM' : 'PRE-TRAINED'} model`);

  try {
    // Image optimization
    console.log(`\n[FACE] Optimizing image (${(buffer.length / 1024).toFixed(2)} KB)...`);
    const optimizeStart = Date.now();

    let processBuffer = buffer;
    try {
      const metadata = await sharp(buffer).metadata();
      console.log(`  Original: ${metadata.width}x${metadata.height}`);

      if (metadata.width > 640) {
        processBuffer = await sharp(buffer)
          .resize(640, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        const newMeta = await sharp(processBuffer).metadata();
        logDuration(optimizeStart, "  Image optimized");
        console.log(`  Optimized: ${newMeta.width}x${newMeta.height}`);
        console.log(`  Size: ${(buffer.length / 1024).toFixed(2)} KB → ${(processBuffer.length / 1024).toFixed(2)} KB`);
      } else {
        console.log(`  ✓ Image size OK, skipping optimization`);
      }
    } catch (err) {
      console.log(`  ⚠️ Optimization failed, using original: ${err.message}`);
      processBuffer = buffer;
    }

    console.log(`\n[FACE] Loading image into canvas...`);
    const loadStart = Date.now();
    const img = await canvas.loadImage(processBuffer);
    logDuration(loadStart, "  Image loaded");
    console.log(`  Canvas: ${img.width}x${img.height}`);

    console.log("\n[FACE] Detecting face (TinyFaceDetector)...");
    const detectStart = Date.now();

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3  // ✅ Lower threshold for better detection (was 0.5)
    });

    let descriptor;

    // ✅ Branch by model type (SAME AS ORIGINAL)
    if (useCustom) {
      // === CUSTOM MODEL PATH ===
      const detection = await faceapi
        .detectSingleFace(img, detectorOptions)
        .withFaceLandmarks();

      logDuration(detectStart, "  Detection completed");

      if (!detection) {
        console.log("[FACE] No face detected");
        console.log("===============================================\n");
        throw new Error("Không phát hiện được khuôn mặt trong ảnh");
      }

      console.log(`[FACE] Face detected (score: ${detection.detection.score.toFixed(4)})`);

      console.log("\n[FACE] 🎯 Extracting with CUSTOM model...");
      const customStart = Date.now();

      // Crop face region
      const box = detection.detection.box;
      const faceCanvas = canvas.createCanvas(box.width, box.height);
      const faceCtx = faceCanvas.getContext('2d');
      faceCtx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);

      // Resize to 160x160 (custom model input size)
      const resizedBuffer = await sharp(faceCanvas.toBuffer('image/png'))
        .resize(160, 160)
        .toBuffer();

      const resizedImg = await canvas.loadImage(resizedBuffer);

      // Convert to tensor
      const tensorCanvas = canvas.createCanvas(160, 160);
      const tensorCtx = tensorCanvas.getContext('2d');
      tensorCtx.drawImage(resizedImg, 0, 0, 160, 160);

      // Convert canvas to tensor (normalize to [0, 1])
      const imageTensor = tf.browser.fromPixels(tensorCanvas)
        .toFloat()
        .div(255.0)
        .expandDims(0);

      console.log(`  Input tensor: ${imageTensor.shape}`);

      // Predict with custom model
      const embedding = customModel.predict(imageTensor);
      descriptor = Array.from(await embedding.data());

      // Cleanup tensors
      imageTensor.dispose();
      embedding.dispose();

      logDuration(customStart, "  ✅ Custom embedding extracted");
      console.log(`  Dimensions: ${descriptor.length}`);

    } else {
      // === PRE-TRAINED MODEL PATH (unchanged) ===
      const detection = await faceapi
        .detectSingleFace(img, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      logDuration(detectStart, "  Detection completed");

      if (!detection) {
        console.log("[FACE] No face detected");
        console.log("===============================================\n");
        throw new Error("Không phát hiện được khuôn mặt trong ảnh");
      }

      console.log(`[FACE] Face detected (score: ${detection.detection.score.toFixed(4)})`);

      console.log("\n[FACE] Extracting descriptor...");
      const descriptorStart = Date.now();
      descriptor = Array.from(detection.descriptor);
      logDuration(descriptorStart, "  Descriptor extracted");

      if (!validDimensions.includes(descriptor.length)) {
        console.log(`[FACE] Invalid length: ${descriptor.length}`);
        throw new Error("Invalid face descriptor length");
      }

      console.log(`[FACE] Valid descriptor (${descriptor.length} dimensions)`);
    }

    const totalDuration = logDuration(overallStart, "\n[FACE] Extraction complete");
    console.log(`[FACE] Total time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`[FACE] Performance: ${totalDuration < 3000 ? '✅ EXCELLENT' : totalDuration < 5000 ? '⚠️ GOOD' : '❌ SLOW'}`);
    console.log("===============================================\n");

    return descriptor;

  } catch (error) {
    console.error("\n[FACE] Extraction error:", error.message);
    logDuration(overallStart, "  Failed after");
    console.log("===============================================\n");
    throw error;
  }
}

/**
 * Calculate Euclidean distance between two embeddings
 * @param {Array<number>} embedding1 
 * @param {Array<number>} embedding2 
 * @returns {number} Distance
 */
function euclideanDistance(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error(`Embedding dimension mismatch: ${embedding1.length} vs ${embedding2.length}`);
  }

  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Compare two face embeddings with auto-detect threshold
 * @param {Array<number>} embedding1 - First embedding
 * @param {Array<number>} embedding2 - Second embedding
 * @param {number} threshold - Distance threshold (null = auto-detect)
 * @returns {Object} Comparison result
 */
function compareFaces(embedding1, embedding2, threshold = null) {
  console.log("\n========== COMPARING FACES ==========");
  const start = Date.now();
  console.log(`[${new Date().toISOString()}]`);

  if (!embedding1 || embedding1.length === 0) {
    console.log("[FACE] Stored embedding not found");
    throw new Error('Stored embedding not found');
  }

  // ✅ Auto-detect threshold based on dimensions (SAME AS ORIGINAL)
  if (threshold === null) {
    const dim = embedding1.length;
    if (dim === 128) {
      threshold = 0.49; // ✅ Relaxed threshold for easier matching (was 0.48)
    } else if (dim === 512) {
      threshold = 0.6; // Large embedding
    } else {
      threshold = 0.5; // Default
    }
    console.log(`[FACE] Auto threshold: ${threshold} (dim=${dim})`);
  } else {
    console.log(`[FACE] Manual threshold: ${threshold}`);
  }

  const distance = euclideanDistance(embedding1, embedding2);
  const isSamePerson = distance < threshold;
  
  // Convert distance to confidence percentage (0-100)
  const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

  return {
    distance: distance.toFixed(4),
    isSamePerson,
    confidence,
    threshold
  };
}

/**
 * Check if models are loaded
 * @returns {boolean}
 */
function areModelsLoaded() {
  return modelsLoaded;
}

module.exports = {
  loadModels,
  extractFaceEmbedding,
  compareFaces,
  euclideanDistance,
  areModelsLoaded,
  validDimensions
};
