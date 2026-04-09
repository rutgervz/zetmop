// Reduced alphabet: no O, I, L to avoid visual ambiguity
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  const upper = code.toUpperCase();
  if (upper.length !== CODE_LENGTH) return false;
  return [...upper].every((c) => ALPHABET.includes(c));
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);
}
