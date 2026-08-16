import React, { useEffect, useRef, forwardRef } from 'react';
import './CameraFeed.css';

const CameraFeed = forwardRef(function CameraFeed({ onStream, onError }, videoRef) {
  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          onStream?.(stream);
        }
      } catch (err) {
        console.error('[Camera] Error:', err);
        onError?.(err);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="camera-feed-container">
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
});

export default CameraFeed;
