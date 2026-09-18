import crypto from 'crypto';
import Conf from 'conf';

// ─── Token Storage ────────────────────────────────────────────────────────────
// Menyimpan OAuth token secara terenkripsi di disk menggunakan `conf`.
// Lokasi penyimpanan: %APPDATA%/figrouter/config.json (Windows)
//                     ~/.config/figrouter/config.json (Linux/Mac)

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
  scope: string;
  tokenType: string;
}

// Gunakan machine-specific encryption key (derive dari hostname + username)
function getEncryptionKey(): string {
  const raw = `${process.env.COMPUTERNAME ?? process.env.HOSTNAME ?? 'figrouter'}-${process.env.USERNAME ?? process.env.USER ?? 'user'}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

const store = new Conf<{ tokens?: StoredTokens }>({
  projectName: 'figrouter',
  encryptionKey: getEncryptionKey(),
  schema: {
    tokens: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresAt: { type: 'number' },
        scope: { type: 'string' },
        tokenType: { type: 'string' },
      },
    },
  },
});

export const tokenStore = {
  /**
   * Simpan token ke disk (terenkripsi)
   */
  save(tokens: StoredTokens): void {
    store.set('tokens', tokens);
    console.log('[TokenStore] Token disimpan.');
  },

  /**
   * Ambil token dari disk, atau null jika belum ada
   */
  load(): StoredTokens | null {
    return store.get('tokens') ?? null;
  },

  /**
   * Hapus semua token tersimpan (logout)
   */
  clear(): void {
    store.delete('tokens');
    console.log('[TokenStore] Token dihapus.');
  },

  /**
   * Cek apakah token tersimpan dan belum expired
   */
  isValid(): boolean {
    const tokens = store.get('tokens');
    if (!tokens) return false;
    // Anggap invalid jika kurang dari 5 menit sebelum expired
    return Date.now() < tokens.expiresAt - 5 * 60 * 1000;
  },

  /**
   * Path file penyimpanan (untuk debugging)
   */
  get storagePath(): string {
    return store.path;
  },
};

export type { StoredTokens };
