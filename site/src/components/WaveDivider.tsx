'use client';

interface WaveDividerProps {
  topColor?: string;
  bottomColor?: string;
  showJetSki?: boolean;
}

const JETSKI_CONFIGS = [
  { ride: 'jetski-ride-1', bob: 'jetski-bob-1', wake: 'jetski-wake-1', size: 80, bottom: '40%', id: 'a' },
  { ride: 'jetski-ride-2', bob: 'jetski-bob-2', wake: 'jetski-wake-2', size: 65, bottom: '28%', id: 'b' },
];

function JetSkiSVG({ id, size }: { id: string; size: number }) {
  const gid = `g${id}`;
  return (
    <svg
      viewBox="0 0 140 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 0.57}
      className="drop-shadow-[0_6px_20px_rgba(255,107,0,0.4)]"
    >
      <defs>
        <linearGradient id={`hull-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="50%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#E55A00" />
        </linearGradient>
        <linearGradient id={`hullB-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D44E00" />
          <stop offset="100%" stopColor="#B33F00" />
        </linearGradient>
        <linearGradient id={`visor-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7DF9FF" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
      </defs>
      {/* Front spray */}
      <g opacity="0.5" className="front-spray">
        <circle cx="128" cy="50" r="2" fill="white" opacity="0.4" />
        <circle cx="133" cy="46" r="1.5" fill="white" opacity="0.3" />
        <path d="M125,52 Q130,48 135,50" stroke="white" strokeWidth="0.8" fill="none" opacity="0.3" />
      </g>
      {/* Hull */}
      <path d="M10,54 L18,52 L95,42 Q110,40 120,42 L130,46 Q135,49 132,52 L125,56 Q118,58 105,58 L20,58 Q12,58 10,56 Z" fill={`url(#hull-${gid})`} />
      <path d="M18,55 L105,52 Q118,52 125,54 L128,56 Q120,58 105,58 L20,58 Q14,58 18,55 Z" fill={`url(#hullB-${gid})`} />
      <path d="M25,54 L100,48 Q112,47 118,49 L122,51 Q115,53 100,54 L25,56 Z" fill="white" opacity="0.15" />
      <text x="65" y="54" fontFamily="Arial" fontWeight="900" fontSize="6" fill="white" opacity="0.8" textAnchor="middle">PRIZE</text>
      {/* Deck */}
      <path d="M35,48 L85,40 Q95,39 100,40 L105,42 Q107,44 104,46 L95,48 L35,52 Q30,52 30,50 Z" fill="#1A1A2E" />
      <path d="M42,47 L80,41 Q85,40 88,41 L90,42 Q88,44 82,45 L42,49 Q39,49 42,47 Z" fill="#2D2D44" />
      {/* Windshield */}
      <path d="M92,40 L100,34 Q103,32 106,34 L108,38 Q106,40 102,41 L94,41 Z" fill={`url(#visor-${gid})`} opacity="0.85" />
      <path d="M96,37 L101,34 Q103,33 104,35" stroke="white" strokeWidth="0.6" fill="none" opacity="0.5" />
      {/* Handlebars */}
      <path d="M98,38 L103,32 M100,38 L105,32" stroke="#666" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="103" cy="31" r="1.5" fill="#888" /><circle cx="105" cy="31" r="1.5" fill="#888" />
      {/* Rider */}
      <path d="M60,34 Q55,28 58,22 L68,20 Q75,22 72,28 L75,36 Q70,40 62,38 Z" fill="#FF6B00" />
      <path d="M62,24 L65,24 L66,34 L61,34 Z" fill="#E55A00" opacity="0.5" />
      {/* Helmet */}
      <path d="M62,22 Q58,18 60,12 Q63,8 70,10 Q74,12 73,18 Q72,22 68,22 Z" fill="#1A1A2E" />
      <path d="M65,14 Q68,12 73,14 Q72,17 69,18 Q66,18 65,16 Z" fill={`url(#visor-${gid})`} opacity="0.7" />
      <path d="M63,13 Q64,10 68,10" stroke="white" strokeWidth="0.6" fill="none" opacity="0.4" />
      {/* Arms */}
      <path d="M72,24 Q82,26 98,34" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M72,24 Q82,26 98,34" stroke="#E55A00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <path d="M58,34 Q50,40 45,46" stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M56,36 Q48,42 44,48" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="44" cy="47" r="2" fill="#111" /><circle cx="43" cy="49" r="2" fill="#111" />
      {/* Nozzle */}
      <ellipse cx="14" cy="54" rx="4" ry="2.5" fill="#333" />
      <ellipse cx="12" cy="54" rx="2" ry="1.5" fill="#555" />
      <path d="M15,58 Q70,56 130,52" stroke="white" strokeWidth="0.5" fill="none" opacity="0.15" />
    </svg>
  );
}

export default function WaveDivider({
  topColor = 'rgb(var(--c-s-900))',
  bottomColor = 'rgb(var(--c-s-950))',
  showJetSki = false,
}: WaveDividerProps) {
  const waveTeal = '#2A9D8F';
  const waveTealDark = '#1F7A6D';
  const waveTealDeep = '#176B5D';

  return (
    <div
      className="relative w-full overflow-hidden leading-[0] h-[80px] sm:h-[100px] lg:h-[120px]"
      style={{ background: topColor }}
    >
      {/* Wave layer 1 */}
      <div className="absolute inset-0 wave-scroll-slow">
        <svg viewBox="0 0 2400 200" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 h-full" style={{ width: '200%' }} preserveAspectRatio="none">
          <path d="M0,100 C150,40 300,140 600,80 C900,20 1050,160 1200,100 C1350,40 1500,140 1800,80 C2100,20 2250,160 2400,100 L2400,200 L0,200 Z" fill={waveTeal} opacity="0.45" />
        </svg>
      </div>
      {/* Wave layer 2 */}
      <div className="absolute inset-0 wave-scroll-mid">
        <svg viewBox="0 0 2400 200" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 h-full" style={{ width: '200%' }} preserveAspectRatio="none">
          <path d="M0,120 C200,60 350,160 600,100 C850,40 1000,150 1200,120 C1400,60 1550,160 1800,100 C2050,40 2200,150 2400,120 L2400,200 L0,200 Z" fill={waveTealDark} opacity="0.65" />
        </svg>
      </div>

      {/* Multiple Jet Skis */}
      {showJetSki && JETSKI_CONFIGS.map((cfg) => (
        <div key={cfg.id} className={`absolute inset-0 z-10 pointer-events-none ${cfg.ride}`}>
          <div className={`${cfg.bob} absolute`} style={{ bottom: cfg.bottom, width: cfg.size, height: cfg.size * 0.57 }}>
            {/* Wake spray */}
            <div className={`absolute -left-4 bottom-0 w-10 h-7 ${cfg.wake}`}>
              <svg viewBox="0 0 50 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <ellipse cx="25" cy="22" rx="22" ry="8" fill="white" opacity="0.25" />
                <ellipse cx="20" cy="18" rx="14" ry="5" fill="white" opacity="0.2" />
                <circle cx="10" cy="14" r="3" fill="white" opacity="0.3" className="spray-drop-1" />
                <circle cx="5" cy="10" r="2" fill="white" opacity="0.25" className="spray-drop-2" />
                <circle cx="15" cy="8" r="2.5" fill="white" opacity="0.2" className="spray-drop-3" />
              </svg>
            </div>
            <JetSkiSVG id={cfg.id} size={cfg.size} />
          </div>
        </div>
      ))}

      {/* Wave layer 3 */}
      <div className="absolute inset-0 wave-scroll-fast">
        <svg viewBox="0 0 2400 200" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 h-full" style={{ width: '200%' }} preserveAspectRatio="none">
          <path d="M0,140 C100,100 250,170 500,130 C750,90 900,165 1200,140 C1500,100 1650,170 1900,130 C2150,90 2300,165 2400,140 L2400,200 L0,200 Z" fill={waveTealDeep} opacity="0.85" />
        </svg>
      </div>
      {/* Wave layer 4 */}
      <div className="absolute inset-0 wave-scroll-front">
        <svg viewBox="0 0 2400 200" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 h-full" style={{ width: '200%' }} preserveAspectRatio="none">
          <path d="M0,160 C150,135 300,180 600,155 C900,130 1050,175 1200,160 C1350,135 1500,180 1800,155 C2100,130 2250,175 2400,160 L2400,200 L0,200 Z" fill={bottomColor} />
        </svg>
      </div>
      {/* Anti-gap strip */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-20" style={{ background: bottomColor }} />
    </div>
  );
}
