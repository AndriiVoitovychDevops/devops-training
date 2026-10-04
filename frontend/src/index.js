// Фронтенд: усі запити йдуть на /api/..., а Nginx пересилає їх у Node.js (reverse proxy).
import './style.css';

const $ = (id) => document.getElementById(id);

function setPill(id, text, state) {
  const el = $(id);
  el.textContent = text;
  el.className = `pill ${state || ''}`;
}

async function getJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function loadStatus() {
  try {
    const { ok, data } = await getJson('/api/health');
    setPill('health', ok ? 'API: працює' : `API: БД ${data.db}, Redis ${data.cache}`, ok ? 'ok' : 'bad');
    setPill('version', `версія: ${data.version ?? '?'}`);
  } catch {
    setPill('health', 'API: недоступний', 'bad');
  }

  try {
    const { data } = await getJson('/api/visits');
    setPill('visits', `відвідувань: ${data.visits}`);
  } catch {
    setPill('visits', 'відвідувань: ?', 'bad');
  }
}

function renderNotes(notes) {
  const list = $('notes');
  list.replaceChildren(
    ...notes.map((note) => {
      const li = document.createElement('li');
      li.textContent = note.text; // textContent, а не innerHTML — захист від XSS
      if (note.created_at) {
        const time = document.createElement('time');
        time.textContent = new Date(note.created_at).toLocaleString('uk-UA');
        li.append(time);
      }
      return li;
    })
  );
}

async function loadNotes() {
  const { ok, data } = await getJson('/api/notes');
  if (ok) renderNotes(data.notes);
}

$('note-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('note-text');
  $('form-error').textContent = '';

  const { ok, data } = await getJson('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.value }),
  });

  if (!ok) {
    $('form-error').textContent = data.error || 'Не вдалося зберегти';
    return;
  }

  input.value = '';
  loadNotes();
});

loadStatus();
loadNotes().catch(() => {});
