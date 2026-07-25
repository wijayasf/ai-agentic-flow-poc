import type { RuntimeViewModel } from '../../domain/runtime'
import shellStyles from '../static-shell/StaticShell.module.css'
import { agents } from './config'
import styles from './ActivityTraceTable.module.css'

export function ActivityTraceTable({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <div
      className={styles.viewport}
      tabIndex={0}
      role="region"
      aria-label="Activity trace"
    >
      <table>
        <caption className={shellStyles.visuallyHidden}>
          Visible deterministic activity trace events
        </caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Agent</th>
            <th scope="col">Action</th>
            <th scope="col">Skill</th>
            <th scope="col">Output</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.visibleEvents.map((event) => {
            const eventTone =
              agents.find((agent) => agent.name === event.agent)?.tone ?? 'blue'
            return (
              <tr key={event.id} data-event-id={event.id}>
                <td aria-label={event.time} title={event.time}>
                  {event.time}
                </td>
                <td aria-label={event.agent} title={event.agent}>
                  <span
                    className={styles.dot}
                    data-tone={eventTone}
                    aria-hidden="true"
                  />
                  {event.agent}
                </td>
                <td aria-label={event.action} title={event.action}>
                  {event.action}
                </td>
                <td
                  aria-label={event.skill}
                  data-tone={eventTone}
                  title={event.skill}
                >
                  {event.skill}
                </td>
                <td aria-label={event.output} title={event.output}>
                  {event.output}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
