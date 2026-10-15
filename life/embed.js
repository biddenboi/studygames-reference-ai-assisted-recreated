// usage: node embed.js life.wasm life.html
// replaces the WASM = "..." line in the html with the new build
import fs from "fs"

const [wasmFile, htmlFile] = process.argv.slice(2)
const base64 = fs.readFileSync(wasmFile).toString("base64")
const html = fs.readFileSync(htmlFile, "utf8")

const updated = html.replace(/const WASM = ".*"/, `const WASM = "${base64}"`)
if (updated === html && !html.includes(base64)) throw new Error("couldn't find the WASM line in " + htmlFile)

fs.writeFileSync(htmlFile, updated)
console.log("embedded " + fs.statSync(wasmFile).size + " bytes of wasm into " + htmlFile)
