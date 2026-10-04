// Перевірка тексту нотатки. Чиста функція без бази — її легко тестувати.
const MAX_LENGTH = 500;

function validateNote(text) {
  if (typeof text !== 'string') {
    return { ok: false, error: 'Поле "text" має бути рядком' };
  }

  const value = text.trim();

  if (value.length === 0) {
    return { ok: false, error: 'Нотатка не може бути порожньою' };
  }

  if (value.length > MAX_LENGTH) {
    return { ok: false, error: `Нотатка довша за ${MAX_LENGTH} символів` };
  }

  return { ok: true, value };
}

module.exports = { validateNote, MAX_LENGTH };
