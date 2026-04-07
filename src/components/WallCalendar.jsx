/*
 * WallCalendar.jsx — root component, owns all state, orchestrates children
 *
 * Known limitations / rough edges:
 * - The 3D flip and swipe gesture can conflict on mobile if user starts a swipe
 *   while a flip is mid-way. Added a guard (isFlipping ref) but there's probably
 *   still a timing edge case there.
 * - Range fills use mix-blend-mode: multiply which doesn't blend great on dark
 *   backgrounds. Dark mode switches to 'screen' mode but it's still not perfect.
 * - The drag-to-reorder in NotesPanel reorders the full notes array by finding
 *   the global index — this works but breaks if you add filtering later.
 * - @property animation for --accent-color only works in Chrome/Edge 85+.
 *   Firefox/Safari just do an instant color swap (tested, works fine).
 * - Custom images stored as base64 can make localStorage hit the 5MB limit fast
 *   if the user uploads large photos. There's a try/catch but no real solution.
 * - Unsplash images require a network connection — no offline fallback.
 * - Container queries require Chrome 105+ / Safari 16+. Layout degrades gracefully.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useCalendarState } from './useCalendarState';
import { useGesture } from './useGesture';
import CalendarHero from './CalendarHero';
import CalendarGrid from './CalendarGrid';
import NotesPanel from './NotesPanel';
import YearView from './YearView';
import styles from './calendar.module.css';

// how many spiral coils to show
const COIL_COUNT = 16;

export default function WallCalendar() {
  const cal = useCalendarState();

  // flip animation state — lives here because it's pure UI
  const [flipClass, setFlipClass] = useState('');
  const isFlipping = useRef(false);

  // gridAnimKey changes each month to trigger the stagger animation on cells
  const [gridAnimKey, setGridAnimKey] = useState(0);

  // using useCallback so the gesture hook doesn't get stale closures
  const navigateMonth = useCallback((direction) => {
    if (isFlipping.current) return;
    isFlipping.current = true;
    setFlipClass(styles.flipOut);

    setTimeout(() => {
      if (direction === 'prev') {
        cal.goToPrevMonth();
      } else {
        cal.goToNextMonth();
      }
      setGridAnimKey(k => k + 1);
      setFlipClass(styles.flipIn);

      setTimeout(() => {
        setFlipClass('');
        isFlipping.current = false;
      }, 320);
    }, 300);
  }, [cal.goToPrevMonth, cal.goToNextMonth]);

  const handlePrev = useCallback(() => navigateMonth('prev'), [navigateMonth]);
  const handleNext = useCallback(() => navigateMonth('next'), [navigateMonth]);

  // gesture hook — swipe left = next month, swipe right = prev month
  const { onTouchStart, onTouchMove, onTouchEnd, dragStyle } = useGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  // print button
  function handlePrint() {
    window.print();
  }

  return (
    <div className={styles.page}>
      {/* SVG noise filter for dark mode paper texture */}
      <svg className={styles.svgFilters} aria-hidden="true">
        <defs>
          <filter id="paper-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <div className={styles.calendarOuter}>
        <div
          className={`${styles.calendarCard} ${flipClass}`}
          style={dragStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* top bar — dark mode, year view, print buttons */}
          <div className={styles.cardTopBar}>
            <span className={styles.topBarSpacer} />

            <button
              className={styles.topBarBtn}
              onClick={cal.openYearView}
              aria-label="Open year view"
            >
              Year
            </button>

            <button
              className={styles.topBarBtn}
              onClick={handlePrint}
              aria-label="Print calendar"
            >
              {/* printer icon */}
              &#128438;
            </button>

            <button
              className={styles.topBarBtn}
              onClick={cal.toggleDarkMode}
              aria-label={cal.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={cal.darkMode}
            >
              {cal.darkMode ? '☀' : '☾'}
            </button>
          </div>

          {/* spiral binding row */}
          <div className={styles.spiralRow} aria-hidden="true">
            {Array.from({ length: COIL_COUNT }).map((_, i) => (
              <div key={i} className={styles.coil} />
            ))}
          </div>

          {/* main calendar body */}
          <div className={styles.calendarBody}>
            {/* left: hero panel */}
            <CalendarHero
              currentMonth={cal.currentMonth}
              currentYear={cal.currentYear}
              customImages={cal.customImages}
              onPrev={handlePrev}
              onNext={handleNext}
              onSetCustomImage={cal.setCustomImage}
              onClearCustomImage={cal.clearCustomImage}
            />

            {/* right: grid + notes */}
            <div className={styles.rightPanel}>
              <CalendarGrid
                currentMonth={cal.currentMonth}
                currentYear={cal.currentYear}
                ranges={cal.ranges}
                activeRangeIdx={cal.activeRangeIdx}
                rangeAnchor={cal.rangeAnchor}
                notes={cal.notes}
                onDayClick={cal.handleDayClick}
                onSetActiveRange={cal.setActiveRangeIdx}
                onClearRange={cal.clearRange}
                onClearAnchor={cal.clearRangeAnchor}
                gridAnimKey={gridAnimKey}
              />

              <NotesPanel
                notes={cal.notes}
                currentMonth={cal.currentMonth}
                currentYear={cal.currentYear}
                activeRangeIdx={cal.activeRangeIdx}
                ranges={cal.ranges}
                onAddNote={cal.addNote}
                onDeleteNote={cal.deleteNote}
                onReorderNotes={cal.reorderNotes}
              />
            </div>
          </div>
        </div>
      </div>

      {/* year view modal */}
      {cal.isYearViewOpen && (
        <YearView
          currentYear={cal.currentYear}
          currentMonth={cal.currentMonth}
          ranges={cal.ranges}
          notes={cal.notes}
          onGoToMonth={cal.goToMonth}
          onClose={cal.closeYearView}
        />
      )}

      {/* toast notification */}
      {cal.toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          {cal.toastMessage}
        </div>
      )}
    </div>
  );
}
