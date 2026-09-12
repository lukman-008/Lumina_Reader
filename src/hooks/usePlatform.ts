import { useState, useEffect } from 'react';
import type { OSPlatform } from '../types';

export function usePlatform() {
  const [platform, setPlatform] = useState<OSPlatform>('windows');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const plat = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

    if (/mac|iphone|ipad|ipod/.test(userAgent) || /mac/.test(plat)) {
      setPlatform('macos');
    } else if (/linux|x11/.test(userAgent) || /linux/.test(plat)) {
      setPlatform('linux');
    } else {
      setPlatform('windows');
    }

    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);
  }, []);

  const modKey = platform === 'macos' ? '⌘' : 'Ctrl';
  const altKey = platform === 'macos' ? '⌥' : 'Alt';
  const fullscreenShortcut = platform === 'macos' ? 'Ctrl+⌘+F' : 'F11';

  return {
    platform,
    isStandalone,
    modKey,
    altKey,
    fullscreenShortcut,
    isMac: platform === 'macos',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
  };
}
