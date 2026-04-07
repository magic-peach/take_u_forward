import { useState, useCallback, useEffect } from 'react';
import { useKeyboard } from './useKeyboard';
import { MONTH_NAMES } from './useCalendarState';
import styles from './calendar.module.css';

const DOW_SHORT   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_FULL    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKEND_IDX = new Set([0, 6]);

// build 42 cells for a month, returned as a flat array
function buildCells(month, year) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ dayNum: prevMonthDays - i, isCurrent: false, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, isCurrent: true, dateStr });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ dayNum: next++, isCurrent: false, dateStr: null });
  }
  return cells;
}

function groupIntoWeeks(cells) {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// returns range position info for a cell, preferring the active range
function getCellRangeInfo(dateStr, ranges, activeRangeIdx) {
  if (!dateStr) return null;

  let firstMatch = null;
  let activeMatch = null;

  ranges.forEach((range, i) => {
    if (!range.startDate || !range.endDate) return;

    const isStart = dateStr === range.startDate;
    const isEnd   = dateStr === range.endDate;
    const isMiddle = !isStart && !isEnd && dateStr > range.startDate && dateStr < range.endDate;

    if (!isStart && !isEnd && !isMiddle) return;

    const info = {
      color: range.color,
      isStart, isEnd, isMiddle,
      isSingle: isStart && isEnd,
    };

    if (!firstMatch) firstMatch = info;
    if (i === activeRangeIdx) activeMatch = info;
  });

  return activeMatch || firstMatch;
}

// compute preview range info while user is mid-selection
function getPreviewInfo(dateStr, anchor, hover, color) {
  if (!anchor || !hover || !dateStr) return null;

  const [start, end] = anchor <= hover ? [anchor, hover] : [hover, anchor];
  if (dateStr < start || dateStr > end) return null;

  const isStart = dateStr === start;
  const isEnd   = dateStr === end;
  const isMiddle = !isStart && !isEnd;

  return { color, isStart, isEnd, isMiddle, isSingle: isStart && isEnd };
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function formatCellAriaLabel(cell, monthName, year, today, ranges) {
  if (!cell.isCurrent) return String(cell.dayNum);

  let label = `${cell.dayNum} ${monthName} ${year}`;
  if (cell.dateStr === today) label += ', today';

  const matchingRanges = ranges.filter(r =>
    r.startDate && r.endDate &&
    cell.dateStr >= r.startDate && cell.dateStr <= r.endDate
  );

  if (matchingRanges.length > 0) {
    const desc = matchingRanges
      .map(r => r.label || `${r.startDate} to ${r.endDate}`)
      .join('; ');
    label += `, in range: ${desc}`;
  }

  return label;
}

export default function CalendarGrid({
  currentMonth,
  currentYear,
  ranges,
  activeRangeIdx,
  rangeAnchor,
  notes,
  onDayClick,
  onSetActiveRange,
  onClearRange,
  onClearAnchor,
  gridAnimKey,
  onRangeAnnounce, // callback to update sr live region
}) {
  const today = todayStr();
  const cells = buildCells(currentMonth, currentYear);
  const weeks = groupIntoWeeks(cells);
  const [hoverDate, setHoverDate] = useState(null);

  useEffect(() => { setHoverDate(null); }, [currentMonth, currentYear, rangeAnchor]);

  // announce to screen reader when a range is set
  useEffect(() => {
    const r = ranges[activeRangeIdx];
    if (r?.startDate && r?.endDate && onRangeAnnounce) {
      onRangeAnnounce(`Range set from ${r.startDate} to ${r.endDate}`);
    }
  }, [ranges, activeRangeIdx]);

  function idxToDate(idx) {
    return cells[idx]?.dateStr ?? null;
  }

  const handleSelect  = useCallback((idx) => { const d = idxToDate(idx); if (d) onDayClick(d); }, [cells, onDayClick]);
  const handleRangeEnd = useCallback((idx) => { const d = idxToDate(idx); if (d) onDayClick(d); }, [cells, onDayClick]);

  const { focusedIdx, handleGridKeyDown } = useKeyboard({
    totalCells: 42,
    onSelect: handleSelect,
    onRangeEnd: handleRangeEnd,
    onEscape: onClearAnchor,
  });

  const activeRangeColor = ranges[activeRangeIdx]?.color;
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // build note-dot map: dateStr → [colors]
  const noteMap = {};
  notes
    .filter(n => n.monthKey === monthKey)
    .forEach(n => {
      if (!n.rangeStart) return;
      const start = new Date(n.rangeStart);
      const end   = new Date(n.rangeEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!noteMap[key]) noteMap[key] = [];
        noteMap[key].push(n.color);
      }
    });

  return (
    <div className={styles.gridSection}>
      {/* day-of-week headers are inside role="grid" as columnheaders */}
      <div
        role="grid"
        aria-label={`${MONTH_NAMES[currentMonth]} ${currentYear} calendar`}
        aria-multiselectable="true"
        className={styles.dayGrid}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
      >
        {/* DOW header row */}
        <div role="row" className={styles.dowRow}>
          {DOW_SHORT.map((d, i) => (
            <div
              key={d}
              role="columnheader"
              aria-label={DOW_FULL[i]}
              className={`${styles.dowCell} ${WEEKEND_IDX.has(i) ? styles.weekend : ''}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div role="row" key={wi} className={styles.weekRow}>
            {week.map((cell, ci) => {
              const idx = wi * 7 + ci;
              const rangeInfo = getCellRangeInfo(cell.dateStr, ranges, activeRangeIdx);
              const preview   = (!rangeInfo && cell.isCurrent && rangeAnchor && cell.dateStr)
                ? getPreviewInfo(cell.dateStr, rangeAnchor, hoverDate, activeRangeColor)
                : null;

              const isToday  = cell.isCurrent && cell.dateStr === today;
              const isFocused = idx === focusedIdx;
              const isAnchor  = cell.isCurrent && cell.dateStr === rangeAnchor;
              const dotColors = noteMap[cell.dateStr] || [];

              const classes = [
                styles.dayCell,
                !cell.isCurrent ? styles.otherMonth : '',
                isToday ? styles.isToday : '',
                isFocused ? styles.isFocused : '',
                isAnchor && !rangeInfo ? styles.isAnchor : '',
                // confirmed range
                rangeInfo?.isSingle                             ? styles.dayRangeSingle : '',
                rangeInfo && !rangeInfo.isSingle && rangeInfo.isStart  ? styles.dayRangeStart  : '',
                rangeInfo && !rangeInfo.isSingle && rangeInfo.isEnd    ? styles.dayRangeEnd    : '',
                rangeInfo && !rangeInfo.isSingle && rangeInfo.isMiddle ? styles.dayRangeMid    : '',
                // preview
                preview?.isSingle                              ? styles.dayPreviewSingle : '',
                preview && !preview.isSingle && preview.isStart  ? styles.dayPreviewStart  : '',
                preview && !preview.isSingle && preview.isEnd    ? styles.dayPreviewEnd    : '',
                preview && !preview.isSingle && preview.isMiddle ? styles.dayPreview       : '',
              ].filter(Boolean).join(' ');

              const rc = (rangeInfo || preview)?.color;

              return (
                <div
                  key={`${gridAnimKey}-${idx}`}
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  aria-label={formatCellAriaLabel(cell, MONTH_NAMES[currentMonth], currentYear, today, ranges)}
                  aria-selected={rangeInfo ? true : undefined}
                  aria-disabled={!cell.isCurrent ? true : undefined}
                  aria-current={isToday ? 'date' : undefined}
                  className={classes}
                  style={{ '--rc': rc, animationDelay: `${idx * 18}ms` }}
                  onClick={() => cell.isCurrent && cell.dateStr && onDayClick(cell.dateStr)}
                  onMouseEnter={() => cell.isCurrent && setHoverDate(cell.dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  <span className={styles.dayNum}>{cell.dayNum}</span>

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
        ))}
      </div>

      {/* range legend — pill-style tags */}
      <div className={styles.rangeLegend} role="list" aria-label="Date ranges">
        {ranges.map((range, idx) => {
          const isEmpty  = !range.startDate;
          const isActive = idx === activeRangeIdx;
          const dateLabel = isEmpty ? null : `${range.startDate.slice(5)} – ${range.endDate.slice(5)}`;

          return (
            <button
              key={range.id}
              role="listitem"
              className={[
                styles.rangePill,
                isActive ? styles.isActive : '',
                isEmpty ? styles.isEmpty : '',
                !isEmpty ? styles.hasDates : '',
              ].filter(Boolean).join(' ')}
              style={{ '--rsc': range.color }}
              onClick={() => onSetActiveRange(idx)}
              aria-label={`Range ${idx + 1}${dateLabel ? ': ' + dateLabel : ', empty'}${isActive ? ' (active)' : ''}`}
              aria-pressed={isActive}
            >
              {isEmpty ? (
                <>
                  <span className={styles.rangePillDotEmpty} aria-hidden="true" />
                  <span>Add range</span>
                </>
              ) : (
                <>
                  <span className={styles.rangePillDot} aria-hidden="true" />
                  <span className={styles.rangePillDate}>{dateLabel}</span>
                  <button
                    className={styles.rangePillClear}
                    onClick={e => { e.stopPropagation(); onClearRange(idx); }}
                    aria-label={`Clear range ${idx + 1}`}
                    tabIndex={-1}
                  >
                    ×
                  </button>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
