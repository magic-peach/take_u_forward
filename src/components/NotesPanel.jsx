import { useState, useRef, useCallback } from 'react';
import styles from './calendar.module.css';

const NOTE_COLORS = ['#D94F3D', '#E8A838', '#5BAD6F', '#3B82A0', '#8B5BAD', '#A0522D'];

function formatRange(note) {
  if (note.rangeStart && note.rangeEnd) {
    const s = note.rangeStart.slice(5).replace('-', '/');
    const e = note.rangeEnd.slice(5).replace('-', '/');
    if (s === e) return s;
    return `${s} – ${e}`;
  }
  return null;
}

export default function NotesPanel({
  notes,
  currentMonth,
  currentYear,
  activeRangeIdx,
  ranges,
  onAddNote,
  onDeleteNote,
  onReorderNotes,
}) {
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const addBtnRef = useRef(null);
  const swatchRefs = useRef([]);

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // filter notes to only show current month
  const visibleNotes = notes.filter(n => n.monthKey === monthKey);

  // drag-to-reorder state
  const draggedIdx = useRef(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);

  function handleAdd() {
    if (!noteText.trim()) return;
    onAddNote(noteText, selectedColor, monthKey);
    setNoteText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  // focus trap within the notes panel
  // when inside the panel, Tab cycles: input → swatches → add btn → input
  function handlePanelKeyDown(e) {
    if (e.key !== 'Tab') return;

    const focusable = panelRef.current?.querySelectorAll(
      'input, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!panelRef.current.contains(document.activeElement)) return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // drag and drop handlers — raw HTML5, no library
  const handleDragStart = useCallback((e, idx) => {
    draggedIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    // tiny delay so the ghost image gets captured properly
    setTimeout(() => {
      if (e.target) e.target.style.opacity = '0.4';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (e.target) e.target.style.opacity = '';
    draggedIdx.current = null;
    setDropTargetIdx(null);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIdx(idx);
  }, []);

  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault();
    const fromIdx = draggedIdx.current;
    if (fromIdx === null || fromIdx === toIdx) return;

    // find the actual indices in the full notes array
    // this is a bit convoluted because visibleNotes is a filtered view
    const fullFromIdx = notes.indexOf(visibleNotes[fromIdx]);
    const fullToIdx = notes.indexOf(visibleNotes[toIdx]);

    if (fullFromIdx >= 0 && fullToIdx >= 0) {
      onReorderNotes(fullFromIdx, fullToIdx);
    }
    setDropTargetIdx(null);
    draggedIdx.current = null;
  }, [notes, visibleNotes, onReorderNotes]);

  return (
    <div
      ref={panelRef}
      className={styles.notesPanel}
      onKeyDown={handlePanelKeyDown}
    >
      <p className={styles.notesHeader}>Notes</p>

      {/* color picker */}
      <div className={styles.colorSwatches}>
        <span className={styles.colorSwatchLabel}>Color:</span>
        {NOTE_COLORS.map((c, i) => (
          <button
            key={c}
            ref={el => swatchRefs.current[i] = el}
            className={`${styles.swatch} ${selectedColor === c ? styles.isSelected : ''}`}
            style={{ background: c }}
            onClick={() => setSelectedColor(c)}
            aria-label={`Note color ${i + 1}`}
            aria-pressed={selectedColor === c}
          />
        ))}
      </div>

      {/* input row */}
      <div className={styles.noteInputRow}>
        <textarea
          ref={inputRef}
          className={styles.noteInput}
          placeholder="Add a note…"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Note text"
        />
        <button
          ref={addBtnRef}
          className={styles.noteAddBtn}
          onClick={handleAdd}
          aria-label="Add note"
          disabled={!noteText.trim()}
        >
          Add
        </button>
      </div>

      {/* notes list */}
      <ul
        className={styles.notesList}
        aria-live="polite"
        aria-label="Notes list"
      >
        {visibleNotes.map((note, i) => {
          const isDropTarget = dropTargetIdx === i;

          return (
            <li
              key={note.id}
              className={[
                styles.noteItem,
                isDropTarget ? styles.isDragOver : '',
              ].filter(Boolean).join(' ')}
              style={{ '--ni-color': note.color }}
              draggable={true}
              onDragStart={e => handleDragStart(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
            >
              <div className={styles.noteItemContent}>
                {formatRange(note) && (
                  <div className={styles.noteItemDate}>{formatRange(note)}</div>
                )}
                <div className={styles.noteItemText}>{note.text}</div>
              </div>
              <button
                className={styles.noteDeleteBtn}
                onClick={() => onDeleteNote(note.id)}
                aria-label={`Delete note: ${note.text}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
