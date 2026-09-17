import { useEffect, useState } from "react"

// put in front of every game. the CSP means a game can only use what's inside its
// own file: no fetch, no outside scripts or images. the doctype keeps it in standards mode.
const LOCKDOWN =
  `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; ` +
  `script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:">`

export default function GameFrame({ game }) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    fetch(game.url)
      .then((res) => res.text())
      .then((text) => setHtml(LOCKDOWN + text))
      .catch(() => setHtml("<p>Couldn't load this app.</p>"))
  }, [game.url])

  if (!html) return <p className="small">Loading...</p>
  return <iframe title={game.title} sandbox="allow-scripts" srcDoc={html} />
}
