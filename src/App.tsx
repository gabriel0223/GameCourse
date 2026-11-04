import { Suspense, lazy, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isDemo } from './data';
import { supabase } from './data/supabase';
import { GoldAmount } from './components/GoldAmount';
import { Sprite } from './components/Sprite';
import { TopBar } from './components/TopBar';
import { LibraryProvider, useLibrary } from './state/LibraryContext';
import { strings } from './strings';
import { GUIDE_CHAPTER_IDS, hrefs, useHashRoute } from './useHashRoute';
import type { Route } from './useHashRoute';
import { CharacterView } from './views/CharacterView';
import { GameView } from './views/GameView';
import { CodexProvider } from './state/CodexContext';
import { CodexEditor } from './views/CodexEditor';
import { CodexHome } from './views/CodexHome';
import { CodexSearchView } from './views/CodexSearchView';
import { CodexEntryView } from './views/CodexView';
import { GlossaryView } from './views/GlossaryView';
import { PathView, PathsView } from './views/PathsView';
import { QuizView } from './views/QuizView';
import { ConsolesView } from './views/ConsolesView';
import { TimelineView } from './views/TimelineView';
import { LibraryView } from './views/LibraryView';
import { PracticeView } from './views/PracticeView';
import { RunnerView } from './views/RunnerView';
import { ShopView } from './views/ShopView';
import { SearchView } from './views/SearchView';

// The 3D engine is large, so it only loads when this game opens.
const JetView = lazy(() => import('./views/JetView').then((module) => ({ default: module.JetView })));

const ICONS = {
  library: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  character: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5',
  practice:
    'M7 8h10a4 4 0 0 1 4 4v4a2.5 2.5 0 0 1-4.6 1.3L15 15H9l-1.4 2.3A2.5 2.5 0 0 1 3 16v-4a4 4 0 0 1 4-4ZM8 11v3M6.5 12.5h3M15.5 12.5h.01M18 11.5h.01',
  shop: 'M4 9h16l-1 11H5L4 9ZM8 9V7a4 4 0 0 1 8 0v2',
  codex: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5v-15ZM5 20.5A2.5 2.5 0 0 0 7.5 21H19v-3',
};

function NavIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function PlayerCard() {
  const { gamer, profile } = useLibrary();
  const { progress } = gamer;
  const percent = Math.round((progress.intoLevel / progress.needed) * 100);
  return (
    <a className="player" href={hrefs.character} aria-label={`${strings.nav.character}, ${strings.level} ${progress.level}`}>
      <span className="player-avatar">
        <Sprite profile={profile} equipped={gamer.equipped} scale={3} />
      </span>
      <span className="player-stats">
        <span className="player-level">
          {strings.level} {progress.level}
          <GoldAmount amount={gamer.gold.balance} />
        </span>
        <span className="xp-bar">
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className="player-xp">
          {progress.intoLevel} / {progress.needed} XP
        </span>
      </span>
    </a>
  );
}

function Sidebar({ route }: { route: Route }) {
  const onCharacter = route.view === 'character';
  const onShop = route.view === 'shop';
  const onPractice = route.view === 'practice';
  const onCodex = route.view === 'codex';
  return (
    <aside className="sidebar">
      <a className="brand" href="#/">
        {strings.appName}
      </a>
      <nav className="main-nav" aria-label="Main">
        <a href="#/" aria-current={onCharacter || onShop || onCodex || onPractice ? undefined : 'page'}>
          <NavIcon name="library" />
          {strings.nav.library}
        </a>
        <a href={hrefs.character} aria-current={onCharacter ? 'page' : undefined}>
          <NavIcon name="character" />
          {strings.nav.character}
        </a>
        <a href={hrefs.shop} aria-current={onShop ? 'page' : undefined}>
          <NavIcon name="shop" />
          {strings.nav.shop}
        </a>
        <a href={hrefs.codex} aria-current={onCodex ? 'page' : undefined}>
          <NavIcon name="codex" />
          {strings.nav.codex}
        </a>
        <a href={hrefs.practice} aria-current={onPractice ? 'page' : undefined}>
          <NavIcon name="practice" />
          {strings.nav.practice}
        </a>
      </nav>
      <PlayerCard />
    </aside>
  );
}

function Toasts() {
  const { toasts } = useLibrary();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}

function Screens({ route }: { route: Route }) {
  if (route.view === 'character') return <CharacterView />;
  if (route.view === 'shop') return <ShopView />;
  if (route.view === 'practice') {
    if (route.game === 'runner') return <RunnerView />;
    if (route.game === 'jet') {
      return (
        <Suspense fallback={<main className="page" aria-busy="true" />}>
          <JetView />
        </Suspense>
      );
    }
    return <PracticeView />;
  }
  if (route.view === 'codex') {
    if (!route.id || route.id === 'home' || route.id === 'all') return <CodexHome />;
    if (route.id === 'timeline' || route.id === 'history') return <TimelineView at={route.at} />;
    if (route.id === 'consoles') return <ConsolesView />;
    if (route.id === 'paths' || route.id === 'guides') return <PathsView />;
    if (route.id === 'path') return route.quiz ? <QuizView key={route.path} id={route.path} /> : <PathView id={route.path} />;
    if (GUIDE_CHAPTER_IDS.includes(route.id)) return <PathView id={route.id} />;
    if (route.id === 'glossary' || route.id === 'terms') return <GlossaryView />;
    if (route.id === 'search') return <CodexSearchView />;
    return route.editing ? <CodexEditor key={route.id} id={route.id} /> : <CodexEntryView id={route.id} pathId={route.path} />;
  }
  if (route.view === 'search') return <SearchView query={route.query} />;
  if (route.view === 'game') return <GameView id={route.id} />;
  return <LibraryView list={route.list} />;
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await supabase?.auth.signInWithPassword({ email, password });
    setFailed(Boolean(result?.error));
  }

  return (
    <main className="sign-in">
      <form className="panel" onSubmit={submit}>
        <h1>{strings.appName}</h1>
        <label>
          {strings.auth.email}
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {strings.auth.password}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {failed && (
          <p className="field-error" role="alert">
            {strings.auth.error}
          </p>
        )}
        <button className="button button-primary" type="submit">
          {strings.auth.submit}
        </button>
      </form>
    </main>
  );
}

function AppShell() {
  const route = useHashRoute();
  return (
    <LibraryProvider>
      <CodexProvider>
        <div className="shell">
          <Sidebar route={route} />
          <div className="content">
            {isDemo && <p className="demo-banner">{strings.demoBanner}</p>}
            <TopBar route={route} />
            <Screens route={route} />
            {!isDemo && (
              <footer className="footer">
                <span>{strings.igdbCredit}</span>
                <button className="button button-quiet" type="button" onClick={() => supabase?.auth.signOut()}>
                  {strings.auth.signOut}
                </button>
              </footer>
            )}
          </div>
        </div>
      </CodexProvider>
      <Toasts />
    </LibraryProvider>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(isDemo);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (!isDemo && !session) return <SignIn />;
  return <AppShell />;
}
