import { useEffect, useRef, useState } from "react"

// put in front of every game. the CSP means a game can only use what's inside its
// own file: no fetch, no outside scripts or images. the doctype keeps it in standards mode.
const LOCKDOWN =
  `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; ` +
  `script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:">`

const MAX_SAVE = 100_000

// games send us whatever they want, so only keep task fields that look right
function cleanTask(msg) {
  const task = {}
  if (typeof msg.text === "string" && msg.text.trim()) task.text = msg.text.trim().slice(0, 200)
  if (typeof msg.done === "boolean") task.done = msg.done
  if (msg.due === null || /^\d{4}-\d{2}-\d{2}$/.test(msg.due)) task.due = msg.due
  if (Number.isInteger(msg.position)) task.position = msg.position
  return task
}

export default function GameFrame({ game, tasks, actions }) {
  const frame = useRef(null)
  const [html, setHtml] = useState("")
  const [ready, setReady] = useState(false)

  function send(msg) {
    frame.current.contentWindow.postMessage(msg, "*")
  }

  // built-in games already have their html, uploaded ones get downloaded
  useEffect(() => {
    if (game.html) return setHtml(LOCKDOWN + game.html)
    fetch(game.url)
      .then((res) => res.text())
      .then((text) => setHtml(LOCKDOWN + text))
      .catch(() => setHtml("<p>Couldn't load this app.</p>"))
  }, [game])

  useEffect(() => {
    function onMessage(e) {
      // only listen to our own iframe, not other windows or games
      if (!frame.current || e.source !== frame.current.contentWindow) return
      const msg = e.data || {}

      if (msg.type === "hello") {
        const save = localStorage.getItem("save:" + game.id)
        send({ type: "load", save: save ? JSON.parse(save) : null })
        setReady(true)
      }

      if (msg.type === "save") {
        const text = JSON.stringify(msg.save)
        if (text.length > MAX_SAVE) return console.warn(game.title + " tried to save more than 100 KB")
        localStorage.setItem("save:" + game.id, text)
      }

      if (msg.type === "add") {
        const task = cleanTask(msg)
        if (task.text) actions.add({ text: task.text, due: task.due })
      }

      if (msg.type === "update") {
        const changes = cleanTask(msg)
        if (Object.keys(changes).length) actions.update(msg.id, changes)
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [game, actions])

  // waits for "ready" so the game always gets load first
  useEffect(() => {
    if (ready) {
      const list = tasks.map((t) => ({ id: t.id, text: t.text, done: t.done, due: t.due, position: t.position }))
      send({ type: "tasks", tasks: list })
    }
  }, [ready, tasks])

  if (!html) return <p className="small">Loading...</p>
  return <iframe ref={frame} title={game.title} sandbox="allow-scripts" srcDoc={html} />
}
