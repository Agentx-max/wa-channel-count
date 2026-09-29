'use client';

import { useEffect } from 'react';

/**
 * SecurityGuard: Active DOM MutationObserver anti-injection shield.
 * Scans for and immediately destroys unauthorized injected scripts,
 * clickjacking frames, or fake modal overlays.
 */
export default function SecurityGuard() {
  useEffect(() => {
    const ALLOWED_FRAME_ORIGINS = [
      'https://challenges.cloudflare.com',
      'https://whatsapp.com',
      'https://pps.whatsapp.net',
    ];

    const cleanNode = (node: Node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;

      // 1. Inspect injected <script> elements
      if (el.tagName === 'SCRIPT') {
        const scriptEl = el as HTMLScriptElement;
        const src = scriptEl.src;
        if (
          src &&
          !src.startsWith(window.location.origin) &&
          !ALLOWED_FRAME_ORIGINS.some((origin) => src.startsWith(origin))
        ) {
          console.warn('[SecurityGuard] Destroyed unauthorized script injection:', src);
          el.remove();
          return;
        }
      }

      // 2. Inspect injected <iframe> / <embed> / <object> elements
      if (el.tagName === 'IFRAME' || el.tagName === 'EMBED' || el.tagName === 'OBJECT') {
        const frameEl = el as HTMLIFrameElement;
        const src = frameEl.src;
        if (
          src &&
          !src.startsWith(window.location.origin) &&
          !src.startsWith('about:blank') &&
          !ALLOWED_FRAME_ORIGINS.some((origin) => src.startsWith(origin))
        ) {
          console.warn('[SecurityGuard] Destroyed unauthorized iframe overlay:', src);
          el.remove();
          return;
        }
      }

      // 3. Inspect high z-index overlay modals containing suspicious text (e.g. Win + R, verification dialog)
      const text = el.innerText || '';
      if (
        text.includes('Press Win + R') ||
        text.includes('open the verification dialog') ||
        text.includes('confirmation code')
      ) {
        console.warn('[SecurityGuard] Destroyed malicious ClickFix modal overlay');
        el.remove();
        return;
      }

      // Recursively check children
      el.querySelectorAll('script, iframe, embed, object').forEach((child) => {
        cleanNode(child);
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          cleanNode(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
