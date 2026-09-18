# 🎨 FigRouter

> **Middleware bridge antara Figma REST API dan AI Coding Agents via Model Context Protocol (MCP)**

FigRouter memungkinkan AI agent (VS Code, Cursor, Claude, Antigravity, 9router) untuk membaca dan berinteraksi dengan desain Figma kamu secara langsung dari chat/terminal.

---

## ⚡ Quick Start

```bash
# 1. Clone & install
git clone https://github.com/kamu/figrouter.git
cd figrouter
npm install

# 2. Konfigurasi .env
cp .env.example .env
# Edit .env dengan Client ID & Secret dari Figma Developer App

# 3. Login ke Figma
npx tsx src/cli.ts auth
# → Browser akan terbuka, login ke Figma, selesai!

# 4. Jalankan server
npx tsx src/cli.ts start
# → FigRouter running di http://localhost:3333/mcp
```

---

## 🔧 Setup Figma OAuth App

1. Buka [figma.com/developers/apps](https://www.figma.com/developers/apps)
2. Klik **"Create new app"**
3. Isi nama app (mis: `FigRouter Local`)
4. Di **Redirect URIs**, tambahkan: `http://localhost:3334/oauth/callback`
5. Pilih scope: **File content** (`file_read`)
6. Salin **Client ID** dan **Client Secret**
7. Tempel ke file `.env` kamu

---

## ⚙️ Konfigurasi `.env`

```env
# Dari Figma Developer App
FIGMA_CLIENT_ID=your_client_id
FIGMA_CLIENT_SECRET=your_client_secret
FIGMA_REDIRECT_URI=http://localhost:3334/oauth/callback

# Port server (opsional, default: 3333)
FIGROUTER_PORT=3333
FIGROUTER_AUTH_PORT=3334
```

---

## 🖥️ CLI Commands

```bash
npx tsx src/cli.ts auth      # Login ke Figma via OAuth
npx tsx src/cli.ts start     # Jalankan MCP bridge server
npx tsx src/cli.ts status    # Cek status autentikasi
npx tsx src/cli.ts logout    # Logout (hapus token)
```

Setelah build (`npm run build`):
```bash
npx figrouter auth
npx figrouter start
npx figrouter status
npx figrouter logout
```

---

## 🔌 Menghubungkan ke IDE / AI Agent

### VS Code (GitHub Copilot / Antigravity)

Buat atau edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "figma": {
      "url": "http://localhost:3333/mcp",
      "type": "http"
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` atau via Settings → MCP:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://localhost:3333/mcp",
      "type": "http"
    }
  }
}
```

### Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://localhost:3333/mcp",
      "type": "http"
    }
  }
}
```

### 9router

Tambahkan ke config 9router kamu dengan URL: `http://localhost:3333/mcp`

---

## 🛠️ Tool yang Tersedia

Setelah terhubung, AI agent kamu bisa menggunakan tool berikut:

| Tool | Deskripsi |
|------|-----------|
| `figma_auth_status` | Cek status autentikasi |
| `figma_authenticate` | Login ke Figma via browser |
| `figma_get_file` | Ambil seluruh dokumen Figma file |
| `figma_get_nodes` | Ambil node tertentu berdasarkan ID |
| `figma_get_components` | Daftar semua komponen |
| `figma_get_styles` | Daftar semua style (colors, typography) |
| `figma_get_comments` | Ambil komentar file |
| `figma_post_comment` | Tambah komentar ke file |

### Cara menemukan File Key

File key ada di URL Figma:
```
https://www.figma.com/file/ABC123XYZ/nama-file
                           ^^^^^^^^^
                           ini file key-nya
```

### Contoh Prompt ke AI Agent

```
Ambil komponen dari file Figma dengan key "abc123xyz" 
dan buatkan React components berdasarkan desain tersebut.
```

```
Baca styles dari file Figma "xyz789" dan generate 
CSS variables untuk color palette dan typography.
```

---

## 🏗️ Arsitektur

```
AI Agent (VS Code / Cursor / Antigravity / 9router)
         │
         │ MCP (JSON-RPC 2.0 / Streamable HTTP)
         ▼
┌─────────────────────────────────────┐
│     FigRouter (localhost:3333)      │
│                                     │
│  MCP Server ←→ TokenManager        │
│      ↓               ↓             │
│  Figma Client   OAuth Server       │
│      ↓           (localhost:3334)  │
└──────┼──────────────────────────────┘
       │ HTTPS + Bearer Token
       ▼
  api.figma.com/v1/*
```

---

## 📁 Struktur Project

```
figrouter/
├── src/
│   ├── auth/
│   │   ├── oauthServer.ts   # OAuth 2.0 + PKCE flow
│   │   ├── tokenManager.ts  # Lifecycle management + auto-refresh
│   │   └── tokenStore.ts    # Encrypted storage
│   ├── figma/
│   │   ├── client.ts        # Figma REST API wrapper
│   │   └── types.ts         # TypeScript types
│   ├── mcp/
│   │   ├── server.ts        # Tool registrations
│   │   └── transport.ts     # Streamable HTTP transport
│   ├── config.ts            # Config loader & validation
│   ├── index.ts             # Bootstrap
│   └── cli.ts               # CLI commands
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---


## 📝 Changelog

Lihat [CHANGELOG.md](./CHANGELOG.md)

---

## 📄 Lisensi

MIT
