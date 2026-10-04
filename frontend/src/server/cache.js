// Підключення до Redis — швидке сховище в пам'яті для лічильника відвідувань.
const { createClient } = require('redis');

async function createCache(url) {
  const client = createClient({ url });

  client.on('error', (err) => console.error('Помилка Redis:', err.message));

  await client.connect();
  console.log('Redis підключено');

  return {
    ping: () => client.ping(),
    incrVisits: () => client.incr('visits'),
    close: () => client.close(),
  };
}

module.exports = { createCache };
