import JSZip from 'jszip';
import { parseConceptsStrokes } from './plistParser.js';
import type { DrawingData, ConceptPlists } from './types.js';

// Use require to get mutable reference to bplist-parser
const bplistParser = require('bplist-parser');

// Increase maxObjectCount to handle large documents (default is 32768)
bplistParser.maxObjectCount = 1000000;

/**
 * Handles .concept file loading and parsing
 */
export class FileHandler {
  /**
   * Process a .concept file and extract drawing data
   */
  async processConceptFile(file: File): Promise<DrawingData> {
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.concept')) {
      throw new Error('Please select a .concept file');
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Unzip the .concept file
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract Strokes.plist
    const strokesFile = zip.file('Strokes.plist');
    if (!strokesFile) {
      throw new Error('Strokes.plist not found in .concept file');
    }

    // Get the binary plist data as Uint8Array
    const strokesBuffer = await strokesFile.async('uint8array');

    // Parse the binary plist using bplist-parser (bundled with esbuild)
    const parsed = await bplistParser.parseBuffer(Buffer.from(strokesBuffer));

    if (!parsed || !Array.isArray(parsed)) {
      throw new Error('Failed to parse Strokes.plist');
    }

    const plistData = parsed[0];
    const drawingData = parseConceptsStrokes(plistData);

    return drawingData;
  }

  /**
   * Set up drag-and-drop handlers on an element
   */
  setupDragAndDrop(
    element: HTMLElement,
    onFileLoaded: (data: DrawingData) => void,
    onError: (error: Error) => void
  ): void {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight on drag over
    ['dragenter', 'dragover'].forEach((eventName) => {
      element.addEventListener(eventName, () => {
        element.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      element.addEventListener(eventName, () => {
        element.classList.remove('drag-over');
      });
    });

    // Handle dropped files
    element.addEventListener('drop', async (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      try {
        const data = await this.processConceptFile(file);
        onFileLoaded(data);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Set up file input handler
   */
  setupFileInput(
    input: HTMLInputElement,
    onFileLoaded: (data: DrawingData) => void,
    onError: (error: Error) => void
  ): void {
    input.addEventListener('change', async () => {
      const files = input.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      try {
        const data = await this.processConceptFile(file);
        onFileLoaded(data);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Process file and return both drawing data and all plists
   */
  private async processConceptFileWithPlists(file: File): Promise<{ data: DrawingData; plists: ConceptPlists }> {
    const drawingData = await this.processConceptFile(file);

    // Parse all plist files
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const plists: ConceptPlists = {
      strokes: null,
      drawing: null,
      resources: null,
      metadata: null,
    };

    // Helper to parse a plist file
    const parsePlist = async (filename: string): Promise<any> => {
      const file = zip.file(filename);
      if (!file) {
        console.warn(`${filename} not found in .concept file`);
        return null;
      }
      try {
        const buffer = await file.async('uint8array');
        const parsed = await bplistParser.parseBuffer(Buffer.from(buffer));
        return parsed[0];
      } catch (error) {
        console.error(`Failed to parse ${filename}:`, error);
        return null;
      }
    };

    // Parse all plists in parallel
    [plists.strokes, plists.drawing, plists.resources, plists.metadata] = await Promise.all([
      parsePlist('Strokes.plist'),
      parsePlist('Drawing.plist'),
      parsePlist('Resources.plist'),
      parsePlist('metadata.plist'),
    ]);

    return { data: drawingData, plists };
  }
}
