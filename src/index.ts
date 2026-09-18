import 'dotenv/config';
import { tokenManager } from './auth/tokenManager.js';
import { startMcpTransport } from './mcp/transport.js';
import { config } from './config.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Entry point utama FigRouter.
// Cek token → start MCP server → siap terima koneksi dari AI agent.

async function main(): Promise<void> {
  console.log(`\n🎨 ${config.app.name} v${config.app.version} — Starting...`);

  // Cek status autentikasi saat startup
  if (!tokenManager.isAuthenticated()) {
    console.log('');
    console.log('⚠️  Belum terautentikasi ke Figma!');
    console.log('   Jalankan perintah berikut untuk login:');
    console.log('   npx figrouter auth');
    console.log('');
    console.log('   Server tetap berjalan, tapi tool Figma akan error');
    console.log('   sampai kamu login. Tool figma_authenticate tersedia');
    console.log('   via MCP untuk trigger login dari AI agent.');
    console.log('');
  } else {
    const status = tokenManager.getStatus();
    console.log(`✅ Terautentikasi ke Figma (token berlaku hingga: ${status.expiresAt})`);
  }

  // Start MCP server
  await startMcpTransport();
}

main().catch((err) => {
  console.error('\n💥 Fatal error saat startup:', err instanceof Error ? err.message : err);
  process.exit(1);
});
