import { useEffect, useRef } from 'react';

export default function StaffTldr() {
  const hostRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return undefined;

    const shadow = host.attachShadow({ mode: 'open' });

    fetch('/staff-tldr.html', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load Staff TLDR');
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;

        const parsed = new DOMParser().parseFromString(source, 'text/html');
        const body = document.createElement('div');
        body.innerHTML = parsed.body.innerHTML;

        parsed.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
          shadow.appendChild(node.cloneNode(true));
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
      })
      .catch((error) => {
        if (!cancelled) {
          shadow.textContent = error.message;
        }
      });

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} style={{ display: 'block', width: '100%', minHeight: '100vh' }} />;
}
