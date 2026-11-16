import { cn } from '@/lib/cn'
import type { MochiMood } from '@/types'

interface MochiAvatarProps {
  mood?: MochiMood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

const sizeMap = {
  sm: 48,
  md: 72,
  lg: 108,
  xl: 160,
}

export function MochiAvatar({ mood = 'default', size = 'md', className, animate = true }: MochiAvatarProps) {
  const px = sizeMap[size]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        animate && 'motion-safe:animate-[mochi-float_3s_ease-in-out_infinite]',
        className,
      )}
      role="img"
      aria-label={`Mochi 正在${moodLabel(mood)}`}
      style={{ width: px, height: px }}
    >
      <MochiSVG mood={mood} size={px} />
    </div>
  )
}

function moodLabel(mood: MochiMood): string {
  const labels: Record<MochiMood, string> = {
    happy: '開心微笑',
    studying: '專心讀書',
    thinking: '思考中',
    celebrating: '慶祝',
    resting: '休息',
    default: '打招呼',
  }
  return labels[mood]
}

function MochiSVG({ mood, size }: { mood: MochiMood; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── 小手（左）── */}
      <ellipse cx="16" cy="72" rx="7" ry="5" fill="#B0A4F0" transform="rotate(-20 16 72)" />
      {/* 爪子 */}
      <line x1="11" y1="68" x2="9"  y2="64" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="66" x2="14" y2="62" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="67" x2="19" y2="63" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── 小手（右）── */}
      <ellipse cx="84" cy="72" rx="7" ry="5" fill="#B0A4F0" transform="rotate(20 84 72)" />
      <line x1="89" y1="68" x2="91" y2="64" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="85" y1="66" x2="86" y2="62" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="81" y1="67" x2="81" y2="63" stroke="#9080D0" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── 身體（怪獸不規則輪廓）── */}
      {/*  用 path 畫出稍微有稜角的怪獸身形，底部有小腳 */}
      <path
        d="
          M50 18
          C32 18 16 30 14 50
          C12 66 18 82 26 90
          C30 94 36 96 42 97
          L44 104 L50 100 L56 104 L58 97
          C64 96 70 94 74 90
          C82 82 88 66 86 50
          C84 30 68 18 50 18
          Z
        "
        fill="#C4BAF5"
      />
      {/* 肚皮亮色 */}
      <ellipse cx="50" cy="68" rx="20" ry="22" fill="#DDD8FC" opacity="0.75" />

      {/* ── 左角（尖角）── */}
      <polygon points="30,22 24,4 38,16" fill="#A090E8" />
      <polygon points="31,21 25,6 37,17" fill="#C4BAF5" />

      {/* ── 右角（尖角）── */}
      <polygon points="70,22 76,4 62,16" fill="#A090E8" />
      <polygon points="69,21 75,6 63,17" fill="#C4BAF5" />

      {/* ── 小耳朵（怪獸側耳，三角形）── */}
      <polygon points="22,38 14,28 20,46" fill="#B8ACF2" />
      <polygon points="78,38 86,28 80,46" fill="#B8ACF2" />

      {/* ── 眼鏡（方形框，更學術感）── */}
      <rect x="27" y="40" width="20" height="16" rx="5" fill="white" fillOpacity="0.88" stroke="#8B7BE8" strokeWidth="2.2" />
      <rect x="53" y="40" width="20" height="16" rx="5" fill="white" fillOpacity="0.88" stroke="#8B7BE8" strokeWidth="2.2" />
      {/* 眼鏡橋 */}
      <path d="M47 48 Q50 46 53 48" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 眼鏡腳 */}
      <path d="M27 48 Q22 47 20 48" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M73 48 Q78 47 80 48" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* ── 眼睛 ── */}
      <Eyes mood={mood} />

      {/* ── 嘴巴 + 小尖牙 ── */}
      <Mouth mood={mood} />

      {/* ── 腮紅 ── */}
      <ellipse cx="24" cy="60" rx="6" ry="4" fill="#FFB3C6" opacity="0.45" />
      <ellipse cx="76" cy="60" rx="6" ry="4" fill="#FFB3C6" opacity="0.45" />

      {/* ── 道具：書（讀書模式）── */}
      {mood === 'studying' && (
        <g>
          <rect x="32" y="78" width="36" height="20" rx="3" fill="#FFE9A6" stroke="#D4A500" strokeWidth="1.5" />
          <line x1="50" y1="78" x2="50" y2="98" stroke="#D4A500" strokeWidth="1.5" />
          <line x1="36" y1="84" x2="46" y2="84" stroke="#D4A500" strokeWidth="1" />
          <line x1="36" y1="89" x2="45" y2="89" stroke="#D4A500" strokeWidth="1" />
          <line x1="54" y1="84" x2="64" y2="84" stroke="#D4A500" strokeWidth="1" />
          <line x1="54" y1="89" x2="63" y2="89" stroke="#D4A500" strokeWidth="1" />
        </g>
      )}

      {/* ── 慶祝：彩帶 ── */}
      {mood === 'celebrating' && (
        <>
          <circle cx="18" cy="20" r="3" fill="#FFD6C8" />
          <circle cx="82" cy="18" r="2.5" fill="#BCEBD8" />
          <circle cx="88" cy="36" r="2" fill="#FFE9A6" />
          <circle cx="12" cy="38" r="2" fill="#C4BAF5" />
          <path d="M14 14 Q18 10 22 14" stroke="#FFD6C8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M78 12 Q82 8 86 12" stroke="#BCEBD8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── 休息：Zzz ── */}
      {mood === 'resting' && (
        <g fill="#A090E8" fontWeight="bold">
          <text x="72" y="30" fontSize="10" aria-hidden="true">z</text>
          <text x="78" y="22" fontSize="8"  aria-hidden="true">z</text>
          <text x="83" y="15" fontSize="6"  aria-hidden="true">z</text>
        </g>
      )}
    </svg>
  )
}

function Eyes({ mood }: { mood: MochiMood }) {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      // ^o^ 弧線眼
      return (
        <>
          <path d="M30 49 Q37 42 44 49" stroke="#29283A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M56 49 Q63 42 70 49" stroke="#29283A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )
    case 'resting':
      // 閉眼線
      return (
        <>
          <path d="M30 48 Q37 51 44 48" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 48 Q63 51 70 48" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    case 'thinking':
      return (
        <>
          {/* 左眼大圓 */}
          <ellipse cx="37" cy="48" rx="5" ry="5.5" fill="#29283A" />
          <circle cx="39" cy="46" r="1.5" fill="white" />
          {/* 右眼細瞇 */}
          <path d="M56 46 Q63 50 70 46" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* 眉毛（思考感） */}
          <path d="M56 42 Q63 39 70 42" stroke="#29283A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )
    default:
      // 標準大圓眼，怪獸感
      return (
        <>
          <ellipse cx="37" cy="48" rx="5.5" ry="6" fill="#29283A" />
          <circle cx="39.5" cy="45.5" r="1.8" fill="white" />
          <ellipse cx="63" cy="48" rx="5.5" ry="6" fill="#29283A" />
          <circle cx="65.5" cy="45.5" r="1.8" fill="white" />
        </>
      )
  }
}

function Mouth({ mood }: { mood: MochiMood }) {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      return (
        <>
          <path d="M40 64 Q50 73 60 64" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* 小尖牙 */}
          <polygon points="47,65 50,71 53,65" fill="white" stroke="#29283A" strokeWidth="1" strokeLinejoin="round" />
        </>
      )
    case 'resting':
      return (
        <path d="M43 66 Q50 66 57 66" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
      )
    case 'thinking':
      return (
        <>
          <path d="M42 66 Q50 62 58 66" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <polygon points="47,66 50,70 53,66" fill="white" stroke="#29283A" strokeWidth="1" strokeLinejoin="round" />
        </>
      )
    case 'studying':
      return (
        <>
          <path d="M42 65 Q50 70 58 65" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <polygon points="48,66 50,70 52,66" fill="white" stroke="#29283A" strokeWidth="1" strokeLinejoin="round" />
        </>
      )
    default:
      return (
        <>
          <path d="M41 65 Q50 72 59 65" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* 招牌小尖牙 */}
          <polygon points="47,66 50,72 53,66" fill="white" stroke="#29283A" strokeWidth="1" strokeLinejoin="round" />
        </>
      )
  }
}
