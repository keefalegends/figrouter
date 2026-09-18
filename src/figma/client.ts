import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '../config.js';
import { tokenManager } from '../auth/tokenManager.js';
import type {
  FigmaFile,
  FigmaFileNodesResponse,
  FigmaComponentsResponse,
  FigmaStylesResponse,
  FigmaCommentsResponse,
  FigmaPostCommentResponse,
} from './types.js';

// ─── Figma REST API Client ────────────────────────────────────────────────────
// Wrapper bertipe untuk Figma REST API v1.
// Otomatis inject Authorization header dan handle error secara konsisten.

class FigmaClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.figma.apiBaseUrl,
      timeout: 30_000,
    });

    // Interceptor: inject Bearer token sebelum setiap request
    this.http.interceptors.request.use(async (reqConfig) => {
      const token = await tokenManager.getValidToken();
      reqConfig.headers.Authorization = `Bearer ${token}`;
      return reqConfig;
    });

    // Interceptor: format error message agar lebih informatif
    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status;
        const data = err.response?.data as { message?: string; err?: string } | undefined;
        const figmaMessage = data?.message ?? data?.err ?? err.message;

        if (status === 401) {
          throw new Error(`[Figma API] 401 Unauthorized — Token tidak valid atau kedaluwarsa. Coba: npx figrouter auth`);
        }
        if (status === 403) {
          throw new Error(`[Figma API] 403 Forbidden — Tidak punya akses ke resource ini. Cek scope OAuth.`);
        }
        if (status === 404) {
          throw new Error(`[Figma API] 404 Not Found — File atau resource tidak ditemukan.`);
        }
        if (status === 429) {
          throw new Error(`[Figma API] 429 Rate Limited — Terlalu banyak request. Coba lagi nanti.`);
        }

        throw new Error(`[Figma API] Error ${status ?? 'unknown'}: ${figmaMessage}`);
      }
    );
  }

  // ─── File ────────────────────────────────────────────────────────────────

  /**
   * Ambil dokumen Figma file lengkap beserta semua nodes.
   * @param fileKey - Key dari URL Figma: figma.com/file/{fileKey}/...
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    const { data } = await this.http.get<FigmaFile>(`/files/${fileKey}`);
    return data;
  }

  /**
   * Ambil node-node tertentu dari sebuah file berdasarkan ID.
   * @param fileKey - Key file Figma
   * @param nodeIds - Array of node IDs (mis: ['1:2', '3:4'])
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FigmaFileNodesResponse> {
    const ids = nodeIds.join(',');
    const { data } = await this.http.get<FigmaFileNodesResponse>(
      `/files/${fileKey}/nodes`,
      { params: { ids } }
    );
    return data;
  }

  // ─── Components ──────────────────────────────────────────────────────────

  /**
   * Daftar semua komponen yang dipublikasikan dari sebuah file.
   * @param fileKey - Key file Figma
   */
  async getComponents(fileKey: string): Promise<FigmaComponentsResponse> {
    const { data } = await this.http.get<FigmaComponentsResponse>(
      `/files/${fileKey}/components`
    );
    return data;
  }

  // ─── Styles ──────────────────────────────────────────────────────────────

  /**
   * Daftar semua style (warna, tipografi, efek, grid) dari sebuah file.
   * @param fileKey - Key file Figma
   */
  async getStyles(fileKey: string): Promise<FigmaStylesResponse> {
    const { data } = await this.http.get<FigmaStylesResponse>(
      `/files/${fileKey}/styles`
    );
    return data;
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  /**
   * Ambil semua komentar dari sebuah file.
   * @param fileKey - Key file Figma
   */
  async getComments(fileKey: string): Promise<FigmaCommentsResponse> {
    const { data } = await this.http.get<FigmaCommentsResponse>(
      `/files/${fileKey}/comments`
    );
    return data;
  }

  /**
   * Tambahkan komentar ke file Figma.
   * @param fileKey - Key file Figma
   * @param message - Teks komentar
   * @param nodeId - (opsional) ID node untuk comment yang di-anchor ke elemen
   * @param x - (opsional) Posisi X pada canvas
   * @param y - (opsional) Posisi Y pada canvas
   */
  async postComment(
    fileKey: string,
    message: string,
    nodeId?: string,
    x?: number,
    y?: number
  ): Promise<FigmaPostCommentResponse> {
    const body: Record<string, unknown> = { message };

    if (nodeId) {
      body.client_meta = { node_id: nodeId };
      if (x !== undefined && y !== undefined) {
        (body.client_meta as Record<string, unknown>).node_offset = { x, y };
      }
    } else if (x !== undefined && y !== undefined) {
      body.client_meta = { x, y };
    }

    const { data } = await this.http.post<FigmaPostCommentResponse>(
      `/files/${fileKey}/comments`,
      body
    );
    return data;
  }
}

// Singleton instance
export const figmaClient = new FigmaClient();
