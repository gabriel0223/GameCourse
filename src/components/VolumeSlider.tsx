import { strings } from '../strings';

export function VolumeSlider({ value, onChange }: { value: number; onChange(value: number): void }) {
  return (
    <label className="volume-slider">
      <span>{strings.practice.jet.sound}</span>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <output>{value === 0 ? strings.practice.jet.soundOff : `${value}%`}</output>
    </label>
  );
}
