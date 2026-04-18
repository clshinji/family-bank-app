import type { ReactElement } from 'react';

export type DecoCategory = 'hat' | 'face' | 'neck' | 'sticker';

export const DECO_CATALOG: Record<string, { cat: DecoCategory; name: string }> = {
  hat_crown: { cat: 'hat', name: 'おうかん' },
  hat_cap: { cat: 'hat', name: 'キャップ' },
  hat_ribbon: { cat: 'hat', name: 'リボン' },
  hat_flower: { cat: 'hat', name: 'おはな' },
  glasses_round: { cat: 'face', name: 'まるメガネ' },
  glasses_heart: { cat: 'face', name: 'ハートめがね' },
  glasses_star: { cat: 'face', name: 'ほしめがね' },
  scarf_red: { cat: 'neck', name: 'マフラー' },
  scarf_mint: { cat: 'neck', name: 'ミントマフラー' },
  bowtie: { cat: 'neck', name: 'ちょうネクタイ' },
  sticker_star: { cat: 'sticker', name: 'ほしシール' },
  sticker_heart: { cat: 'sticker', name: 'ハートシール' },
  sticker_cloud: { cat: 'sticker', name: 'くもシール' },
  sticker_flower: { cat: 'sticker', name: 'おはなシール' },
};

const DECO_SVG: Record<string, ReactElement> = {
  hat_crown: (
    <g>
      <path
        d="M88 38 L100 20 L112 34 L124 14 L136 34 L148 20 L160 38 L156 52 L92 52 Z"
        fill="#F5C849"
        stroke="#B07A14"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={100} cy={22} r={3} fill="#E54A5F" />
      <circle cx={124} cy={16} r={3} fill="#4A9FE5" />
      <circle cx={148} cy={22} r={3} fill="#34C759" />
      <rect x={92} y={48} width={64} height={6} fill="#E0A525" />
    </g>
  ),
  hat_cap: (
    <g>
      <path d="M86 50 Q86 22 124 22 Q162 22 162 50 Z" fill="#4A9FE5" />
      <path
        d="M86 50 Q86 22 124 22 Q162 22 162 50 Z"
        fill="url(#capShade)"
        opacity={0.4}
      />
      <path
        d="M76 50 Q124 42 172 50 L172 56 Q124 50 76 56 Z"
        fill="#2F7AC4"
      />
      <circle cx={124} cy={32} r={5} fill="#FFE79C" />
      <defs>
        <linearGradient id="capShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
    </g>
  ),
  hat_ribbon: (
    <g>
      <path
        d="M100 44 Q96 28 112 30 Q120 34 124 44 Q128 34 136 30 Q152 28 148 44 Q140 52 124 50 Q108 52 100 44Z"
        fill="#F27CA7"
      />
      <ellipse cx={124} cy={46} rx={7} ry={6} fill="#C94E7E" />
      <path
        d="M118 52 Q116 60 112 64 M130 52 Q132 60 136 64"
        stroke="#F27CA7"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  ),
  hat_flower: (
    <g>
      {[0, 1, 2, 3, 4].map(i => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={124 + Math.cos(a) * 10}
            cy={36 + Math.sin(a) * 10}
            r={8}
            fill="#F8A8D4"
          />
        );
      })}
      <circle cx={124} cy={36} r={6} fill="#FFE79C" />
      <path
        d="M118 48 Q116 54 112 56"
        stroke="#6ED1A5"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  glasses_round: (
    <g>
      <circle cx={96} cy={86} r={13} fill="rgba(255,255,255,0.3)" stroke="#3D2A4E" strokeWidth={3} />
      <circle cx={152} cy={86} r={13} fill="rgba(255,255,255,0.3)" stroke="#3D2A4E" strokeWidth={3} />
      <path d="M109 86 L139 86" stroke="#3D2A4E" strokeWidth={3} />
    </g>
  ),
  glasses_heart: (
    <g>
      {[96, 152].map(x => (
        <path
          key={x}
          d={`M${x - 14} ${86 - 2} Q${x - 14} ${86 - 10} ${x - 7} ${86 - 10} Q${x} ${86 - 10} ${x} ${86 - 2} Q${x} ${86 - 10} ${x + 7} ${86 - 10} Q${x + 14} ${86 - 10} ${x + 14} ${86 - 2} Q${x + 14} ${86 + 8} ${x} ${86 + 16} Q${x - 14} ${86 + 8} ${x - 14} ${86 - 2} Z`}
          fill="rgba(255,180,204,0.3)"
          stroke="#E54A5F"
          strokeWidth={2.5}
        />
      ))}
      <path d="M110 84 L138 84" stroke="#E54A5F" strokeWidth={2.5} />
    </g>
  ),
  glasses_star: (
    <g>
      {[96, 152].map(x => (
        <path
          key={x}
          d={`M${x} ${86 - 14} L${x + 4} ${86 - 4} L${x + 14} ${86 - 4} L${x + 6} ${86 + 2} L${x + 9} ${86 + 12} L${x} ${86 + 6} L${x - 9} ${86 + 12} L${x - 6} ${86 + 2} L${x - 14} ${86 - 4} L${x - 4} ${86 - 4} Z`}
          fill="#FFE79C"
          stroke="#B07A14"
          strokeWidth={2}
        />
      ))}
      <path d="M110 86 L138 86" stroke="#B07A14" strokeWidth={2.5} />
    </g>
  ),
  scarf_red: (
    <g>
      <path d="M60 152 Q124 172 188 152 L188 166 Q124 186 60 166 Z" fill="#E54A5F" />
      <path d="M68 168 L60 196 L78 190 L76 170 Z" fill="#C93A4E" />
      <path
        d="M60 152 Q124 172 188 152"
        stroke="#FFFFFF"
        strokeDasharray="3 4"
        strokeWidth={1.5}
        fill="none"
        opacity={0.5}
      />
    </g>
  ),
  scarf_mint: (
    <g>
      <path d="M60 152 Q124 172 188 152 L188 166 Q124 186 60 166 Z" fill="#6ED1A5" />
      <path d="M176 168 L192 196 L178 192 L176 172 Z" fill="#4BB888" />
    </g>
  ),
  bowtie: (
    <g>
      <path d="M104 150 L80 140 L80 166 L104 156 Z" fill="#6B4FB3" />
      <path d="M144 150 L168 140 L168 166 L144 156 Z" fill="#6B4FB3" />
      <rect x={108} y={148} width={32} height={14} rx={3} fill="#4F3687" />
      <rect x={116} y={150} width={2} height={10} fill="#8570C8" />
    </g>
  ),
  sticker_star: (
    <g transform="translate(195 75) rotate(18)">
      <path
        d="M0 -12 L4 -4 L13 -4 L6 2 L9 11 L0 5 L-9 11 L-6 2 L-13 -4 L-4 -4 Z"
        fill="#FFE79C"
        stroke="#F5C849"
        strokeWidth={1.5}
      />
    </g>
  ),
  sticker_heart: (
    <g transform="translate(48 100) rotate(-20)">
      <path
        d="M0 -4 Q0 -12 -7 -12 Q-14 -12 -14 -4 Q-14 4 0 14 Q14 4 14 -4 Q14 -12 7 -12 Q0 -12 0 -4 Z"
        fill="#FF8AA8"
        stroke="#E54A5F"
        strokeWidth={1.5}
      />
    </g>
  ),
  sticker_cloud: (
    <g transform="translate(200 140)">
      <path
        d="M-18 4 Q-18 -6 -8 -6 Q-5 -12 4 -10 Q10 -14 16 -8 Q22 -8 22 -2 Q24 4 16 6 Q10 10 0 8 Q-10 12 -18 4Z"
        fill="#FFFFFF"
        stroke="#B4B4C8"
        strokeWidth={1.5}
      />
    </g>
  ),
  sticker_flower: (
    <g transform="translate(50 160)">
      {[0, 1, 2, 3, 4].map(i => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * 6}
            cy={Math.sin(a) * 6}
            r={5}
            fill="#D9CCF5"
          />
        );
      })}
      <circle cx={0} cy={0} r={3.5} fill="#FFE79C" />
    </g>
  ),
};

export function renderDeco(ids: string[] | undefined): ReactElement | null {
  if (!ids || !ids.length) return null;
  const layers: Record<DecoCategory, ReactElement[]> = {
    hat: [],
    face: [],
    neck: [],
    sticker: [],
  };
  ids.forEach(id => {
    const meta = DECO_CATALOG[id];
    if (!meta) return;
    const el = DECO_SVG[id];
    if (!el) return;
    layers[meta.cat].push(<g key={id}>{el}</g>);
  });
  return (
    <g>
      {layers.sticker}
      {layers.neck}
      {layers.hat}
      {layers.face}
    </g>
  );
}
