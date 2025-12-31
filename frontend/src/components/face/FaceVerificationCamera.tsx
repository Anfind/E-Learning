"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Camera, AlertCircle, Sparkles, Shield, CheckCircle, User, Activity, Eye, Zap } from "lucide-react"
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import * as faceapi from 'face-api.js'
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"

// Emotion mapping
const EMOTION_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  neutral: { label: 'Bình thường', emoji: '😐', color: '#6b7280' },   // gray
  happy: { label: 'Vui vẻ', emoji: '😊', color: '#22c55e' },         // green
  sad: { label: 'Buồn', emoji: '😢', color: '#3b82f6' },             // blue
  angry: { label: 'Tức giận', emoji: '😠', color: '#ef4444' },       // red
  fearful: { label: 'Sợ hãi', emoji: '😨', color: '#a855f7' },       // purple
  disgusted: { label: 'Ghê tởm', emoji: '🤢', color: '#ca8a04' },    // yellow
  surprised: { label: 'Ngạc nhiên', emoji: '😲', color: '#f97316' }, // orange
}

// Smoothing constants
const EMOTION_SMOOTHING_FACTOR = 0.3
const EMOTION_HISTORY_SIZE = 8

interface SmoothedExpressions {
  neutral: number
  happy: number
  sad: number
  angry: number
  fearful: number
  disgusted: number
  surprised: number
  [key: string]: number  // Add index signature for dynamic access
}

interface VerificationResult {
  success: boolean
  match: boolean
  confidence: number
  message?: string
  processingTime?: number
}

interface FaceVerificationCameraProps {
  onClose: () => void
  onSuccess?: (result: VerificationResult) => void
  onError?: (error: string) => void
  verificationPhase?: "before" | "after"
  expectedUserId?: string  // ✅ Add expectedUserId prop
}

interface FrameMetrics {
  confidence: number
  brightness: number
  contrast: number
  sharpness: number
  faceSize: number
  facePosition: "center" | "left" | "right" | "top" | "bottom" | "unknown"
  exposure: number
  overallQuality: number
}

export default function FaceVerificationCamera({
  onClose,
  onSuccess,
  onError,
  verificationPhase = "before",
  expectedUserId,  // ✅ Destructure expectedUserId
}: FaceVerificationCameraProps) {
  const { user } = useAuth()

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stableFramesRef = useRef<number>(0)
  const isCapturingRef = useRef<boolean>(false)
  
  // Emotion refs for smoothing
  const smoothedExpressionsRef = useRef<SmoothedExpressions>({
    neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
  })
  const expressionHistoryRef = useRef<SmoothedExpressions[]>([])
  const lastEmotionDetectionRef = useRef<number>(0) // Throttle emotion detection

  // State
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState("Chờ bật camera...")
  const [expressionModelsLoaded, setExpressionModelsLoaded] = useState(false)
  const [smoothedExpressions, setSmoothedExpressions] = useState<SmoothedExpressions | null>(null)
  const [dominantEmotion, setDominantEmotion] = useState<{ emotion: string; confidence: number } | null>(null)
  const [frameMetrics, setFrameMetrics] = useState<FrameMetrics>({
    confidence: 0,
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    faceSize: 0,
    facePosition: "unknown",
    exposure: 0,
    overallQuality: 0,
  })
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([])

  // Constants - Stricter for better quality
  const STABLE_FRAMES_REQUIRED = 100  // ✅ Increase from 80 to 100
  const CONFIDENCE_THRESHOLD = 0.65    // ✅ Increase from 0.6 to 0.65

  const BRIGHTNESS_OPTIMAL = { min: 100, max: 180 }
  const CONTRAST_OPTIMAL = { min: 50, max: 100 }
  const SHARPNESS_OPTIMAL = { min: 0.5, max: 1.0 }
  const FACE_SIZE_OPTIMAL = { min: 0.25, max: 0.7 }

  const QUALITY_THRESHOLD = 55  // ✅ Increase from 50 to 55

  // ============================================================
  // EMOTION SMOOTHING FUNCTIONS
  // ============================================================
  const smoothExpressions = useCallback((raw: Record<string, number>): SmoothedExpressions => {
    const emotions: (keyof SmoothedExpressions)[] = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']
    const prev = smoothedExpressionsRef.current
    
    const newSmoothed: SmoothedExpressions = {} as SmoothedExpressions
    emotions.forEach(emotion => {
      const rawValue = raw[emotion] || 0
      newSmoothed[emotion] = prev[emotion] * (1 - EMOTION_SMOOTHING_FACTOR) + rawValue * EMOTION_SMOOTHING_FACTOR
    })
    
    expressionHistoryRef.current.push(newSmoothed)
    if (expressionHistoryRef.current.length > EMOTION_HISTORY_SIZE) {
      expressionHistoryRef.current.shift()
    }
    
    const avgSmoothed: SmoothedExpressions = {} as SmoothedExpressions
    emotions.forEach(emotion => {
      const sum = expressionHistoryRef.current.reduce((acc, exp) => acc + exp[emotion], 0)
      avgSmoothed[emotion] = sum / expressionHistoryRef.current.length
    })
    
    smoothedExpressionsRef.current = avgSmoothed
    return avgSmoothed
  }, [])

  const getDominantEmotionFromSmoothed = useCallback((expressions: SmoothedExpressions): { emotion: string; confidence: number } => {
    const entries = Object.entries(expressions) as [string, number][]
    const sorted = entries.sort(([, a], [, b]) => b - a)
    const [topEmotion, topConfidence] = sorted[0]
    return { emotion: topEmotion, confidence: topConfidence }
  }, [])

  // ✅ Auto-start camera on mount
  useEffect(() => {
    setIsCameraActive(true)
    return () => {
      setIsCameraActive(false)
    }
  }, [])

  // ============================================================
  // AUTO CLOSE EFFECT
  // ============================================================
  useEffect(() => {
    if (isSuccess && verificationResult) {
      console.log("[EFFECT] Success detected, scheduling close...")
      const timeoutId = setTimeout(() => {
        console.log("[EFFECT] Closing modal...")
        onSuccess?.(verificationResult)
      }, 2500)

      return () => clearTimeout(timeoutId)
    }
  }, [isSuccess, verificationResult, onSuccess])

  // ============================================================
  // INITIALIZATION
  // ============================================================
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        )

        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          }
        )

        faceLandmarkerRef.current = landmarker
      } catch {
        setError("Không thể khởi tạo face detector")
      }
    }

    initFaceLandmarker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // ============================================================
  // FACE-API EXPRESSION MODELS
  // ============================================================
  useEffect(() => {
    const loadExpressionModels = async () => {
      try {
        console.log("[FACE-API] Loading expression models...")
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')  // ✅ REQUIRED for expressions!
        await faceapi.nets.faceExpressionNet.loadFromUri('/models')
        setExpressionModelsLoaded(true)
        console.log("[FACE-API] ✅ Expression models loaded!")
      } catch (err) {
        console.error("[FACE-API] Failed to load expression models:", err)
      }
    }
    loadExpressionModels()
  }, [])

  // ============================================================
  // EMOTION DETECTION - INDEPENDENT LOOP (không phụ thuộc MediaPipe)
  // ============================================================
  useEffect(() => {
    let emotionIntervalId: NodeJS.Timeout | null = null

    const runEmotionDetection = async () => {
      if (!expressionModelsLoaded || !videoRef.current || !isCameraActive) {
        return
      }

      const video = videoRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return
      }

      try {
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 416, 
          scoreThreshold: 0.4 
        })
        
        const detection = await faceapi
          .detectSingleFace(video, detectorOptions)
          .withFaceLandmarks()
          .withFaceExpressions()

        if (detection?.expressions) {
          const expressionsObj = { ...detection.expressions } as Record<string, number>
          const smoothed = smoothExpressions(expressionsObj)
          setSmoothedExpressions(smoothed)
          
          const dominant = getDominantEmotionFromSmoothed(smoothed)
          setDominantEmotion(dominant)
          console.log("[EMOTION] ✅ Detected:", dominant.emotion, dominant.confidence.toFixed(2))
        } else {
          console.log("[EMOTION] No face detected")
        }
      } catch (err) {
        console.error("[EMOTION] Detection error:", err)
      }
    }

    // Chạy emotion detection mỗi 500ms khi camera active và models loaded
    if (isCameraActive && expressionModelsLoaded) {
      console.log("[EMOTION] Starting emotion detection loop...")
      emotionIntervalId = setInterval(runEmotionDetection, 500)
    }

    return () => {
      if (emotionIntervalId) {
        clearInterval(emotionIntervalId)
        console.log("[EMOTION] Stopped emotion detection loop")
      }
    }
  }, [isCameraActive, expressionModelsLoaded, smoothExpressions, getDominantEmotionFromSmoothed])

  // ============================================================
  // CAMERA MANAGEMENT
  // ============================================================
  useEffect(() => {
    const startCamera = async () => {
      try {
        setError(null)
        setDetectionStatus("📷 Đang khởi động camera...")

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            setDetectionStatus("👤 Chờ phát hiện khuôn mặt...")
            processVideoFrames()
          }
        }
      } catch {
        setError("Không thể truy cập camera")
        setIsCameraActive(false)
      }
    }

    const stopCamera = () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }

    if (isCameraActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive])

  // ============================================================
  // QUALITY ANALYSIS (Same as registration)
  // ============================================================
  const calculateBrightness = (data: Uint8ClampedArray): number => {
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      sum += avg
    }
    return Math.round(sum / (data.length / 4))
  }

  const calculateContrast = (data: Uint8ClampedArray, brightness: number): number => {
    let variance = 0
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      variance += Math.pow(avg - brightness, 2)
    }
    const standardDeviation = Math.sqrt(variance / (data.length / 4))
    return Math.min(100, (standardDeviation / 128) * 100)
  }

  const calculateSharpness = (canvas: HTMLCanvasElement): number => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || canvas.width === 0 || canvas.height === 0) {
      return 0
    }

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let mean = 0
      let count = 0

      for (let i = 0; i < data.length; i += 4) {
        mean += data[i]
        count++
      }
      mean /= count

      let variance = 0

      for (let i = 0; i < data.length; i += 4) {
        const diff = data[i] - mean
        variance += diff * diff
      }
      variance /= count

      const laplacianVariance = Math.sqrt(variance)

      let score = 0
      if (laplacianVariance < 100) {
        score = 0
      } else if (laplacianVariance < 500) {
        score = (laplacianVariance - 100) / 400
      } else {
        score = 1
      }

      return Math.min(1, Math.max(0, score))
    } catch {
      return 0
    }
  }

  const calculateFaceSize = (landmarks: Array<{ x: number; y: number }>, canvasWidth: number, canvasHeight: number): number => {
    if (!landmarks || landmarks.length === 0) return 0

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    })

    const faceArea = (maxX - minX) * (maxY - minY) * canvasWidth * canvasHeight
    const frameArea = canvasWidth * canvasHeight

    return (faceArea / frameArea) * 100
  }

  const calculateFacePosition = (landmarks: Array<{ x: number; y: number }>): "center" | "left" | "right" | "top" | "bottom" | "unknown" => {
    if (!landmarks || landmarks.length === 0) return "unknown"

    let avgX = 0,
      avgY = 0
    landmarks.forEach((point) => {
      avgX += point.x
      avgY += point.y
    })
    avgX /= landmarks.length
    avgY /= landmarks.length

    const deviationX = avgX - 0.5
    const deviationY = avgY - 0.5

    if (Math.abs(deviationX) >= Math.abs(deviationY)) {
      return deviationX > 0 ? "right" : "left"
    }
    return deviationY > 0 ? "bottom" : "top"
  }

  const calculateExposure = (brightness: number, contrast: number): number => {
    const brightnessDiff = Math.abs(brightness - 128) / 128
    const exposureScore = 1 - brightnessDiff
    const contrastFactor = Math.min(1, contrast / 30)
    return (exposureScore + contrastFactor) / 2
  }

  const calculateOverallQuality = (metrics: Partial<FrameMetrics>): number => {
    const weights = {
      brightness: 0.1,
      contrast: 0.1,
      sharpness: 0.15,
      faceSize: 0.15,
      exposure: 0.1,
      confidence: 0.4,
    }

    const center = (BRIGHTNESS_OPTIMAL.min + BRIGHTNESS_OPTIMAL.max) / 2
    const brightnessScore = metrics.brightness
      ? Math.max(0, 100 - Math.abs(metrics.brightness - center))
      : 0

    const faceSizeCenter = (FACE_SIZE_OPTIMAL.min + FACE_SIZE_OPTIMAL.max) / 2
    const faceSizeScore = metrics.faceSize
      ? Math.max(0, 100 - Math.abs((metrics.faceSize / 100) - faceSizeCenter) * 100)
      : 0

    return (
      brightnessScore * weights.brightness +
      (metrics.contrast ?? 0) * weights.contrast +
      ((metrics.sharpness ?? 0) * 100) * weights.sharpness +
      faceSizeScore * weights.faceSize +
      ((metrics.exposure ?? 0) * 100) * weights.exposure +
      ((metrics.confidence ?? 0) * 100) * weights.confidence
    )
  }

  const generateWarnings = (metrics: FrameMetrics): string[] => {
    const warnings: string[] = []

    if (metrics.brightness < BRIGHTNESS_OPTIMAL.min - 20) {
      warnings.push("💡 Quá tối")
    } else if (metrics.brightness > BRIGHTNESS_OPTIMAL.max + 20) {
      warnings.push("☀️ Quá sáng")
    }

    if (metrics.contrast < CONTRAST_OPTIMAL.min - 5) {
      warnings.push("⚖️ Tương phản thấp")
    }

    if (metrics.sharpness < SHARPNESS_OPTIMAL.min) {
      warnings.push("🔍 Ảnh mờ")
    }

    if (metrics.faceSize < FACE_SIZE_OPTIMAL.min * 100 - 2) {
      warnings.push("📏 Quá nhỏ")
    }

    return warnings
  }

  const drawFaceBox = (canvas: HTMLCanvasElement, landmarks: Array<{ x: number; y: number }>, confidence: number, isQualityGood: boolean) => {
    const ctx = canvas.getContext("2d")
    if (!ctx || !landmarks || landmarks.length === 0) return

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    })

    const width = maxX - minX
    const height = maxY - minY
    const padding = Math.min(width, height) * 0.1

    const x = minX - padding
    const y = minY - padding
    const w = width + padding * 2
    const h = height + padding * 2

    const boxColor = isQualityGood ? "#00ff00" : confidence > 0.5 ? "#ffff00" : "#ff6600"
    ctx.strokeStyle = boxColor
    ctx.lineWidth = 3
    ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height)

    const cornerSize = 15
    ctx.fillStyle = boxColor
    const corners = [
      [x * canvas.width, y * canvas.height],
      [(x + w) * canvas.width, y * canvas.height],
      [x * canvas.width, (y + h) * canvas.height],
      [(x + w) * canvas.width, (y + h) * canvas.height],
    ]

    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - cornerSize / 2, cy - cornerSize / 2, cornerSize, cornerSize)
    })

    const keyLandmarks = [33, 133, 61, 291, 199]
    ctx.fillStyle = "#00ff00"
    ctx.globalAlpha = 0.7

    keyLandmarks.forEach((idx) => {
      if (landmarks[idx]) {
        const lm = landmarks[idx]
        ctx.beginPath()
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    ctx.globalAlpha = 1.0
    ctx.fillStyle = boxColor
    ctx.font = "bold 12px Arial"
    ctx.fillText(`${(confidence * 100).toFixed(0)}%`, x * canvas.width + 5, y * canvas.height - 5)
  }

  // ============================================================
  // VIDEO PROCESSING
  // ============================================================
  const processVideoFrames = async () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || !faceLandmarkerRef.current || capturedImage || isCapturingRef.current) {
      if (!capturedImage && isCameraActive) {
        animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
      }
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    overlayCanvas.width = video.videoWidth
    overlayCanvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    const overlayCtx = overlayCanvas.getContext("2d")

    if (!ctx || !overlayCtx) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
      return
    }

    ctx.drawImage(video, 0, 0)

    try {
      const results = faceLandmarkerRef.current.detectForVideo(video, performance.now())

      const hasFace = results.faceLandmarks?.length === 1
      const hasMultipleFaces = (results.faceLandmarks?.length ?? 0) > 1

      // NOTE: Emotion detection moved to separate useEffect (runs independently)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixelData = imageData.data

      const brightness = calculateBrightness(pixelData)
      const contrast = calculateContrast(pixelData, brightness)
      const sharpness = calculateSharpness(canvas)
      const exposure = calculateExposure(brightness, contrast)

      let faceSize = 0
      let confidence = 0

      if (hasFace) {
        const landmarks = results.faceLandmarks[0]
        faceSize = calculateFaceSize(landmarks, canvas.width, canvas.height)
        confidence = (results.faceBlendshapes?.[0]?.categories[0]?.score ?? 0.7) > CONFIDENCE_THRESHOLD ? 0.9 : 0.5
      }

      const newMetrics: FrameMetrics = {
        confidence,
        brightness,
        contrast,
        sharpness,
        faceSize,
        facePosition: hasFace ? calculateFacePosition(results.faceLandmarks[0]) : "unknown",
        exposure,
        overallQuality: 0,
      }

      newMetrics.overallQuality = calculateOverallQuality(newMetrics)
      const warnings = generateWarnings(newMetrics)

      setFrameMetrics(newMetrics)
      setQualityWarnings(warnings)

      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

      if (hasMultipleFaces) {
        setDetectionStatus("⚠️ Nhiều khuôn mặt")
        stableFramesRef.current = 0
      } else if (!hasFace) {
        setDetectionStatus("👤 Không thấy khuôn mặt")
        stableFramesRef.current = 0
      } else {
        const landmarks = results.faceLandmarks[0]
        const isQualityGood = newMetrics.overallQuality > QUALITY_THRESHOLD && confidence > CONFIDENCE_THRESHOLD - 0.1

        drawFaceBox(overlayCanvas, landmarks, confidence, isQualityGood)

        if (isQualityGood) {
          stableFramesRef.current++
          const progress = Math.min(100, (stableFramesRef.current / STABLE_FRAMES_REQUIRED) * 100)
          setDetectionStatus(`✓ ${Math.round(progress)}%`)

          if (stableFramesRef.current >= STABLE_FRAMES_REQUIRED) {
            // ✅ Pass landmarks to help backend detect face
            await autoCapture(canvas, landmarks)
            return
          }
        } else {
          stableFramesRef.current = 0
          setDetectionStatus(`📊 ${Math.round(newMetrics.overallQuality)}%`)
        }
      }
    } catch {
      // Silent fail
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
  }

  // ============================================================
  // AUTO CAPTURE - VERIFY API
  // ============================================================
  const autoCapture = async (canvas: HTMLCanvasElement, landmarks?: Array<{ x: number; y: number }>) => {
    if (isCapturingRef.current) return

    isCapturingRef.current = true
    setDetectionStatus("📸 Xác thực...")

    // ✅ Crop to face region if landmarks provided
    let finalCanvas = canvas
    if (landmarks && landmarks.length > 0) {
      // Calculate bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      landmarks.forEach((point) => {
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      })

      // Add padding
      const width = maxX - minX
      const height = maxY - minY
      const padding = Math.max(width, height) * 0.3  // 30% padding

      const x = Math.max(0, minX - padding)
      const y = Math.max(0, minY - padding)
      const w = Math.min(1 - x, width + padding * 2)
      const h = Math.min(1 - y, height + padding * 2)

      // Create cropped canvas
      const croppedCanvas = document.createElement('canvas')
      const cropW = w * canvas.width
      const cropH = h * canvas.height
      croppedCanvas.width = cropW
      croppedCanvas.height = cropH

      const cropCtx = croppedCanvas.getContext('2d')
      if (cropCtx) {
        cropCtx.drawImage(
          canvas,
          x * canvas.width, y * canvas.height, cropW, cropH,
          0, 0, cropW, cropH
        )
        finalCanvas = croppedCanvas
      }
    }

    const imageData = finalCanvas.toDataURL("image/jpeg", 0.95)
    setCapturedImage(imageData)

    finalCanvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], "face.jpg", { type: "image/jpeg" })
          setAttemptCount((prev) => prev + 1)
          setLoading(true)

          try {
            console.log(`[AUTO CAPTURE] Verifying ${verificationPhase} for user:`, user?.email)
            console.log(`[AUTO CAPTURE] Expected userId:`, expectedUserId)
            
            const formData = new FormData()
            formData.append('image', file)
            
            // ✅ Add expectedUserId if provided (for testing different users)
            if (expectedUserId) {
              formData.append('userId', expectedUserId)
            }

            const response = await api.postForm('/face/verify', formData)

            console.log("[AUTO CAPTURE] ✅ Verification success:", response)
            setVerificationResult(response as VerificationResult)
            setIsSuccess(true)
            setError(null)
            setDetectionStatus("✅ Xác thực thành công!")
            
            // ✅ Call onSuccess callback with result
            if (onSuccess) {
              onSuccess(response as VerificationResult)
            }
          } catch (error: unknown) {
            console.error("[AUTO CAPTURE] ❌ Verification failed:", error)
            const err = error as { response?: { data?: { error?: string; message?: string } } }
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Xác thực thất bại. Vui lòng thử lại."
            setError(errorMsg)
            setDetectionStatus("❌ Thất bại")
            setCapturedImage(null)
            
            // ✅ Call onError callback
            if (onError) {
              onError(errorMsg)
            }
            stableFramesRef.current = 0
            isCapturingRef.current = false

            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
            }
            animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
          } finally {
            setLoading(false)
          }
        }
      },
      "image/jpeg",
      0.95
    )
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setVerificationResult(null)
    setError(null)
    setIsSuccess(false)
    stableFramesRef.current = 0
    isCapturingRef.current = false
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Card className="border-0 shadow-2xl w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-slate-800 dark:text-slate-100">Xác thực khuôn mặt</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              {verificationPhase === "before" ? "📚 Trước khi bắt đầu bài học" : "⏳ Sau 2/3 bài học"}
            </p>
          </div>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-100 hover:text-red-600 transition-colors">
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== VIDEO SECTION ===== */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden relative aspect-video shadow-xl ring-1 ring-white/10">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full" />

                  {/* Top Overlay */}
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex justify-between items-start">
                      {/* Live Badge */}
                      <Badge variant="outline" className="bg-red-500/90 text-white border-0 text-xs px-2 py-1 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></div>
                        LIVE
                      </Badge>

                      {/* Quality Score */}
                      {frameMetrics.overallQuality > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`border-0 text-white text-xs px-2 py-1 ${
                            frameMetrics.overallQuality >= 70 
                              ? 'bg-green-500/90' 
                              : frameMetrics.overallQuality >= 50 
                                ? 'bg-yellow-500/90' 
                                : 'bg-red-500/90'
                          }`}
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          {frameMetrics.overallQuality.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Warning Badge */}
                  {qualityWarnings.length > 0 && (
                    <div className="absolute top-12 left-3 right-3">
                      <Badge variant="outline" className="bg-orange-500/90 text-white border-0 text-xs w-full justify-center py-1">
                        ⚠️ {qualityWarnings[0]}
                      </Badge>
                    </div>
                  )}

                  {/* Bottom Status */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center justify-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`border-0 text-white text-sm px-4 py-2 ${
                          detectionStatus.includes('✓') 
                            ? 'bg-green-500/90' 
                            : detectionStatus.includes('⚠️') 
                              ? 'bg-yellow-500/90' 
                              : 'bg-slate-700/90'
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {detectionStatus}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setIsCameraActive(!isCameraActive)}
                variant={isCameraActive ? "destructive" : "default"}
                className="flex-1 text-sm h-10 font-medium shadow-md"
              >
                {isCameraActive ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Tắt camera
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Bật camera
                  </>
                )}
              </Button>
              {capturedImage && (
                <Button onClick={handleRetake} variant="outline" className="flex-1 text-sm h-10 font-medium">
                  🔄 Chụp lại
                </Button>
              )}
            </div>

            {attemptCount > 0 && (
              <p className="text-xs text-muted-foreground text-center bg-slate-100 dark:bg-slate-800 rounded-lg py-1.5">
                Lần thử: <span className="font-semibold">{attemptCount}</span>
              </p>
            )}
          </div>

          {/* ===== SIDE PANEL ===== */}
          <div className="space-y-3">
            {/* Success Card */}
            {isSuccess && verificationResult && (
              <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">Thành công!</p>
                      <p className="text-xs text-green-100 truncate">{user?.name || user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Card */}
            {error && (
              <Card className="border-0 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading Card */}
            {loading && (
              <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <p className="text-sm font-medium">Đang xác thực...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DEBUG: Expression Status Card */}
            {isCameraActive && (
              <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <CardContent className="p-3">
                  <p className="text-xs font-bold mb-2">🐛 DEBUG INFO</p>
                  <div className="text-xs space-y-1">
                    <p>Models: {expressionModelsLoaded ? '✅ Loaded' : '❌ Not loaded'}</p>
                    <p>Smoothed: {smoothedExpressions ? '✅ Yes' : '❌ No'}</p>
                    <p>Dominant: {dominantEmotion ? `✅ ${dominantEmotion.emotion}` : '❌ No'}</p>
                    <p>Camera: {isCameraActive ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dominant Emotion Card - ALWAYS SHOW when camera active and models loaded */}
            {isCameraActive && expressionModelsLoaded && (
              <Card 
                className="border-0 shadow-lg overflow-hidden transition-all duration-300"
                style={{ 
                  background: dominantEmotion 
                    ? `linear-gradient(135deg, ${EMOTION_MAP[dominantEmotion.emotion]?.color || '#64748b'}dd, ${EMOTION_MAP[dominantEmotion.emotion]?.color || '#64748b'}99)`
                    : 'linear-gradient(135deg, #64748bdd, #64748b99)'
                }}
              >
                <CardContent className="p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {dominantEmotion ? (EMOTION_MAP[dominantEmotion.emotion]?.emoji || '😐') : '⏳'}
                    </div>
                    <div>
                      <p className="text-xs text-white/80 uppercase tracking-wider font-medium">Cảm xúc</p>
                      <p className="text-lg font-bold">
                        {dominantEmotion ? (EMOTION_MAP[dominantEmotion.emotion]?.label || dominantEmotion.emotion) : 'Đang phát hiện...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emotion Bars - ALWAYS SHOW when camera active and models loaded */}
            {isCameraActive && expressionModelsLoaded && (
              <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Phân tích cảm xúc
                    {!smoothedExpressions && <span className="text-xs font-normal text-muted-foreground">(Đang tải...)</span>}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(EMOTION_MAP).map(([key, { label, emoji, color }]) => {
                      const value = smoothedExpressions ? ((smoothedExpressions as Record<string, number>)[key] || 0) : 0
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <span>{emoji}</span>
                              <span>{label}</span>
                            </span>
                            <span className="font-mono font-medium" style={{ color }}>
                              {(value * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={value * 100} 
                            className="h-1.5 bg-slate-200 dark:bg-slate-700"
                            indicatorColor={color}
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quality Metrics Card */}
            {isCameraActive && frameMetrics.confidence > 0 && (
              <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Chất lượng hình ảnh
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Độ sáng</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{frameMetrics.brightness}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Tương phản</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{frameMetrics.contrast.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Sắc nét</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{(frameMetrics.sharpness * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Kích thước</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{frameMetrics.faceSize.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                  <Zap className="w-4 h-4" />
                  Mẹo xác thực
                </div>
                <ul className="text-xs space-y-1 text-amber-600 dark:text-amber-400">
                  <li>✓ Nhìn thẳng vào camera</li>
                  <li>✓ Ánh sáng đều, tự nhiên</li>
                  <li>✓ Khoảng cách 30-50cm</li>
                  <li>✓ Chất lượng ≥ 50%</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Info */}
            {user && (
              <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                      <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                      <p className="text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
