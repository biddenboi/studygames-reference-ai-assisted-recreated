import { useState } from "react"
import { supabase } from "./supabase.js"

export default function Upload({ user, onUploaded }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [author, setAuthor] = useState("")
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState("")

  async function upload(e) {
    e.preventDefault()
    if (!file || !file.name.endsWith(".html")) return setStatus("It has to be one .html file.")
    if (file.size > 1_000_000) return setStatus("Max size is 1 MB.")

    setStatus("Uploading...")
    const path = user.id + "/" + Date.now() + ".html"
    const { error: fileError } = await supabase.storage.from("games").upload(path, file)
    if (fileError) return setStatus(fileError.message)

    const { error } = await supabase.from("games").insert({ title, description, author, file_path: path })
    if (error) return setStatus(error.message)

    setStatus("Uploaded!")
    onUploaded()
    setTitle("")
    setDescription("")
    setFile(null)
    e.target.reset()
  }

  return (
    <section className="upload box">
      <h2>Upload an app</h2>
      <p className="small">
        One .html file, under 1 MB. Everyone will be able to see it.
      </p>
      <form onSubmit={upload}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" required />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" required />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="description"
          required
        />
        <input type="file" accept=".html" onChange={(e) => setFile(e.target.files[0])} required />
        <button>Upload</button>
      </form>
      {status && <p className="small">{status}</p>}
    </section>
  )
}
