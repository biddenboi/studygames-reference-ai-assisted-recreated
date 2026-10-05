import { supabase } from "./supabase.js"

// tasks go to your account when you're logged in (so other apps can read them),
// otherwise they just live in this browser.
// every function takes the current list and returns the new one.

function saveLocal(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks))
  return tasks
}

export async function loadTasks(user) {
  if (!user) return JSON.parse(localStorage.getItem("tasks") || "[]")
  const { data, error } = await supabase
    .from("tasks")
    .select("id, text, done, due, position")
    .order("position")
  if (error) throw error
  return data
}

export async function addTasks(user, tasks, newOnes) {
  let next = tasks.length ? tasks[tasks.length - 1].position + 1 : 0
  const rows = newOnes.map((t) => ({ text: t.text, due: t.due || null, done: false, position: next++ }))

  if (!user) return saveLocal([...tasks, ...rows.map((r) => ({ ...r, id: crypto.randomUUID() }))])

  const { data, error } = await supabase.from("tasks").insert(rows).select("id, text, done, due, position")
  if (error) throw error
  return [...tasks, ...data]
}

export async function updateTask(user, tasks, id, changes) {
  if (user) {
    const { error } = await supabase.from("tasks").update(changes).eq("id", id)
    if (error) throw error
  }
  const list = tasks.map((t) => (t.id === id ? { ...t, ...changes } : t))
  return user ? list : saveLocal(list)
}

export async function deleteTask(user, tasks, id) {
  if (user) {
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
  }
  const list = tasks.filter((t) => t.id !== id)
  return user ? list : saveLocal(list)
}

// swap a task with the one above it
export async function moveUp(user, tasks, id) {
  const i = tasks.findIndex((t) => t.id === id)
  if (i < 1) return tasks
  const a = tasks[i - 1]
  const b = tasks[i]
  let list = await updateTask(user, tasks, a.id, { position: b.position })
  list = await updateTask(user, list, b.id, { position: a.position })
  return list.sort((x, y) => x.position - y.position)
}
