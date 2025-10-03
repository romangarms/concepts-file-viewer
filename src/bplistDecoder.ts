/**
 * Minimal binary plist decoder for browser use
 * Only handles the subset needed for Concepts files
 */

export function parseBplist(buffer: ArrayBuffer): any {
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Check header
  const header = String.fromCharCode(...data.slice(0, 8));
  if (!header.startsWith('bplist')) {
    throw new Error('Not a binary plist file');
  }

  // Read trailer (last 32 bytes)
  const trailerOffset = data.length - 32;
  const offsetIntSize = data[trailerOffset + 6];
  const objectRefSize = data[trailerOffset + 7];

  const numObjects = view.getBigUint64(trailerOffset + 8, false);
  const topObject = view.getBigUint64(trailerOffset + 16, false);
  const offsetTableOffset = view.getBigUint64(trailerOffset + 24, false);

  // Read offset table
  const offsets: number[] = [];
  let pos = Number(offsetTableOffset);
  for (let i = 0; i < numObjects; i++) {
    let offset = 0;
    for (let j = 0; j < offsetIntSize; j++) {
      offset = (offset << 8) | data[pos++];
    }
    offsets.push(offset);
  }

  // Parse objects
  const objects: any[] = [];
  for (let i = 0; i < numObjects; i++) {
    objects.push(parseObject(data, view, offsets[i], objectRefSize, offsets, objects));
  }

  return objects[Number(topObject)];
}

function parseObject(
  data: Uint8Array,
  view: DataView,
  offset: number,
  objectRefSize: number,
  offsets: number[],
  objects: any[]
): any {
  const marker = data[offset];
  const type = (marker & 0xf0) >> 4;
  const info = marker & 0x0f;

  let pos = offset + 1;

  // Helper to read object count
  const readCount = (): number => {
    if (info === 0x0f) {
      const intMarker = data[pos++];
      const intType = (intMarker & 0x0f);
      const bytes = 1 << intType;
      let count = 0;
      for (let i = 0; i < bytes; i++) {
        count = (count << 8) | data[pos++];
      }
      return count;
    }
    return info;
  };

  switch (type) {
    case 0x0: // null, bool, fill
      if (info === 0x00) return null;
      if (info === 0x08) return false;
      if (info === 0x09) return true;
      return null;

    case 0x1: // int
      const intBytes = 1 << info;
      let intVal = 0;
      for (let i = 0; i < intBytes; i++) {
        intVal = (intVal << 8) | data[pos++];
      }
      return intVal;

    case 0x2: // real
      if (info === 2) {
        return view.getFloat32(pos, false);
      } else if (info === 3) {
        return view.getFloat64(pos, false);
      }
      return 0;

    case 0x3: // date
      const timestamp = view.getFloat64(pos, false);
      return new Date((timestamp + 978307200) * 1000); // Apple epoch

    case 0x4: // data
      const dataLen = readCount();
      return data.slice(pos, pos + dataLen);

    case 0x5: // ascii string
      const asciiLen = readCount();
      return String.fromCharCode(...data.slice(pos, pos + asciiLen));

    case 0x6: // utf16 string
      const utf16Len = readCount();
      let str = '';
      for (let i = 0; i < utf16Len; i++) {
        const charCode = view.getUint16(pos, false);
        str += String.fromCharCode(charCode);
        pos += 2;
      }
      return str;

    case 0x8: // uid
      const uidBytes = info + 1;
      let uid = 0;
      for (let i = 0; i < uidBytes; i++) {
        uid = (uid << 8) | data[pos++];
      }
      return { data: uid }; // Return UID object compatible with our parser

    case 0xa: // array
      const arrayLen = readCount();
      const arr: any[] = [];
      for (let i = 0; i < arrayLen; i++) {
        let ref = 0;
        for (let j = 0; j < objectRefSize; j++) {
          ref = (ref << 8) | data[pos++];
        }
        // Lazy reference - will be resolved later
        arr.push({ data: ref });
      }
      return arr;

    case 0xd: // dict
      const dictLen = readCount();
      const keyRefs: number[] = [];
      const valRefs: number[] = [];

      // Read key refs
      for (let i = 0; i < dictLen; i++) {
        let ref = 0;
        for (let j = 0; j < objectRefSize; j++) {
          ref = (ref << 8) | data[pos++];
        }
        keyRefs.push(ref);
      }

      // Read value refs
      for (let i = 0; i < dictLen; i++) {
        let ref = 0;
        for (let j = 0; j < objectRefSize; j++) {
          ref = (ref << 8) | data[pos++];
        }
        valRefs.push(ref);
      }

      const dict: any = {};
      for (let i = 0; i < dictLen; i++) {
        const key = objects[keyRefs[i]] || parseObject(data, view, offsets[keyRefs[i]], objectRefSize, offsets, objects);
        const val = { data: valRefs[i] }; // Return as UID for lazy resolution
        dict[key] = val;
      }
      return dict;

    default:
      console.warn(`Unknown plist type: 0x${type.toString(16)}`);
      return null;
  }
}
