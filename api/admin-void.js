import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('void_letters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ letters: data || [] })
  }

  if (req.method === 'DELETE') {
    const { id, username } = req.body

    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { error } = await supabase
      .from('void_letters')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })

    // Log the deletion
    await supabase.from('admin_log').insert([{
      username: username || 'unknown',
      action: 'deleted',
      letter_type: 'void',
      letter_id: id,
      note: `Void letter #${id} deleted`
    }])

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
