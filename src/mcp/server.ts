import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { figmaClient } from '../figma/client.js';
import { tokenManager } from '../auth/tokenManager.js';
import { runOAuthFlow } from '../auth/oauthServer.js';
import { config } from '../config.js';

// ─── MCP Server ───────────────────────────────────────────────────────────────
// Mendaftarkan semua tool Figma ke MCP Server.
// AI agent (VS Code, Cursor, 9router, Antigravity) akan menemukan tool ini
// saat terhubung ke http://localhost:3333/mcp.

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: config.app.name,
    version: config.app.version,
  });

  // ─── Tool: figma_auth_status ───────────────────────────────────────────────
  server.registerTool(
    'figma_auth_status',
    {
      title: 'Cek Status Autentikasi Figma',
      description: 'Cek apakah FigRouter sudah terhubung ke akun Figma. Gunakan tool ini sebelum memanggil tool Figma lainnya.',
      inputSchema: {},
    },
    async () => {
      const status = tokenManager.getStatus();
      const text = status.authenticated
        ? `✅ Terautentikasi ke Figma\nScope: ${status.scope}\nToken berlaku hingga: ${status.expiresAt}\nStorage: ${status.storagePath}`
        : `❌ Belum terautentikasi. Jalankan tool figma_authenticate atau: npx figrouter auth`;

      return { content: [{ type: 'text', text }] };
    }
  );

  // ─── Tool: figma_authenticate ─────────────────────────────────────────────
  server.registerTool(
    'figma_authenticate',
    {
      title: 'Login ke Figma via OAuth',
      description: 'Membuka browser untuk login ke Figma via OAuth 2.0. Panggil tool ini jika figma_auth_status menunjukkan belum terautentikasi.',
      inputSchema: {},
    },
    async () => {
      if (tokenManager.isAuthenticated()) {
        return {
          content: [{ type: 'text', text: '✅ Sudah terautentikasi. Tidak perlu login ulang.' }],
        };
      }

      try {
        await runOAuthFlow();
        return {
          content: [{ type: 'text', text: '✅ Login berhasil! Kamu sekarang bisa menggunakan semua tool Figma.' }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `❌ Login gagal: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  // ─── Tool: figma_get_file ──────────────────────────────────────────────────
  server.registerTool(
    'figma_get_file',
    {
      title: 'Ambil File Figma',
      description: `Mengambil seluruh dokumen Figma file termasuk semua layer, komponen, dan style.
File key bisa ditemukan di URL Figma: figma.com/file/{FILE_KEY}/nama-file
Contoh URL: https://www.figma.com/file/abc123xyz/MyDesign → fileKey = "abc123xyz"`,
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma (dari URL: figma.com/file/{fileKey}/...)'),
      },
    },
    async ({ fileKey }) => {
      try {
        const file = await figmaClient.getFile(fileKey);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: file.name,
              lastModified: file.lastModified,
              version: file.version,
              document: file.document,
              componentCount: Object.keys(file.components).length,
              styleCount: Object.keys(file.styles).length,
            }, null, 2),
          }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  // ─── Tool: figma_get_nodes ────────────────────────────────────────────────
  server.registerTool(
    'figma_get_nodes',
    {
      title: 'Ambil Node Tertentu dari File Figma',
      description: 'Mengambil node-node spesifik dari file Figma berdasarkan ID. Berguna untuk inspeksi komponen atau frame tertentu tanpa harus load seluruh file.',
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma'),
        nodeIds: z.array(z.string()).describe('Array ID node yang ingin diambil, mis: ["1:2", "3:4"]'),
      },
    },
    async ({ fileKey, nodeIds }) => {
      try {
        const result = await figmaClient.getFileNodes(fileKey, nodeIds);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  // ─── Tool: figma_get_components ───────────────────────────────────────────
  server.registerTool(
    'figma_get_components',
    {
      title: 'Daftar Komponen Figma',
      description: 'Mengambil daftar semua komponen yang tersedia di sebuah file Figma. Berguna untuk melihat design system / component library.',
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma'),
      },
    },
    async ({ fileKey }) => {
      try {
        const result = await figmaClient.getComponents(fileKey);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  // ─── Tool: figma_get_styles ───────────────────────────────────────────────
  server.registerTool(
    'figma_get_styles',
    {
      title: 'Daftar Style Figma',
      description: 'Mengambil semua style (color tokens, typography, effects, grids) dari file Figma. Berguna untuk generate design tokens atau CSS variables.',
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma'),
      },
    },
    async ({ fileKey }) => {
      try {
        const result = await figmaClient.getStyles(fileKey);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  // ─── Tool: figma_get_comments ─────────────────────────────────────────────
  server.registerTool(
    'figma_get_comments',
    {
      title: 'Ambil Komentar File Figma',
      description: 'Mengambil semua komentar yang ada di sebuah file Figma. Berguna untuk melihat feedback desain dari tim.',
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma'),
      },
    },
    async ({ fileKey }) => {
      try {
        const result = await figmaClient.getComments(fileKey);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  // ─── Tool: figma_post_comment ─────────────────────────────────────────────
  server.registerTool(
    'figma_post_comment',
    {
      title: 'Tambah Komentar ke File Figma',
      description: 'Menambahkan komentar baru ke sebuah file Figma. Bisa di-anchor ke node tertentu atau ke posisi koordinat di canvas.',
      inputSchema: {
        fileKey: z.string().describe('Key unik file Figma'),
        message: z.string().describe('Teks komentar yang akan ditambahkan'),
        nodeId: z.string().optional().describe('(Opsional) ID node untuk anchor komentar ke elemen tertentu'),
        x: z.number().optional().describe('(Opsional) Posisi X pada canvas'),
        y: z.number().optional().describe('(Opsional) Posisi Y pada canvas'),
      },
    },
    async ({ fileKey, message, nodeId, x, y }) => {
      try {
        const result = await figmaClient.postComment(fileKey, message, nodeId, x, y);
        return {
          content: [{
            type: 'text',
            text: `✅ Komentar berhasil ditambahkan!\nID: ${result.id}\nPesan: "${result.message}"\nWaktu: ${result.created_at}`,
          }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ ${msg}` }], isError: true };
      }
    }
  );

  return server;
}
