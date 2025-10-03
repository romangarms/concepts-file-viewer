import { FileHandler } from './fileHandler.js';
import { StrokeRenderer } from './strokeRenderer.js';
import type { DrawingData, ConceptPlists } from './types.js';

/**
 * Main application class
 */
class ConceptsFileViewer {
  private fileHandler: FileHandler;
  private renderer: StrokeRenderer;
  private canvas: HTMLCanvasElement;
  private dropZone: HTMLElement;
  private fileInput: HTMLInputElement;
  private statusElement: HTMLElement;
  private controlsDiv: HTMLElement;
  private downloadButton: HTMLButtonElement;
  private currentPlists: ConceptPlists | null = null;

  constructor() {
    // Get DOM elements
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.dropZone = document.getElementById('drop-zone') as HTMLElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.statusElement = document.getElementById('status') as HTMLElement;
    this.controlsDiv = document.getElementById('controls') as HTMLElement;
    this.downloadButton = document.getElementById('download-json') as HTMLButtonElement;

    if (!this.canvas || !this.dropZone || !this.fileInput || !this.statusElement || !this.controlsDiv || !this.downloadButton) {
      throw new Error('Required DOM elements not found');
    }

    // Initialize modules
    this.renderer = new StrokeRenderer(this.canvas);
    this.fileHandler = new FileHandler();

    // Set up event handlers
    this.setupEventHandlers();

    // Initial canvas sizing
    this.handleResize();
  }

  private setupEventHandlers(): void {
    // Drag and drop
    this.fileHandler.setupDragAndDrop(
      this.dropZone,
      (data, plists) => this.onFileLoaded(data, plists),
      (error) => this.onError(error)
    );

    // File input
    this.fileHandler.setupFileInput(
      this.fileInput,
      (data, plists) => this.onFileLoaded(data, plists),
      (error) => this.onError(error)
    );

    // Download button
    this.downloadButton.addEventListener('click', () => this.downloadAllPlists());

    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.renderer.resize();
    // Re-render if we have data loaded
    // (In a real app, you'd store the current DrawingData)
  }

  private onFileLoaded(data: DrawingData, plists: ConceptPlists): void {
    this.currentPlists = plists;

    this.statusElement.textContent = `Loaded ${data.strokes.length} strokes`;
    this.statusElement.className = 'status success';

    // Hide drop zone, show canvas and controls
    this.dropZone.style.display = 'none';
    this.canvas.style.display = 'block';
    this.controlsDiv.style.display = 'block';

    // Resize canvas now that it's visible
    this.renderer.resize();

    // Render the drawing
    this.renderer.render(data);
  }

  private downloadAllPlists(): void {
    if (!this.currentPlists) return;

    // Download each plist as a separate file
    this.downloadPlist('Strokes.json', this.currentPlists.strokes);
    this.downloadPlist('Drawing.json', this.currentPlists.drawing);
    this.downloadPlist('Resources.json', this.currentPlists.resources);
    this.downloadPlist('metadata.json', this.currentPlists.metadata);
  }

  private downloadPlist(filename: string, data: any): void {
    if (!data) {
      console.warn(`No data for ${filename}`);
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  private onError(error: Error): void {
    this.statusElement.textContent = `Error: ${error.message}`;
    this.statusElement.className = 'status error';
    console.error('Error processing file:', error);
  }
}

// Initialize the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Print startup message
  console.log(
    '%c🎨 Concepts File Viewer',
    'font-size: 16px; font-weight: bold; color: #667eea;'
  );

  new ConceptsFileViewer();
});
