import { strings } from '../strings';

export function GoldAmount({ amount }: { amount: number }) {
  return (
    <span className="gold">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <circle cx="8" cy="8" r="4.5" fill="none" stroke="#7a5412" strokeWidth="1.2" />
      </svg>
      {strings.gold(amount)}
    </span>
  );
}
