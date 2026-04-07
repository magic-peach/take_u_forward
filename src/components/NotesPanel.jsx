import { useState, useRef, useCallback } from 'react';
import styles from './calendar.module.css';

const NOTE_COLORS = ['#D94F3D', '#E8A838', '#5BAD6F', '#3B82A0', '#8B5BAD', '#A0522D'];

function formatRange(note) {
  if (note.rangeStart && note.rangeEnd) {
    const s = note.rangeStart.slice(5).replace('-', '/');
    const e = note.rangeEnd.slice(5).replace('-', '/');
    return s === e ? s : `${s} – ${e}`;
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
  onNoteAnnounce,
}) {
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const addBtnRef = useRef(null);

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const visibleNotes = notes.filter(n => n.monthKey === monthKey);

  const draggedIdx = useRef(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);

  function handleAdd() {
    if (!noteText.trim()) return;
    onAddNote(noteText, selectedColor, monthKey);
    onNoteAnnounce && onNoteAnnounce(`Note added: ${noteText}`);
    setNoteText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  // focus trap: Tab cycles within the panel when focus is inside
  function handlePanelKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (!panelRef.current?.contains(document.activeElement)) return;

    const focusable = panelRef.current.querySelectorAll(
      'button:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // drag-to-reorder — raw HTML5, no library
  const handleDragStart = useCallback((e, idx) => {
    draggedIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.4'; }, 0);
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

    const fullFrom = notes.indexOf(visibleNotes[fromIdx]);
    const fullTo   = notes.indexOf(visibleNotes[toIdx]);

    if (fullFrom >= 0 && fullTo >= 0) {
      onReorderNotes(fullFrom, fullTo);
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

      {/* color swatches with ring-on-active */}
      <div className={styles.colorSwatches}>
        <span className={styles.colorSwatchLabel}>Color:</span>
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            className={`${styles.swatch} ${selectedColor === c ? styles.isSelected : ''}`}
            style={{ '--sc': c, background: c }}
            onClick={() => setSelectedColor(c)}
            aria-label={`Note color`}
            aria-pressed={selectedColor === c}
          />
        ))}
      </div>

      {/* input + add button */}
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
          disabled={!noteText.trim()}
          aria-label="Add note"
        >
          Add
        </button>
      </div>

      {/* notes list */}
      <ul
        className={styles.notesList}
        aria-label="Notes"
        aria-live="polite"
        aria-atomic="false"
      >
        {visibleNotes.map((note, i) => (
          <li
            key={note.id}
            className={[
              styles.noteItem,
              dropTargetIdx === i ? styles.isDragOver : '',
            ].filter(Boolean).join(' ')}
            style={{ '--ni-color': note.color }}
            draggable={true}
            onDragStart={e => handleDragStart(e, i)}
            onDragEnd={handleDragEnd}
            onDragOver={e => handleDragOver(e, i)}
            onDrop={e => handleDrop(e, i)}
          >
            {/* drag handle — ⠿ braille 6-dot pattern */}
            <span className={styles.dragHandle} aria-hidden="true">⠿</span>

            <div className={styles.noteBody}>
              {formatRange(note) && (
                <div className={styles.noteRangeLabel}>{formatRange(note)}</div>
              )}
              <div className={styles.noteText}>{note.text}</div>
            </div>

            <button
              className={styles.noteDeleteBtn}
              onClick={() => {
                onDeleteNote(note.id);
                onNoteAnnounce && onNoteAnnounce(`Note deleted: ${note.text}`);
              }}
              aria-label={`Delete note: ${note.text}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
