// every .html file in src/games/ is a built-in tool, so adding or removing one
// is just adding or deleting its file. the list reads the title, author and
// description from the <title> and <meta> tags at the top of each file.
// a .png with the same name next to it is the screenshot on its card.
const files = import.meta.glob("./games/**/*.html", { query: "?raw", import: "default", eager: true })
const thumbs = import.meta.glob("./games/**/*.png", { query: "?url", import: "default", eager: true })

function meta(html, name) {
  const match = html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))
  return match ? match[1] : ""
}

export const BUILT_IN = Object.entries(files).map(([path, html]) => ({
  id: path.replace("./games/", "").replace(".html", ""), // "garden", "trial/bookshelf"...
  title: html.match(/<title>(.*?)<\/title>/)?.[1] || path,
  author: meta(html, "author"),
  description: meta(html, "description"),
  thumb: thumbs[path.replace(".html", ".png")],
  html,
}))
