import 'dotenv/config';

// ─── Config Loader ────────────────────────────────────────────────────────────
// Memuat dan memvalidasi semua environment variable yang diperlukan.
// Throws error dengan pesan jelas jika variabel wajib tidak ada.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[FigRouter] Environment variable "${key}" wajib diisi.\n` +
      `Salin .env.example → .env dan isi nilainya.`
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // Figma OAuth credentials
  figma: {
    clientId: requireEnv('FIGMA_CLIENT_ID'),
    clientSecret: requireEnv('FIGMA_CLIENT_SECRET'),
    redirectUri: optionalEnv(
      'FIGMA_REDIRECT_URI',
      'http://localhost:3334/oauth/callback'
    ),
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    apiBaseUrl: 'https://api.figma.com/v1',
    // Scopes yang diizinkan untuk third-party app
    // Format baru Figma: https://www.figma.com/developers/api#oauth2
    scopes: [
      'file_content:read',
      'file_metadata:read',
      'file_comments:read',
      'file_comments:write',
    ],
  },

  // Server ports
  server: {
    mcpPort: parseInt(optionalEnv('FIGROUTER_PORT', '3333'), 10),
    authPort: parseInt(optionalEnv('FIGROUTER_AUTH_PORT', '3334'), 10),
  },

  // Logging
  logLevel: optionalEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',

  // App info
  app: {
    name: 'FigRouter',
    version: '0.1.0',
  },
} as const;

export type Config = typeof config;
