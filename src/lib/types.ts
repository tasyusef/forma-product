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

export interface SketchShape {
  id: string;
  type: 'rect' | 'ellipse' | 'figure' | 'freeform';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export type AspectRatio = '1:1' | '3:2' | '16:9' | '9:16';

export interface SketchData {
  aspectRatio: AspectRatio;
  shapes: SketchShape[];
  freehandPaths: Point[][];
  textPrompt: string;
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
}

export interface Session {
  id: string;
  rounds: Round[];
  activeRoundIndex: number;
}

export type MarkTool = 'keep' | 'remove' | 'redirect' | null;

export type Screen = 'composer' | 'loading' | 'director';

export type DirectorMode = 'evaluate' | 'mark' | 'compare';
