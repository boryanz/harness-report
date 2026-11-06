import type { SessionSummary } from '../../shared/types.ts'

type SessionRowProps = {
  session: SessionSummary
}

function SessionRow({ session }: SessionRowProps) {
  return (
    <details>
      <summary>{session.name || session.id}</summary>
      <div>
        <p className="muted">{session.id} · {session.cwd}</p>
      </div>
    </details>
  )
}

export default SessionRow
