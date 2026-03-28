import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  // ── Submit a reflection (public) ──
  if (action === 'submit' && req.method === 'POST') {
    const { question, content } = req.body;
    if (!question || !content || !content.trim()) {
      return res.status(400).json({ error: 'Missing or too-short content.' });
    }
    const { error } = await supabase.from('reflections').insert([{
      question: question.trim(),
      content: content.trim(),
      status: 'pending'
    }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Get approved reflections (public) ──
  if (action === 'get-approved' && req.method === 'GET') {
    const { data, error } = await supabase
      .from('reflections')
      .select('id, created_at, question, content')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ reflections: data });
  }

  // ── Get all reflections (admin) ──
  if (action === 'get-all' && req.method === 'GET') {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ reflections: data });
  }

  // ── Update status (admin) ──
  if (action === 'update' && req.method === 'POST') {
    const { id, status, username } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing id or status.' });
    const { error } = await supabase
      .from('reflections')
      .update({ status })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    // Log to admin_log
    await supabase.from('admin_log').insert([{
      username: username || 'admin',
      action: status,
      letter_type: 'reflection',
      letter_id: id,
      note: `Reflection ${status}`
    }]);

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action.' });
}
