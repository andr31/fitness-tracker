import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Only the top-most open modal reacts to Escape/Tab when modals are stacked
const modalStack: symbol[] = [];

/**
 * Adds Escape-to-close, focus trapping and focus restoration to a modal.
 * Attach the returned ref to the dialog panel.
 */
export function useModalA11y<T extends HTMLElement>(
  isOpen: boolean,
  onClose?: () => void,
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol('modal');
    modalStack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Wait a tick so the panel is mounted (and animated in)
    const focusTimer = window.setTimeout(() => {
      const node = ref.current;
      if (!node || node.contains(document.activeElement)) return;
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      // On touch devices focusing a text field opens the keyboard and shifts the layout
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isTextField = first?.matches('input:not([type=checkbox]):not([type=radio]), textarea');
      if (isTouch && isTextField) {
        node.setAttribute('tabindex', '-1');
        node.focus({ preventScroll: true });
        return;
      }
      (first ?? node).focus({ preventScroll: true });
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        if (onCloseRef.current) {
          e.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (e.key !== 'Tab') return;
      const node = ref.current;
      if (!node) return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      const index = modalStack.indexOf(id);
      if (index >= 0) modalStack.splice(index, 1);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  return ref;
}
