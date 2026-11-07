# Games Course

A personal web app for learning to play games, built with React, TypeScript, Vite, and Supabase.

## Run it

```bash
npm install
npm run dev
```

With no Supabase settings, the app runs in preview mode with sample games and browser storage.

```bash
npm test
npm run build
```

## Connect the real services

1. Create a Supabase project, then run the files in `supabase/migrations` in order in its SQL editor.
2. Create her account and yours under Authentication, then turn off "Allow new users to sign up" there. The app has no sign-up screen, but Supabase's API still accepts sign-ups until that is off.
3. Create a Twitch developer app (Confidential). Your Twitch account needs two-factor authentication.
4. Deploy the function and set its secrets:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set TWITCH_CLIENT_ID=... TWITCH_CLIENT_SECRET=...
supabase functions deploy igdb
```

5. Copy `.env.example` to `.env`, then fill in the project URL and anon key.

The IGDB function only answers signed-in users, and only from the site in its `APP_ORIGIN` secret, which defaults to `https://gabriel0223.github.io`.

## Deploy

Every push to `main` runs the tests, builds the app, and publishes it to GitHub Pages through `.github/workflows/deploy.yml`. In the repo's Settings, Pages needs its source set to GitHub Actions. The Supabase URL and anon key in that workflow are public by design, because they ship in the browser build. Row level security is what protects the data.

Only accounts listed in the `codex_editors` table can edit the Codex. The app hides the editor from everyone else, and database policies block their writes. To add an editor, run this in the SQL editor:

```sql
insert into public.codex_editors (user_id) values ('THEIR_USER_ID');
```

The Twitch secret must only be stored in Supabase secrets, never in `.env` or the repo.

## Structure

- `src/domain`: game rules for XP, levels, lists, and genres, with tests.
- `src/data`: sample and real data adapters, chosen automatically.
- Friends: every other account is a friend. Their profiles and games are read through the `friend_profiles` and `friend_library` database functions in `0007_friends.sql`, so the app's own table queries still only see the signed-in user's rows. Preview mode has one sample friend in `src/data/demoFriends.ts`.
- `src/views` and `src/components`: the screens.
- `src/strings.ts`: interface text.
- `src/assets/sprites`: character layers, each a five-frame strip.
- `supabase`: the database schema and IGDB Edge Function.
- `src/content/codex.ts`: Codex guides and glossary.
- `src/content/consoles.ts`: Console entries. Generation pages list them automatically.
- `src/content/timeline.ts`: Generations and timeline events. A generation's games carry a release year, which the app uses to find them on IGDB. A game with no year, or one IGDB doesn't have, stays a plain card.
- `src/practice`: Practice minigames. Rules, controller layouts, input, and drawing are kept separate. Sunset Ace uses Three.js, which loads only when that game opens. `jetSky.ts` draws the sky, clouds, ocean, and final palette as one shader, and it lowers its own quality to hold a smooth frame rate. `jetAudio.ts` builds every sound live with the Web Audio API, so there are no audio files.
- `tools/codex_art.py`: generates the Codex scenes.
- `tools/runner_art.py`: generates the Endless Runner world. Its Japanese signs use glyphs from DotGothic16, under the SIL Open Font License.
- `tools/character_sprites.py`: generates the character art. Set `SPRITE_REVIEW` to a folder to also export review sheets.
