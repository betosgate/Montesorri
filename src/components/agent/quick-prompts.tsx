'use client'

const PROMPTS = [
  {
    label: 'What does my state require?',
    icon: '📋',
  },
  {
    label: 'Help me with my subscription',
    icon: '💳',
  },
  {
    label: 'I need to cancel',
    icon: '🚫',
  },
  {
    label: 'Check my compliance status',
    icon: '✅',
  },
]

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
}

export function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="space-y-2 px-1">
      <p className="text-xs text-stone-400 text-center mb-3">
        How can I help you today?
      </p>
      {PROMPTS.map((prompt) => (
        <button
          key={prompt.label}
          onClick={() => onSelect(prompt.label)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm text-stone-700 transition-all hover:border-green-300 hover:bg-green-50 hover:shadow-sm"
        >
          <span className="text-base">{prompt.icon}</span>
          <span>{prompt.label}</span>
        </button>
      ))}
    </div>
  )
}
