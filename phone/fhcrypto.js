// Encryption on the phone, in exactly the formats the PC writes (vault.js, diary.js, auth.js),
// so a phone and a PC read and write the same files.
//   sealed file:  MAGIC (4 bytes) | iv (12) | GCM tag (16) | ciphertext      AES-256-GCM
//   family files use the magic "FHE1", diary pages "FHD1"
//   keys from passwords: scrypt (scrypt-js), same parameters as Node on the PC
(function () {
  'use strict';
  const te = new TextEncoder(), td = new TextDecoder();
  const FHE = te.encode('FHE1'), FHD = te.encode('FHD1');
  const subtle = () => {
    if (!window.crypto || !window.crypto.subtle) throw new Error('This browser cannot encrypt. Open the app over https in Safari or Chrome.');
    return window.crypto.subtle;
  };

  const b64 = {
    from(s) { const bin = atob(String(s || '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; },
    to(u8) { let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); },
  };
  const hex = u8 => Array.from(u8, b => b.toString(16).padStart(2, '0')).join('');
  const sameMagic = (blob, magic) => blob.length >= 32 && blob[0] === magic[0] && blob[1] === magic[1] && blob[2] === magic[2] && blob[3] === magic[3];
  const u8 = x => (x instanceof Uint8Array ? x : new Uint8Array(x));

  function importKey(raw, extractable) {
    return subtle().importKey('raw', u8(raw), { name: 'AES-GCM' }, !!extractable, ['encrypt', 'decrypt']);
  }
  async function seal(key, data, magic) {
    const m = magic || FHE;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const r = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, u8(data)));
    const ct = r.subarray(0, r.length - 16), tag = r.subarray(r.length - 16);
    const out = new Uint8Array(32 + ct.length);
    out.set(m, 0); out.set(iv, 4); out.set(tag, 16); out.set(ct, 32);
    return out;
  }
  async function open(key, blob, magic) {
    const b = u8(blob), m = magic || FHE;
    if (!sameMagic(b, m)) throw new Error(m === FHD ? 'Not a diary page' : 'Not an encrypted Family Hub file');
    const ct = b.subarray(32), joined = new Uint8Array(ct.length + 16);
    joined.set(ct, 0); joined.set(b.subarray(16, 32), ct.length);
    return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: b.subarray(4, 16) }, key, joined));
  }
  const isSealed = blob => sameMagic(u8(blob), FHE);

  // scrypt from scrypt-js; it yields to the page while it works, so the screen does not freeze
  function scrypt(pass, salt, N, r, p, len) {
    if (!window.scrypt || !window.scrypt.scrypt) throw new Error('scrypt is missing');
    return window.scrypt.scrypt(u8(pass), u8(salt), N, r, p, len).then(x => new Uint8Array(x));
  }

  // ---- the family key (vault.js): kdf(secret NFKC, salt) = scrypt N 32768, r 8, p 1, 32 bytes ----
  const vaultKek = (secret, saltB64) => scrypt(te.encode(String(secret).normalize('NFKC')), b64.from(saltB64), 32768, 8, 1, 32);
  const normCode = c => String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  // opens a wrapped data key; returns its raw bytes (only ever held in memory while it is imported)
  async function unwrap(kekRaw, wB64) { return open(await importKey(kekRaw), b64.from(wB64)); }

  // ---- in-app logins (auth.js): scrypt(password, salt-hex-as-text, 64), Node's defaults N 16384, r 8, p 1 ----
  async function hashPassword(pw) {
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    return { salt, hash: hex(await scrypt(te.encode(String(pw)), te.encode(salt), 16384, 8, 1, 64)) };
  }
  async function verifyPassword(pw, salt, hash) {
    if (!salt || !hash) return false;
    const test = hex(await scrypt(te.encode(String(pw)), te.encode(String(salt)), 16384, 8, 1, 64));
    const known = String(hash).toLowerCase();
    if (test.length !== known.length) return false;
    let diff = 0;
    for (let i = 0; i < test.length; i++) diff |= test.charCodeAt(i) ^ known.charCodeAt(i);
    return diff === 0;
  }

  // ---- a child's diary (diary.js): kek = scrypt(pin, salt, N 65536, r 8, p 1, 32) ----
  const diaryKek = (pin, saltB64) => scrypt(te.encode(String(pin)), b64.from(saltB64), 65536, 8, 1, 32);

  window.FHCrypto = { te, td, FHE, FHD, b64, hex, importKey, seal, open, isSealed, scrypt, vaultKek, normCode, unwrap, hashPassword, verifyPassword, diaryKek };
})();
