import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  const { action } = req.query

  // GET /api/letters?action=get
  if (action === 'get') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Failed to fetch letters' })
    return res.status(200).json({ letters: data })
  }

  // POST /api/letters?action=submit
  if (action === 'submit') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { content, addressed_to } = req.body

    if (!content || !addressed_to) {
      return res.status(400).json({ error: 'Missing content or addressed_to' })
    }

    const { error } = await supabase
      .from('letters')
      .insert([{ content, addressed_to, status: 'pending' }])

    if (error) return res.status(500).json({ error: 'Failed to save letter' })
    return res.status(200).json({ message: 'Letter saved successfully' })
  }

  // POST /api/letters?action=submit-void
  if (action === 'submit-void') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { content, addressed_to } = req.body

    if (!content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Content too short' })
    }

    const { error } = await supabase
      .from('void_letters')
      .insert([{ content: content.trim(), addressed_to: addressed_to || 'The void' }])

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
