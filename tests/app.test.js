// Тести API без справжніх MySQL і Redis: підставляємо фейкові db і cache.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server/app');

function fakeDeps({ dbUp = true, cacheUp = true } = {}) {
  const notes = [];
  let visits = 0;

  return {
    db: {
      ping: async () => {
        if (!dbUp) throw new Error('db down');
      },
      listNotes: async () => [...notes].reverse(),
      addNote: async (text) => {
        const note = { id: notes.length + 1, text };
        notes.push(note);
        return note;
      },
    },
    cache: {
      ping: async () => {
        if (!cacheUp) throw new Error('cache down');
      },
      incrVisits: async () => ++visits,
    },
  };
}

// Запускає застосунок на випадковому вільному порту і повертає базову адресу
async function start(t, deps) {
  const server = createApp({ ...deps, version: 'test' }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}`;
}

test('GET /api/health -> 200, коли все працює', async (t) => {
  const url = await start(t, fakeDeps());
  const res = await fetch(`${url}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', version: 'test', db: 'up', cache: 'up' });
});

test('GET /api/health -> 503, коли база недоступна', async (t) => {
  const url = await start(t, fakeDeps({ dbUp: false }));
  const res = await fetch(`${url}/api/health`);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).db, 'down');
});

test('GET /api/health -> 503, коли Redis недоступний', async (t) => {
  const url = await start(t, fakeDeps({ cacheUp: false }));
  const res = await fetch(`${url}/api/health`);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).cache, 'down');
});

test('GET /api/version повертає версію', async (t) => {
  const url = await start(t, fakeDeps());
  const res = await fetch(`${url}/api/version`);
  assert.deepEqual(await res.json(), { version: 'test' });
});

test('GET /api/visits збільшує лічильник', async (t) => {
  const url = await start(t, fakeDeps());
  await fetch(`${url}/api/visits`);
  const res = await fetch(`${url}/api/visits`);
  assert.deepEqual(await res.json(), { visits: 2 });
});

test('POST /api/notes створює нотатку, GET її повертає', async (t) => {
  const url = await start(t, fakeDeps());

  const created = await fetch(`${url}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Налаштувати Jenkins' }),
  });
  assert.equal(created.status, 201);

  const list = await (await fetch(`${url}/api/notes`)).json();
  assert.equal(list.notes.length, 1);
  assert.equal(list.notes[0].text, 'Налаштувати Jenkins');
});

test('POST /api/notes з порожнім текстом -> 400', async (t) => {
  const url = await start(t, fakeDeps());
  const res = await fetch(`${url}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '' }),
  });
  assert.equal(res.status, 400);
});

test('помилка бази -> 500 без деталей для клієнта', async (t) => {
  const deps = fakeDeps();
  deps.db.listNotes = async () => {
    throw new Error('secret details');
  };
  const url = await start(t, deps);
  t.mock.method(console, 'error', () => {});

  const res = await fetch(`${url}/api/notes`);
  assert.equal(res.status, 500);
  assert.equal(JSON.stringify(await res.json()).includes('secret'), false);
});
