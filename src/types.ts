// Represents a 2D point (x, y)
export interface Point {
  x: number;
  y: number;
}

// A stroke is an array of points
export type Stroke = Point[];

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
