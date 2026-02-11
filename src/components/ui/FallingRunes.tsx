// src/components/ui/FallingRunes.tsx
/**
 * Falling Runes Background Effect
 * ================================
 * Canvas-based animation of white Elder Futhark runes falling like rain.
 * Respects theme — more visible in dark mode, subtle in light mode.
 */

import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Elder Futhark runes
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛞᛟ';

interface Column {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

export default function FallingRunes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 14;
    let columns: Column[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initColumns();
    };

    const initColumns = () => {
      const colCount = Math.floor(canvas.width / (fontSize * 1.5));
      columns = [];
      for (let i = 0; i < colCount; i++) {
        columns.push(createColumn(i, true));
      }
    };

    const createColumn = (index: number, randomStart: boolean): Column => {
      const length = 4 + Math.floor(Math.random() * 8);
      const chars: string[] = [];
      for (let j = 0; j < length; j++) {
        chars.push(RUNES[Math.floor(Math.random() * RUNES.length)]);
      }
      return {
        x: index * fontSize * 1.5 + fontSize,
        y: randomStart ? -Math.random() * canvas.height * 2 : -length * fontSize,
        speed: 0.3 + Math.random() * 0.7,
        chars,
        length,
        opacity: 0.03 + Math.random() * 0.07,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        for (let j = 0; j < col.chars.length; j++) {
          const charY = col.y + j * fontSize;
          if (charY < -fontSize || charY > canvas.height + fontSize) continue;

          // Fade: head is brightest, tail fades out
          const headDist = col.chars.length - 1 - j;
          const fadeFactor = headDist === 0 ? 1.0 : Math.max(0, 1 - headDist / col.chars.length);
          const alpha = col.opacity * fadeFactor * (isLight ? 0.6 : 1.0);

          if (isLight) {
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          }
          ctx.fillText(col.chars[j], col.x, charY);
        }

        col.y += col.speed;

        // Reset column when it goes off screen
        if (col.y - col.length * fontSize > canvas.height) {
          columns[i] = createColumn(i, false);
        }

        // Occasionally mutate a random char
        if (Math.random() < 0.002) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = RUNES[Math.floor(Math.random() * RUNES.length)];
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    animRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[2] pointer-events-none w-full h-full"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
