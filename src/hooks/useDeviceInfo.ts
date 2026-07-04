'use client';

import { useState, useEffect } from 'react';

export function useDeviceInfo() {
  const [device, setDevice] = useState({
    isMobile: true,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent.toLowerCase();
    const handleResize = () => {
      setDevice({
        isMobile: window.innerWidth < 768,
        isIOS: /iphone|ipad|ipod/.test(ua),
        isAndroid: /android/.test(ua),
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
}
