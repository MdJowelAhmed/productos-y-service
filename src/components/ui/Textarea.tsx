import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const textareaId = id ?? props.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300',
          'focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600',
          'disabled:cursor-not-allowed disabled:bg-ink-50',
          error ? 'border-red-400' : 'border-ink-200',
          className,
        )}
        rows={props.rows ?? 4}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})
