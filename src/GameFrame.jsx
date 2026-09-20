import { useEffect, useRef, useState } from "react"

// put in front of every game. the CSP means a game can only use what's inside its
// own file: no fetch, no outside scripts or images. the doctype keeps it in standards mode.
const LOCKDOWN =
  `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; ` +
  `script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:">`

const MAX_SAVE = 100_000

export default function GameFrame({ game }) {
  const frame = useRef(null)
  const [html, setHtml] = useState("")

  function send(msg) {
    frame.current.contentWindow.postMessage(msg, "*")
  }

  useEffect(() => {
    fetch(game.url)
      .then((res) => res.text())
      .then((text) => setHtml(LOCKDOWN + text))
      .catch(() => setHtml("<p>Couldn't load this app.</p>"))
  }, [game.url])

  useEffect(() => {
    function onMessage(e) {
      // only listen to our own iframe, not other windows or games
      if (!frame.current || e.source !== frame.current.contentWindow) return
      const msg = e.data || {}

      if (msg.type === "hello") {
        const save = localStorage.getItem("save:" + game.id)
        send({ type: "load", save: save ? JSON.parse(save) : null })
      }

      if (msg.type === "save") {
        const text = JSON.stringify(msg.save)
        if (text.length > MAX_SAVE) return console.warn(game.title + " tried to save more than 100 KB")
        localStorage.setItem("save:" + game.id, text)
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [game])

  if (!html) return <p className="small">Loading...</p>
  return <iframe ref={frame} title={game.title} sandbox="allow-scripts" srcDoc={html} />
}
