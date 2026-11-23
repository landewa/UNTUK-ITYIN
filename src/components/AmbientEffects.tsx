import React, { useMemo } from 'react';

interface PetalConfig {
  id: number;
  leftPercent: number;
  size: number;
  duration: number;
  delay: number;
  variant: 'petal' | 'heart' | 'spark';
}

export const AmbientEffects: React.FC<{ enabled: boolean; isDark: boolean }> = ({
  enabled,
  isDark,
}) => {
  const items = useMemo<PetalConfig[]>(
    () =>
      Array.from({ length: 14 }, (_, idx) => ({
        id: idx,
        leftPercent: (idx * 7.3 + 4) % 96,
        size: 10 + (idx % 4) * 3,
        duration: 13 + (idx % 5) * 3,
        delay: (idx % 7) * -2.2,
        variant: idx % 5 === 0 ? 'heart' : idx % 4 === 0 && isDark ? 'spark' : 'petal',
      })),
    [isDark],
  );

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-10"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-petal absolute -top-8"
          style={{
            left: `${item.leftPercent}%`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.variant === 'heart' ? (
            <svg
              width={item.size}
              height={item.size}
              viewBox="0 0 24 24"
              fill="#FFB6CB"
              className="opacity-70"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : item.variant === 'spark' ? (
            <span
              className="block rounded-full bg-[#B3D9F2]/75"
              style={{ width: item.size * 0.45, height: item.size * 0.45 }}
            />
          ) : (
            <svg
              width={item.size}
              height={item.size * 0.75}
              viewBox="0 0 24 18"
              fill="none"
              className="opacity-75"
            >
              <path
                d="M12 1C6 1 1 5.5 1 10.5C1 14.5 5 17 11 17C17 17 23 12 23 6.5C23 2.5 18 1 12 1Z"
                fill="#FFB6CB"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};
