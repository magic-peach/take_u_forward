import { useState, useCallback, useRef } from 'react';

// keyboard nav for the calendar grid
// using a ref for focusedIdx so the keydown handler always sees fresh value
// (not sure if there's a cleaner way to do this without useCallback dependencies getting weird)
export function useKeyboard({ totalCells, onSelect, onRangeEnd, onEscape }) {
  const [focusedIdx, setFocusedIdx] = useState(0);
  const focusedRef = useRef(0);

  function moveFocus(newIdx) {
    focusedRef.current = newIdx;
    setFocusedIdx(newIdx);
  }

  const handleGridKeyDown = useCallback((e) => {
    const cur = focusedRef.current;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        moveFocus(Math.min(cur + 1, totalCells - 1));
        break;

      case 'ArrowLeft':
        e.preventDefault();
        moveFocus(Math.max(cur - 1, 0));
        break;

      case 'ArrowDown':
        e.preventDefault();
        moveFocus(Math.min(cur + 7, totalCells - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        moveFocus(Math.max(cur - 7, 0));
        break;

      case ' ':
        e.preventDefault();
        if (e.shiftKey) {
          onRangeEnd && onRangeEnd(cur);
        } else {
          onSelect && onSelect(cur);
        }
        break;

      case 'Enter':
        e.preventDefault();
        onRangeEnd && onRangeEnd(cur);
        break;

      case 'Escape':
        e.preventDefault();
        onEscape && onEscape();
        break;

      default:
        break;
    }
  // not including focusedIdx in deps — we use the ref instead so this doesn't
  // get recreated constantly
  }, [totalCells, onSelect, onRangeEnd, onEscape]);

  return { focusedIdx, setFocusedIdx: moveFocus, handleGridKeyDown };
}
