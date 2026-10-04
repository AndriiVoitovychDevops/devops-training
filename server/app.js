// Express-застосунок. База (db) і кеш (cache) передаються ззовні —
// так у тестах можна підставити "фейкові" об'єкти без MySQL і Redis.
const express = require('express');
const { validateNote } = require('./notes');

function createApp({ db, cache, version = 'dev' }) {
  const app = express();
  app.use(express.json());

  // Перевірка здоров'я: Jenkins і Docker смикають цей адрес після деплою
  app.get('/api/health', async (req, res) => {
    const status = { status: 'ok', version, db: 'up', cache: 'up' };

    try {
      await db.ping();
    } catch {
      status.db = 'down';
      status.status = 'error';
    }

    try {
      await cache.ping();
    } catch {
      status.cache = 'down';
      status.status = 'error';
    }

    res.status(status.status === 'ok' ? 200 : 503).json(status);
  });

  // Яка версія (номер збірки Jenkins) зараз працює
  app.get('/api/version', (req, res) => {
    res.json({ version });
  });

  // Лічильник відвідувань — живе в Redis
  app.get('/api/visits', async (req, res) => {
    const visits = await cache.incrVisits();
    res.json({ visits });
  });

  // Нотатки — живуть у MySQL
  app.get('/api/notes', async (req, res) => {
    const notes = await db.listNotes();
    res.json({ notes });
  });

  app.post('/api/notes', async (req, res) => {
    const result = validateNote(req.body?.text);

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const note = await db.addNote(result.value);
    res.status(201).json({ note });
  });

  // Будь-яка непередбачена помилка -> 500, а деталі тільки в лог
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  });

  return app;
}

module.exports = { createApp };
