import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Smartphone camera access via the MediaDevices API.
 * Permission is requested only when open() is called by the user, and the
 * stream is always stopped on close or unmount.
 */
export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const supported = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia;

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const open = useCallback(async () => {
    setError('');
    if (!supported) {
      setError('This browser does not expose camera access. Use the image upload option instead.');
      return false;
    }
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setActive(true);
      return true;
    } catch (e) {
      const map = {
        NotAllowedError: 'Camera permission was denied. Allow access in your browser settings, or upload a photo instead.',
        NotFoundError: 'No camera device was found on this device. Please upload a photo instead.',
        NotReadableError: 'The camera is already in use by another application.',
        SecurityError: 'Camera access requires a secure (HTTPS) connection.',
      };
      setError(map[e.name] || `Camera could not be started: ${e.message}`);
      return false;
    } finally {
      setStarting(false);
    }
  }, [supported]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve({ file, url: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.9);
    });
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, open, stop, capture, active, error, starting, supported };
}
