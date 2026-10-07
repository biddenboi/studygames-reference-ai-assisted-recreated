import { useState } from "react"
import { addTasks, updateTask, deleteTask, moveUp } from "./tasks.js"
import { getTodoistTasks } from "./todoist.js"

// "2026-10-27" -> "Oct 27"
function shortDate(due) {
  return new Date(due + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function Tasks({ user, tasks, changeTasks }) {
  const [text, setText] = useState("")
  const [due, setDue] = useState("")
  const [token, setToken] = useState("")
  const [status, setStatus] = useState("")

  function run(change) {
    changeTasks(change).catch((err) => setStatus(err.message))
  }

  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    run((list) => addTasks(user, list, [{ text: text.trim(), due }]))
    setText("")
    setDue("")
  }

  async function importTodoist() {
    setStatus("Importing...")
    try {
      const imported = await getTodoistTasks(token.trim())
      await changeTasks((list) => addTasks(user, list, imported))
      setStatus("Imported " + imported.length + " tasks")
      setToken("")
    } catch (err) {
      setStatus("Import failed: " + err.message)
    }
  }

  return (
    <section className="tasks box">
      <h2>Tasks</h2>
      <p className="small">Every app on the site reads from this list.</p>
      {tasks.length === 0 && <p className="small">No tasks yet.</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => run((list) => updateTask(user, list, t.id, { done: !t.done }))}
            />
            <span className="text">{t.text}</span>
            {t.due && <span className="due">{shortDate(t.due)}</span>}
            <button title="move up" onClick={() => run((list) => moveUp(user, list, t.id))}>↑</button>
            <button title="delete" onClick={() => run((list) => deleteTask(user, list, t.id))}>×</button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New task" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button>Add</button>
      </form>

      <details>
        <summary>Import from Todoist</summary>
        <p className="small">
          Paste your API token (Todoist &gt; Settings &gt; Integrations &gt; Developer). It's only used for this
          import and isn't saved.
        </p>
        <div className="row">
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="token" type="password" />
          <button onClick={importTodoist} disabled={!token}>Import</button>
        </div>
      </details>

      {!user && <p className="small">Not logged in, so tasks are only saved in this browser.</p>}
      {status && <p className="small">{status}</p>}
    </section>
  )
}
