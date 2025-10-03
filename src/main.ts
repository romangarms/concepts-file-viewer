import { FileHandler } from './fileHandler.js';
import { StrokeRenderer } from './strokeRenderer.js';
import type { DrawingData } from './types.js';

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

  constructor() {
    // Get DOM elements
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.dropZone = document.getElementById('drop-zone') as HTMLElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.statusElement = document.getElementById('status') as HTMLElement;

    if (!this.canvas || !this.dropZone || !this.fileInput || !this.statusElement) {
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
      (data) => this.onFileLoaded(data),
      (error) => this.onError(error)
    );

    // File input
    this.fileHandler.setupFileInput(
      this.fileInput,
      (data) => this.onFileLoaded(data),
      (error) => this.onError(error)
    );

    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.renderer.resize();
    // Re-render if we have data loaded
    // (In a real app, you'd store the current DrawingData)
  }

  private onFileLoaded(data: DrawingData): void {
    this.statusElement.textContent = `Loaded ${data.strokes.length} strokes`;
    this.statusElement.className = 'status success';

    // Hide drop zone, show canvas
    this.dropZone.style.display = 'none';
    this.canvas.style.display = 'block';

    // Resize canvas now that it's visible
    this.renderer.resize();

    // Render the drawing
    this.renderer.render(data);
  }

  private onError(error: Error): void {
    this.statusElement.textContent = `Error: ${error.message}`;
    this.statusElement.className = 'status error';
    console.error('Error processing file:', error);
  }
}

// Initialize the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Print startup message with clickable link
  const port = window.location.port || '8000';
  const url = `http://localhost:${port}`;
  console.log(
    '%c🎨 Concepts File Viewer',
    'font-size: 16px; font-weight: bold; color: #667eea;'
  );
  console.log(
    '%c➜ %cLocal:   %c' + url,
    'color: #22c55e; font-weight: bold;',
    'color: #666;',
    'color: #0ea5e9; text-decoration: underline;'
  );
  console.log('');

  new ConceptsFileViewer();
});
