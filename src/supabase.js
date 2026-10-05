import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// if there's no .env the site still works, just without login/uploads
export const supabase = url && key ? createClient(url, key) : null
