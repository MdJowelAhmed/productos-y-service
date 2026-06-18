import { useEffect, useRef, type ReactNode } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  RemoveFormatting,
  Undo2,
  Redo2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  label?: string
  placeholder?: string
  className?: string
}

/**
 * Lightweight WYSIWYG editor — a contentEditable surface with a formatting
 * toolbar. Stores HTML and emits it via onChange. No external dependency.
 */
export function RichTextEditor({ value, onChange, label, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Sync external value into the DOM only when the editor isn't focused,
  // so typing never causes a caret jump.
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  const emit = () => onChange(ref.current?.innerHTML ?? '')

  const run = (command: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) run('createLink', url)
  }

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>}

      <div className="overflow-hidden rounded-lg border border-ink-200 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-100 bg-ink-50 px-2 py-1.5">
          <ToolButton icon={Bold} label="Bold" onClick={() => run('bold')} />
          <ToolButton icon={Italic} label="Italic" onClick={() => run('italic')} />
          <ToolButton icon={Underline} label="Underline" onClick={() => run('underline')} />
          <ToolButton icon={Strikethrough} label="Strikethrough" onClick={() => run('strikeThrough')} />
          <Divider />
          <ToolButton icon={Heading2} label="Heading" onClick={() => run('formatBlock', 'h2')} />
          <ToolButton icon={Heading3} label="Subheading" onClick={() => run('formatBlock', 'h3')} />
          <Divider />
          <ToolButton icon={List} label="Bullet list" onClick={() => run('insertUnorderedList')} />
          <ToolButton icon={ListOrdered} label="Numbered list" onClick={() => run('insertOrderedList')} />
          <Divider />
          <ToolButton icon={Link2} label="Add link" onClick={addLink} />
          <ToolButton icon={Link2Off} label="Remove link" onClick={() => run('unlink')} />
          <ToolButton icon={RemoveFormatting} label="Clear formatting" onClick={() => run('removeFormat')} />
          <Divider />
          <ToolButton icon={Undo2} label="Undo" onClick={() => run('undo')} />
          <ToolButton icon={Redo2} label="Redo" onClick={() => run('redo')} />
        </div>

        {/* Editable surface */}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          data-placeholder={placeholder ?? 'Write something…'}
          className={cn(
            'scrollbar-thin min-h-[180px] max-h-[420px] overflow-y-auto bg-white px-4 py-3 text-sm leading-relaxed text-ink-900 focus:outline-none',
            'empty:before:text-ink-300 empty:before:content-[attr(data-placeholder)]',
            '[&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold',
            '[&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
            '[&_a]:text-brand-600 [&_a]:underline',
            '[&_p]:mb-2',
          )}
        />
      </div>
    </div>
  )
}

function ToolButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Prevent the editor from losing its selection when the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-ink-700 hover:bg-ink-200"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function Divider(): ReactNode {
  return <span className="mx-1 h-5 w-px bg-ink-200" />
}
