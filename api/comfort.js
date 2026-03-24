import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  const { action } = req.query

  // GET /api/comfort?action=get — returns single random approved comfort letter
  if (action === 'get') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { data, error } = await supabase
      .from('comfort_letters')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    if (!data || data.length === 0) return res.status(200).json({ letter: null })

    const random = data[Math.floor(Math.random() * data.length)]
    return res.status(200).json({ letter: random })
  }

  // GET /api/comfort?action=get-all — returns all comfort letters
  if (action === 'get-all') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { data, error } = await supabase
      .from('comfort_letters')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ letters: data || [] })
  }

  // POST /api/comfort?action=submit
  if (action === 'submit') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { content } = req.body

    if (!content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Content too short' })
    }

    const { error } = await supabase
      .from('comfort_letters')
      .insert([{ content: content.trim(), status: 'pending' }])

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
