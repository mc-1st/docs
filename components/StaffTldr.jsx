import { useEffect, useRef } from 'react';
import { STAFF_TLDR_HTML } from './staff-tldr-content.js';

export default function StaffTldr() {
  const hostRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return undefined;

    const shadow = host.attachShadow({ mode: 'open' });

    try {
      const binary = atob(STAFF_TLDR_HTML);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const source = new TextDecoder().decode(bytes);
      if (cancelled) return undefined;

      const parsed = new DOMParser().parseFromString(source, 'text/html');
      const body = document.createElement('div');
      body.innerHTML = parsed.body.innerHTML;

      parsed.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        const clone = node.cloneNode(true);
        if (clone.tagName === 'STYLE') {
          clone.textContent = clone.textContent
            .replace(/:root/g, '.staff-tldr-root')
            .replace(/html\s*,\s*body/g, '.staff-tldr-root')
            .replace(/(^|[}\s])body(?=\s*[{,])/g, '$1.staff-tldr-root');
        }
        shadow.appendChild(clone);
      });

      const root = document.createElement('div');
      root.className = 'staff-tldr-root';
      root.append(...body.childNodes);
      shadow.appendChild(root);

      const scopedDocument = {
        getElementById: (id) => shadow.querySelector('#' + CSS.escape(id)),
        createElement: (tag) => document.createElement(tag),
        addEventListener: (...args) => shadow.addEventListener(...args),
        removeEventListener: (...args) => shadow.removeEventListener(...args),
        get activeElement() { return shadow.activeElement; }
      };

      parsed.querySelectorAll('script').forEach((script) => {
        if (!script.textContent.trim()) return;
        new Function('document', script.textContent)(scopedDocument);
      });
    } catch (error) {
      shadow.textContent = error.message;
    }

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} style={{ display: 'block', width: '100%', minHeight: '100vh' }} />;
}
