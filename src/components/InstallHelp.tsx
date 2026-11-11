'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

export default function InstallHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="install-help relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-white hover:bg-white/10"
      >
        <Smartphone className="h-4 w-4" aria-hidden="true" />
        Install
      </button>
      {isOpen && (
        <div
          id={id}
          role="dialog"
          aria-labelledby={`${id}-title`}
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-600 bg-gray-800 p-4 text-left text-sm text-gray-200 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id={`${id}-title`} className="font-bold text-white">
              Add Fitness Battle to your phone
            </h2>
            <button
              type="button"
              aria-label="Close install instructions"
              onClick={() => {
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 space-y-3">
            <p>
              <strong className="text-white">iPhone:</strong> Open this site in
              Safari, tap Share, then Add to Home Screen. If shown, leave Open
              as Web App enabled.
            </p>
            <p>
              <strong className="text-white">Android:</strong> Open this site in
              Chrome, open the browser menu, then tap Install app or Add to
              Home screen.
            </p>
            <p className="text-gray-400">
              The app still needs an internet connection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
