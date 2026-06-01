import { useEffect } from 'react';
import { markLastSeen, trackClick, trackPageView, trackScrollDepth } from './userMonitoring';

function patchHistory(onRouteChange: (path: string) => void): () => void {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const emit = () => onRouteChange(window.location.pathname);

  window.history.pushState = function pushStatePatched(...args) {
    originalPushState.apply(this, args);
    emit();
  };

  window.history.replaceState = function replaceStatePatched(...args) {
    originalReplaceState.apply(this, args);
    emit();
  };

  const handlePopState = () => emit();
  window.addEventListener('popstate', handlePopState);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', handlePopState);
  };
}

export function useBrowserMonitoring(): void {
  useEffect(() => {
    trackPageView(window.location.pathname);

    const cleanupHistory = patchHistory((path) => trackPageView(path));

    const handleClick = () => trackClick();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        markLastSeen();
      }
    };
    const handleBeforeUnload = () => markLastSeen();

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        trackScrollDepth(100);
        return;
      }

      const depth = (window.scrollY / scrollableHeight) * 100;
      trackScrollDepth(depth);
    };

    const heartbeatId = window.setInterval(() => {
      markLastSeen();
    }, 30000);

    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cleanupHistory();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      window.clearInterval(heartbeatId);
    };
  }, []);
}
