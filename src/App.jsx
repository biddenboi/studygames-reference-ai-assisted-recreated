import { useRef, useState } from "react"
import { loadTasks, addTask, updateTask } from "./tasks.js"
import Tasks from "./Tasks.jsx"
import GameFrame from "./GameFrame.jsx"

const GAMES = [
  { id: "garden", title: "Pixel Garden", url: "games/garden.html" },
  { id: "sky", title: "Night Sky", url: "games/sky.html" },
  { id: "pomodoro", title: "Pomodoro", url: "games/pomodoro.html" },
]

export default function App() {
  const [view, setView] = useState(GAMES[0].id)
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
          {GAMES.map((g) => (
            <a key={g.id} href="#" className={view === g.id ? "on" : ""} onClick={() => setView(g.id)}>
              {g.title}
            </a>
          ))}
          <a href="#" className={view === "tasks" ? "on" : ""} onClick={() => setView("tasks")}>
            Tasks
          </a>
        </nav>
      </header>

      {GAMES.filter((g) => g.id === view).map((g) => (
        <div className="player" key={g.id}>
          <GameFrame game={g} tasks={tasks} actions={toolActions} />
        </div>
      ))}

      {view === "tasks" && (
        <main className="settings-page">
          <Tasks tasks={tasks} changeTasks={changeTasks} />
        </main>
      )}
    </>
  )
}
