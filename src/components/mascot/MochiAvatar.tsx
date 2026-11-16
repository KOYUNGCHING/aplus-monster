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

/**
 * Mochi — A+ Monster's original round study mascot.
 * SVG-drawn inline to avoid asset dependencies.
 * Mood variants control expression; reduced-motion respected via CSS.
 */
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
  // Eye and mouth shapes by mood
  const eyes = getEyes(mood)
  const mouth = getMouth(mood)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body — round soft lavender */}
      <ellipse cx="50" cy="54" rx="38" ry="36" fill="#C4BAF5" />
      {/* Belly highlight */}
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#DDD8FC" opacity="0.7" />

      {/* Left ear/horn */}
      <ellipse cx="28" cy="22" rx="8" ry="11" fill="#B0A4F0" transform="rotate(-15 28 22)" />
      <ellipse cx="28" cy="22" rx="4.5" ry="6.5" fill="#E8E0FF" transform="rotate(-15 28 22)" />

      {/* Right ear/horn */}
      <ellipse cx="72" cy="22" rx="8" ry="11" fill="#B0A4F0" transform="rotate(15 72 22)" />
      <ellipse cx="72" cy="22" rx="4.5" ry="6.5" fill="#E8E0FF" transform="rotate(15 72 22)" />

      {/* Glasses frame */}
      <circle cx="38" cy="46" r="10" stroke="#8B7BE8" strokeWidth="2.5" fill="white" fillOpacity="0.85" />
      <circle cx="62" cy="46" r="10" stroke="#8B7BE8" strokeWidth="2.5" fill="white" fillOpacity="0.85" />
      {/* Glasses bridge */}
      <path d="M48 46 Q50 44 52 46" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Glasses arm left */}
      <path d="M28 44 Q24 43 22 44" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Glasses arm right */}
      <path d="M72 44 Q76 43 78 44" stroke="#8B7BE8" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      {eyes}

      {/* Mouth */}
      {mouth}

      {/* Cheek blush left */}
      <ellipse cx="28" cy="56" rx="6" ry="4" fill="#FFB3C6" opacity="0.5" />
      {/* Cheek blush right */}
      <ellipse cx="72" cy="56" rx="6" ry="4" fill="#FFB3C6" opacity="0.5" />

      {/* Book prop for studying mood */}
      {mood === 'studying' && (
        <g>
          <rect x="30" y="74" width="40" height="18" rx="3" fill="#FFE9A6" stroke="#D4B800" strokeWidth="1.5" />
          <line x1="50" y1="74" x2="50" y2="92" stroke="#D4B800" strokeWidth="1.5" />
          <line x1="36" y1="80" x2="46" y2="80" stroke="#D4B800" strokeWidth="1" />
          <line x1="36" y1="84" x2="44" y2="84" stroke="#D4B800" strokeWidth="1" />
          <line x1="54" y1="80" x2="64" y2="80" stroke="#D4B800" strokeWidth="1" />
          <line x1="54" y1="84" x2="62" y2="84" stroke="#D4B800" strokeWidth="1" />
        </g>
      )}

      {/* Stars for celebrating */}
      {mood === 'celebrating' && (
        <>
          <text x="12" y="20" fontSize="12" aria-hidden="true">⭐</text>
          <text x="76" y="18" fontSize="10" aria-hidden="true">✨</text>
          <text x="80" y="40" fontSize="8" aria-hidden="true">🌟</text>
        </>
      )}

      {/* Zzz for resting */}
      {mood === 'resting' && (
        <text x="68" y="30" fontSize="14" fill="#8B7BE8" fontWeight="bold" aria-hidden="true">z</text>
      )}
    </svg>
  )
}

function getEyes(mood: MochiMood): React.ReactNode {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      // Happy arc eyes (^_^)
      return (
        <>
          <path d="M32 46 Q38 40 44 46" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 46 Q62 40 68 46" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    case 'resting':
      // Closed sleepy lines
      return (
        <>
          <path d="M33 46 Q38 48 43 46" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M57 46 Q62 48 67 46" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    case 'thinking':
      // One eye bigger, slight squint
      return (
        <>
          <circle cx="38" cy="46" r="4" fill="#29283A" />
          <circle cx="40" cy="44" r="1.2" fill="white" />
          <path d="M57 44 Q62 48 67 44" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    default:
      // Default round eyes
      return (
        <>
          <circle cx="38" cy="46" r="4.5" fill="#29283A" />
          <circle cx="40" cy="44" r="1.5" fill="white" />
          <circle cx="62" cy="46" r="4.5" fill="#29283A" />
          <circle cx="64" cy="44" r="1.5" fill="white" />
        </>
      )
  }
}

function getMouth(mood: MochiMood): React.ReactNode {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      return <path d="M42 60 Q50 68 58 60" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    case 'resting':
      return <path d="M44 62 Q50 62 56 62" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'thinking':
      return <path d="M43 63 Q50 60 57 63" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'studying':
      return <path d="M44 61 Q50 65 56 61" stroke="#29283A" strokeWidth="2" fill="none" strokeLinecap="round" />
    default:
      return <path d="M43 62 Q50 67 57 62" stroke="#29283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  }
}
