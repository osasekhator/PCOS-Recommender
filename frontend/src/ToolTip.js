import { useState } from 'react';
import { giColor} from './helpers';

export function PCOSTooltip({ explanation }) {
  const [open, setOpen] = useState(false);
  const lines = Array.isArray(explanation)
    ? explanation
    : [explanation];

  return (
    <span className="tooltip-wrap">
      <button
        className="tooltip-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Why PCOS-friendly?"
      >
        ?
      </button>
      {open && (
        <div className="tooltip-box" role="tooltip">
          <button className="tooltip-close" onClick={() => setOpen(false)}>✕</button>
          <strong>Why PCOS-friendly?</strong>
          <ul>
            {lines.map((l, i) => <li key={i}>{l.replace(/\n/g, '')}</li>)}
          </ul>
        </div>
      )}
    </span>
  );
}
export function GIBar({ gi }) {
  const pct = Math.min(100, Math.max(0, gi));
  const cls = giColor(gi);
  return (
    <div className="gi-bar-wrap" title={`GI: ${gi}`}>
      <div className={`gi-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      <span className="gi-bar-label">{gi}</span>
    </div>
  );
}