export interface Point3D {
  x: number;
  y: number;
  z: number;
  label?: string;
  color?: string; // Hex code
}

export interface Line3D {
  from: string; // Label of the start point
  to: string;   // Label of the end point
  label?: string;
  color?: string;
  dashed?: boolean;
}

export interface Polygon3D {
  points: string[]; // Labels of vertices
  color?: string;
  opacity?: number;
}

export interface VisualizationState {
  points: Point3D[];
  lines: Line3D[];
  polygons: Polygon3D[];
  cameraLookAt?: { x: number, y: number, z: number };
}

export interface SolveStep {
  stepId: number;
  title: string;
  description: string;
  mathExpression?: string; // Optional LaTeX or simple math string
  visuals: VisualizationState;
}

export interface MathSolution {
  problemSummary: string;
  steps: SolveStep[];
  finalAnswer: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  SOLVED = 'SOLVED',
  ERROR = 'ERROR'
}