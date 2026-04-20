export interface Point {
  x: number;
  y: number;
}

export interface Mark {
  id: string;
  type: 'keep' | 'remove' | 'redirect';
  path: Point[];
  annotation: string | null;
  persists: boolean;
}

export type ShapeType = 'rect' | 'ellipse' | 'figure' | 'freeform' | 'stroke' | 'group';

export interface SketchShape {
  id: string;
  type: ShapeType;
  /** Bounding box in normalized coordinates (0-1), origin top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Short human label shown on the shape and in the layer panel. */
  label: string;
  /** Per-layer generation prompt — describes what this region represents. */
  prompt?: string;
  /** For type === 'stroke': the freehand path, normalized 0-1 against the canvas. */
  path?: Point[];
  /** For type === 'group': IDs of the original shapes grouped together. */
  memberIds?: string[];
  /** For type === 'group': snapshot of each member's prompt at combine time, keyed by member id. */
  memberPrompts?: Record<string, string>;
  /** Transient flag — true while Claude is composing the merged prompt after a combine. */
  isMerging?: boolean;
}

export type AspectRatio = '3:2';

export interface SketchData {
  aspectRatio: AspectRatio;
  shapes: SketchShape[];
  /** Global prompt — overall mood, style, medium, lighting. Per-layer prompts drive regional content. */
  textPrompt: string;
}

export interface Interpretation {
  /** The master prompt composed by Claude from the full sketch state. */
  masterPrompt: string;
  /** True once the user has edited the master prompt; further interpretation runs won't overwrite. */
  editedByUser: boolean;
  /** Hash of the sketch state that produced this interpretation; used for cache hits. */
  sketchHash: string;
}

export interface Round {
  id: string;
  index: number;
  type: 'sketch' | 'generation';
  imageUrl: string | null;
  sketchData: SketchData | null;
  marks: Mark[];
  thumbnailUrl: string;
  prompt: string | null;
  /** Set on generation rounds — the master prompt used for this generation. */
  interpretation?: Interpretation;
}

export interface Session {
  id: string;
  rounds: Round[];
  activeRoundIndex: number;
}

/**
 * Snapshot of a session the user explicitly finished. Persisted to
 * localStorage so the Library can list past work and resume it.
 */
export interface SavedSession {
  id: string;
  title: string;
  finalizedAt: number;
  finalRoundIndex: number;
  thumbnailUrl: string;
  session: Session;
}

export type MarkTool = 'keep' | 'remove' | 'redirect' | null;

export type Screen = 'library' | 'composer' | 'loading' | 'director';

export type DirectorMode = 'evaluate' | 'mark' | 'compare';

/**
 * Slider-driven adjustments applied during refine. Each value 0-100;
 * 50 is neutral. Claude translates non-neutral values into prompt directives.
 */
export interface Adjustments {
  lighting: number;
  saturation: number;
  style: number;
  detail: number;
  mood: number;
  contrast: number;
}

export const NEUTRAL_ADJUSTMENTS: Adjustments = {
  lighting: 50,
  saturation: 50,
  style: 50,
  detail: 50,
  mood: 50,
  contrast: 50,
};

