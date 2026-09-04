import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

if (!supabase) {
  console.log('ℹ️ No Supabase credentials configured in .env — using local SQLite database.')
}

