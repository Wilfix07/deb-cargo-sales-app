import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Camera, X, Scan, RotateCcw, Flashlight, FlashlightOff, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';

interface ScannerProps {
  onScanSuccess: (result: string, format: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (permissionGranted && cameras.length > 0) {
      startScanning();
    }
  }, [currentCameraIndex, cameras, permissionGranted]);

  const cleanup = () => {
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.warn('Error resetting code reader:', e);
      }
      codeReader.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    
    setIsScanning(false);
    setFlashOn(false);
  };

  const requestCameraPermission = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera pa sipòte nan navigatè sa a');
      }

      console.log('Requesting camera permission...');
      
      // Request basic camera permission first
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      });
      
      // Stop the temporary stream immediately
      tempStream.getTracks().forEach(track => track.stop());
      
      console.log('Camera permission granted, enumerating devices...');
      setPermissionGranted(true);
      
      // Now enumerate devices
      await enumerateDevices();
      
    } catch (error) {
      console.error('Camera permission error:', error);
      handleCameraError(error);
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Found video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('Pa gen camera yo jwenn nan aparèy la');
      }

      setCameras(videoDevices);
      
      // Prefer back camera for mobile devices
      const backCameraIndex = videoDevices.findIndex(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('facing back')
      );
      
      if (backCameraIndex !== -1) {
        setCurrentCameraIndex(backCameraIndex);
      } else {
        setCurrentCameraIndex(0);
      }
      
    } catch (error) {
      console.error('Device enumeration error:', error);
      setError('Pa ka jwenn camera yo. Asire w ke ou bay otorizasyon pou itilize camera a.');
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      // Clean up any existing stream
      cleanup();

      if (!cameras[currentCameraIndex]) {
        throw new Error('Camera pa disponib');
      }

      console.log('Starting camera with device:', cameras[currentCameraIndex].label);

      // Configure camera constraints for better mobile compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: cameras[currentCameraIndex].deviceId ? 
            { exact: cameras[currentCameraIndex].deviceId } : undefined,
          width: { 
            ideal: 1280, 
            max: 1920,
            min: 640 
          },
          height: { 
            ideal: 720, 
            max: 1080,
            min: 480 
          },
          frameRate: { 
            ideal: 30,
            max: 60,
            min: 15 
          },
          facingMode: cameras[currentCameraIndex].label.toLowerCase().includes('back') || 
                     cameras[currentCameraIndex].label.toLowerCase().includes('rear') || 
                     cameras[currentCameraIndex].label.toLowerCase().includes('environment') ? 
                     'environment' : 'user'
        }
      };

      // Get media stream with error handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError) {
        console.warn('Failed with ideal constraints, trying basic constraints:', constraintError);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: cameras[currentCameraIndex].deviceId ? 
              { exact: cameras[currentCameraIndex].deviceId } : undefined,
            facingMode: 'environment'
          }
        });
      }

      streamRef.current = stream;

      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities();
        setHasFlash(!!capabilities.torch);
        console.log('Camera capabilities:', capabilities);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set video attributes for mobile compatibility
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        
        // Wait for video to be ready with timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current?.removeEventListener('error', onError);
            console.log('Video loaded successfully');
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current?.removeEventListener('error', onError);
            console.error('Video loading error:', e);
            reject(new Error('Video loading failed'));
          };

          videoRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current?.addEventListener('error', onError);
          
          // Try to play the video
          videoRef.current?.play().catch(playError => {
            console.warn('Video play error:', playError);
            // Don't reject here, sometimes play fails but video still works
          });
        });

        // Initialize ZXing scanner with better error handling
        try {
          codeReader.current = new BrowserMultiFormatReader();
          
          console.log('Starting ZXing decoder...');
          
          await codeReader.current.decodeFromVideoDevice(
            cameras[currentCameraIndex].deviceId,
            videoRef.current,
            (result: Result | null, error?: any) => {
              if (result) {
                console.log('Scan successful:', result.getText());
                const format = result.getBarcodeFormat().toString();
                const scanType = format.includes('QR') ? 'qr' : 'barcode';
                
                // Vibrate on successful scan (mobile only)
                if ('vibrate' in navigator) {
                  navigator.vibrate(200);
                }
                
                onScanSuccess(result.getText(), scanType);
                cleanup();
              }
              
              // Only log significant errors
              if (error && 
                  !(error.name === 'NotFoundException') && 
                  !(error.message && error.message.includes('No MultiFormat Readers were able to detect the code'))) {
                console.warn('Scanning error:', error);
              }
            }
          );
          
          console.log('ZXing decoder started successfully');
          
        } catch (zxingError) {
          console.error('ZXing initialization error:', zxingError);
          throw new Error('Pa ka kòmanse scanner la');
        }
      }
    } catch (err) {
      console.error('Scanner start error:', err);
      handleCameraError(err);
      setIsScanning(false);
    }
  };

  const handleCameraError = (error: any) => {
    let errorMessage = 'Erè nan kòmanse camera a';
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Otorizasyon camera a refize. Tanpri bay otorizasyon pou itilize camera a nan paramèt navigatè ou an.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Pa gen camera yo jwenn. Asire w ke aparèy ou an gen yon camera ki fonksyone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera pa sipòte nan navigatè sa a. Eseye ak yon navigatè pi resan.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera a okipe pa yon lòt aplikasyon. Fèmen lòt aplikasyon yo ki ap itilize camera a.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Paramèt camera yo pa sipòte. Ap eseye ak paramèt pi senp yo...';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
  };

  const switchCamera = () => {
    if (cameras.length > 1) {
      setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
    }
  };

  const toggleFlash = async () => {
    if (!hasFlash || !streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      });
      setFlashOn(!flashOn);
    } catch (error) {
      console.error('Flash toggle error:', error);
    }
  };

  const retryCamera = () => {
    setError(null);
    setPermissionGranted(false);
    requestCameraPermission();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-md mx-auto relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between safe-area-top">
          <div className="absolute left-1/2 transform -translate-x-1/2 top-2 flex flex-col items-center">
            <Logo size="small" />
            <h1 className="text-sm font-bold text-white mt-1">DEB CARGO SHIPPING LLC</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Scan className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera Controls */}
        {!error && permissionGranted && (
          <div className="bg-black bg-opacity-50 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  title="Chanje Camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              
              {hasFlash && (
                <button
                  onClick={toggleFlash}
                  className={`rounded-full p-2 transition-colors ${
                    flashOn 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                  title={flashOn ? 'Fèmen Flash' : 'Ouvè Flash'}
                >
                  {flashOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
                </button>
              )}
            </div>
            
            <div className="text-white text-sm">
              {cameras.length > 0 && `Camera ${currentCameraIndex + 1}/${cameras.length}`}
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="flex-1 relative bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full text-center p-6">
              <div>
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-white mb-4 text-lg">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={retryCamera}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold block w-full"
                  >
                    Eseye Ankò
                  </button>
                  
                  {!permissionGranted && (
                    <div className="text-sm text-gray-300 space-y-2">
                      <p>Si pwoblèm nan kontinye:</p>
                      <ul className="text-left space-y-1">
                        <li>• Asire w ke ou bay otorizasyon camera a</li>
                        <li>• Rechaje paj la ak eseye ankò</li>
                        <li>• Verifye si camera a pa okipe pa yon lòt aplikasyon</li>
                        <li>• Eseye ak yon navigatè diferan</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : !permissionGranted ? (
            <div className="flex items-center justify-center h-full text-center p-6">
              <div>
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-4 text-lg">Ap mande otorizasyon camera a...</p>
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
              />
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Scanning Frame */}
                  <div className="relative">
                    <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg animate-pulse"></div>
                      
                      {/* Scanning line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 animate-pulse"></div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                      <p className="text-white text-sm font-medium">
                        Mete kòd la nan kad la
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-black bg-opacity-50 p-4 text-center safe-area-bottom">
          <p className="text-white text-sm">
            Kenbe telefòn ou an stab ak mete QR code oswa barcode la nan kad la
          </p>
          {cameras.length > 1 && (
            <p className="text-gray-300 text-xs mt-2">
              Klike sou bouton chanje camera pou itilize camera devan an oswa dèyè a
            </p>
          )}
        </div>
      </div>
    </div>
  );
};