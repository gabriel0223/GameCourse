import type { ControlGuide } from '../practice/controls';
import { strings } from '../strings';

export function ControlsGuide({ guide }: { guide: ControlGuide }) {
  return (
    <section className="controls-guide" aria-label={strings.practice.controls.title}>
      <h2>{strings.practice.controls.title}</h2>
      <dl>
        {guide.rows.map((row) => (
          <div key={row.action}>
            <dt>{row.action}</dt>
            <dd>
              {row.inputs.map((input) => (
                <kbd key={input}>{input}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {guide.tip && <p>{guide.tip}</p>}
    </section>
  );
}
