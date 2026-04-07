/*
 * WallCalendar.jsx — root component, owns all state, orchestrates children.
 *
 * KNOWN ISSUES / ROUGH EDGES:
 * - The 3D flip and swipe gesture can conflict on very fast mobile taps — added
 *   isFlipping ref guard but there's still an edge case with rapid successive swipes.
 * - mix-blend-mode range fills look better in light mode than dark mode.
 *   Dark mode switches to color-mix for fills which works better.
 * - Base64 custom images can fill localStorage quickly with large files. Try/catch
 *   prevents a crash but no recovery mechanism exists.
 * - @property --accent-color tweens in Chrome/Edge 85+. Firefox/Safari snap instantly.
 *   Both are acceptable behaviors.
 * - e.preventDefault() on onTouchMove may be passive in some browsers when attached
 *   via React JSX. Swipe detection still works but page may scroll simultaneously.
 * - container queries require Chrome 105+ / Safari 16+. Layout degrades gracefully.
 * - color-mix() in CSS requires Chrome 111+ / Safari 16.2+ / Firefox 113+.
 *
 * TESTED:
 * - Chrome 124 ✓
 * - Firefox 125 ✓
 * - Safari 17 ✓ (note: @property color transition falls back to instant switch)
 * - Mobile Chrome 375px ✓
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { useCalendarState } from './useCalendarState';
import { useGesture } from './useGesture';
import CalendarHero from './CalendarHero';
import CalendarGrid from './CalendarGrid';
import NotesPanel from './NotesPanel';
import YearView from './YearView';
import styles from './calendar.module.css';

const COIL_COUNT = 16;

// print icon SVG
function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

export default function WallCalendar() {
  const cal = useCalendarState();

  const [flipClass, setFlipClass] = useState('');
  const isFlipping = useRef(false);
  const [gridAnimKey, setGridAnimKey] = useState(0);

  // live region announcements for screen readers
  const [rangeAnnouncement, setRangeAnnouncement] = useState('');
  const [noteAnnouncement, setNoteAnnouncement]   = useState('');

  const navigateMonth = useCallback((direction) => {
    if (isFlipping.current) return;
    isFlipping.current = true;
    setFlipClass(styles.flipOut);

    setTimeout(() => {
      if (direction === 'prev') cal.goToPrevMonth();
      else                       cal.goToNextMonth();

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

  const { onTouchStart, onTouchMove, onTouchEnd, dragStyle } = useGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  return (
    <div className={styles.page}>
      {/* hidden SVG filter for dark mode paper texture */}
      <svg className={styles.svgFilters} aria-hidden="true">
        <defs>
          <filter id="paper-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* screen reader live regions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {rangeAnnouncement}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {noteAnnouncement}
      </div>

      <div className={styles.calendarOuter}>
        <div
          className={`${styles.calendarCard} ${flipClass}`}
          style={dragStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* spiral binding */}
          <div className={styles.spiralRow} aria-hidden="true">
            {Array.from({ length: COIL_COUNT }).map((_, i) => (
              <div key={i} className={styles.coil} />
            ))}
          </div>

          <div className={styles.calendarBody}>
            {/* left: hero */}
            <CalendarHero
              currentMonth={cal.currentMonth}
              currentYear={cal.currentYear}
              customImages={cal.customImages}
              onPrev={handlePrev}
              onNext={handleNext}
              onSetCustomImage={cal.setCustomImage}
              onClearCustomImage={cal.clearCustomImage}
            />

            {/* right: toolbar + grid + notes */}
            <div className={styles.rightPanel}>
              {/* toolbar at top-right of right panel */}
              <div className={styles.toolbar}>
                <button
                  className={styles.toolbarBtn}
                  onClick={cal.openYearView}
                  aria-label="Open year view"
                >
                  Year
                </button>

                <button
                  className={styles.toolbarBtn}
                  onClick={() => window.print()}
                  aria-label="Print calendar"
                >
                  <PrintIcon />
                </button>

                <button
                  className={styles.toolbarBtn}
                  onClick={cal.toggleDarkMode}
                  aria-label={cal.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-pressed={cal.darkMode}
                >
                  {cal.darkMode ? '☀' : '☾'}
                </button>
              </div>

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
                onRangeAnnounce={setRangeAnnouncement}
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
                onNoteAnnounce={setNoteAnnouncement}
              />
            </div>
          </div>
        </div>
      </div>

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

      {cal.toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          {cal.toastMessage}
        </div>
      )}
    </div>
  );
}
