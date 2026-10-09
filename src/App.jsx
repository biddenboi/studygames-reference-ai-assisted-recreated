import { useEffect, useRef, useState } from "react"
import { supabase } from "./supabase.js"
import { loadTasks, addTasks, updateTask } from "./tasks.js"
import Tasks from "./Tasks.jsx"
import GameFrame from "./GameFrame.jsx"
import Upload from "./Upload.jsx"
import { BUILT_IN } from "./games.js"

export default function App() {
  const [view, setView] = useState(BUILT_IN[0].id)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginMessage, setLoginMessage] = useState("")
  const [games, setGames] = useState(BUILT_IN)
  const [tasks, setTasks] = useState([])

  // the list and the app can both change tasks, and saving to Supabase takes a moment,
  // so changes run one at a time. otherwise two quick changes could overwrite each other
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

  // what an app is allowed to do to your tasks: add and update, never delete
  const toolActions = {
    add: (task) => changeTasks((list) => addTasks(user, list, [task])),
    update: (id, changes) =>
      changeTasks((list) => (list.some((t) => t.id === id) ? updateTask(user, list, id, changes) : list)),
  }

  return (
    <>
      <header>
        <a href="#" className="name">
          StudyGames
        </a>
        <nav>
          {games.map((g) => (
            <a key={g.id} href="#" className={view === g.id ? "on" : ""} onClick={() => setView(g.id)}>
              {g.title}
            </a>
          ))}
        </nav>
        <a href="#" className={view === "settings" ? "on right" : "right"} onClick={() => setView("settings")}>
          {user ? user.email : "Settings"}
        </a>
      </header>

      {games.filter((g) => g.id === view).map((g) => (
        <div className="player" key={g.id}>
          <GameFrame game={g} tasks={tasks} actions={toolActions} />
        </div>
      ))}

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

          {supabase && user && <Upload user={user} onUploaded={loadUploaded} />}
        </main>
      )}
    </>
  )
}
