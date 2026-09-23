import { useEffect, useRef } from 'react';

export default function StaffTldr() {
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/staff-tldr.html', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load Staff TLDR');
        return response.text();
      })
      .then((source) => {
        if (cancelled || !rootRef.current) return;

        const parsed = new DOMParser().parseFromString(source, 'text/html');
        const root = rootRef.current;

        // Keep the supplied document's body markup and styles unchanged.
        root.innerHTML = parsed.body.innerHTML;
        parsed.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
          root.prepend(node.cloneNode(true));
        });

        // React does not execute scripts inserted through innerHTML, so run
        // the supplied page script after its original markup is mounted.
        parsed.querySelectorAll('script').forEach((script) => {
          if (!script.textContent.trim()) return;
          const run = document.createElement('script');
          run.textContent = script.textContent;
          root.appendChild(run);
          run.remove();
        });
      })
      .catch((error) => {
        if (!cancelled && rootRef.current) {
          rootRef.current.textContent = error.message;
        }
      });

    return () => {
      cancelled = true;
      if (rootRef.current) rootRef.current.replaceChildren();
    };
  }, []);

  return <div ref={rootRef} />;
}
