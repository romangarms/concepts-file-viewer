import {
  STROKE_POINT_FIELDS,
  KEY_POINT_FIELDS,
  PLIST_KEYS,
  POINT_STRIDE,
  XY_COMPONENTS,
} from './constants.js';
import type { ConceptsPlist, Stroke, Point, PlistObject, PlistUID, DrawingData, Color } from './types.js';

/**
 * Checks if a value is a UID reference object
 * bplist-parser returns UIDs as {UID: number} not {data: number}
 */
function isUID(value: any): boolean {
  return value && typeof value === 'object' && ('data' in value || 'UID' in value);
}

/**
 * Gets the UID number from a UID object
 */
function getUIDValue(uid: any): number {
  if (uid.UID !== undefined) return uid.UID;
  if (uid.data !== undefined) return uid.data;
  throw new Error('Invalid UID object');
}

/**
 * Decodes float32 point data from a binary buffer
 */
function decodeFloat32Points(buffer: Uint8Array): Point[] {
  // Create a copy if the buffer isn't properly aligned for Float32Array
  let alignedBuffer = buffer;
  if (buffer.byteOffset % 4 !== 0) {
    alignedBuffer = new Uint8Array(buffer);
  }

  const floatArray = new Float32Array(alignedBuffer.buffer, alignedBuffer.byteOffset, alignedBuffer.byteLength / 4);
  const points: Point[] = [];

  for (let i = 0; i < floatArray.length; i += POINT_STRIDE) {
    points.push({
      x: floatArray[i],
      y: floatArray[i + 1],
    });
  }

  return points;
}

/**
 * Decodes glPosition data (8 bytes, 2 floats)
 */
function decodeGLPosition(buffer: Uint8Array): Point | null {
  if (buffer.byteLength !== 8) return null;

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return {
    x: view.getFloat32(0, true), // little-endian
    y: view.getFloat32(4, true),
  };
}

/**
 * Extracts brush width from brushProperties object
 */
function extractBrushWidth(obj: PlistObject, objects: PlistObject[]): number {
  const defaultWidth = 2.0; // Default brush width if not found

  if (!('brushProperties' in obj)) {
    return defaultWidth;
  }

  const brushPropsUID = obj['brushProperties'];
  if (!isUID(brushPropsUID)) {
    return defaultWidth;
  }

  const brushProps = objects[getUIDValue(brushPropsUID)];
  if (!brushProps || !('brushWidth' in brushProps)) {
    return defaultWidth;
  }

  const width = brushProps['brushWidth'];
  return typeof width === 'number' ? width : defaultWidth;
}

/**
 * Extracts brush color from brushProperties object
 */
function extractBrushColor(obj: PlistObject, objects: PlistObject[]): Color {
  const defaultColor: Color = { r: 0, g: 0, b: 0, a: 1 }; // Default black

  if (!('brushProperties' in obj)) {
    return defaultColor;
  }

  const brushPropsUID = obj['brushProperties'];
  if (!isUID(brushPropsUID)) {
    return defaultColor;
  }

  const brushProps = objects[getUIDValue(brushPropsUID)];
  if (!brushProps || !('brushColor' in brushProps)) {
    return defaultColor;
  }

  const brushColorUID = brushProps['brushColor'];
  if (!isUID(brushColorUID)) {
    return defaultColor;
  }

  const colorObj = objects[getUIDValue(brushColorUID)];
  if (!colorObj) {
    return defaultColor;
  }

  // Extract RGB values (they're in 0-1 range)
  const r = typeof colorObj['UIRed'] === 'number' ? colorObj['UIRed'] : 0;
  const g = typeof colorObj['UIGreen'] === 'number' ? colorObj['UIGreen'] : 0;
  const b = typeof colorObj['UIBlue'] === 'number' ? colorObj['UIBlue'] : 0;
  const a = typeof colorObj['UIAlpha'] === 'number' ? colorObj['UIAlpha'] : 1;

  return { r, g, b, a };
}

/**
 * Attempts to extract stroke points from a stroke object
 */
function extractStrokePoints(obj: PlistObject, objects: PlistObject[]): Point[] | null {
  // Try strokePoints45 or strokePointsNonOptionalAngles fields
  for (const field of [
    STROKE_POINT_FIELDS.STROKE_POINTS_45,
    STROKE_POINT_FIELDS.STROKE_POINTS_NON_OPTIONAL_ANGLES,
  ]) {
    if (field in obj) {
      const uid = obj[field];
      if (isUID(uid)) {
        const blob = objects[getUIDValue(uid)];
        if (blob instanceof Uint8Array) {
          try {
            return decodeFloat32Points(blob);
          } catch (e) {
            console.warn(`Failed to decode ${field}:`, e);
          }
        }
      }
    }
  }

  // Fallback: try keyPoints → glPosition
  if (KEY_POINT_FIELDS.KEY_POINTS in obj) {
    const keyPointsUID = obj[KEY_POINT_FIELDS.KEY_POINTS];
    if (isUID(keyPointsUID)) {
      const keyPointsObj = objects[getUIDValue(keyPointsUID)];
      const keyPointUIDs = keyPointsObj?.[PLIST_KEYS.NS_OBJECTS];

      if (Array.isArray(keyPointUIDs)) {
        const points: Point[] = [];
        for (const ptUID of keyPointUIDs) {
          if (isUID(ptUID)) {
            const pt = objects[getUIDValue(ptUID)];
            if (pt && KEY_POINT_FIELDS.GL_POSITION in pt) {
              const buffer = pt[KEY_POINT_FIELDS.GL_POSITION];
              if (buffer instanceof Uint8Array) {
                const point = decodeGLPosition(buffer);
                if (point) points.push(point);
              }
            }
          }
        }
        if (points.length > 0) return points;
      }
    }
  }

  return null;
}

/**
 * Parses a Concepts Strokes.plist file and extracts all stroke data
 */
export function parseConceptsStrokes(plistData: any): DrawingData {
  // Check if bplist-parser already resolved the structure
  // It might return the decoded object directly instead of the raw archive format
  if (!plistData[PLIST_KEYS.OBJECTS] || !plistData[PLIST_KEYS.TOP]) {
    // Try to work with already-decoded structure
    if (plistData[PLIST_KEYS.ROOT]) {
      plistData = { [PLIST_KEYS.TOP]: { [PLIST_KEYS.ROOT]: plistData } };
    } else {
      throw new Error('Invalid plist structure: missing $objects and $top, and no root found');
    }
  }

  const objects = plistData[PLIST_KEYS.OBJECTS];
  const rootUID = plistData[PLIST_KEYS.TOP]?.[PLIST_KEYS.ROOT];

  if (!rootUID) {
    throw new Error('Invalid plist structure: no root in $top');
  }

  // Handle case where bplist-parser already resolved UIDs
  const root = isUID(rootUID) ? objects[getUIDValue(rootUID)] : rootUID;

  const groupLayerRef = root[PLIST_KEYS.ROOT_GROUP_LAYERS];
  const groupLayer = isUID(groupLayerRef) ? objects[getUIDValue(groupLayerRef)] : groupLayerRef;

  const groupItems = groupLayer[PLIST_KEYS.NS_OBJECTS];

  if (!Array.isArray(groupItems)) {
    throw new Error('Invalid plist structure: groupItems is not an array');
  }

  const strokes: Stroke[] = [];

  // Iterate through all group items
  for (const strokeRef of groupItems) {
    const stroke = isUID(strokeRef) ? objects[getUIDValue(strokeRef)] : strokeRef;

    if (!stroke || !(PLIST_KEYS.GROUP_ITEMS in stroke)) continue;

    const subItemsRef = stroke[PLIST_KEYS.GROUP_ITEMS];
    const subItemsObj = isUID(subItemsRef) ? objects[getUIDValue(subItemsRef)] : subItemsRef;
    const subObjs = subItemsObj?.[PLIST_KEYS.NS_OBJECTS];

    if (!Array.isArray(subObjs)) continue;

    // Extract points from each sub-object
    for (const objRef of subObjs) {
      const obj = isUID(objRef) ? objects[getUIDValue(objRef)] : objRef;
      if (!obj) continue;

      const points = extractStrokePoints(obj, objects);
      if (points && points.length > 0) {
        const width = extractBrushWidth(obj, objects);
        const color = extractBrushColor(obj, objects);
        strokes.push({ points, width, color });
      }
    }
  }

  return { strokes };
}
