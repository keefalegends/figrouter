#!/usr/bin/env node
import 'dotenv/config';

// ─── CLI ──────────────────────────────────────────────────────────────────────
// Command-line interface untuk FigRouter.
// Usage:
//   npx figrouter start    — Jalankan MCP bridge server
//   npx figrouter auth     — Login ke Figma via OAuth
//   npx figrouter status   — Cek status token
//   npx figrouter logout   — Logout (hapus token)

const [, , command, ...args] = process.argv;

async function run(): Promise<void> {
  switch (command) {
    case 'start':
    case undefined: {
      // Jalankan MCP server (default command)
      const { startMcpTransport } = await import('./mcp/transport.js');
      const { tokenManager } = await import('./auth/tokenManager.js');
      const { config } = await import('./config.js');

      console.log(`\n🎨 ${config.app.name} v${config.app.version}`);

      if (!tokenManager.isAuthenticated()) {
        console.log('\n⚠️  Belum login ke Figma. Jalankan: npx figrouter auth\n');
      } else {
        const status = tokenManager.getStatus();
        console.log(`✅ Terautentikasi (berlaku hingga: ${status.expiresAt})`);
      }

      await startMcpTransport();
      break;
    }

    case 'auth': {
      // Trigger OAuth login flow
      console.log('\n🔑 FigRouter — Login ke Figma\n');
      const { runOAuthFlow } = await import('./auth/oauthServer.js');
      const { tokenManager } = await import('./auth/tokenManager.js');

      if (tokenManager.isAuthenticated()) {
        const status = tokenManager.getStatus();
        console.log(`✅ Sudah terautentikasi!`);
        console.log(`   Token berlaku hingga: ${status.expiresAt}`);
        console.log(`   Scope: ${status.scope}`);
        console.log('\nJika ingin login ulang, jalankan: npx figrouter logout\n');
        process.exit(0);
      }

      await runOAuthFlow();
      console.log('\n✅ Login berhasil! Sekarang jalankan: npx figrouter start\n');
      process.exit(0);
      break;
    }

    case 'status': {
      // Tampilkan status token
      const { tokenManager } = await import('./auth/tokenManager.js');
      const status = tokenManager.getStatus();

      console.log('\n📊 FigRouter — Status\n');
      console.log(`  Authenticated : ${status.authenticated ? '✅ Ya' : '❌ Tidak'}`);
      if (status.authenticated) {
        console.log(`  Token expires : ${status.expiresAt}`);
        console.log(`  Scope         : ${status.scope}`);
      }
      console.log(`  Storage path  : ${status.storagePath}`);
      console.log('');

      if (!status.authenticated) {
        console.log('  Jalankan: npx figrouter auth\n');
        process.exit(1);
      }
      process.exit(0);
      break;
    }

    case 'logout': {
      // Hapus token tersimpan
      const { tokenManager } = await import('./auth/tokenManager.js');
      tokenManager.logout();
      console.log('\n✅ Logout berhasil. Token dihapus.\n');
      console.log('Untuk login ulang: npx figrouter auth\n');
      process.exit(0);
      break;
    }

    default: {
      console.log(`
🎨 FigRouter v0.1.0 — Figma MCP Bridge

Usage:
  npx figrouter [command]

Commands:
  start     Jalankan MCP bridge server (default)
  auth      Login ke Figma via OAuth 2.0
  status    Cek status autentikasi
  logout    Logout (hapus token tersimpan)

Examples:
  npx figrouter auth          # Login dulu
  npx figrouter start         # Jalankan server
  npx figrouter status        # Cek status
      `);
      process.exit(0);
    }
  }
}

run().catch((err) => {
  console.error('\n💥 Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
