export default function AspirationBanner({ from = 'Engineering', to = 'Data Analyst', subtitle = "You're Halfway There, Keep Going!!" }: { from?: string; to?: string; subtitle?: string }) {
  return (
    <div style={{
      width: '100%', height: '180px',
      background: 'linear-gradient(135deg, #7B6FE0 0%, #9B8FF5 100%)',
      borderRadius: '16px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Background ghost circle */}
      <div style={{
        position: 'absolute', width: '320px', height: '320px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)', top: '50%', left: '38%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: '22px', left: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>My Aspiration Tracker</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>{subtitle}</div>
      </div>

      {/* Stars */}
      <div style={{ position: 'absolute', top: '18px', right: '155px', display: 'flex', gap: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </div>

      {/* Road SVG — tapered perspective road */}
      <svg
        viewBox="0 0 700 180"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '75%', height: '100%' }}
      >
        {/* Road shadow/base — tapered shape */}
        <path
          d="M 20 155 Q 120 120 340 105 Q 480 96 600 88 L 600 100 Q 480 108 340 117 Q 120 134 20 170 Z"
          fill="rgba(0,0,0,0.15)"
        />

        {/* White road (remaining) */}
        <path
          d="M 20 152 Q 120 117 340 102 Q 480 93 600 85 L 600 97 Q 480 105 340 114 Q 120 131 20 168 Z"
          fill="rgba(255,255,255,0.55)"
        />

        {/* Green road (progress ~50%) */}
        <path
          d="M 20 152 Q 100 125 230 112 Q 290 108 330 106 L 330 118 Q 290 120 230 124 Q 100 137 20 168 Z"
          fill="#4ADE80"
        />

        {/* Dashed center line — green portion */}
        <path d="M 30 160 Q 120 131 280 112" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none" strokeDasharray="14 8" strokeLinecap="round"/>
        {/* Dashed center line — white portion */}
        <path d="M 320 108 Q 460 99 580 91" stroke="rgba(180,180,180,0.5)" strokeWidth="2" fill="none" strokeDasharray="14 8" strokeLinecap="round"/>

        {/* From pin */}
        <circle cx="22" cy="160" r="13" fill="#fff" />
        <circle cx="22" cy="160" r="6"  fill="#7B6FE0" />

        {/* To pin */}
        <circle cx="590" cy="91" r="9"  fill="#fff" />
        <circle cx="590" cy="91" r="4"  fill="#7B6FE0" />

        {/* From label */}
        <text x="22" y="180" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">{from}</text>

        {/* To label — above the pin */}
        <text x="590" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{to}</text>
      </svg>

      {/* Dartboard */}
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Rings */}
          <circle cx="65" cy="65" r="60" fill="#F97316" />
          <circle cx="65" cy="65" r="48" fill="#fff" />
          <circle cx="65" cy="65" r="36" fill="#EF4444" />
          <circle cx="65" cy="65" r="24" fill="#fff" />
          <circle cx="65" cy="65" r="14" fill="#EF4444" />
          <circle cx="65" cy="65" r="6"  fill="#fff" />
          {/* Dart shaft */}
          <line x1="100" y1="22" x2="67" y2="62" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round"/>
          {/* Dart tip */}
          <polygon points="67,62 61,57 72,55" fill="#7C3AED" />
          {/* Dart tail fins */}
          <line x1="100" y1="22" x2="108" y2="13" stroke="#EC4899" strokeWidth="4" strokeLinecap="round"/>
          <line x1="104" y1="18" x2="112" y2="26" stroke="#EC4899" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
