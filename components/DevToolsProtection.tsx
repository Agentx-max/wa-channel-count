'use client';

import { useEffect } from 'react';

export default function DevToolsProtection() {
  useEffect(() => {
    // Function to close tab / exit page immediately
    const closeTab = () => {
      try {
        window.close();
      } catch {
        // Fallback if browser blocks window.close()
      }
      // Instantly wipe page and redirect to about:blank
      document.body.innerHTML = '';
      window.location.replace('about:blank');
    };

    // 1. Intercept keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        closeTab();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Cmd on Mac)
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'I' || key === 'J' || key === 'C') {
          e.preventDefault();
          e.stopPropagation();
          closeTab();
          return false;
        }
      }

      // Ctrl+U (View Source)
      if (isCmdOrCtrl && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        e.stopPropagation();
        closeTab();
        return false;
      }
    };

    // 2. Prevent right click context menu (Inspect Element)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Detect DevTools opening via window size thresholds or debugger timing
    let devtoolsOpen = false;
    const threshold = 160;

    const detectDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if ((widthDiff || heightDiff) && !devtoolsOpen) {
        devtoolsOpen = true;
        closeTab();
      }
    };

    // Interval detector
    const interval = setInterval(detectDevTools, 500);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', detectDevTools);
    };
  }, []);

  return null;
}
