import { useEffect, useRef } from 'react';
import { MONTH_NAMES } from './useCalendarState';
import styles from './calendar.module.css';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildMiniCells(month, year) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, isCurrent: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrent: true });
  }
  while (cells.length < 42) {
    cells.push({ day: null, isCurrent: false });
  }
  return cells;
}

function todayRef() {
  const t = new Date();
  return { m: t.getMonth(), d: t.getDate(), y: t.getFullYear() };
}

// mini grid for a single month in the year view
function MiniMonth({ month, year, isCurrentView, ranges, notes, onClick }) {
  const today = todayRef();
  const cells = buildMiniCells(month, year);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const hasNotes = notes.some(n => n.monthKey === monthKey);

  // build a quick set of dates that have range fills for this mini grid
  const rangeMap = {};
  ranges.forEach(r => {
    if (!r.startDate || !r.endDate) return;
    // only mark dates in this month
    const pad = n => String(n).padStart(2, '0');
    const start = r.startDate;
    const end = r.endDate;
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
      const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
      if (ds >= start && ds <= end) {
        rangeMap[d] = r.color;
      }
    }
  });

  // dates with notes in this month
  const noteSet = new Set(
    notes
      .filter(n => n.monthKey === monthKey)
      .flatMap(n => {
        if (!n.rangeStart) return [];
        const days = [];
        const start = new Date(n.rangeStart);
        const end = new Date(n.rangeEnd);
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          days.push(dt.getDate());
        }
        return days;
      })
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.miniMonth} ${isCurrentView ? styles.isCurrent : ''}`}
      onClick={() => onClick(month, year)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick(month, year)}
      aria-label={`${MONTH_NAMES[month]} ${year}${hasNotes ? ', has notes' : ''}`}
    >
      <div className={styles.miniMonthName}>
        {MONTH_NAMES[month].slice(0, 3)}
        {hasNotes && <span className={styles.miniMonthDot} aria-hidden="true" />}
      </div>

      <div className={styles.miniGrid} role="presentation">
        {DOW.map((d, i) => (
          <div key={i} className={styles.miniDow}>{d}</div>
        ))}

        {cells.map((cell, idx) => {
          const isToday = cell.isCurrent && today.y === year && today.m === month && today.d === cell.day;
          const rangeColor = cell.day ? rangeMap[cell.day] : null;
          const hasNote = cell.day ? noteSet.has(cell.day) : false;

          return (
            <div
              key={idx}
              className={[
                styles.miniCell,
                cell.isCurrent ? styles.miniCurrent : '',
                isToday ? styles.miniToday : '',
              ].filter(Boolean).join(' ')}
            >
              {rangeColor && (
                <div
                  className={styles.miniRangeFill}
                  style={{ '--mrc': rangeColor }}
                  aria-hidden="true"
                />
              )}
              {cell.day}
              {hasNote && !rangeColor && (
                <div className={styles.miniCellDot} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function YearView({ currentYear, currentMonth, ranges, notes, onGoToMonth, onClose }) {
  const closeRef = useRef(null);

  // close on Escape, trap focus
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={styles.yearViewOverlay}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Year view ${currentYear}`}
    >
      <div className={styles.yearViewCard}>
        <div className={styles.yearViewHeader}>
          <h2 className={styles.yearViewTitle}>{currentYear}</h2>
          <button
            ref={closeRef}
            className={styles.yearViewCloseBtn}
            onClick={onClose}
            aria-label="Close year view"
          >
            Close
          </button>
        </div>

        <div className={styles.monthsGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <MiniMonth
              key={i}
              month={i}
              year={currentYear}
              isCurrentView={i === currentMonth}
              ranges={ranges}
              notes={notes}
              onClick={onGoToMonth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
