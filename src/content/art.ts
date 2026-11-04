const ART = import.meta.glob('../assets/codex/*.png', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>;

export const originalArt = (id: string): string | undefined => ART[`../assets/codex/${id}.png`];
