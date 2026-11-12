const ICONS = {
  library: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  friends:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.7-3.3 3.1-5.2 6.5-5.2s5.8 1.9 6.5 5.2M15.5 4.3a3.5 3.5 0 0 1 0 6.4M17.5 14.9c2.1.5 3.5 2.2 4 5.1',
  character: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5',
  practice:
    'M7 8h10a4 4 0 0 1 4 4v4a2.5 2.5 0 0 1-4.6 1.3L15 15H9l-1.4 2.3A2.5 2.5 0 0 1 3 16v-4a4 4 0 0 1 4-4ZM8 11v3M6.5 12.5h3M15.5 12.5h.01M18 11.5h.01',
  shop: 'M4 9h16l-1 11H5L4 9ZM8 9V7a4 4 0 0 1 8 0v2',
  codex: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5v-15ZM5 20.5A2.5 2.5 0 0 0 7.5 21H19v-3',
  overview: 'M4 20V11M10 20V4M16 20v-6M21 20H3',
  wardrobe: 'M10 5.5a2 2 0 1 1 3.2 1.6c-.8.6-1.2 1-1.2 1.9L3.6 15a1.6 1.6 0 0 0 1 2.9h14.8a1.6 1.6 0 0 0 1-2.9L12 9',
  trophy:
    'M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 20h8M10 18h4',
  flag: 'M5 21V4h13l-2.5 4 2.5 4H5',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  pencil: 'M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1ZM14 7l3 3',
  check: 'M5 12.5 10 17.5 19 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2',
  quest: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 8v5M12 16.5h.01',
};

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
