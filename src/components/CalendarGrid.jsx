import { useState, useCallback, useEffect } from 'react';
import { useKeyboard } from './useKeyboard';
import { MONTH_NAMES } from './useCalendarState';
import styles from './calendar.module.css';

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// builds the 42-cell grid for a given month
function buildCells(month, year) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  // padding from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ dayNum: prevMonthDays - i, isCurrent: false, dateStr: null });
  }

  // current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, isCurrent: true, dateStr });
  }

  // fill to 42
  let next = 1;
  while (cells.length < 42) {
    cells.push({ dayNum: next++, isCurrent: false, dateStr: null });
  }

  return cells;
}

// returns range state for a given dateStr across all ranges
// each entry: { isStart, isEnd, isInRange, color } or null
function getRangeStates(dateStr, ranges) {
  if (!dateStr) return [];
  return ranges.map(range => {
    if (!range.startDate || !range.endDate) return null;
    const isStart = dateStr === range.startDate;
    const isEnd = dateStr === range.endDate;
    const isInRange = dateStr > range.startDate && dateStr < range.endDate;
    if (!isStart && !isEnd && !isInRange) return null;
    return { isStart, isEnd, isInRange, color: range.color };
  });
}

// figure out preview range state for when user is mid-selection
function getPreviewState(dateStr, anchor, hoverDate, color) {
  if (!anchor || !hoverDate || !dateStr) return null;
  const [start, end] = anchor <= hoverDate ? [anchor, hoverDate] : [hoverDate, anchor];
  if (dateStr < start || dateStr > end) return null;
  return {
    isStart: dateStr === start,
    isEnd: dateStr === end,
    isInRange: dateStr > start && dateStr < end,
    color,
    isPreview: true,
  };
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

// RangeFill renders the visual fill for one range slot within a cell
function RangeFill({ rs }) {
  if (!rs) return null;
  const isSingle = rs.isStart && rs.isEnd;

  return (
    <div className={styles.rangeFillLayer} style={{ '--rc': rs.color }}>
      {/* left segment */}
      {!isSingle && (rs.isEnd || rs.isInRange) && (
        <div className={`${styles.rangeSegLeft} ${rs.isPreview ? styles.isPreview : ''}`} />
      )}
      {/* right segment */}
      {!isSingle && (rs.isStart || rs.isInRange) && (
        <div className={`${styles.rangeSegRight} ${rs.isPreview ? styles.isPreview : ''}`} />
      )}
      {/* circle cap */}
      {(rs.isStart || rs.isEnd || isSingle) && (
        <div className={`${styles.rangeCircle} ${rs.isPreview ? styles.isPreview : ''}`} />
      )}
    </div>
  );
}

export default function CalendarGrid({
  currentMonth,
  currentYear,
  ranges,
  activeRangeIdx,
  rangeAnchor,
  notes,
  onDayClick,
  onClearAnchor,
  gridAnimKey, // changes when month changes to trigger the stagger animation
}) {
  const today = todayStr();
  const cells = buildCells(currentMonth, currentYear);
  const [hoverDate, setHoverDate] = useState(null);

  // reset hover when month changes or anchor clears
  useEffect(() => {
    setHoverDate(null);
  }, [currentMonth, currentYear, rangeAnchor]);

  // convert cell index to dateStr for keyboard callbacks
  function idxToDate(idx) {
    return cells[idx]?.dateStr ?? null;
  }

  const handleSelect = useCallback((idx) => {
    const d = idxToDate(idx);
    if (d) onDayClick(d);
  }, [cells, onDayClick]);

  const handleRangeEnd = useCallback((idx) => {
    const d = idxToDate(idx);
    if (d) onDayClick(d); // second click completes range
  }, [cells, onDayClick]);

  const { focusedIdx, handleGridKeyDown } = useKeyboard({
    totalCells: 42,
    onSelect: handleSelect,
    onRangeEnd: handleRangeEnd,
    onEscape: onClearAnchor,
  });

  const activeRangeColor = ranges[activeRangeIdx]?.color;

  // build a map of dateStr -> array of note colors for dot indicators
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const noteMap = {};
  notes.filter(n => n.monthKey === monthKey).forEach(n => {
    if (n.rangeStart) {
      // mark all dates in that range
      const start = new Date(n.rangeStart);
      const end = new Date(n.rangeEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!noteMap[key]) noteMap[key] = [];
        noteMap[key].push(n.color);
      }
    }
  });

  return (
    <div className={styles.gridSection}>
      {/* day of week headers */}
      <div className={styles.dowRow} aria-hidden="true">
        {DOW_LABELS.map(d => (
          <div key={d} className={styles.dowCell}>{d}</div>
        ))}
      </div>

      {/* the grid */}
      <div
        role="grid"
        aria-label={`${MONTH_NAMES[currentMonth]} ${currentYear}`}
        className={styles.dayGrid}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
      >
        {cells.map((cell, idx) => {
          const rangeStates = getRangeStates(cell.dateStr, ranges);
          const preview = getPreviewState(cell.dateStr, rangeAnchor, hoverDate, activeRangeColor);
          const isToday = cell.dateStr === today;
          const isFocused = focusedIdx === idx;
          const isAnchor = cell.dateStr && cell.dateStr === rangeAnchor;
          const dotColors = noteMap[cell.dateStr] || [];

          // aria label for accessibility
          let ariaLabel = cell.isCurrent ? `${cell.dayNum} ${MONTH_NAMES[currentMonth]} ${currentYear}` : String(cell.dayNum);
          const activeRange = ranges.find(r => r.startDate === cell.dateStr || r.endDate === cell.dateStr);
          if (activeRange?.startDate && activeRange?.endDate) {
            ariaLabel += `, selected range ${activeRange.startDate} to ${activeRange.endDate}`;
          }

          return (
            <div
              key={`${gridAnimKey}-${idx}`}
              role="gridcell"
              aria-label={ariaLabel}
              aria-selected={rangeStates.some(rs => rs !== null) ? 'true' : undefined}
              className={[
                styles.dayCell,
                !cell.isCurrent ? styles.otherMonth : '',
                isToday ? styles.isToday : '',
                isFocused ? styles.isFocused : '',
                isAnchor ? styles.isAnchor : '',
              ].filter(Boolean).join(' ')}
              style={{ animationDelay: `${idx * 18}ms` }}
              onClick={() => cell.isCurrent && cell.dateStr && onDayClick(cell.dateStr)}
              onMouseEnter={() => cell.isCurrent && setHoverDate(cell.dateStr)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {/* range fills — existing confirmed ranges */}
              {rangeStates.map((rs, i) => rs && (
                <RangeFill key={i} rs={rs} />
              ))}

              {/* preview fill while user is selecting */}
              {preview && !rangeStates.some(rs => rs) && (
                <RangeFill rs={preview} />
              )}

              <span className={styles.dayNum}>{cell.dayNum}</span>

              {/* note dots */}
              {dotColors.length > 0 && (
                <div className={styles.noteDots} aria-hidden="true">
                  {dotColors.slice(0, 3).map((c, i) => (
                    <div key={i} className={styles.noteDot} style={{ background: c }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* range legend — click to select active range, X to clear it */}
      <div className={styles.rangeLegend} role="list" aria-label="Date ranges">
        {ranges.map((range, idx) => {
          const isEmpty = !range.startDate;
          const isActive = idx === activeRangeIdx;
          const slotLabel = range.label
            || (isEmpty ? 'empty' : `${range.startDate?.slice(5)} – ${range.endDate?.slice(5)}`);

          return (
            <button
              key={range.id}
              role="listitem"
              className={[
                styles.rangeSlot,
                isActive ? styles.isActive : '',
                isEmpty ? styles.isEmpty : '',
              ].filter(Boolean).join(' ')}
              style={{ '--rsc': range.color }}
              onClick={() => onSetActiveRange(idx)}
              aria-label={`Range ${idx + 1}: ${slotLabel}${isActive ? ', active' : ''}`}
              aria-pressed={isActive}
            >
              <div className={styles.rangeDot} />
              <span className={styles.rangeSlotLabel}>{slotLabel}</span>
              {!isEmpty && (
                <button
                  className={styles.rangeClearBtn}
                  onClick={e => { e.stopPropagation(); onClearRange(idx); }}
                  aria-label={`Clear range ${idx + 1}`}
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
