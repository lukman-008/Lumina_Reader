import { useEffect, useRef } from 'react';

/**
 * Custom hook to close modals, drawers, or popups when the Escape key is pressed.
 * Uses capture phase so focused inputs or children cannot swallow the event.
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);
}

