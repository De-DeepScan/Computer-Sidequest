import { useState, useEffect } from 'react';
import './ScreenBoot.css';

interface ScreenBootProps {
  /** Called when the full animation is complete */
  onComplete?: () => void;
  /** Total animation duration in ms (default: 2400) */
  duration?: number;
}

/**
 * CRT screen power-on animation.
 * Sequence:
 *   1. Horizontal line expands across screen
 *   2. Central glow node + halo + lens flare
 *   3. Full-screen white flash
 *   4. Screen "opens" — two halves (top/bottom) slide apart revealing content
 */
export default function ScreenBoot({ onComplete, duration = 2400 }: ScreenBootProps) {
  const [phase, setPhase] = useState<'line' | 'opening' | 'removed'>('line');

  useEffect(() => {
    // After flash peak, start the split-open
    const openTimer = setTimeout(() => {
      setPhase('opening');
    }, 1300);

    // Animation fully done
    const removeTimer = setTimeout(() => {
      setPhase('removed');
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onComplete]);

  if (phase === 'removed') return null;

  return (
    <div className={`screen-boot ${phase === 'line' ? 'boot-solid' : ''}`}>
      {/* Phase 1–3: line, glow, flare on black background */}
      {phase === 'line' && (
        <>
          <div className="boot-line" />
          <div className="boot-glow" />
          <div className="boot-halo" />
          <div className="boot-flare" />
        </>
      )}

      {/* Phase 4: Two halves split open */}
      {phase === 'opening' && (
        <>
          <div className="boot-half boot-half-top" />
          <div className="boot-half boot-half-bottom" />
          {/* Bright seam glow along the split */}
          <div className="boot-seam" />
        </>
      )}
    </div>
  );
}
