/**
 * Craft-balance radar — Stage E. Six axes (structure/character/dialogue/
 * tone/pace/theme), 0–10. SVG grid + computed shape ported verbatim from the
 * prototype's applyDashboard radar math (centre 110,108; hexagon vertices).
 */

const AXES = [
  { key: 'structure', outer: [110, 18] as const }, // top
  { key: 'character', outer: [187, 63] as const }, // top-right
  { key: 'dialogue', outer: [187, 153] as const }, // bottom-right
  { key: 'tone', outer: [110, 198] as const }, // bottom
  { key: 'pace', outer: [33, 153] as const }, // bottom-left
  { key: 'theme', outer: [33, 63] as const }, // top-left
] as const;

const CX = 110;
const CY = 108;

export function RadarChart({ scores }: { scores: Record<string, number> }) {
  const shapePoints = AXES.map(({ key, outer }) => {
    const v = (scores[key] ?? 5) / 10;
    const x = CX + (outer[0] - CX) * v;
    const y = CY + (outer[1] - CY) * v;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width="280" height="230" viewBox="-30 0 280 230">
      {/* concentric hexagon grid + spokes */}
      <g fill="none" stroke="var(--rule)" strokeWidth="1" opacity=".7">
        <polygon points="110,18 187,63 187,153 110,198 33,153 33,63" />
        <polygon points="110,42 163,72 163,148 110,178 57,148 57,72" />
        <polygon points="110,66 139,81 139,139 110,154 81,139 81,81" />
        <line x1="110" y1="18" x2="110" y2="198" />
        <line x1="187" y1="63" x2="33" y2="153" />
        <line x1="187" y1="153" x2="33" y2="63" />
      </g>
      {/* axis labels */}
      <text x="110" y="10" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--ink-soft)" letterSpacing="1">STRUCTURE</text>
      <text x="200" y="62" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--ink-soft)" letterSpacing="0.5">CHARACTER</text>
      <text x="200" y="158" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--ink-soft)" letterSpacing="0.5">DIALOGUE</text>
      <text x="110" y="213" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--ink-soft)" letterSpacing="1">TONE</text>
      <text x="18" y="158" textAnchor="end" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--ink-soft)" letterSpacing="0.5">PACE</text>
      <text x="18" y="62" textAnchor="end" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--ink-soft)" letterSpacing="0.5">THEME</text>
      {/* the work's shape */}
      <polygon
        points={shapePoints}
        fill="rgba(168,108,16,.15)"
        stroke="var(--amber)"
        strokeWidth="1.5"
      />
      <circle cx="110" cy="108" r="2.5" fill="var(--amber)" />
    </svg>
  );
}
