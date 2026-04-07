import { useRef, useState, useCallback } from 'react';
import { MONTH_NAMES, DEFAULT_HERO_IMAGES } from './useCalendarState';
import styles from './calendar.module.css';

// hero panel — left side image with month name + nav arrows + drag/drop upload
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
  const defaultSrc = DEFAULT_HERO_IMAGES[currentMonth];
  const imageSrc = customSrc || defaultSrc;

  function readImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onSetCustomImage(monthKey, e.target.result);
    };
    reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    readImageFile(file);
  }, [monthKey]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  function handleFileInputChange(e) {
    const file = e.target.files[0];
    readImageFile(file);
    // reset so same file can be re-uploaded
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

      {/* drag-drop overlay */}
      {isDragOver && (
        <div className={styles.heroDragOverlay}>
          <p className={styles.heroDragText}>Drop to set as cover</p>
        </div>
      )}

      <div className={styles.heroContent}>
        <h2 className={styles.heroMonthName}>{MONTH_NAMES[currentMonth]}</h2>
        <p className={styles.heroYear}>{currentYear}</p>
      </div>

      {/* prev arrow */}
      <button
        className={styles.heroPrevBtn}
        onClick={onPrev}
        aria-label="Previous month"
      >
        ‹
      </button>

      {/* next arrow */}
      <button
        className={styles.heroNextBtn}
        onClick={onNext}
        aria-label="Next month"
      >
        ›
      </button>

      {/* camera upload button */}
      <button
        className={styles.heroUploadBtn}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload custom photo"
        title="Upload photo"
      >
        {/* unicode camera symbol */}
        &#128247;
      </button>

      {/* reset button — only shows when custom image is active */}
      {customSrc && (
        <button
          className={styles.heroResetBtn}
          onClick={() => onClearCustomImage(monthKey)}
          aria-label="Reset to default photo"
        >
          Reset
        </button>
      )}

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
