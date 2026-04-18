import { type CSSProperties, useMemo } from 'react';
import { renderDeco } from './decorations';

export type PigMood = 'happy' | 'sleepy' | 'sad' | 'excited' | 'wink';

interface PigMascotProps {
  size?: number;
  mood?: PigMood;
  bounce?: boolean;
  deco?: string[];
  photoUrl?: string;
}

interface EyeProps {
  x: number;
  isRight?: boolean;
  mood: PigMood;
}

function Eye({ x, isRight = false, mood }: EyeProps) {
  if (mood === 'sleepy') {
    return (
      <path
        d={`M${x - 9} 86 Q${x} 92 ${x + 9} 86`}
        stroke="#3D2A4E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (mood === 'sad') {
    return (
      <g>
        <circle cx={x} cy={87} r={6} fill="#3D2A4E" />
        <circle cx={x + 2} cy={85} r={1.8} fill="#fff" />
        <path
          d={`M${x - 2} 94 Q${x - 4} 100 ${x - 2} 104 Q${x} 100 ${x - 2} 94Z`}
          fill="#7FC6E8"
        />
      </g>
    );
  }
  if (mood === 'excited') {
    return (
      <g>
        <path
          d={`M${x - 8} 82 L${x} 72 L${x + 8} 82`}
          stroke="#3D2A4E"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx={x} cy={88} r={4} fill="#3D2A4E" />
      </g>
    );
  }
  if (mood === 'wink' && isRight) {
    return (
      <path
        d={`M${x - 8} 87 Q${x} 83 ${x + 8} 87`}
        stroke="#3D2A4E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <g>
      <circle cx={x} cy={86} r={7} fill="#3D2A4E" />
      <circle cx={x + 2.5} cy={83.5} r={2.2} fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: PigMood }) {
  if (mood === 'sad') {
    return (
      <path
        d="M110 128 Q124 120 138 128"
        stroke="#6B3F52"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (mood === 'excited') {
    return (
      <path
        d="M106 120 Q124 140 142 120 Q142 132 124 134 Q106 132 106 120Z"
        fill="#C9466F"
      />
    );
  }
  if (mood === 'sleepy') {
    return (
      <path
        d="M116 128 Q124 131 132 128"
        stroke="#6B3F52"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <path
      d="M112 126 Q124 134 136 126"
      stroke="#6B3F52"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
  );
}

export function PigMascot({
  size = 220,
  mood = 'happy',
  bounce = true,
  deco = [],
  photoUrl,
}: PigMascotProps) {
  const bodyFill = '#FFB7CD';
  const bodyShade = '#F494B2';
  const snout = '#FFA4BF';
  const cheek = 'rgba(233,110,156,0.55)';
  const coinSlot = '#6B3F52';
  const photoClip = useMemo(() => `pig-photo-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <div
      style={{ width: size, height: size, display: 'inline-block' }}
      className={bounce ? 'pig-idle' : ''}
    >
      <svg viewBox="0 0 248 220" width={size} height={size}>
        <defs>
          <radialGradient id="pigShadow" cx="50%" cy="95%" r="60%">
            <stop offset="0%" stopColor="#F27CA7" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#F27CA7" stopOpacity="0" />
          </radialGradient>
          {photoUrl && (
            <clipPath id={photoClip}>
              <ellipse cx={124} cy={128} rx={86} ry={66} />
            </clipPath>
          )}
        </defs>

        <ellipse cx={124} cy={202} rx={78} ry={8} fill="rgba(61,42,78,0.15)" />

        <rect x={74} y={168} width={26} height={32} rx={10} fill={bodyShade} />
        <rect x={148} y={168} width={26} height={32} rx={10} fill={bodyShade} />

        <ellipse cx={124} cy={128} rx={96} ry={72} fill={bodyFill} />
        <ellipse cx={124} cy={128} rx={96} ry={72} fill="url(#pigShadow)" opacity={0.3} />

        {photoUrl && (
          <image
            href={photoUrl}
            x={38}
            y={62}
            width={172}
            height={132}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${photoClip})`}
            opacity={0.95}
          />
        )}

        <path
          d="M218 120 Q236 112 232 98 Q228 88 216 94"
          stroke={bodyShade}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />

        <path d="M62 78 Q56 56 76 58 Q84 72 78 90 Z" fill={bodyShade} />
        <path d="M186 78 Q192 56 172 58 Q164 72 170 90 Z" fill={bodyShade} />
        <path d="M66 74 Q64 62 74 64" fill="#F47DA1" />
        <path d="M182 74 Q184 62 174 64" fill="#F47DA1" />

        <rect x={108} y={56} width={32} height={6} rx={3} fill={coinSlot} />
        <rect x={108} y={56} width={32} height={2.5} rx={1.2} fill="#4A2638" />

        {!photoUrl && (
          <>
            <ellipse cx={124} cy={122} rx={34} ry={24} fill={snout} />
            <ellipse cx={114} cy={118} rx={3.5} ry={5} fill={coinSlot} />
            <ellipse cx={134} cy={118} rx={3.5} ry={5} fill={coinSlot} />

            <circle cx={82} cy={118} r={10} fill={cheek} />
            <circle cx={166} cy={118} r={10} fill={cheek} />

            <Eye x={96} mood={mood} />
            <Eye x={152} isRight mood={mood} />

            <Mouth mood={mood} />
          </>
        )}

        {renderDeco(deco)}
      </svg>
    </div>
  );
}

interface CoinProps {
  size?: number;
  spin?: boolean;
  style?: CSSProperties;
}

export function Coin({ size = 44, spin = false, style }: CoinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={spin ? { animation: 'wiggle 1.2s ease-in-out infinite', ...style } : style}
    >
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFE8A0" />
          <stop offset="60%" stopColor="#F5C849" />
          <stop offset="100%" stopColor="#C9921B" />
        </radialGradient>
      </defs>
      <circle cx={24} cy={24} r={22} fill="url(#coinGrad)" />
      <circle
        cx={24}
        cy={24}
        r={18}
        fill="none"
        stroke="#B07A14"
        strokeWidth={1.5}
        strokeDasharray="2 2"
        opacity={0.5}
      />
      <text
        x={24}
        y={30}
        textAnchor="middle"
        fontSize={18}
        fontWeight={900}
        fontFamily="'M PLUS Rounded 1c', system-ui"
        fill="#8B5E11"
      >
        ¥
      </text>
    </svg>
  );
}

interface CoinRainProps {
  count?: number;
  trigger: number;
}

export function CoinRain({ count = 18, trigger }: CoinRainProps) {
  const coins = useMemo(() => (
    Array.from({ length: count }).map((_, i) => ({
      id: `${trigger}-${i}`,
      left: `${Math.random() * 90 + 2}%`,
      x: `${(Math.random() - 0.5) * 80}px`,
      delay: `${Math.random() * 0.6}s`,
      dur: `${1.6 + Math.random() * 1.2}s`,
      size: 26 + Math.random() * 22,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [trigger]);
  if (!trigger) return null;
  return (
    <div
      key={trigger}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {coins.map(c => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            top: 0,
            left: c.left,
            ['--coin-x' as string]: c.x,
            animation: `coin-fall ${c.dur} ${c.delay} ease-in forwards`,
          } as CSSProperties}
        >
          <Coin size={c.size} />
        </div>
      ))}
    </div>
  );
}

interface SparkleProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Sparkle({ size = 24, color = '#FFE79C', style, className }: SparkleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className}>
      <path
        d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
        fill={color}
      />
    </svg>
  );
}
