# StudyGames

Your tasks usually end up split between a todo app, a timer and whatever else you use. StudyGames has one task list, and every app on the site can read it and add to it. There's a planner, a pomodoro timer, a garden and a few more, and you can upload your own.

"My apps" is a grid of the apps you've added. Click one and it opens under the top bar. "Browse" lists the built-in ones and the ones people uploaded. Your tasks only show up inside the apps. To add, delete or import tasks, or to log in, go to Settings.

Each app is one `.html` file running in a sandboxed iframe, and it talks to the site with six messages.

## Running it

```
npm install
npm run dev
```

Open the link it prints.

Without a `.env` the built-in apps still work and tasks are saved in your browser. Login, uploads and account tasks need Supabase (below).

## Make your own app

An app is one `.html` file with everything inside it. Outside scripts, images and network requests are blocked. Send `hello` when your app loads and the site answers.

| Direction | Message | When |
| --- | --- | --- |
| app → site | `{ type: "hello" }` | once, when your app has loaded |
| site → app | `{ type: "load", save }` | reply to hello. `save` is whatever you saved last time, or `null` |
| site → app | `{ type: "tasks", tasks }` | after load, and every time the list changes. Each task is `{ id, text, done, due, position }` |
| app → site | `{ type: "save", save }` | whenever you want. Any JSON up to 100 KB |
| app → site | `{ type: "add", text, due }` | adds a task. `due` is `"YYYY-MM-DD"` or left out |
| app → site | `{ type: "update", id, ...changes }` | changes `text`, `done`, `due` or `position` on a task |

Apps can't delete tasks, only you can (in Settings).

The site doesn't show your tasks anywhere except Settings, so an app should let people add tasks and check them off itself. Every built-in app does this in its own way (the garden has a to do list, the night sky has grey stars you click, the bookshelf has a pile of books).

A tiny example:

```html
<script>
  let save = { finished: 0 }

  window.addEventListener("message", (e) => {
    const msg = e.data
    if (msg.type === "load" && msg.save) save = msg.save
    if (msg.type === "tasks") {
      document.body.textContent = msg.tasks.filter((t) => !t.done).length + " tasks left"
    }
  })

  parent.postMessage({ type: "hello" }, "*")
</script>
```

Anything else your app needs (a timer, a score) goes in its own save. `pomodoro.html` keeps its session counts there and only tells the site `update` with `done: true`.

Saves are stored in your browser, one per app, and apps can't see each other's saves. Uploaded apps can see your task text, so don't put anything private in task names.

The built-in apps in `src/games/` use the same messages, so they're good examples. `garden.html` is the simplest one, and `plan.html` shows `add` and `update`.

## How the code is split

The site (`src/*.jsx`, `src/*.js`) doesn't know about any specific app, and apps don't import anything from the site. `GameFrame.jsx` is the only place they meet, so a new message means changing the table above. Helpers like `newlyDone` are copied into each app instead of shared, since every app has to work as one file.

## Adding or removing a built-in app

Every `.html` file in `src/games/` (including subfolders) shows up under "Browse" on its own. New visitors start with everything outside `trial/` in My apps. The list reads these tags from the top of the file:

```html
<title>My Game</title>
<meta name="author" content="Your name">
<meta name="description" content="One line about it.">
```

Put a screenshot next to it with the same name (`garden.png` for `garden.html`, 640x400 looks right) and it shows on the app's card. Without one the card just shows the title.

To remove one, delete its file. `src/games/trial/` has ones I'm still trying out. An app's save is stored under its file path (like `save:trial/bookshelf`), so renaming a file starts it fresh.

## Your tasks from other apps

Your tasks are stored in a Supabase table, so apps outside the site can use them too, over HTTP with your login (kind of like CalDAV for todos). A task is:

```
{ id, text, done, due, position }
```

`position` is the order you put them in. There's no priority or label field.

```sh
# log in (use your StudyGames email + password)
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
# copy access_token from the response into $TOKEN

# get your tasks
curl "$SUPABASE_URL/rest/v1/tasks?select=id,text,done,due,position&order=position" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOKEN"

# tick one off
curl -X PATCH "$SUPABASE_URL/rest/v1/tasks?id=eq.TASK_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"done":true}'
```

You can only ever see your own tasks (row level security in `schema.sql`).

Coming from Todoist? Open Settings, then "Import from Todoist", and paste your API token. It copies your open tasks over once and doesn't keep the token.

## Supabase setup

1. Make a project at supabase.com.
2. Run `schema.sql` in the SQL editor. It creates the `games` and `tasks` tables and the `games` storage bucket.
3. Copy `.env.example` to `.env` and fill in the URL and anon key from Project Settings > API.

Uploads show up for everyone right away. To hide one, set `approved` to false in the `games` table.

## Life While You Study (Rust)

`life/` is the Rust code for the Game of Life. It builds to a tiny `.wasm` file that gets pasted into `src/games/life.html` as base64, so the game is still one file. To rebuild after changing the Rust:

```
rustup target add wasm32-unknown-unknown
npm run life
```

## Files

```
src/
  App.jsx        top bar, My apps, Browse, Settings, login
  Tasks.jsx      task list + Todoist import
  tasks.js       saving tasks (Supabase or localStorage)
  todoist.js     Todoist import
  GameFrame.jsx  the iframe and all the messages
  games.js       builds the app list from src/games/
  Upload.jsx     upload form
  supabase.js
  style.css
  games/         built-in apps, one .html file each
    trial/       ones I'm trying out (delete the folder to remove them)
life/            Rust for the Game of Life
schema.sql       database setup
```
