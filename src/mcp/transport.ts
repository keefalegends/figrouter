import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { config } from '../config.js';

// ─── MCP Transport ────────────────────────────────────────────────────────────
// Mengekspos MCP server via Streamable HTTP transport.
// AI agent / 9router connect ke: POST http://localhost:3333/mcp
//
// Protocol:
//   - Request:  POST /mcp  (JSON-RPC 2.0 body)
//   - Response: JSON atau SSE stream (tergantung Accept header)
//   - Health:   GET  /health

export async function startMcpTransport(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // ── CORS untuk koneksi lokal dari IDE ─────────────────────────────────────
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    next();
  });

  app.options('*', (_req, res) => res.sendStatus(204));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: config.app.name,
      version: config.app.version,
      timestamp: new Date().toISOString(),
    });
  });

  // ── MCP Endpoint ──────────────────────────────────────────────────────────
  // Setiap POST ke /mcp membuat instance MCP server + transport baru (stateless).
  // Ini adalah pola yang direkomendasikan untuk Streamable HTTP.
  app.post('/mcp', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Transport] Error handling MCP request:', msg);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: `Internal error: ${msg}` },
          id: null,
        });
      }
    }
  });

  // ── Handle GET/DELETE untuk session management (MCP spec) ────────────────
  app.get('/mcp', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) res.status(405).json({ error: 'Method not allowed' });
    }
  });

  app.delete('/mcp', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) res.status(405).json({ error: 'Method not allowed' });
    }
  });

  // ── Start listening ───────────────────────────────────────────────────────
  const port = config.server.mcpPort;
  app.listen(port, () => {
    console.log('');
    console.log('━'.repeat(60));
    console.log('🎨 FigRouter MCP Server');
    console.log('━'.repeat(60));
    console.log(`  Status     : ✅ Running`);
    console.log(`  MCP URL    : http://localhost:${port}/mcp`);
    console.log(`  Health     : http://localhost:${port}/health`);
    console.log('━'.repeat(60));
    console.log('  Tambahkan ke mcp.json IDE kamu:');
    console.log('  {');
    console.log('    "mcpServers": {');
    console.log('      "figma": {');
    console.log(`        "url": "http://localhost:${port}/mcp",`);
    console.log('        "type": "http"');
    console.log('      }');
    console.log('    }');
    console.log('  }');
    console.log('━'.repeat(60));
    console.log('');
  });
}
