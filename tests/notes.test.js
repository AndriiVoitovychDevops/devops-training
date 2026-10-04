const test = require('node:test');
const assert = require('node:assert/strict');
const { validateNote, MAX_LENGTH } = require('../server/notes');

test('приймає звичайний текст і обрізає пробіли', () => {
  assert.deepEqual(validateNote('  Вивчити Docker  '), { ok: true, value: 'Вивчити Docker' });
});

test('не приймає порожній текст', () => {
  assert.equal(validateNote('   ').ok, false);
});

test('не приймає не-рядок', () => {
  assert.equal(validateNote(42).ok, false);
  assert.equal(validateNote(undefined).ok, false);
});

test('не приймає занадто довгий текст', () => {
  assert.equal(validateNote('a'.repeat(MAX_LENGTH + 1)).ok, false);
  assert.equal(validateNote('a'.repeat(MAX_LENGTH)).ok, true);
});
