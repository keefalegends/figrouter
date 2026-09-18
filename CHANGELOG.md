# Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [0.1.0] — 2026-09-18

### 🎉 Rilis Pertama — Fase 1: CLI + MCP Server

#### Ditambahkan
- **OAuth 2.0 + PKCE** — Autentikasi aman ke Figma dengan refresh token otomatis
- **Token Storage Terenkripsi** — Token disimpan aman menggunakan `conf` dengan enkripsi berbasis mesin
- **MCP Server** — Implementasi Model Context Protocol via Streamable HTTP transport
- **8 Tool Figma**:
  - `figma_auth_status` — Cek status autentikasi
  - `figma_authenticate` — Trigger OAuth login dari AI agent
  - `figma_get_file` — Ambil dokumen Figma lengkap
  - `figma_get_nodes` — Ambil node tertentu berdasarkan ID
  - `figma_get_components` — Daftar komponen yang dipublikasikan
  - `figma_get_styles` — Daftar style (color, typography, effects)
  - `figma_get_comments` — Ambil komentar file
  - `figma_post_comment` — Tambah komentar ke file
- **CLI Commands**: `auth`, `start`, `status`, `logout`
- **Health Check Endpoint** — `GET /health`
- **CORS Support** — Untuk koneksi dari IDE lokal
- **README** lengkap dengan panduan setup dan koneksi IDE

#### Kompatibel Dengan
- VS Code (MCP via `.vscode/mcp.json`)
- Cursor (MCP via `~/.cursor/mcp.json`)
- Claude Desktop
- Antigravity (Google DeepMind)
- 9router

---

## [Unreleased]

### Direncanakan untuk v0.2.0
- Web Dashboard lokal (React UI)
- Real-time log viewer di browser
- Manajemen koneksi multi-client

### Direncanakan untuk v0.3.0
- Desktop App (Electron/Tauri)
- System tray icon
- Auto-start saat boot
