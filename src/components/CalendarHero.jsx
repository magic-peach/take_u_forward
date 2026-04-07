import { useRef, useState, useCallback } from 'react';
import { MONTH_NAMES, DEFAULT_HERO_IMAGES } from './useCalendarState';
import styles from './calendar.module.css';

// inline camera SVG — no icon library needed
function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

export default function CalendarHero({
  currentMonth,
  currentYear,
  customImages,
  onPrev,
  onNext,
  onSetCustomImage,
  onClearCustomImage,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const customSrc = customImages[monthKey];
  const imageSrc = customSrc || DEFAULT_HERO_IMAGES[currentMonth];

  function readImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onSetCustomImage(monthKey, e.target.result);
    reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    readImageFile(e.dataTransfer.files[0]);
  }, [monthKey]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  function handleFileChange(e) {
    readImageFile(e.target.files[0]);
    e.target.value = '';
  }

  return (
    <div
      className={styles.heroPanel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.heroImg}
        src={imageSrc}
        alt={`${MONTH_NAMES[currentMonth]} ${currentYear}`}
        draggable="false"
      />

      <div className={styles.heroGradient} />

      {isDragOver && (
        <div className={styles.heroDragOverlay}>
          <p className={styles.heroDragText}>Drop to set as cover</p>
        </div>
      )}

      {/* year above month name, both bottom-left */}
      <div className={styles.heroContent}>
        <p className={styles.heroYear}>{currentYear}</p>
        <h2 className={styles.heroMonthName}>{MONTH_NAMES[currentMonth]}</h2>
      </div>

      <button className={styles.heroPrevBtn} onClick={onPrev} aria-label="Previous month">
        ‹
      </button>
      <button className={styles.heroNextBtn} onClick={onNext} aria-label="Next month">
        ›
      </button>

      <button
        className={styles.heroUploadBtn}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload custom photo"
        title="Upload photo"
      >
        <CameraIcon />
      </button>

      {customSrc && (
        <button
          className={styles.heroResetBtn}
          onClick={() => onClearCustomImage(monthKey)}
          aria-label="Reset to default photo"
        >
          Reset
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
