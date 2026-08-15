'use client';

import type { Project } from '@/types';

/**
 * Abstract motifs, one per project. These are DECORATION ONLY — deliberately
 * geometric rather than chart-like, with no axes, values or legends, so
 * nothing here can be mistaken for real project results. The résumé states no
 * outcome metrics, so none are depicted.
 */
export function ProjectVisual({ variant }: { variant: Project['visual'] }) {
  const stroke = 'rgba(232,222,200,0.28)';
  const faint = 'rgba(232,222,200,0.12)';
  const gold = 'rgba(216,192,138,0.55)';

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 320 200"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Shared hairline grid */}
      <g stroke={faint} strokeWidth="0.5">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 28} x2="320" y2={i * 28} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={i * 36} y1="0" x2={i * 36} y2="200" />
        ))}
      </g>

      {variant === 'text' && (
        // Token stream: rows of varying-length bars, a few picked out in gold.
        <g>
          {Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 6 }, (_, c) => {
              const w = 12 + ((r * 7 + c * 13) % 26);
              const flagged = (r * 6 + c) % 11 === 0;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={16 + c * 48}
                  y={22 + r * 17}
                  width={w}
                  height="3"
                  fill={flagged ? gold : stroke}
                />
              );
            }),
          )}
        </g>
      )}

      {variant === 'flow' && (
        // Directed flow: nodes joined left-to-right with connectors.
        <g>
          {Array.from({ length: 4 }, (_, i) => (
            <g key={i}>
              <line
                x1={40 + i * 72}
                y1={100 - (i % 2 === 0 ? 26 : -26)}
                x2={112 + i * 72}
                y2={100 - (i % 2 === 0 ? -26 : 26)}
                stroke={stroke}
                strokeWidth="0.75"
              />
              <rect
                x={30 + i * 72}
                y={90 - (i % 2 === 0 ? 26 : -26)}
                width="20"
                height="20"
                fill="none"
                stroke={i === 2 ? gold : stroke}
                strokeWidth="0.9"
              />
            </g>
          ))}
          <rect x={246} y={90} width="20" height="20" fill="none" stroke={stroke} strokeWidth="0.9" />
        </g>
      )}

      {variant === 'finance' && (
        // Paired vertical rules of differing heights — proportion as a motif,
        // not a bar chart: no baseline, no scale, no labels.
        <g>
          {Array.from({ length: 14 }, (_, i) => {
            const h = 18 + ((i * 29) % 62);
            return (
              <g key={i}>
                <line
                  x1={22 + i * 21}
                  y1={100 - h / 2}
                  x2={22 + i * 21}
                  y2={100 + h / 2}
                  stroke={i % 5 === 2 ? gold : stroke}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
          <circle cx="160" cy="100" r="46" fill="none" stroke={faint} strokeWidth="0.75" />
        </g>
      )}

      {variant === 'database' && (
        // Relational blocks: stacked table-like groups with join lines.
        <g>
          {Array.from({ length: 3 }, (_, g) => (
            <g key={g}>
              <rect
                x={26 + g * 100}
                y={52}
                width="70"
                height="96"
                fill="none"
                stroke={g === 1 ? gold : stroke}
                strokeWidth="0.9"
              />
              {Array.from({ length: 5 }, (_, r) => (
                <line
                  key={r}
                  x1={26 + g * 100}
                  y1={68 + r * 16}
                  x2={96 + g * 100}
                  y2={68 + r * 16}
                  stroke={faint}
                  strokeWidth="0.6"
                />
              ))}
            </g>
          ))}
          <line x1="96" y1="84" x2="126" y2="116" stroke={stroke} strokeWidth="0.75" />
          <line x1="196" y1="116" x2="226" y2="84" stroke={stroke} strokeWidth="0.75" />
        </g>
      )}
    </svg>
  );
}
