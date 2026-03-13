export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}