import JSZip from 'jszip';
import * as bplistParser from 'bplist-parser';
import { parseConceptsStrokes } from './plistParser.js';
import type { DrawingData } from './types.js';

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

    console.log(`Processing ${file.name}...`);

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
    console.log('========== FULL PARSED PLIST ==========');
    console.log(JSON.stringify(plistData, null, 2));
    console.log('========================================');
    console.log('Has $objects?', '$objects' in plistData);
    console.log('Has $top?', '$top' in plistData);
    console.log('Top-level keys:', Object.keys(plistData));

    const drawingData = parseConceptsStrokes(plistData);

    console.log(`Successfully loaded ${drawingData.strokes.length} strokes`);

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
}
