// Точка входу: читаємо налаштування зі змінних оточення,
// підключаємось до MySQL і Redis, запускаємо HTTP-сервер.
const { createApp } = require('./app');
const { createDb } = require('./db');
const { createCache } = require('./cache');

const config = {
  port: Number(process.env.PORT) || 3000,
  version: process.env.APP_VERSION || 'dev',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'notes',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'notes',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};

async function main() {
  const db = await createDb(config.db);
  const cache = await createCache(config.redisUrl);
  const app = createApp({ db, cache, version: config.version });

  const server = app.listen(config.port, () => {
    console.log(`Notes app (версія ${config.version}) слухає порт ${config.port}`);
  });

  // docker stop надсилає SIGTERM — акуратно закриваємо з'єднання
  const shutdown = async () => {
    console.log('Зупиняємось...');
    server.close();
    await Promise.allSettled([db.close(), cache.close()]);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Не вдалося запустити застосунок:', err);
  process.exit(1);
});
