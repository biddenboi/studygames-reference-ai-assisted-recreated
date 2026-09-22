// tasks live in this browser for now.
// every function takes the current list and returns the new one.

function save(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks))
  return tasks
}

export function loadTasks() {
  return JSON.parse(localStorage.getItem("tasks") || "[]")
}

export function addTask(tasks, text, due) {
  const position = tasks.length ? tasks[tasks.length - 1].position + 1 : 0
  return save([...tasks, { id: crypto.randomUUID(), text, due: due || null, done: false, position }])
}

export function updateTask(tasks, id, changes) {
  return save(tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)))
}

export function deleteTask(tasks, id) {
  return save(tasks.filter((t) => t.id !== id))
}

// swap a task with the one above it
export function moveUp(tasks, id) {
  const i = tasks.findIndex((t) => t.id === id)
  if (i < 1) return tasks
  const a = tasks[i - 1]
  const b = tasks[i]
  let list = updateTask(tasks, a.id, { position: b.position })
  list = updateTask(list, b.id, { position: a.position })
  return save(list.sort((x, y) => x.position - y.position))
}
