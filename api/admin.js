import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  const { action } = req.query

  // GET /api/admin?action=letters&type=primary|comfort
  if (action === 'letters') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { type } = req.query
    const table = type === 'comfort' ? 'comfort_letters' : 'letters'

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ letters: data || [] })
  }

  // POST /api/admin?action=update
  if (action === 'update') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { type, id, status, username } = req.body

    if (!type || !id || !status || !username) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const table = type === 'comfort' ? 'comfort_letters' : 'letters'

    const { error } = await supabase
      .from(table)
      .update({ status })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })

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

  // GET /api/admin?action=suggestions — fetch all suggestions
  // DELETE /api/admin?action=suggestions — delete a suggestion
  if (action === 'suggestions') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ suggestions: data || [] })
    }

    if (req.method === 'DELETE') {
      const { id, username } = req.body

      if (!id) return res.status(400).json({ error: 'Missing id' })

      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      await supabase.from('admin_log').insert([{
        username: username || 'unknown',
        action: 'deleted',
        letter_type: 'suggestion',
        letter_id: id,
        note: `Suggestion #${id} deleted`
      }])

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }

  // GET /api/admin?action=log
  if (action === 'log') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { data, error } = await supabase
      .from('admin_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ logs: data || [] })
  }

  // GET /api/admin?action=void — fetch void letters
  // DELETE /api/admin?action=void — delete a void letter
  if (action === 'void') {
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

  return res.status(400).json({ error: 'Invalid action' })
}
