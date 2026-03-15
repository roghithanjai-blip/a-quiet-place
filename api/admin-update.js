import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, id, status, username } = req.body

  if (!type || !id || !status || !username) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const table = type === 'comfort' ? 'comfort_letters' : 'letters'

  const { error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Log the activity
  const note = `${type === 'comfort' ? 'Comfort letter' : 'Letter'} #${id} marked as ${status}`
  await supabase.from('admin_log').insert([{
    username,
    action: status,
    letter_type: type,
    letter_id: id,
    note
  }])

  return res.status(200).json({ ok: true })
}
