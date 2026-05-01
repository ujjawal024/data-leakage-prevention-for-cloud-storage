/**
 * StatsCard — metric card with icon, value, title, and optional accent color.
 * Props: title, value, icon (JSX), color ("blue"|"green"|"red"|"amber"|"purple"|"cyan")
 */
const COLOR_MAP = {
  blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20'   },
  green:  { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    border: 'border-red-500/20'    },
  amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20'  },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  cyan:   { bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   border: 'border-cyan-500/20'   },
}

export default function StatsCard({ title, value, icon, color = 'blue', subtitle }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue

  return (
    <div className={`card border ${c.border} hover:scale-[1.01] transition-transform duration-200 cursor-default animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2 tabular-nums">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center shrink-0`}>
          <span className={`${c.icon}`}>{icon}</span>
        </div>
      </div>
    </div>
  )
}
