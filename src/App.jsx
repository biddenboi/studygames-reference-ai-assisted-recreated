import { useEffect, useRef, useState } from "react"
import { supabase } from "./supabase.js"
import { loadTasks, addTasks, updateTask } from "./tasks.js"
import Tasks from "./Tasks.jsx"
import GameFrame from "./GameFrame.jsx"
import Upload from "./Upload.jsx"
import { BUILT_IN } from "./games.js"

export default function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginMessage, setLoginMessage] = useState("")
  const [games, setGames] = useState(BUILT_IN)
  // the apps you've added to your sidebar. new people start with the built-ins outside trial/
  const [mine, setMine] = useState(() => {
    const saved = localStorage.getItem("myApps")
    return saved ? JSON.parse(saved) : BUILT_IN.filter((g) => !g.id.startsWith("trial/")).map((g) => g.id)
  })
  const [tasks, setTasks] = useState([])

  // tasks are the one thing every tool shares, so every change (from the list or from a
  // tool) goes through here one at a time. otherwise two quick changes could overwrite each other
  const latest = useRef([])
  const queue = useRef(Promise.resolve())

  function changeTasks(change) {
    const run = queue.current.then(async () => {
      latest.current = await change(latest.current)
      setTasks(latest.current)
    })
    queue.current = run.catch(() => {})
    return run
  }

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  // apps people uploaded. everyone sees them (I can hide one by setting approved to false)
  function loadUploaded() {
    if (!supabase) return
    supabase
      .from("games")
      .select("id, title, author, description, file_path, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const uploaded = (data || []).map((g) => ({
          ...g,
          url: supabase.storage.from("games").getPublicUrl(g.file_path).data.publicUrl,
        }))
        setGames([...BUILT_IN, ...uploaded])
      })
  }

  useEffect(loadUploaded, [])

  useEffect(() => {
    changeTasks(() => loadTasks(user)).catch((err) => console.error(err))
  }, [user])

  // email + password (not magic links) so other apps can log in to use your tasks too
  async function login(e) {
    e.preventDefault()
    const signUp = e.nativeEvent.submitter?.name === "signup"
    const { error } = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginMessage(error.message)
    else if (signUp) setLoginMessage("Signed up! Check your email to confirm.")
  }

  // what a tool is allowed to do to your tasks: add and update, never delete
  const toolActions = {
    add: (task) => changeTasks((list) => addTasks(user, list, [task])),
    update: (id, changes) =>
      changeTasks((list) => (list.some((t) => t.id === id) ? updateTask(user, list, id, changes) : list)),
  }

  // the page is picked by the part of the url after #, so the back button works
  // "" = my apps, "#browse", "#settings", "#app/garden"
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  function toggle(id) {
    const next = mine.includes(id) ? mine.filter((m) => m !== id) : [...mine, id]
    setMine(next)
    localStorage.setItem("myApps", JSON.stringify(next))
  }

  const view = hash.startsWith("#app/") ? "app" : hash.slice(1) || "home"
  const app = games.find((g) => "#app/" + g.id === hash)
  const myApps = games.filter((g) => mine.includes(g.id))

  return (
    <>
      <header>
        <a href="#" className="name">
          StudyGames
        </a>
        <nav>
          <a href="#" className={view === "home" ? "on" : ""}>
            My apps
          </a>
          <a href="#browse" className={view === "browse" ? "on" : ""}>
            Browse
          </a>
        </nav>
        <a href="#settings" className={view === "settings" ? "on right" : "right"}>
          {user ? user.email : "Settings"}
        </a>
      </header>

      {view === "home" && (
        <main>
          <div className="title-row">
            <h1>My apps</h1>
            <a href="#browse">+ Add apps</a>
          </div>
          {!myApps.length && <p>You haven't added any apps yet.</p>}
          <div className="grid">
            {myApps.map((g) => (
              <Card key={g.id} app={g} />
            ))}
          </div>
          <p className="credit">Made by Peter for the 2026 Congressional App Challenge</p>
        </main>
      )}

      {view === "app" && (
        <div className="player">
          <div className="player-bar">
            <a href="#">← My apps</a>
            {app && (
              <span>
                <b>{app.title}</b> <span className="small">by {app.author}</span>
              </span>
            )}
            {app && !mine.includes(app.id) && <button onClick={() => toggle(app.id)}>Add to my apps</button>}
          </div>
          {app ? (
            <GameFrame key={app.id} game={app} tasks={tasks} actions={toolActions} />
          ) : (
            <p className="small">Can't find that app.</p>
          )}
        </div>
      )}

      {view === "browse" && (
        <main>
          <h1>Browse</h1>
          <h2>Built in</h2>
          <div className="grid">
            {games
              .filter((g) => !g.url)
              .map((g) => (
                <Card key={g.id} app={g} mine={mine} toggle={toggle} />
              ))}
          </div>

          <h2>Uploaded</h2>
          {!supabase && <p className="small">Uploads need Supabase set up (see the README).</p>}
          {supabase && !games.some((g) => g.url) && <p className="small">Nothing uploaded yet.</p>}
          <div className="grid">
            {games
              .filter((g) => g.url)
              .map((g) => (
                <Card key={g.id} app={g} mine={mine} toggle={toggle} />
              ))}
          </div>

          {supabase && user && <Upload user={user} onUploaded={loadUploaded} />}
          {supabase && !user && (
            <p className="small">
              <a href="#settings">Log in</a> to upload your own.
            </p>
          )}
          <p className="small">
            Want to make one? It's a single .html file, see the{" "}
            <a href="https://github.com/biddenboi/StudyGames">README</a>.
          </p>
        </main>
      )}

      {view === "settings" && (
        <main className="settings-page">
          <h1>Settings</h1>
          <section className="box">
            <h2>Account</h2>
            {!supabase && <p className="small">No Supabase set up, so everything is saved in this browser.</p>}
            {supabase && user && (
              <p>
                Logged in as {user.email} <button onClick={() => supabase.auth.signOut()}>Log out</button>
              </p>
            )}
            {supabase && !user && (
              <form onSubmit={login} className="row">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" required />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  required
                />
                <button name="login">Log in</button>
                <button name="signup">Sign up</button>
                {loginMessage && <span className="small">{loginMessage}</span>}
              </form>
            )}
          </section>

          <Tasks user={user} tasks={tasks} changeTasks={changeTasks} />
        </main>
      )}
    </>
  )
}

// one app in a grid. on Browse it also gets an Add/Remove button
function Card({ app, mine, toggle }) {
  return (
    <div className="card">
      <a href={"#app/" + app.id} className="thumb">
        {app.thumb ? <img src={app.thumb} alt="" /> : <span>{app.title}</span>}
      </a>
      <div className="card-body">
        <a href={"#app/" + app.id}>
          <b>{app.title}</b>
        </a>
        <div className="small">
          by {app.author}
          {app.created_at && " · " + new Date(app.created_at).toLocaleDateString()}
        </div>
        <p>{app.description}</p>
        {toggle && (
          <button onClick={() => toggle(app.id)} className={mine.includes(app.id) ? "" : "add"}>
            {mine.includes(app.id) ? "Remove" : "Add"}
          </button>
        )}
      </div>
    </div>
  )
}
