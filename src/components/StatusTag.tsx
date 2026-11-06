import { CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { SessionStatus } from '../../shared/types.ts'

const STATUSES: Record<SessionStatus, { label: string; hint: string; icon: LucideIcon; color: string }> = {
  stuck: {
    label: 'Stuck',
    hint: 'A tool kept failing or never returned',
    icon: OctagonAlert,
    color: 'var(--destructive)',
  },
  degraded: {
    label: 'Degraded',
    hint: 'Something failed, but the session carried on',
    icon: TriangleAlert,
    color: 'var(--waiting)',
  },
  healthy: {
    label: 'Healthy',
    hint: 'No findings in this session',
    icon: CircleCheck,
    color: 'var(--agent-3)',
  },
}

function StatusTag({ status }: { status: SessionStatus }) {
  const { label, hint, icon: Icon, color } = STATUSES[status]

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-px font-mono text-[0.6875rem] tracking-wide uppercase"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}
      title={hint}
      aria-label={`${label}: ${hint}`}
    >
      <Icon className="size-3" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}

export default StatusTag
