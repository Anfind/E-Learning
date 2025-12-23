'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface FaceVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  expectedUserId?: string;
  title?: string;
  description?: string;
}

export default function FaceVerificationModal({
  open,
  onOpenChange,
  onVerified,
  expectedUserId,
  title = 'Xác thực khuôn mặt',
  description = 'Vui lòng chụp ảnh khuôn mặt của bạn để xác thực',
}: FaceVerificationModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError(null);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
  };

  const verify = async () => {
    if (!capturedImage) return;

    try {
      setVerifying(true);
      setError(null);

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      
      // Add userId if provided
      if (expectedUserId) {
        formData.append('userId', expectedUserId);
      }

      // Call verify API
      await api.postForm('/face/verify', formData);

      // Success
      setSuccess(true);
      setTimeout(() => {
        onVerified();
        onOpenChange(false);
        // Reset state
        setCapturedImage(null);
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Xác thực thất bại. Vui lòng thử lại.');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    if (!verifying) {
      onOpenChange(false);
      // Reset state
      setCapturedImage(null);
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl border-2 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Image Display - Enhanced */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl overflow-hidden shadow-xl border-2 border-blue-200 dark:border-blue-800">
            {!capturedImage ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: 'user',
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay guide - Enhanced */}
            {!capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-4 border-dashed border-blue-400 dark:border-blue-600 rounded-full opacity-60 animate-pulse" />
              </div>
            )}
          </div>

          {/* Error Alert - Enhanced */}
          {error && (
            <Alert variant="destructive" className="border-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 animate-in slide-in-from-top duration-300">
              <XCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert - Enhanced */}
          {success && (
            <Alert className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300 font-bold text-lg">
                ✅ Xác thực thành công!
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions - Enhanced */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-sm font-bold mb-2 text-blue-700 dark:text-blue-300">📸 Hướng dẫn chụp ảnh:</p>
            <ul className="list-none space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">💡</span>
                <span>Đảm bảo khuôn mặt được chiếu sáng <strong>đầy đủ</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">👀</span>
                <span>Nhìn <strong>thẳng</strong> vào camera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">🚫</span>
                <span>Không đeo <strong>kính đen</strong> hoặc <strong>khẩu trang</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">📱</span>
                <span>Giữ camera <strong>ổn định</strong> khi chụp</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={verifying}
                  className="flex-1 border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={capture} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Chụp ảnh
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={retake}
                  disabled={verifying || success}
                  className="flex-1 border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Chụp lại
                </Button>
                <Button
                  onClick={verify}
                  disabled={verifying || success}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Thành công ✓
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Xác thực
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
