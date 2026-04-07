import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { detectFace, loadModels, isFakeDetection } from '../lib/faceApi';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';

interface FaceWidgetProps {
  onFaceDetected: (detected: boolean) => void;
  isActive: boolean;
}

export default function FaceWidget({ onFaceDetected, isActive }: FaceWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        await loadModels();
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 15 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        setError('Kamera ruxsati yo\'q');
        setLoading(false);
      }
    };

    if (isActive) startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [isActive]);

  useEffect(() => {
    if (!isActive || loading || error) return;

    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detection = await detectFace(videoRef.current);
        
        if (detection) {
          const isFake = isFakeDetection(detection);
          onFaceDetected(!isFake);
          
          // Draw on canvas for visual feedback
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const resized = faceapi.resizeResults(detection, dims);
          canvasRef.current.getContext('2d')?.clearRect(0, 0, dims.width, dims.height);
          faceapi.draw.drawDetections(canvasRef.current, resized);
        } else {
          onFaceDetected(false);
        }
      }
    }, 1000); // Check every 1 second as requested

    return () => clearInterval(interval);
  }, [isActive, loading, error, onFaceDetected]);

  return (
    <div className="relative w-48 h-36 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border-2 border-slate-300 dark:border-slate-700">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Yuklanmoqda...
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-red-500 p-2 text-center">
          <CameraOff className="w-6 h-6 mb-1" />
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </div>
        </>
      )}
    </div>
  );
}
