import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import open from 'open';
import http from 'http';
import { config } from '../config.js';
import { tokenManager } from './tokenManager.js';

// ─── OAuth Server ─────────────────────────────────────────────────────────────
// Server Express sementara yang menangani alur OAuth 2.0 + PKCE untuk Figma.
// Flow:
//   1. Generate code_verifier + code_challenge (PKCE S256)
//   2. Buka browser → Figma authorization URL
//   3. Figma redirect ke localhost:3334/oauth/callback?code=xxx
//   4. Tukar code → access_token + refresh_token
//   5. Simpan token, tutup server

// ─── PKCE Helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ─── Main OAuth Flow ──────────────────────────────────────────────────────────

export async function runOAuthFlow(): Promise<void> {
  return new Promise((resolve, reject) => {
    const app = express();
    let server: http.Server;

    // State tetap dipakai untuk proteksi CSRF
    const state = generateState();

    // ── Callback Route ──────────────────────────────────────────────────────
    app.get('/oauth/callback', async (req, res) => {
      const { code, state: returnedState, error } = req.query;

      // Validasi state (cegah CSRF)
      if (returnedState !== state) {
        res.status(400).send(htmlPage('❌ Error', 'State tidak valid. Kemungkinan serangan CSRF. Coba lagi.'));
        reject(new Error('OAuth state mismatch — kemungkinan CSRF attack'));
        server.close();
        return;
      }

      if (error) {
        res.status(400).send(htmlPage('❌ Login Dibatalkan', `Figma mengembalikan error: ${error}`));
        reject(new Error(`OAuth error dari Figma: ${error}`));
        server.close();
        return;
      }

      if (!code || typeof code !== 'string') {
        res.status(400).send(htmlPage('❌ Error', 'Authorization code tidak diterima.'));
        reject(new Error('Authorization code tidak ada di callback'));
        server.close();
        return;
      }

      // ── Tukar code → token ───────────────────────────────────────────────
      try {
        console.log('[OAuth] Menukar authorization code dengan token...');

        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.figma.clientId,
          client_secret: config.figma.clientSecret,
          redirect_uri: config.figma.redirectUri,
          code,
          // Tidak pakai code_verifier karena Figma OAuth tidak support PKCE
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

        tokenManager.saveTokens(response.data);

        res.send(htmlPage(
          '✅ Login Berhasil!',
          `
            <p>Kamu berhasil terhubung ke Figma.</p>
            <p><strong>Scope:</strong> ${response.data.scope}</p>
            <p>Kamu bisa tutup tab ini dan kembali ke terminal.</p>
            <p style="margin-top:24px; color:#666; font-size:14px;">FigRouter siap digunakan 🚀</p>
          `
        ));

        console.log('[OAuth] ✅ Autentikasi berhasil! Token disimpan.');
        resolve();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).send(htmlPage('❌ Error', `Gagal menukar token: ${message}`));
        reject(new Error(`Gagal menukar token: ${message}`));
      } finally {
        // Tutup server setelah 2 detik (beri waktu browser baca response)
        setTimeout(() => server.close(), 2000);
      }
    });

    // ── Start Server ────────────────────────────────────────────────────────
    server = app.listen(config.server.authPort, () => {
      // Build authorization URL secara manual agar colon ':' dalam scope
      // TIDAK di-encode menjadi '%3A' (URLSearchParams encode semua karakter khusus,
      // tapi Figma OAuth memerlukan ':' sebagai literal di scope string).
      // Figma OAuth endpoint (figma.com/oauth) tidak support PKCE, jadi kita skip.
      const scopeStr = config.figma.scopes.join(' ');
      const authUrl = [
        `${config.figma.authUrl}`,
        `?client_id=${encodeURIComponent(config.figma.clientId)}`,
        `&redirect_uri=${encodeURIComponent(config.figma.redirectUri)}`,
        `&scope=${scopeStr}`,
        `&response_type=code`,
        `&state=${state}`,
      ].join('');

      console.log('\n' + '─'.repeat(60));
      console.log('🎨 FigRouter — Login Figma');
      console.log('─'.repeat(60));
      console.log('Membuka browser untuk login...');
      console.log('\nJika browser tidak terbuka otomatis, buka URL ini:');
      console.log(authUrl);
      console.log('─'.repeat(60) + '\n');

      open(authUrl).catch(() => {
        console.log('Tidak bisa buka browser otomatis. Silakan buka URL di atas secara manual.');
      });
    });

    server.on('error', (err) => {
      reject(new Error(`Gagal menjalankan OAuth server: ${err.message}`));
    });
  });
}

// ─── HTML Helper ──────────────────────────────────────────────────────────────
function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — FigRouter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d0d0d;
      color: #e8e8e8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 90%;
      text-align: center;
    }
    h1 { font-size: 28px; margin-bottom: 16px; }
    p { line-height: 1.7; color: #aaa; }
    strong { color: #e8e8e8; }
    .logo { font-size: 48px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎨</div>
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}
