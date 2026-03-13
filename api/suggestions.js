import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let content;
  try {
    const text = await req.text();
    const body = JSON.parse(text);
    content = body.content;
  } catch (e) {
    return new Response('Invalid request', { status: 400 });
  }

  if (!content || content.trim().length < 3) {
    return new Response('Content too short', { status: 400 });
  }

  const { error } = await supabase
    .from('suggestions')
    .insert([{ content: content.trim() }]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}