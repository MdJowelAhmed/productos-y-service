import { cn } from '@/lib/utils'

interface LogoProps {
  /** 'full' = mark + wordmark, 'mark' = icon only. */
  variant?: 'full' | 'mark'
  /** Use on dark/green backgrounds (e.g. the login panel). */
  light?: boolean
  className?: string
}

/**
 * Brand logo — "Productos y Servicios".
 * Green shopping cart (products) topped with colorful figures (services/people).
 * Pure SVG so it stays crisp at any size and themes via the `light` prop.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 34" fill="none" className={className} role="img" aria-label="Productos y Servicios">
      {/* colorful service figures / items above the basket */}
      <circle cx="13" cy="6.5" r="3" fill="#F79009" />
      <circle cx="20" cy="5" r="3" fill="#155EEF" />
      <circle cx="27" cy="6.5" r="3" fill="#DD2590" />
      <circle cx="33" cy="9" r="2.4" fill="#7F56D9" />
      {/* shopping cart */}
      <path
        d="M2 4h4.2l3.4 15.2h17.2L33 8.5H9"
        stroke="#039855"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12.5" cy="25.5" r="2.6" fill="#039855" />
      <circle cx="25" cy="25.5" r="2.6" fill="#039855" />
    </svg>
  )
}

export function Logo({ variant = 'full', light = false, className }: LogoProps) {
  if (variant === 'mark') {
    return <LogoMark className={cn('h-8 w-auto', className)} />
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-9 w-auto shrink-0" />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[15px] font-extrabold uppercase tracking-tight',
            light ? 'text-white' : 'text-brand-700',
          )}
        >
          Productos
        </span>
        <span
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.22em]',
            light ? 'text-brand-100' : 'text-ink-500',
          )}
        >
          y Servicios
        </span>
      </div>
    </div>
  )
}
