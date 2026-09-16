import { useState, useEffect } from 'react';
import type { OSPlatform } from '../types';

export function usePlatform() {
  const [platform, setPlatform] = useState<OSPlatform>('windows');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const plat = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';
    
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform();

    if (/android/.test(userAgent) || isCapacitor) {
      setPlatform('android');
      setIsMobile(true);
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      setIsMobile(true);
    } else if (/mac/.test(userAgent) || /mac/.test(plat)) {
      setPlatform('macos');
    } else if (/linux|x11/.test(userAgent) || /linux/.test(plat)) {
      setPlatform('linux');
    } else {
      setPlatform('windows');
    }

    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      isCapacitor;

    setIsStandalone(isAppStandalone);
  }, []);

  const modKey = platform === 'macos' || platform === 'ios' ? '⌘' : 'Ctrl';
  const altKey = platform === 'macos' || platform === 'ios' ? '⌥' : 'Alt';
  const fullscreenShortcut = platform === 'macos' ? 'Ctrl+⌘+F' : 'F11';

  return {
    platform,
    isStandalone,
    isMobile,
    modKey,
    altKey,
    fullscreenShortcut,
    isMac: platform === 'macos',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
  };
}
