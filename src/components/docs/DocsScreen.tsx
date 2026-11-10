import { Activity, Coins, FlaskConical, LayoutDashboard, Lock, Settings, TriangleAlert } from 'lucide-react'
import ContractGuide, { Section } from '../evals/ContractGuide.tsx'

const code = (text: string) => <code className="rounded-sm bg-muted px-1 py-px font-mono text-[0.7rem]">{text}</code>

const STATUSES: [string, string, string][] = [
  ['healthy', 'var(--agent-3)', 'No problems found.'],
  ['degraded', 'var(--waiting)', 'At least one problem, but the session kept moving.'],
  ['stuck', 'var(--destructive)', 'A stuck loop or a hung call: the agent stopped making progress.'],
]

const CHECKS: [string, string][] = [
  ['Stuck loop', 'The same tool fails 3 or more times in a row.'],
  ['Hung call', 'A tool call that never returned.'],
  ['Identical calls', 'The agent repeats the exact same call.'],
  ['Tool failures', 'Recurring errors, grouped by agent and message.'],
]

function Terms({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_1fr]">
      {items.map(([term, meaning]) => (
        <div key={term} className="contents">
          <dt className="font-medium text-foreground">{term}</dt>
          <dd className="mb-1 sm:mb-0">{meaning}</dd>
        </div>
      ))}
    </dl>
  )
}

function PartHeading({ children }: { children: string }) {
  return <h2 className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</h2>
}

function DocsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <Section icon={Activity} color="var(--agent-1)" title="What harness-report is">
        <p className="text-sm text-foreground">
          A local dashboard for your coding agent harness. It reads your agent sessions and eval results from disk and shows
          where things go wrong: stuck loops, hung tool calls, failing tools and credit usage.
        </p>
        <p>
          It has three screens. <span className="font-medium text-foreground">Observability</span> shows how your agent
          sessions went, <span className="font-medium text-foreground">Evals</span> shows whether your skills and agents
          actually help, and <span className="font-medium text-foreground">Settings</span> tells the app where to look.
        </p>
      </Section>

      <Section icon={LayoutDashboard} color="var(--agent-1)" title="Observability">
        <p>
          Every GitHub Copilot CLI session from this month, read from {code('~/.copilot/session-state')}. The tiles at the top
          count sessions and degraded sessions and show credits spent. The chart shows activity per day. Open a session in
          the list below for its timeline, its agents and their tool calls, and the full event log.
        </p>
        <h3 className="mt-1 text-xs font-medium text-foreground">Session status</h3>
        <ul className="flex flex-col gap-1.5">
          {STATUSES.map(([status, color, meaning]) => (
            <li key={status} className="flex items-baseline gap-2">
              <span className="w-20 shrink-0 font-medium" style={{ color }}>{status}</span>
              {meaning}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={TriangleAlert} color="var(--destructive)" title="Needs attention">
        <p>
          Problems found automatically in your sessions, newest first. Known errors come with a plain-English hint on how to
          fix them in the harness.
        </p>
        <Terms items={CHECKS} />
      </Section>

      <Section icon={Coins} color="var(--agent-1)" title="Credits">
        <p>
          Credits spent this month, against the monthly budget you set in Settings. With no budget set, the tile shows only
          what was spent.
        </p>
      </Section>

      <Section icon={FlaskConical} color="var(--agent-7)" title="Evals">
        <p>
          One card per skill or agent that has eval results. Cards start collapsed: open one for its details, the score
          table, every case, and older versions. Skills and agents no longer installed in {code('~/.copilot')} get a red{' '}
          <span className="font-medium text-destructive">removed</span> tag and move to the end.
        </p>
        <p>
          When a suite compares a skill with a baseline, the Difference column shows the gain over the baseline. A {code('+')}{' '}
          in green means the skill did better, even for metrics where lower is better. How to write result files is explained
          below.
        </p>
      </Section>

      <Section icon={Settings} color="var(--agent-4)" title="Settings">
        <p>
          Set your monthly credit budget and the folders your eval tool writes result files into. Settings are saved to{' '}
          {code('~/.config/harness-report/settings.json')} and apply right away, with no restart.
        </p>
      </Section>

      <Section icon={Lock} color="var(--agent-3)" title="Privacy">
        <p>
          Everything runs on your machine. The server listens only on {code('127.0.0.1')} and never sends your data anywhere.
        </p>
      </Section>

      <PartHeading>Writing eval results</PartHeading>
      <ContractGuide />
    </div>
  )
}

export default DocsScreen
