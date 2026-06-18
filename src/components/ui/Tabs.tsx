import { cn } from '@/lib/utils'
import type { Option } from '@/types/common.types'

interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
}

export function Tabs<T extends string>({ value, onChange, options }: TabsProps<T>) {
  return (
    <div className="inline-flex rounded-lg bg-ink-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
