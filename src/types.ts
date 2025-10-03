// Represents a 2D point (x, y)
export interface Point {
  x: number;
  y: number;
}

// RGB color
export interface Color {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1 (alpha)
}

// A stroke with its points and metadata
export interface Stroke {
  points: Point[];
  width: number; // Brush width in points
  color: Color;  // Brush color
}

// Plist object with UID reference
export interface PlistUID {
  data: number;
}

// Generic plist object
export interface PlistObject {
  [key: string]: any;
}

// Root structure of Concepts plist
export interface ConceptsPlist {
  $objects: PlistObject[];
  $top: {
    root: PlistUID;
  };
}

// Parsed drawing data
export interface DrawingData {
  strokes: Stroke[];
  metadata?: {
    width?: number;
    height?: number;
  };
}

// All plist files from a .concept file
export interface ConceptPlists {
  strokes: any;
  drawing: any;
  resources: any;
  metadata: any;
}
