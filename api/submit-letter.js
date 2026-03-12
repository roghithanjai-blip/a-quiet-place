import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { content, addressed_to } = req.body

  if (!content || !addressed_to) {
    return res.status(400).json({ error: 'Missing content or addressed_to' })
  }

  const { error } = await supabase
    .from('letters')
    .insert([{ content, addressed_to, status: 'pending' }])

  if (error) {
    return res.status(500).json({ error: 'Failed to save letter' })
  }

  return res.status(200).json({ message: 'Letter saved successfully' })
}