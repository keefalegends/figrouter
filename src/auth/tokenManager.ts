import axios from 'axios';
import { EventEmitter } from 'events';
import { config } from '../config.js';
import { tokenStore, type StoredTokens } from './tokenStore.js';

// ─── Token Manager ────────────────────────────────────────────────────────────
// Mengelola siklus hidup token OAuth:
// - Mengembalikan token valid (refresh otomatis jika expired)
// - Emit events saat token diperbarui atau kedaluwarsa

class TokenManager extends EventEmitter {
  private refreshPromise: Promise<string> | null = null;

  /**
   * Kembalikan access token yang valid.
   * Jika token hampir expired, otomatis refresh dulu.
   */
  async getValidToken(): Promise<string> {
    const tokens = tokenStore.load();

    if (!tokens) {
      throw new Error(
        '[FigRouter] Belum terautentikasi. Jalankan: npx figrouter auth'
      );
    }

    // Token masih valid
    if (tokenStore.isValid()) {
      return tokens.accessToken;
    }

    // Token expired — refresh (cegah race condition dengan satu promise)
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken(tokens).finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  /**
   * Cek apakah sudah terautentikasi (token ada dan valid)
   */
  isAuthenticated(): boolean {
    return tokenStore.isValid();
  }

  /**
   * Simpan token baru (dipanggil setelah OAuth callback berhasil)
   */
  saveTokens(data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }): void {
    const tokens: StoredTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
      tokenType: data.token_type,
    };
    tokenStore.save(tokens);
    this.emit('token:saved', tokens);
    console.log('[TokenManager] Token disimpan, valid hingga:', new Date(tokens.expiresAt).toLocaleString());
  }

  /**
   * Status token untuk CLI / dashboard
   */
  getStatus(): {
    authenticated: boolean;
    expiresAt?: string;
    scope?: string;
    storagePath: string;
  } {
    const tokens = tokenStore.load();
    return {
      authenticated: tokenStore.isValid(),
      expiresAt: tokens ? new Date(tokens.expiresAt).toLocaleString('id-ID') : undefined,
      scope: tokens?.scope,
      storagePath: tokenStore.storagePath,
    };
  }

  /**
   * Hapus semua token (logout)
   */
  logout(): void {
    tokenStore.clear();
    this.emit('token:cleared');
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async refreshToken(tokens: StoredTokens): Promise<string> {
    console.log('[TokenManager] Token expired, melakukan refresh...');

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.figma.clientId,
        client_secret: config.figma.clientSecret,
        refresh_token: tokens.refreshToken,
      });

      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
      }>(config.figma.tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.saveTokens(response.data);
      this.emit('token:refreshed');
      console.log('[TokenManager] Token berhasil diperbarui.');
      return response.data.access_token;
    } catch (err) {
      this.emit('token:expired');
      tokenStore.clear();
      throw new Error(
        '[TokenManager] Gagal refresh token. Silakan login ulang: npx figrouter auth'
      );
    }
  }
}

// Singleton instance
export const tokenManager = new TokenManager();
