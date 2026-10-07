// one-time import from Todoist.
// token comes from Todoist > Settings > Integrations > Developer. we don't store it.
export async function getTodoistTasks(token) {
  let all = []
  let cursor = null

  // the API gives tasks a page at a time
  do {
    const url = "https://api.todoist.com/api/v1/tasks" + (cursor ? "?cursor=" + cursor : "")
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } })
    if (!res.ok) throw new Error("Todoist said " + res.status)
    const page = await res.json()
    all = all.concat(page.results)
    cursor = page.next_cursor
  } while (cursor)

  // keep their order and due date, drop everything else (projects, labels, priority...)
  return all
    .sort((a, b) => a.child_order - b.child_order)
    .map((t) => ({ text: t.content, due: t.due ? t.due.date.slice(0, 10) : null }))
}
