import { useEffect, useState } from 'react';

/**
 * ウィンドウ幅に基づくレスポンシブブレイクポイントフック。
 * AppShell のモバイル判定で利用。
 */
export function useResponsive(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return { isMobile };
}
