import { useState, useEffect, useCallback, useRef } from 'react';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// hand-picked — not auto-generated palette
export const MONTH_ACCENT_COLORS = [
  '#2C3E7A', // January — deep navy
  '#8B2252', // February — burgundy rose
  '#3D7A4A', // March — sage green
  '#6B5B8A', // April — dusty lilac
  '#C45E3A', // May — warm coral
  '#B8870A', // June — golden amber
  '#1B6B8A', // July — cerulean blue
  '#A0522D', // August — sienna
  '#7A2C3E', // September — deep wine
  '#B05A1A', // October — burnt orange
  '#4A5568', // November — slate
  '#2D5A3D', // December — forest green
];

export const DEFAULT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490750967868-88df5691cc6e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516912481800-0a4f2af35736?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80&auto=format&fit=crop',
];

// range color slots — warm, distinct, not pastel
const RANGE_COLORS = ['#D94F3D', '#3B82A0', '#5BAD6F', '#E8A838'];

function makeDefaultRanges() {
  return [
    { id: 'r1', label: '', color: RANGE_COLORS[0], startDate: null, endDate: null },
    { id: 'r2', label: '', color: RANGE_COLORS[1], startDate: null, endDate: null },
    { id: 'r3', label: '', color: RANGE_COLORS[2], startDate: null, endDate: null },
    { id: 'r4', label: '', color: RANGE_COLORS[3], startDate: null, endDate: null },
  ];
}

function getInitialState() {
  const today = new Date();
  return {
    currentMonth: today.getMonth(),
    currentYear: today.getFullYear(),
    activeRangeIdx: 0,
    rangeAnchor: null,
    isYearViewOpen: false,
    darkMode: false,
    toastMessage: null,
    past: [],
    present: {
      ranges: makeDefaultRanges(),
      notes: [],
      customImages: {},
    },
    future: [],
  };
}

// pull the saveable bits out of a snapshot (don't save huge base64 in history)
function snapshotPresent(present) {
  return {
    ranges: present.ranges,
    notes: present.notes,
    // not saving customImages in history — too big, gets annoying
    customImages: present.customImages,
  };
}

function pushToHistory(s, newPresent) {
  const newPast = [...s.past, snapshotPresent(s.present)].slice(-50);
  return {
    ...s,
    past: newPast,
    present: newPresent,
    future: [],
  };
}

export function useCalendarState() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem('wcal-state');
      if (saved) {
        const p = JSON.parse(saved);
        const base = getInitialState();
        return {
          ...base,
          currentMonth: p.currentMonth ?? base.currentMonth,
          currentYear: p.currentYear ?? base.currentYear,
          darkMode: p.darkMode ?? false,
          activeRangeIdx: p.activeRangeIdx ?? 0,
          past: p.past ?? [],
          present: {
            ranges: p.present?.ranges ?? makeDefaultRanges(),
            notes: p.present?.notes ?? [],
            customImages: p.present?.customImages ?? {},
          },
          future: p.future ?? [],
        };
      }
    } catch (e) {
      // SSR or storage not available
    }
    return getInitialState();
  });

  // save relevant stuff to localStorage
  useEffect(() => {
    try {
      const toSave = {
        currentMonth: state.currentMonth,
        currentYear: state.currentYear,
        darkMode: state.darkMode,
        activeRangeIdx: state.activeRangeIdx,
        // only keep recent history to keep size manageable
        past: state.past.slice(-15),
        present: state.present,
        future: state.future.slice(0, 10),
      };
      localStorage.setItem('wcal-state', JSON.stringify(toSave));
    } catch (e) {
      // this can fail if customImages are large — not much we can do
    }
  }, [state.currentMonth, state.currentYear, state.darkMode, state.activeRangeIdx,
      state.past, state.present, state.future]);

  // sync dark-mode class on body
  useEffect(() => {
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  }, [state.darkMode]);

  // update the CSS custom property for accent color when month changes
  useEffect(() => {
    const color = MONTH_ACCENT_COLORS[state.currentMonth];
    document.documentElement.style.setProperty('--accent-color', color);
  }, [state.currentMonth]);

  const toastTimer = useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState(s => ({ ...s, toastMessage: msg }));
    toastTimer.current = setTimeout(() => {
      setState(s => ({ ...s, toastMessage: null }));
    }, 1500);
  }

  const undo = useCallback(() => {
    setState(s => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return {
        ...s,
        past: s.past.slice(0, -1),
        present: { ...s.present, ...prev },
        future: [snapshotPresent(s.present), ...s.future].slice(0, 50),
      };
    });
    showToast('Undone');
  }, []);

  const redo = useCallback(() => {
    setState(s => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        ...s,
        past: [...s.past, snapshotPresent(s.present)].slice(-50),
        present: { ...s.present, ...next },
        future: s.future.slice(1),
      };
    });
    showToast('Redone');
  }, []);

  // keyboard undo/redo — listen globally
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const goToPrevMonth = useCallback(() => {
    setState(s => {
      const m = s.currentMonth === 0 ? 11 : s.currentMonth - 1;
      const y = s.currentMonth === 0 ? s.currentYear - 1 : s.currentYear;
      return { ...s, currentMonth: m, currentYear: y, rangeAnchor: null };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setState(s => {
      const m = s.currentMonth === 11 ? 0 : s.currentMonth + 1;
      const y = s.currentMonth === 11 ? s.currentYear + 1 : s.currentYear;
      return { ...s, currentMonth: m, currentYear: y, rangeAnchor: null };
    });
  }, []);

  const goToMonth = useCallback((month, year) => {
    setState(s => ({
      ...s,
      currentMonth: month,
      currentYear: year,
      rangeAnchor: null,
      isYearViewOpen: false,
    }));
  }, []);

  const setActiveRangeIdx = useCallback((idx) => {
    setState(s => ({ ...s, activeRangeIdx: idx }));
  }, []);

  const handleDayClick = useCallback((dateStr) => {
    setState(s => {
      if (!s.rangeAnchor) {
        return { ...s, rangeAnchor: dateStr };
      }

      const anchor = s.rangeAnchor;
      const [start, end] = anchor <= dateStr ? [anchor, dateStr] : [dateStr, anchor];

      const newRanges = s.present.ranges.map((r, i) =>
        i === s.activeRangeIdx ? { ...r, startDate: start, endDate: end } : r
      );
      const newPresent = { ...s.present, ranges: newRanges };
      return pushToHistory({ ...s, rangeAnchor: null }, newPresent);
    });
  }, []);

  const clearRangeAnchor = useCallback(() => {
    setState(s => ({ ...s, rangeAnchor: null }));
  }, []);

  const clearRange = useCallback((idx) => {
    setState(s => {
      const newRanges = s.present.ranges.map((r, i) =>
        i === idx ? { ...r, startDate: null, endDate: null, label: '' } : r
      );
      const newPresent = { ...s.present, ranges: newRanges };
      return pushToHistory(s, newPresent);
    });
  }, []);

  // label changes don't go in history — too noisy
  const updateRangeLabel = useCallback((idx, label) => {
    setState(s => {
      const newRanges = s.present.ranges.map((r, i) =>
        i === idx ? { ...r, label } : r
      );
      return { ...s, present: { ...s.present, ranges: newRanges } };
    });
  }, []);

  const addNote = useCallback((text, color, monthKey) => {
    setState(s => {
      const activeRange = s.present.ranges[s.activeRangeIdx];
      const note = {
        id: `n${Date.now()}`,
        text: text.trim(),
        color,
        rangeId: activeRange.startDate ? activeRange.id : null,
        rangeLabel: activeRange.label || null,
        rangeStart: activeRange.startDate,
        rangeEnd: activeRange.endDate,
        monthKey,
      };
      const newPresent = { ...s.present, notes: [...s.present.notes, note] };
      return pushToHistory(s, newPresent);
    });
  }, []);

  const deleteNote = useCallback((noteId) => {
    setState(s => {
      const newPresent = { ...s.present, notes: s.present.notes.filter(n => n.id !== noteId) };
      return pushToHistory(s, newPresent);
    });
  }, []);

  const reorderNotes = useCallback((fromIdx, toIdx) => {
    setState(s => {
      if (fromIdx === toIdx) return s;
      const notes = [...s.present.notes];
      const [moved] = notes.splice(fromIdx, 1);
      notes.splice(toIdx, 0, moved);
      const newPresent = { ...s.present, notes };
      return pushToHistory(s, newPresent);
    });
  }, []);

  const setCustomImage = useCallback((monthKey, base64) => {
    setState(s => {
      const newImages = { ...s.present.customImages, [monthKey]: base64 };
      const newPresent = { ...s.present, customImages: newImages };
      return pushToHistory(s, newPresent);
    });
  }, []);

  const clearCustomImage = useCallback((monthKey) => {
    setState(s => {
      const newImages = { ...s.present.customImages };
      delete newImages[monthKey];
      const newPresent = { ...s.present, customImages: newImages };
      return pushToHistory(s, newPresent);
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(s => ({ ...s, darkMode: !s.darkMode }));
  }, []);

  const openYearView = useCallback(() => {
    setState(s => ({ ...s, isYearViewOpen: true }));
  }, []);

  const closeYearView = useCallback(() => {
    setState(s => ({ ...s, isYearViewOpen: false }));
  }, []);

  return {
    currentMonth: state.currentMonth,
    currentYear: state.currentYear,
    activeRangeIdx: state.activeRangeIdx,
    rangeAnchor: state.rangeAnchor,
    ranges: state.present.ranges,
    notes: state.present.notes,
    customImages: state.present.customImages,
    darkMode: state.darkMode,
    toastMessage: state.toastMessage,
    isYearViewOpen: state.isYearViewOpen,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    // actions
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    setActiveRangeIdx,
    handleDayClick,
    clearRangeAnchor,
    clearRange,
    updateRangeLabel,
    addNote,
    deleteNote,
    reorderNotes,
    setCustomImage,
    clearCustomImage,
    toggleDarkMode,
    openYearView,
    closeYearView,
    undo,
    redo,
    showToast,
  };
}
