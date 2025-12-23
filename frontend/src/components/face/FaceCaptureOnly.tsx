'use client';

import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';

interface FaceCaptureOnlyProps {
  onClose: () => void;
  onCapture: (file: File) => void; // Chỉ trả về File, không upload
}

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

interface FrameMetrics {
  confidence: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  faceSize: number;
  facePosition: string;
  exposure: number;
  overallQuality: number;
}

const STABLE_FRAMES_REQUIRED = 80;
const CONFIDENCE_THRESHOLD = 0.6;
const QUALITY_THRESHOLD = 50;

const BRIGHTNESS_OPTIMAL = { min: 100, max: 180 };
const CONTRAST_OPTIMAL = { min: 50, max: 100 };
const SHARPNESS_OPTIMAL = { min: 0.5, max: 1.0 };
const FACE_SIZE_OPTIMAL = { min: 0.25, max: 0.7 };

export default function FaceCaptureOnly({ onClose, onCapture }: FaceCaptureOnlyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stableFramesRef = useRef<number>(0);

  const [isInitializing, setIsInitializing] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState<string>('🔄 Đang khởi động...');
  const [frameMetrics, setFrameMetrics] = useState<FrameMetrics>({
    confidence: 0,
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    faceSize: 0,
    facePosition: 'unknown',
    exposure: 0,
    overallQuality: 0,
  });
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);

  const initializeCamera = async () => {
    try {
      setIsInitializing(true);
      setDetectionStatus('📹 Đang mở camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setDetectionStatus('🤖 Đang tải AI model...');
      await initializeFaceLandmarker();

      setDetectionStatus('✓ Sẵn sàng');
      setIsInitializing(false);

      processVideoFrames();
    } catch (error) {
      console.error('[CAMERA] Error:', error);
      setDetectionStatus('❌ Lỗi camera');
      setIsInitializing(false);
    }
  };

  const initializeFaceLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch (error) {
      console.error('[MEDIAPIPE] Error:', error);
      throw error;
    }
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateBrightness = (pixelData: Uint8ClampedArray): number => {
    let sum = 0;
    for (let i = 0; i < pixelData.length; i += 4) {
      sum += 0.299 * pixelData[i] + 0.587 * pixelData[i + 1] + 0.114 * pixelData[i + 2];
    }
    return sum / (pixelData.length / 4);
  };

  const calculateContrast = (pixelData: Uint8ClampedArray, brightness: number): number => {
    let variance = 0;
    for (let i = 0; i < pixelData.length; i += 4) {
      const gray = 0.299 * pixelData[i] + 0.587 * pixelData[i + 1] + 0.114 * pixelData[i + 2];
      variance += Math.pow(gray - brightness, 2);
    }
    return Math.sqrt(variance / (pixelData.length / 4));
  };

  const calculateSharpness = (canvas: HTMLCanvasElement): number => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let sharpness = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (i + 4 < data.length) {
        const diff = Math.abs(data[i] - data[i + 4]);
        sharpness += diff;
      }
    }

    return Math.min(1, sharpness / (data.length / 4) / 50);
  };

  const calculateFaceSize = (landmarks: Landmark[], canvasWidth: number, canvasHeight: number): number => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    const faceWidth = (maxX - minX) * canvasWidth;
    const faceHeight = (maxY - minY) * canvasHeight;
    const faceArea = faceWidth * faceHeight;
    const canvasArea = canvasWidth * canvasHeight;

    return (faceArea / canvasArea) * 100;
  };

  const calculateFacePosition = (landmarks: Landmark[]): string => {
    const centerX = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
    const centerY = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;

    if (centerX < 0.4) return 'left';
    if (centerX > 0.6) return 'right';
    if (centerY < 0.4) return 'top';
    if (centerY > 0.6) return 'bottom';
    return 'center';
  };

  const calculateExposure = (brightness: number, contrast: number): number => {
    const brightnessDiff = Math.abs(brightness - (BRIGHTNESS_OPTIMAL.min + BRIGHTNESS_OPTIMAL.max) / 2) / 100;
    const exposureScore = 1 - brightnessDiff;
    const contrastFactor = Math.min(1, contrast / 30);
    return (exposureScore + contrastFactor) / 2;
  };

  const calculateOverallQuality = (metrics: Partial<FrameMetrics>): number => {
    const weights = {
      brightness: 0.1,
      contrast: 0.1,
      sharpness: 0.15,
      faceSize: 0.15,
      exposure: 0.1,
      confidence: 0.4,
    };

    const center = (BRIGHTNESS_OPTIMAL.min + BRIGHTNESS_OPTIMAL.max) / 2;
    const brightnessScore = metrics.brightness
      ? Math.max(0, 100 - Math.abs(metrics.brightness - center))
      : 0;

    const faceSizeCenter = (FACE_SIZE_OPTIMAL.min + FACE_SIZE_OPTIMAL.max) / 2;
    const faceSizeScore = metrics.faceSize
      ? Math.max(0, 100 - Math.abs((metrics.faceSize / 100) - faceSizeCenter) * 100)
      : 0;

    return (
      brightnessScore * weights.brightness +
      (metrics.contrast ?? 0) * weights.contrast +
      ((metrics.sharpness ?? 0) * 100) * weights.sharpness +
      faceSizeScore * weights.faceSize +
      ((metrics.exposure ?? 0) * 100) * weights.exposure +
      ((metrics.confidence ?? 0) * 100) * weights.confidence
    );
  };

  const generateWarnings = (metrics: FrameMetrics): string[] => {
    const warnings: string[] = [];

    if (metrics.brightness < BRIGHTNESS_OPTIMAL.min - 20) {
      warnings.push('💡 Quá tối');
    } else if (metrics.brightness > BRIGHTNESS_OPTIMAL.max + 20) {
      warnings.push('☀️ Quá sáng');
    }

    if (metrics.contrast < CONTRAST_OPTIMAL.min - 5) {
      warnings.push('⚖️ Tương phản thấp');
    }

    if (metrics.sharpness < SHARPNESS_OPTIMAL.min) {
      warnings.push('🔍 Ảnh mờ');
    }

    if (metrics.faceSize < FACE_SIZE_OPTIMAL.min * 100 - 2) {
      warnings.push('📏 Quá nhỏ');
    }

    return warnings;
  };

  const drawFaceBox = (canvas: HTMLCanvasElement, landmarks: Landmark[], confidence: number, isQualityGood: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !landmarks || landmarks.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    const x = minX * canvas.width;
    const y = minY * canvas.height;
    const width = (maxX - minX) * canvas.width;
    const height = (maxY - minY) * canvas.height;

    const padding = 20;
    ctx.strokeStyle = isQualityGood ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);

    ctx.fillStyle = isQualityGood ? '#22c55e' : '#ef4444';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      `${(confidence * 100).toFixed(0)}%`,
      x - padding,
      y - padding - 5
    );
  };

  const autoCapture = async (canvas: HTMLCanvasElement) => {
    try {
      setDetectionStatus('📸 Đang chụp...');
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.95
        );
      });

      const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
      
      setDetectionStatus('✓ Chụp thành công!');
      onCapture(file); // Trả file về parent
      
    } catch (error) {
      console.error('[CAPTURE] Error:', error);
      setDetectionStatus('❌ Lỗi chụp ảnh');
    }
  };

  const processVideoFrames = async () => {
    if (!faceLandmarkerRef.current || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number;
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number;
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    if (!ctx || !overlayCtx) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number;
      return;
    }

    ctx.drawImage(video, 0, 0);

    try {
      const timestamp = Date.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, timestamp);

      const hasFace = results.faceLandmarks?.length === 1;
      const hasMultipleFaces = (results.faceLandmarks?.length ?? 0) > 1;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixelData = imageData.data;

      const brightness = calculateBrightness(pixelData);
      const contrast = calculateContrast(pixelData, brightness);
      const sharpness = calculateSharpness(canvas);
      const exposure = calculateExposure(brightness, contrast);

      let faceSize = 0;
      let confidence = 0;

      if (hasFace) {
        const landmarks = results.faceLandmarks[0];
        faceSize = calculateFaceSize(landmarks, canvas.width, canvas.height);
        confidence = (results.faceBlendshapes?.[0]?.categories[0]?.score ?? 0.7) > CONFIDENCE_THRESHOLD ? 0.9 : 0.5;
      }

      const newMetrics: FrameMetrics = {
        confidence,
        brightness,
        contrast,
        sharpness,
        faceSize,
        facePosition: hasFace ? calculateFacePosition(results.faceLandmarks[0]) : 'unknown',
        exposure,
        overallQuality: 0,
      };

      newMetrics.overallQuality = calculateOverallQuality(newMetrics);
      const warnings = generateWarnings(newMetrics);

      setFrameMetrics(newMetrics);
      setQualityWarnings(warnings);

      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      if (hasMultipleFaces) {
        setDetectionStatus('⚠️ Nhiều khuôn mặt');
        stableFramesRef.current = 0;
      } else if (!hasFace) {
        setDetectionStatus('👤 Không thấy khuôn mặt');
        stableFramesRef.current = 0;
      } else {
        const landmarks = results.faceLandmarks[0];
        const isQualityGood = newMetrics.overallQuality > QUALITY_THRESHOLD && confidence > CONFIDENCE_THRESHOLD - 0.1;

        drawFaceBox(overlayCanvas, landmarks, confidence, isQualityGood);

        if (isQualityGood) {
          stableFramesRef.current++;
          const progress = Math.min(100, (stableFramesRef.current / STABLE_FRAMES_REQUIRED) * 100);
          setDetectionStatus(`✓ ${Math.round(progress)}%`);

          if (stableFramesRef.current >= STABLE_FRAMES_REQUIRED) {
            await autoCapture(canvas);
            return;
          }
        } else {
          stableFramesRef.current = 0;
          setDetectionStatus(`📊 ${Math.round(newMetrics.overallQuality)}%`);
        }
      }
    } catch (error) {
      console.error('[DETECTION] Error:', error);
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrames) as number;
  };

  const progress = Math.min(100, (stableFramesRef.current / STABLE_FRAMES_REQUIRED) * 100);
  const isQualityGood = frameMetrics.overallQuality > QUALITY_THRESHOLD;

  return (
    <div className="relative w-full h-full bg-black">
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70 text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row h-full">
        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black p-4">
          <div className="relative max-w-4xl w-full aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none"
            />

            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg">{detectionStatus}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full lg:w-96 bg-background p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">📸 Chụp khuôn mặt</h2>
              <p className="text-sm text-muted-foreground">
                Giữ mặt trong khung hình để tự động chụp
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tiến độ</span>
                      <Badge variant={isQualityGood ? 'default' : 'secondary'}>
                        {stableFramesRef.current}/{STABLE_FRAMES_REQUIRED}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Trạng thái</span>
                    <Badge variant={isQualityGood ? 'default' : 'secondary'}>
                      {detectionStatus}
                    </Badge>
                  </div>

                  {qualityWarnings.length > 0 && (
                    <div className="space-y-1">
                      {qualityWarnings.map((warning, index) => (
                        <div key={index} className="text-sm text-orange-600 dark:text-orange-400">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">💡 Hướng dẫn</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Giữ mặt trong khung hình</li>
                  <li>✓ Đảm bảo ánh sáng đủ</li>
                  <li>✓ Không đeo khẩu trang</li>
                  <li>✓ Đợi 80 frames tự động chụp</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
