import { useRef, useState } from "react"
import { loadTasks, addTask, updateTask } from "./tasks.js"
import Tasks from "./Tasks.jsx"
import GameFrame from "./GameFrame.jsx"

const TEST = { id: "test", title: "Test", url: "games/test.html" }

export default function App() {
  const [view, setView] = useState("app")
  const [tasks, setTasks] = useState(loadTasks)

  // the list and the app can both change tasks, so every change starts from the newest list.
  // otherwise two quick changes could overwrite each other
  const latest = useRef(tasks)

  function changeTasks(change) {
    latest.current = change(latest.current)
    setTasks(latest.current)
  }

  // what an app is allowed to do to your tasks: add and update, never delete
  const toolActions = {
    add: (task) => changeTasks((list) => addTask(list, task.text, task.due)),
    update: (id, changes) => changeTasks((list) => (list.some((t) => t.id === id) ? updateTask(list, id, changes) : list)),
  }

  return (
    <>
      <header>
        <a href="#" className="name">
          StudyGames
        </a>
        <nav>
          <a href="#" className={view === "app" ? "on" : ""} onClick={() => setView("app")}>
            Test
          </a>
          <a href="#" className={view === "tasks" ? "on" : ""} onClick={() => setView("tasks")}>
            Tasks
          </a>
        </nav>
      </header>

      {view === "app" && (
        <div className="player">
          <GameFrame game={TEST} tasks={tasks} actions={toolActions} />
        </div>
      )}

      {view === "tasks" && (
        <main className="settings-page">
          <Tasks tasks={tasks} changeTasks={changeTasks} />
        </main>
      )}
    </>
  )
}
