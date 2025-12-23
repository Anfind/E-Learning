"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"

interface FaceRegistrationCameraProps {
  onClose: () => void
  onSuccess?: () => void
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

interface Landmark {
  x: number
  y: number
  z?: number
}

export default function FaceRegistrationCamera({ onClose, onSuccess }: FaceRegistrationCameraProps) {
  const { user } = useAuth()

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stableFramesRef = useRef<number>(0)
  const isCapturingRef = useRef<boolean>(false)

  // State
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [registrationResult, setRegistrationResult] = useState<{
    success?: boolean;
    message?: string;
    faceEmbedding?: number[];
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState("Chờ bật camera...")
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

  // Constants (same as original)
  const STABLE_FRAMES_REQUIRED = 80
  const CONFIDENCE_THRESHOLD = 0.6

  // Optimal ranges
  const BRIGHTNESS_OPTIMAL = { min: 100, max: 180 }
  const CONTRAST_OPTIMAL = { min: 50, max: 100 }
  const SHARPNESS_OPTIMAL = { min: 0.5, max: 1.0 }
  const FACE_SIZE_OPTIMAL = { min: 0.25, max: 0.7 }

  const QUALITY_THRESHOLD = 50

  // ============================================================
  // AUTO CLOSE EFFECT
  // ============================================================
  useEffect(() => {
    if (isSuccess && registrationResult) {
      console.log("[EFFECT] Success detected, scheduling close...")
      const timeoutId = setTimeout(() => {
        console.log("[EFFECT] Closing modal...")
        onSuccess?.()
      }, 2500)

      return () => clearTimeout(timeoutId)
    }
  }, [isSuccess, registrationResult, onSuccess])

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
      } catch (error) {
        console.error("[FACE DETECTOR] Error:", error)
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
  // CAMERA MANAGEMENT
  // ============================================================
  useEffect(() => {
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

  // ============================================================
  // QUALITY ANALYSIS (Same as original)
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

      console.log("[SHARPNESS] Variance:", laplacianVariance.toFixed(2), "Score:", (score * 100).toFixed(1) + "%")
      return Math.min(1, Math.max(0, score))
    } catch (error) {
      console.error("[SHARPNESS] Error:", error)
      return 0
    }
  }

  const calculateFaceSize = (landmarks: Landmark[], canvasWidth: number, canvasHeight: number): number => {
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

  const calculateFacePosition = (landmarks: Landmark[]): "center" | "left" | "right" | "top" | "bottom" | "unknown" => {
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

  const drawFaceBox = (canvas: HTMLCanvasElement, landmarks: Landmark[], confidence: number, isQualityGood: boolean) => {
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
            await autoCapture(canvas)
            return
          }
        } else {
          stableFramesRef.current = 0
          setDetectionStatus(`📊 ${Math.round(newMetrics.overallQuality)}%`)
        }
      }
    } catch (error) {
      console.error("[DETECTION] Error:", error)
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number
  }

  // ============================================================
  // AUTO CAPTURE - ADAPTED FOR V3 API
  // ============================================================
  const autoCapture = async (canvas: HTMLCanvasElement) => {
    if (isCapturingRef.current) return

    isCapturingRef.current = true
    setDetectionStatus("📸 Xử lý...")

    const imageData = canvas.toDataURL("image/jpeg", 0.95)
    setCapturedImage(imageData)

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], "face.jpg", { type: "image/jpeg" })
          setAttemptCount((prev) => prev + 1)
          setLoading(true)

          try {
            console.log("[AUTO CAPTURE] Sending to API for user:", user?.email)
            
            const formData = new FormData()
            formData.append('image', file)

            const response = await api.postForm('/auth/register-face', formData)

            console.log("[AUTO CAPTURE] ✅ Success:", response)
            setRegistrationResult(response as { success: boolean; message: string })
            setIsSuccess(true)
            setError(null)
            setDetectionStatus("✅ Thành công!")
          } catch (error: unknown) {
            console.error("[AUTO CAPTURE] ❌ Failed:", error)
            setError(error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại.")
            setDetectionStatus("❌ Thất bại")
            setCapturedImage(null)
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
    setRegistrationResult(null)
    setError(null)
    setIsSuccess(false)
    stableFramesRef.current = 0
    isCapturingRef.current = false
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Card className="border-2 border-blue-400 shadow-lg w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <CardTitle className="flex items-center gap-1.5 text-base font-bold">
          <Camera className="w-4 h-4" />
          {user?.name || user?.email}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-2 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* ===== VIDEO SECTION - COMPACT ===== */}
          <div className="lg:col-span-2 space-y-1.5">
            <div className="bg-black rounded-lg overflow-hidden relative aspect-video min-h-[240px] max-h-[280px] shadow-md border border-gray-600">
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

                  {/* Status - COMPACT */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2">
                    <div className="flex justify-between gap-1.5">
                      {qualityWarnings.length > 0 && (
                        <div className="bg-red-500/95 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-md">
                          {qualityWarnings[0]}
                        </div>
                      )}
                      {frameMetrics.overallQuality > 0 && (
                        <div className="ml-auto bg-black/90 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-md">
                          {frameMetrics.overallQuality.toFixed(0)}%
                        </div>
                      )}
                    </div>
                    <div className="text-center bg-black/90 text-white px-4 py-1.5 rounded-full text-sm font-bold w-fit mx-auto shadow-lg">
                      {detectionStatus}
                    </div>
                  </div>
                </>
              ) : (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex gap-1.5">
              <Button
                onClick={() => setIsCameraActive(!isCameraActive)}
                variant={isCameraActive ? "destructive" : "default"}
                className="flex-1 text-xs py-2 font-semibold"
                size="sm"
              >
                {isCameraActive ? "Tắt camera" : "Bật camera"}
              </Button>
              {capturedImage && (
                <Button onClick={handleRetake} variant="outline" className="flex-1 text-xs py-2 font-semibold" size="sm">
                  Chụp lại
                </Button>
              )}
            </div>

            {attemptCount > 0 && <p className="text-xs text-muted-foreground text-center font-medium">Lần thử: {attemptCount}</p>}
          </div>

          {/* ===== RESULT SECTION - COMPACT ===== */}
          <div className="space-y-1.5">
            {/* Success */}
            {isSuccess && registrationResult && (
              <div className="p-2 bg-green-50 border border-green-300 rounded-md space-y-1">
                <div className="flex items-start gap-1.5">
                  <div className="text-2xl">✅</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-green-900 truncate">Thành công</p>
                    <p className="text-xs text-green-700">{user?.name || user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-300 rounded-md flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="p-2 bg-blue-50 border border-blue-300 rounded-md flex items-center gap-1.5">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-blue-700 font-medium">Đang xử lý...</p>
              </div>
            )}

            {/* Metrics - COMPACT */}
            {isCameraActive && frameMetrics.confidence > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-300 rounded-md space-y-1">
                <p className="text-xs font-bold text-blue-900">📊 Thông số</p>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="font-medium">Độ sáng:</span>
                    <span className="font-semibold text-blue-700">{frameMetrics.brightness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tương phản:</span>
                    <span className="font-semibold text-blue-700">{frameMetrics.contrast.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sắc nét:</span>
                    <span className="font-semibold text-blue-700">{(frameMetrics.sharpness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Kích thước:</span>
                    <span className="font-semibold text-blue-700">{frameMetrics.faceSize.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tips - COMPACT */}
            <div className="p-2 bg-purple-50 border border-purple-300 rounded-md">
              <p className="text-xs font-bold text-purple-900 mb-1">💡 Hướng dẫn</p>
              <ul className="text-[10px] space-y-0.5 text-purple-700 font-medium">
                <li>✓ Mặt thẳng camera</li>
                <li>✓ Ánh sáng tốt</li>
                <li>✓ Cách 30-50cm</li>
                <li>✓ Chất lượng ≥ 50%</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
