import { useState } from "react"
import { addTask, updateTask, deleteTask, moveUp } from "./tasks.js"

// "2026-10-27" -> "Oct 27"
function shortDate(due) {
  return new Date(due + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function Tasks({ tasks, setTasks }) {
  const [text, setText] = useState("")
  const [due, setDue] = useState("")

  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setTasks(addTask(tasks, text.trim(), due))
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
            <input type="checkbox" checked={t.done} onChange={() => setTasks(updateTask(tasks, t.id, { done: !t.done }))} />
            <span className="text">{t.text}</span>
            {t.due && <span className="due">{shortDate(t.due)}</span>}
            <button title="move up" onClick={() => setTasks(moveUp(tasks, t.id))}>↑</button>
            <button title="delete" onClick={() => setTasks(deleteTask(tasks, t.id))}>×</button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New task" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button>Add</button>
      </form>
    </section>
  )
}
