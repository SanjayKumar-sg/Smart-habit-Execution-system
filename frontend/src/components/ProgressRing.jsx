export default function ProgressRing({ percent = 0, size = 140, strokeWidth = 10, color = '#7C3AED', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const center = size / 2;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="progress-ring-label">
        {label !== undefined && (
          <div style={{ fontSize: size > 100 ? '1.6rem' : '1.1rem', fontWeight: 800, lineHeight: 1 }}>{label}</div>
        )}
        {sublabel && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}
