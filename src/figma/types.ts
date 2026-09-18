// ─── Figma API Types ──────────────────────────────────────────────────────────
// Tipe TypeScript untuk respons Figma REST API v1.
// Referensi: https://www.figma.com/developers/api

// ─── Common ──────────────────────────────────────────────────────────────────

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Node ────────────────────────────────────────────────────────────────────

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: FigmaRect;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  opacity?: number;
  backgroundColor?: FigmaColor;
  // Typography
  style?: FigmaTypeStyle;
  characters?: string;
  // Component
  componentId?: string;
  // Layout
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  // Additional properties
  [key: string]: unknown;
}

export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  blendMode?: string;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: Array<{ color: FigmaColor; position: number }>;
  scaleMode?: string;
  imageRef?: string;
}

export interface FigmaTypeStyle {
  fontFamily?: string;
  fontPostScriptName?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
}

// ─── File ────────────────────────────────────────────────────────────────────

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  styles: Record<string, FigmaStyle>;
  schemaVersion: number;
}

export interface FigmaFileNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  nodes: Record<string, { document: FigmaNode; components: Record<string, FigmaComponent>; styles: Record<string, FigmaStyle> }>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks?: Array<{ uri: string }>;
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
}

export interface FigmaComponentsResponse {
  error: boolean;
  status: number;
  meta: {
    components: Array<{
      key: string;
      file_key: string;
      node_id: string;
      thumbnail_url: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      user: { id: string; handle: string; img_url: string };
      containing_frame: { name: string; nodeId: string; pageId: string; pageName: string; backgroundColor: string; containingStateGroup?: { name: string; nodeId: string } };
    }>;
    cursor?: { before: number; after: number };
  };
}

// ─── Style ───────────────────────────────────────────────────────────────────

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

export interface FigmaStylesResponse {
  error: boolean;
  status: number;
  meta: {
    styles: Array<{
      key: string;
      file_key: string;
      node_id: string;
      style_type: string;
      thumbnail_url: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      user: { id: string; handle: string; img_url: string };
      sort_position: string;
    }>;
  };
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface FigmaComment {
  id: string;
  uuid: string;
  file_key: string;
  parent_id: string;
  user: { id: string; handle: string; img_url: string; email: string };
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: {
    node_id?: string;
    node_offset?: FigmaVector;
  };
  order_id: string;
}

export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

export interface FigmaPostCommentResponse {
  id: string;
  uuid: string;
  file_key: string;
  parent_id: string;
  user: { id: string; handle: string; img_url: string };
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: { node_id?: string; node_offset?: FigmaVector };
  order_id: string;
}
