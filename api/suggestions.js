import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { content } = req.body

  if (!content || content.trim().length < 3) {
    return res.status(400).json({ error: 'Content too short' })
  }

  const { error } = await supabase
    .from('suggestions')
    .insert([{ content: content.trim() }])

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}