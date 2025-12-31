'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CameraOff,
  Smile,
  AlertCircle,
  Zap,
  User,
  Activity,
  Brain,
  Sparkles,
  Eye,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Header from '@/components/layout/Header';

// Emotion mapping với tiếng Việt và icon
const EMOTION_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  neutral: { label: 'Bình thường', emoji: '😐', color: 'bg-gray-500' },
  happy: { label: 'Vui vẻ', emoji: '😊', color: 'bg-green-500' },
  sad: { label: 'Buồn', emoji: '😢', color: 'bg-blue-500' },
  angry: { label: 'Tức giận', emoji: '😠', color: 'bg-red-500' },
  fearful: { label: 'Sợ hãi', emoji: '😨', color: 'bg-purple-500' },
  disgusted: { label: 'Ghê tởm', emoji: '🤢', color: 'bg-yellow-600' },
  surprised: { label: 'Ngạc nhiên', emoji: '😲', color: 'bg-orange-500' },
};

// Mouth landmarks indices for 68-point model
const MOUTH_OUTER = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
const MOUTH_INNER = [60, 61, 62, 63, 64, 65, 66, 67];
const LEFT_EYE = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE = [42, 43, 44, 45, 46, 47];

interface FaceData {
  detection: faceapi.FaceDetection;
  landmarks?: faceapi.FaceLandmarks68;
  expressions?: faceapi.FaceExpressions;
  age?: number;
  gender?: string;
  genderProbability?: number;
}

interface MouthAnalysis {
  isOpen: boolean;
  openness: number; // 0-100%
  width: number;
  height: number;
}

interface EyeAnalysis {
  leftOpen: boolean;
  rightOpen: boolean;
  leftOpenness: number;
  rightOpenness: number;
  isBlinking: boolean;
}

// Smoothed emotion state for stability
interface SmoothedExpressions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

// Constants for better emotion detection
const EMOTION_SMOOTHING_FACTOR = 0.3; // Lower = smoother, Higher = more responsive
const MIN_CONFIDENCE_THRESHOLD = 0.1; // Minimum confidence to consider emotion
const EMOTION_HISTORY_SIZE = 10; // Number of frames to average

export default function FaceAITestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Refs for smoothing (to avoid re-renders)
  const smoothedExpressionsRef = useRef<SmoothedExpressions>({
    neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
  });
  const expressionHistoryRef = useRef<SmoothedExpressions[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Face data
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [mouthAnalysis, setMouthAnalysis] = useState<MouthAnalysis | null>(null);
  const [eyeAnalysis, setEyeAnalysis] = useState<EyeAnalysis | null>(null);
  const [smoothedExpressions, setSmoothedExpressions] = useState<SmoothedExpressions | null>(null);
  const [dominantEmotion, setDominantEmotion] = useState<{ emotion: string; confidence: number } | null>(null);
  const [fps, setFps] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);
  
  // History for charts (for future use)
  const [, setEmotionHistory] = useState<string[]>([]);
  const [, setMouthOpenHistory] = useState<boolean[]>([]);

  // Settings
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showExpressions, setShowExpressions] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState<'fast' | 'balanced' | 'accurate'>('balanced');

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const MODEL_URL = '/models';
        
        console.log('[FACE-AI] Loading models from:', MODEL_URL);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        
        console.log('[FACE-AI] ✅ All models loaded successfully');
        setModelsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('[FACE-AI] ❌ Failed to load models:', err);
        setError('Không thể tải models. Vui lòng kiểm tra thư mục public/models');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  // Smooth expressions using exponential moving average + history
  const smoothExpressions = useCallback((raw: faceapi.FaceExpressions): SmoothedExpressions => {
    const emotions: (keyof SmoothedExpressions)[] = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
    const prev = smoothedExpressionsRef.current;
    
    // Create new smoothed values using EMA
    const newSmoothed: SmoothedExpressions = {} as SmoothedExpressions;
    emotions.forEach(emotion => {
      const rawValue = raw[emotion] || 0;
      // Apply exponential moving average
      newSmoothed[emotion] = prev[emotion] * (1 - EMOTION_SMOOTHING_FACTOR) + rawValue * EMOTION_SMOOTHING_FACTOR;
    });
    
    // Add to history for additional averaging
    expressionHistoryRef.current.push(newSmoothed);
    if (expressionHistoryRef.current.length > EMOTION_HISTORY_SIZE) {
      expressionHistoryRef.current.shift();
    }
    
    // Calculate average from history
    const avgSmoothed: SmoothedExpressions = {} as SmoothedExpressions;
    emotions.forEach(emotion => {
      const sum = expressionHistoryRef.current.reduce((acc, exp) => acc + exp[emotion], 0);
      avgSmoothed[emotion] = sum / expressionHistoryRef.current.length;
    });
    
    smoothedExpressionsRef.current = avgSmoothed;
    return avgSmoothed;
  }, []);

  // Get dominant emotion with confidence
  const getDominantEmotion = useCallback((expressions: SmoothedExpressions): { emotion: string; confidence: number } => {
    const entries = Object.entries(expressions) as [string, number][];
    const sorted = entries.sort(([, a], [, b]) => b - a);
    
    // Check if dominant emotion is confident enough
    const [topEmotion, topConfidence] = sorted[0];
    const [, secondConfidence] = sorted[1] || ['', 0];
    
    // Only report if the top emotion is significantly higher than the second
    // This reduces flickering between similar emotions
    const confidenceGap = topConfidence - secondConfidence;
    
    if (topConfidence >= MIN_CONFIDENCE_THRESHOLD && confidenceGap > 0.05) {
      return { emotion: topEmotion, confidence: topConfidence };
    }
    
    // Default to neutral if no clear emotion
    return { emotion: 'neutral', confidence: expressions.neutral };
  }, []);

  // Get detector options based on quality setting
  const getDetectorOptions = useCallback(() => {
    switch (detectionQuality) {
      case 'fast':
        return new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      case 'accurate':
        return new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
      case 'balanced':
      default:
        return new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
    }
  }, [detectionQuality]);

  // Analyze mouth from landmarks
  const analyzeMouth = useCallback((landmarks: faceapi.FaceLandmarks68): MouthAnalysis => {
    const positions = landmarks.positions;
    
    // Get mouth points
    const topLip = positions[62]; // Top of inner upper lip
    const bottomLip = positions[66]; // Bottom of inner lower lip
    const leftCorner = positions[48]; // Left corner
    const rightCorner = positions[54]; // Right corner
    
    const height = Math.abs(bottomLip.y - topLip.y);
    const width = Math.abs(rightCorner.x - leftCorner.x);
    
    // Calculate openness ratio
    const openness = Math.min(100, (height / width) * 200);
    const isOpen = openness > 15;
    
    return { isOpen, openness, width, height };
  }, []);

  // Analyze eyes from landmarks
  const analyzeEyes = useCallback((landmarks: faceapi.FaceLandmarks68): EyeAnalysis => {
    const positions = landmarks.positions;
    
    // Left eye
    const leftTop = positions[37];
    const leftBottom = positions[41];
    const leftWidth = Math.abs(positions[39].x - positions[36].x);
    const leftHeight = Math.abs(leftBottom.y - leftTop.y);
    const leftOpenness = Math.min(100, (leftHeight / leftWidth) * 300);
    
    // Right eye
    const rightTop = positions[43];
    const rightBottom = positions[47];
    const rightWidth = Math.abs(positions[45].x - positions[42].x);
    const rightHeight = Math.abs(rightBottom.y - rightTop.y);
    const rightOpenness = Math.min(100, (rightHeight / rightWidth) * 300);
    
    const leftOpen = leftOpenness > 20;
    const rightOpen = rightOpenness > 20;
    const isBlinking = !leftOpen || !rightOpen;
    
    return { leftOpen, rightOpen, leftOpenness, rightOpenness, isBlinking };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setError(null);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          startDetection();
        };
      }
    } catch (err) {
      console.error('[FACE-AI] Camera error:', err);
      setError('Không thể truy cập camera. Vui lòng cấp quyền.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsCameraOn(false);
    setFaceData(null);
    setMouthAnalysis(null);
    setEyeAnalysis(null);
  };

  // Main detection loop
  const startDetection = () => {
    let lastTime = performance.now();
    let frameCount = 0;

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !isCameraOn) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // Detect face with all features - use dynamic options based on quality
        const detection = await faceapi
          .detectSingleFace(video, getDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setDetectionCount(prev => prev + 1);
          
          // Store face data
          const newFaceData: FaceData = {
            detection: detection.detection,
            landmarks: detection.landmarks,
            expressions: detection.expressions,
            age: detection.age,
            gender: detection.gender,
            genderProbability: detection.genderProbability,
          };
          setFaceData(newFaceData);

          // Analyze mouth
          if (detection.landmarks) {
            const mouth = analyzeMouth(detection.landmarks);
            setMouthAnalysis(mouth);
            setMouthOpenHistory(prev => [...prev.slice(-50), mouth.isOpen]);
            
            const eyes = analyzeEyes(detection.landmarks);
            setEyeAnalysis(eyes);
          }

          // Apply emotion smoothing for stable detection
          if (detection.expressions) {
            const smoothed = smoothExpressions(detection.expressions);
            setSmoothedExpressions(smoothed);
            
            const dominant = getDominantEmotion(smoothed);
            setDominantEmotion(dominant);
            
            setEmotionHistory(prev => [...prev.slice(-50), dominant.emotion]);
          }

          // Draw on canvas
          const displaySize = { width: canvas.width, height: canvas.height };
          const resizedDetection = faceapi.resizeResults(detection, displaySize);

          // Draw face box with gradient
          const box = resizedDetection.detection.box;
          const gradient = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#8b5cf6');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw corners
          const cornerSize = 15;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(box.x, box.y + cornerSize);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerSize, box.y);
          // Top-right
          ctx.moveTo(box.x + box.width - cornerSize, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerSize);
          // Bottom-right
          ctx.moveTo(box.x + box.width, box.y + box.height - cornerSize);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width - cornerSize, box.y + box.height);
          // Bottom-left
          ctx.moveTo(box.x + cornerSize, box.y + box.height);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x, box.y + box.height - cornerSize);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw landmarks
          if (showLandmarks && resizedDetection.landmarks) {
            const landmarks = resizedDetection.landmarks;
            const points = landmarks.positions;
            
            // Draw all points
            points.forEach((point, index) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              
              // Color code different parts
              if (MOUTH_OUTER.includes(index) || MOUTH_INNER.includes(index)) {
                ctx.fillStyle = '#ef4444'; // Red for mouth
              } else if (LEFT_EYE.includes(index) || RIGHT_EYE.includes(index)) {
                ctx.fillStyle = '#3b82f6'; // Blue for eyes
              } else {
                ctx.fillStyle = '#22c55e'; // Green for others
              }
              ctx.fill();
            });

            // Draw mouth outline
            ctx.beginPath();
            const mouthPoints = MOUTH_OUTER.map(i => points[i]);
            ctx.moveTo(mouthPoints[0].x, mouthPoints[0].y);
            mouthPoints.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Draw expression label - use smoothed emotion for stability
          if (showExpressions && dominantEmotion) {
            const emotionInfo = EMOTION_MAP[dominantEmotion.emotion] || { label: dominantEmotion.emotion, emoji: '❓', color: 'bg-gray-500' };
            
            // Draw label background with emotion color
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.roundRect(box.x, box.y - 40, 180, 35, 8);
            ctx.fill();
            
            // Draw border with emotion color
            const emotionColors: Record<string, string> = {
              neutral: '#6b7280', happy: '#22c55e', sad: '#3b82f6',
              angry: '#ef4444', fearful: '#a855f7', disgusted: '#ca8a04', surprised: '#f97316'
            };
            ctx.strokeStyle = emotionColors[dominantEmotion.emotion] || '#6b7280';
            ctx.lineWidth = 2;
            ctx.roundRect(box.x, box.y - 40, 180, 35, 8);
            ctx.stroke();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`${emotionInfo.emoji} ${emotionInfo.label}`, box.x + 10, box.y - 18);
            
            // Draw confidence bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.roundRect(box.x + 120, box.y - 30, 50, 12, 3);
            ctx.fill();
            ctx.fillStyle = emotionColors[dominantEmotion.emotion] || '#6b7280';
            ctx.roundRect(box.x + 120, box.y - 30, 50 * dominantEmotion.confidence, 12, 3);
            ctx.fill();
          }

          // Draw age/gender
          if (detection.age && detection.gender) {
            const genderText = detection.gender === 'male' ? '👨 Nam' : '👩 Nữ';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.roundRect(box.x, box.y + box.height + 5, 120, 25, 5);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${genderText} • ${Math.round(detection.age)} tuổi`, box.x + 8, box.y + box.height + 22);
          }

        } else {
          setFaceData(null);
          setMouthAnalysis(null);
          setEyeAnalysis(null);
          setSmoothedExpressions(null);
          setDominantEmotion(null);
        }

        // Calculate FPS
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTime = now;
        }

      } catch (err) {
        console.error('[FACE-AI] Detection error:', err);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // Restart detection when camera state changes
  useEffect(() => {
    if (isCameraOn && modelsLoaded) {
      startDetection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn, modelsLoaded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Face AI Lab
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Phân tích khuôn mặt với AI: Nhận diện cảm xúc, kiểm tra miệng mở/đóng, 
            độ mở mắt, tuổi và giới tính theo thời gian thực
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white">Đang tải AI models...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="max-w-xl mx-auto mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {modelsLoaded && !isLoading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Live Camera
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isCameraOn && (
                        <>
                          <Badge variant="outline" className="border-green-500 text-green-400">
                            <Activity className="h-3 w-3 mr-1" />
                            {fps} FPS
                          </Badge>
                          <Badge variant="outline" className="border-blue-500 text-blue-400">
                            #{detectionCount}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    
                    {!isCameraOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
                        <CameraOff className="h-16 w-16 text-gray-500 mb-4" />
                        <p className="text-gray-400 mb-4">Camera chưa bật</p>
                        <Button onClick={startCamera} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500">
                          <Camera className="mr-2 h-5 w-5" />
                          Bật Camera
                        </Button>
                      </div>
                    )}

                    {/* Mouth Status Overlay */}
                    {isCameraOn && mouthAnalysis && (
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <div className={`px-3 py-2 rounded-lg backdrop-blur-sm ${mouthAnalysis.isOpen ? 'bg-green-500/80' : 'bg-red-500/80'} text-white text-sm font-medium`}>
                          {mouthAnalysis.isOpen ? '👄 Miệng MỞ' : '👄 Miệng ĐÓNG'} ({mouthAnalysis.openness.toFixed(0)}%)
                        </div>
                        {eyeAnalysis && (
                          <div className={`px-3 py-2 rounded-lg backdrop-blur-sm ${eyeAnalysis.isBlinking ? 'bg-yellow-500/80' : 'bg-blue-500/80'} text-white text-sm font-medium`}>
                            {eyeAnalysis.isBlinking ? '😑 Đang nháy mắt' : '👁️ Mắt mở'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      onClick={isCameraOn ? stopCamera : startCamera}
                      variant={isCameraOn ? 'destructive' : 'default'}
                    >
                      {isCameraOn ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                      {isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowLandmarks(!showLandmarks)}
                      className={showLandmarks ? 'border-green-500 text-green-400' : ''}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Landmarks
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowExpressions(!showExpressions)}
                      className={showExpressions ? 'border-green-500 text-green-400' : ''}
                    >
                      <Smile className="mr-2 h-4 w-4" />
                      Expressions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={soundEnabled ? 'border-green-500 text-green-400' : ''}
                    >
                      {soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                      Âm thanh
                    </Button>
                  </div>

                  {/* Quality Settings */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                    <span className="text-gray-400 text-sm">Chất lượng:</span>
                    <div className="flex gap-1">
                      {(['fast', 'balanced', 'accurate'] as const).map((quality) => (
                        <Button
                          key={quality}
                          size="sm"
                          variant={detectionQuality === quality ? 'default' : 'outline'}
                          onClick={() => setDetectionQuality(quality)}
                          className={detectionQuality === quality ? 'bg-blue-600' : 'border-slate-600'}
                        >
                          {quality === 'fast' ? '⚡ Nhanh' : quality === 'balanced' ? '⚖️ Cân bằng' : '🎯 Chính xác'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Smoothed Emotions Display */}
              {smoothedExpressions && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Phân tích cảm xúc (Đã làm mượt)
                      <Badge variant="outline" className="ml-auto text-xs border-blue-500 text-blue-400">
                        Smoothed
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(smoothedExpressions).map(([emotion, confidence]) => {
                        const info = EMOTION_MAP[emotion] || { label: emotion, emoji: '❓', color: 'bg-gray-500' };
                        const percent = confidence * 100;
                        const isDominant = dominantEmotion?.emotion === emotion;
                        return (
                          <div 
                            key={emotion} 
                            className={`rounded-lg p-3 transition-all duration-300 ${
                              isDominant 
                                ? 'bg-gradient-to-br from-blue-600/50 to-purple-600/50 ring-2 ring-blue-400 scale-105' 
                                : 'bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-2xl ${isDominant ? 'animate-bounce' : ''}`}>{info.emoji}</span>
                              <span className={`font-bold ${isDominant ? 'text-blue-300' : 'text-white'}`}>
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                            <p className={`text-sm mb-2 ${isDominant ? 'text-blue-200 font-medium' : 'text-gray-400'}`}>
                              {info.label}
                              {isDominant && ' ✓'}
                            </p>
                            <div className="relative h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDominant 
                                    ? 'bg-gradient-to-r from-blue-400 to-purple-400' 
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-4">
              {/* Main Emotion Card - Use smoothed data */}
              {dominantEmotion && (() => {
                const emotionInfo = EMOTION_MAP[dominantEmotion.emotion] || { label: dominantEmotion.emotion, emoji: '❓', color: 'bg-gray-500' };
                return (
                  <Card className={`${emotionInfo.color} border-0 transition-all duration-500`}>
                    <CardContent className="p-6 text-center text-white">
                      <div className="text-6xl mb-2 animate-pulse">{emotionInfo.emoji}</div>
                      <h3 className="text-2xl font-bold mb-1">{emotionInfo.label}</h3>
                      <p className="text-white/80">
                        Độ tin cậy: {(dominantEmotion.confidence * 100).toFixed(1)}%
                      </p>
                      <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${dominantEmotion.confidence * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Age & Gender */}
              {faceData?.age && faceData?.gender && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Giới tính</span>
                      <Badge className={faceData.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}>
                        {faceData.gender === 'male' ? '👨 Nam' : '👩 Nữ'}
                        <span className="ml-1 opacity-75">
                          ({((faceData.genderProbability || 0) * 100).toFixed(0)}%)
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tuổi ước tính</span>
                      <span className="text-white font-bold text-xl">
                        {Math.round(faceData.age)} tuổi
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mouth Analysis */}
              {mouthAnalysis && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      👄 Phân tích miệng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Trạng thái</span>
                      <Badge className={mouthAnalysis.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                        {mouthAnalysis.isOpen ? 'MỞ' : 'ĐÓNG'}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Độ mở miệng</span>
                        <span className="text-white">{mouthAnalysis.openness.toFixed(1)}%</span>
                      </div>
                      <Progress value={mouthAnalysis.openness} className="h-3" />
                    </div>
                    <div className="text-xs text-gray-500">
                      Kích thước: {mouthAnalysis.width.toFixed(0)}x{mouthAnalysis.height.toFixed(0)} px
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Eye Analysis */}
              {eyeAnalysis && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      👁️ Phân tích mắt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Mắt trái</p>
                        <Badge className={eyeAnalysis.leftOpen ? 'bg-green-500' : 'bg-yellow-500'}>
                          {eyeAnalysis.leftOpen ? 'Mở' : 'Nhắm'}
                        </Badge>
                        <Progress value={eyeAnalysis.leftOpenness} className="h-2 mt-2" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Mắt phải</p>
                        <Badge className={eyeAnalysis.rightOpen ? 'bg-green-500' : 'bg-yellow-500'}>
                          {eyeAnalysis.rightOpen ? 'Mở' : 'Nhắm'}
                        </Badge>
                        <Progress value={eyeAnalysis.rightOpenness} className="h-2 mt-2" />
                      </div>
                    </div>
                    {eyeAnalysis.isBlinking && (
                      <div className="text-center text-yellow-400 font-medium animate-pulse">
                        😑 Đang nháy mắt!
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Thống kê nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng số lần phát hiện</span>
                    <span className="text-white font-bold">{detectionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS hiện tại</span>
                    <span className="text-white font-bold">{fps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trạng thái</span>
                    <Badge variant={faceData ? 'default' : 'secondary'}>
                      {faceData ? '✅ Phát hiện khuôn mặt' : '❌ Không có'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">💡 Hướng dẫn</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• Bật camera và đưa mặt vào khung hình</li>
                    <li>• Thử các biểu cảm khác nhau để xem AI phân tích</li>
                    <li>• Mở/đóng miệng để test tính năng kiểm tra miệng</li>
                    <li>• Nháy mắt để test tính năng kiểm tra mắt</li>
                    <li>• Bật Landmarks để xem 68 điểm đặc trưng khuôn mặt</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
