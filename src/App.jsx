import { useState } from "react"
import { loadTasks } from "./tasks.js"
import Tasks from "./Tasks.jsx"
import GameFrame from "./GameFrame.jsx"

const TEST = { id: "test", title: "Test", url: "games/test.html" }

export default function App() {
  const [view, setView] = useState("app")
  const [tasks, setTasks] = useState(loadTasks)

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
          <GameFrame game={TEST} tasks={tasks} />
        </div>
      )}

      {view === "tasks" && (
        <main className="settings-page">
          <Tasks tasks={tasks} setTasks={setTasks} />
        </main>
      )}
    </>
  )
}
