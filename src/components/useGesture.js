import { useRef, useState, useCallback } from 'react';

// detects touch swipes with velocity + spring-back
// returns handlers and a dragStyle to apply to the card element
export function useGesture({ onSwipeLeft, onSwipeRight }) {
  const startX = useRef(null);
  const startY = useRef(null);
  const startTime = useRef(null);
  const cardWidth = useRef(400);
  const isDragging = useRef(false);

  const [translateX, setTranslateX] = useState(0);
  const [isSpringBack, setIsSpringBack] = useState(false);

  // need a ref for translateX because onTouchEnd closure won't have fresh state
  const translateXRef = useRef(0);

  function updateTranslate(val) {
    translateXRef.current = val;
    setTranslateX(val);
  }

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    isDragging.current = false;
    setIsSpringBack(false);
    updateTranslate(0);

    if (e.currentTarget) {
      cardWidth.current = e.currentTarget.offsetWidth || 400;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startX.current === null) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // if they're scrolling vertically — bail out before we lock them in
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      startX.current = null;
      return;
    }

    if (Math.abs(dx) > 6) {
      isDragging.current = true;
    }

    if (isDragging.current) {
      e.preventDefault();
      // add resistance so it doesn't fly off-screen
      updateTranslate(dx * 0.65);
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null || !isDragging.current) {
      updateTranslate(0);
      return;
    }

    const elapsed = Math.max(Date.now() - startTime.current, 1);
    const dist = translateXRef.current;
    const velocity = Math.abs(dist) / elapsed; // px/ms

    // this threshold took some tweaking
    const distRatio = Math.abs(dist) / cardWidth.current;
    const shouldNavigate = velocity > 0.35 || distRatio > 0.28;

    if (shouldNavigate) {
      if (dist < 0) {
        onSwipeLeft && onSwipeLeft();
      } else {
        onSwipeRight && onSwipeRight();
      }
      updateTranslate(0);
    } else {
      // spring back to center
      setIsSpringBack(true);
      updateTranslate(0);
      setTimeout(() => setIsSpringBack(false), 400);
    }

    startX.current = null;
    isDragging.current = false;
  }, [onSwipeLeft, onSwipeRight]);

  const dragStyle = {
    transform: translateX !== 0 ? `translateX(${translateX}px)` : undefined,
    transition: isSpringBack
      ? 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      : translateX !== 0 ? 'none' : undefined,
    willChange: translateX !== 0 ? 'transform' : undefined,
  };

  return { onTouchStart, onTouchMove, onTouchEnd, dragStyle };
}
