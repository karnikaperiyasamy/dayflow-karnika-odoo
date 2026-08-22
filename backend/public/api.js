// Small fetch helper shared by all Dayflow auth pages.
async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  return { ok: res.ok, status: res.status, data };
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + type;
}
