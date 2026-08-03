import type { SVGProps } from 'react'

export type IconName =
  | 'activity'
  | 'alert'
  | 'approval'
  | 'artifact'
  | 'bot'
  | 'calculator'
  | 'check'
  | 'clock'
  | 'database'
  | 'file-image'
  | 'file-text'
  | 'flag'
  | 'flow'
  | 'lock'
  | 'message'
  | 'pause'
  | 'play'
  | 'policy'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'skip'
  | 'sparkles'
  | 'system'
  | 'user'
  | 'users'
  | 'volume-on'
  | 'volume-off'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  readonly name: IconName
  readonly label?: string
  readonly size?: number
}

function IconPaths({ name }: { readonly name: IconName }) {
  switch (name) {
    case 'activity':
      return <path d="M3 12h4l2.4-7 4.2 14 2.4-7h5" />
    case 'alert':
      return (
        <>
          <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      )
    case 'approval':
      return (
        <>
          <path d="M9 11 11 13 15.5 8.5" />
          <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" />
        </>
      )
    case 'artifact':
      return (
        <>
          <path d="M6 2h9l4 4v16H6Z" />
          <path d="M14 2v5h5" />
          <path d="M9 13h6M9 17h6" />
        </>
      )
    case 'bot':
      return (
        <>
          <rect x="4" y="7" width="16" height="12" rx="3" />
          <path d="M12 3v4M8 12h.01M16 12h.01M9 16h6M2 11h2M20 11h2" />
        </>
      )
    case 'calculator':
      return (
        <>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M8 6h8v4H8ZM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </>
      )
    case 'check':
      return <path d="m5 12 4 4L19 6" />
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )
    case 'database':
      return (
        <>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </>
      )
    case 'file-image':
      return (
        <>
          <path d="M6 2h9l4 4v16H6Z" />
          <path d="M14 2v5h5M9 17l2.5-3 2 2 1.5-2 2 3M10 10h.01" />
        </>
      )
    case 'file-text':
      return (
        <>
          <path d="M6 2h9l4 4v16H6Z" />
          <path d="M14 2v5h5M9 12h6M9 16h6" />
        </>
      )
    case 'flag':
      return (
        <>
          <path d="M5 21V4" />
          <path d="M5 5h11l-2 3 2 3H5" />
        </>
      )
    case 'flow':
      return (
        <>
          <rect x="9" y="2" width="6" height="5" rx="1" />
          <rect x="2" y="17" width="6" height="5" rx="1" />
          <rect x="9" y="17" width="6" height="5" rx="1" />
          <rect x="16" y="17" width="6" height="5" rx="1" />
          <path d="M12 7v5M5 17v-5h14v5M12 12v5" />
        </>
      )
    case 'lock':
      return (
        <>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      )
    case 'message':
      return (
        <>
          <path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </>
      )
    case 'pause':
      return <path d="M8 5v14M16 5v14" />
    case 'play':
      return <path d="m8 5 11 7-11 7Z" />
    case 'policy':
      return (
        <>
          <path d="M12 2 4 5v6c0 5 3.3 8.8 8 11 4.7-2.2 8-6 8-11V5Z" />
          <path d="m9 12 2 2 4-5" />
        </>
      )
    case 'refresh':
      return (
        <>
          <path d="M20 7v5h-5" />
          <path d="M19 12a7 7 0 1 0-2 5" />
        </>
      )
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </>
      )
    case 'shield':
      return (
        <>
          <path d="M12 2 4 5v6c0 5 3.3 8.8 8 11 4.7-2.2 8-6 8-11V5Z" />
          <path d="M12 7v6M12 17h.01" />
        </>
      )
    case 'skip':
      return <path d="m5 5 10 7-10 7ZM18 5v14" />
    case 'sparkles':
      return (
        <>
          <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7ZM19 13l.7 2.3 2.3.7-2.3.7L19 19l-.7-2.3L16 16l2.3-.7Z" />
        </>
      )
    case 'system':
      return (
        <>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 22h8M12 18v4M7 9h4M7 13h7" />
        </>
      )
    case 'user':
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22a8 8 0 0 1 16 0" />
        </>
      )
    case 'users':
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M16 14a6 6 0 0 1 5 6" />
        </>
      )
    case 'volume-on':
      return (
        <>
          <path d="M5 9v6h4l5 4V5L9 9Z" />
          <path d="M17 8a5 5 0 0 1 0 8" />
          <path d="M20.5 5.5a9 9 0 0 1 0 13" />
        </>
      )
    case 'volume-off':
      return (
        <>
          <path d="M5 9v6h4l5 4V5L9 9Z" />
          <path d="m17 9 5 6M22 9l-5 6" />
        </>
      )
    default:
      return name satisfies never
  }
}

export function Icon({
  name,
  label,
  size = 20,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <svg
      {...props}
      aria-hidden={label === undefined ? true : undefined}
      aria-label={label}
      fill="none"
      height={size}
      role={label === undefined ? undefined : 'img'}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      <IconPaths name={name} />
    </svg>
  )
}
