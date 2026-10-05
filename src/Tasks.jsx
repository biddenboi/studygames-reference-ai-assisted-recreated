import { useState } from "react"
import { addTasks, updateTask, deleteTask, moveUp } from "./tasks.js"

// "2026-10-27" -> "Oct 27"
function shortDate(due) {
  return new Date(due + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function Tasks({ user, tasks, changeTasks }) {
  const [text, setText] = useState("")
  const [due, setDue] = useState("")
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

  return (
    <section className="tasks box">
      <h2>Tasks</h2>
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

      {!user && <p className="small">Not logged in, so tasks are only saved in this browser.</p>}
      {status && <p className="small">{status}</p>}
    </section>
  )
}
