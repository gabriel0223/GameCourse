import { useState } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { findPath } from '../content/paths';
import type { Path } from '../content/paths';
import { QUIZZES, quizDeck } from '../content/quizzes';
import type { QuizQuestion } from '../content/quizzes';
import { passMark } from '../domain/quiz';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { pathHref } from './CodexView';

const t = strings.codex.quiz;

function optionState(option: string, picked: string | null, correct: string) {
  if (picked === null) return undefined;
  if (option === correct) return 'right';
  return option === picked ? 'wrong' : undefined;
}

function Results({
  path,
  misses,
  total,
  firstPass,
  onRetry,
}: {
  path: Path;
  misses: QuizQuestion[];
  total: number;
  firstPass: boolean;
  onRetry(): void;
}) {
  const { find } = useCodex();
  const score = total - misses.length;
  const needed = passMark(total);
  const passed = score >= needed;
  const era = path.kind === 'era';
  const home = pathHref(path);
  const backLabel = era ? t.backEra : t.back;
  const stopHref = (stop: string) => (era ? hrefs.codexEntry(stop) : hrefs.pathStop(stop, path.id));
  return (
    <section className="quiz">
      <h2>{passed ? (firstPass ? (era ? t.eraPassed : t.passed) : t.passedAgain) : t.failed}</h2>
      <p className="quiz-score">{t.score(score, total)}</p>
      {!passed && <p className="quiz-result-note">{t.needed(needed, total)}</p>}
      {firstPass && (
        <p className="quiz-reward">
          {t.reward} <GoldAmount amount={path.gold} />
        </p>
      )}
      {misses.length > 0 && (
        <div className="quiz-review">
          <h3>{t.review}</h3>
          <ul className="example-list">
            {misses.map((question) => (
              <li key={question.stop}>
                <a href={stopHref(question.stop)}>{find(question.stop)?.title ?? question.stop}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="quiz-actions">
        {passed ? (
          <a className="button button-primary" href={home}>
            {backLabel}
          </a>
        ) : (
          <button className="button button-primary" type="button" onClick={onRetry}>
            {t.retry}
          </button>
        )}
        {passed ? (
          misses.length > 0 && (
            <button className="button button-quiet" type="button" onClick={onRetry}>
              {t.retry}
            </button>
          )
        ) : (
          <a className="button button-link" href={home}>
            {backLabel}
          </a>
        )}
      </div>
    </section>
  );
}

function QuizRun({ path, questions, onRetry }: { path: Path; questions: QuizQuestion[]; onRetry(): void }) {
  const { profile, recordQuiz } = useLibrary();
  const [deck] = useState(() => quizDeck(questions));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);
  const [firstPass, setFirstPass] = useState(false);
  const [finished, setFinished] = useState(false);

  if (finished) {
    const misses = deck.filter((_, position) => !outcomes[position]);
    return <Results path={path} misses={misses} total={deck.length} firstPass={firstPass} onRetry={onRetry} />;
  }

  const question = deck[index];
  const last = index === deck.length - 1;
  const answered = picked !== null;
  const right = picked === question.correct;

  function advance() {
    if (!last) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    const score = outcomes.filter(Boolean).length;
    setFirstPass(score >= passMark(deck.length) && !profile.quizzes[path.id]?.passed);
    recordQuiz(path.id, score, deck.length);
    setFinished(true);
  }

  return (
    <section className="quiz">
      <p className="quiz-count">{t.question(index + 1, deck.length)}</p>
      <div className="quiz-progress" aria-hidden="true">
        {deck.map((item, position) => (
          <i
            key={item.stop}
            data-state={
              position < outcomes.length ? (outcomes[position] ? 'right' : 'wrong') : position === index ? 'current' : undefined
            }
          />
        ))}
      </div>
      <h2>{question.prompt}</h2>
      <ul className="quiz-options">
        {question.options.map((option) => (
          <li key={option}>
            <button
              type="button"
              disabled={answered}
              data-state={optionState(option, picked, question.correct)}
              onClick={() => {
                setPicked(option);
                setOutcomes([...outcomes, option === question.correct]);
              }}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      {answered && (
        <div className="quiz-feedback" data-right={right} role="status">
          <strong>{right ? t.right : t.wrong(question.correct)}</strong>
          <p>{question.explanation}</p>
          <button className="button button-primary" type="button" autoFocus onClick={advance}>
            {last ? t.finish : t.next}
          </button>
        </div>
      )}
    </section>
  );
}

export function QuizView({ id }: { id: string | null }) {
  const [attempt, setAttempt] = useState(0);
  const path = findPath(id);
  const questions = path ? QUIZZES[path.id] : undefined;
  return (
    <main className="page">
      {path && (
        <a className="back" href={pathHref(path)}>
          {path.title}
        </a>
      )}
      <header className="page-header">
        <h1>{path ? t.title(path.title) : strings.codex.title}</h1>
      </header>
      {path && questions ? (
        <QuizRun key={attempt} path={path} questions={questions} onRetry={() => setAttempt(attempt + 1)} />
      ) : (
        <p className="notice">{t.none}</p>
      )}
    </main>
  );
}
