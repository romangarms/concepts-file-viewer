// Field names for stroke point data in Concepts plist format
export const STROKE_POINT_FIELDS = {
  STROKE_POINTS_45: 'strokePoints45',
  STROKE_POINTS_NON_OPTIONAL_ANGLES: 'strokePointsNonOptionalAngles',
} as const;

// Fallback field names for key points
export const KEY_POINT_FIELDS = {
  KEY_POINTS: 'keyPoints',
  GL_POSITION: 'glPosition',
} as const;

// Plist structure keys
export const PLIST_KEYS = {
  OBJECTS: '$objects',
  TOP: '$top',
  ROOT: 'root',
  ROOT_GROUP_LAYERS: 'rootGroupLayers',
  NS_OBJECTS: 'NS.objects',
  GROUP_ITEMS: 'groupItems',
} as const;

// Float32 point format: [x, y, pressure?, angle?]
export const POINT_STRIDE = 4;
export const XY_COMPONENTS = 2;
