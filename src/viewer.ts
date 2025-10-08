import { StrokeRenderer } from './strokeRenderer.js';
import type { DrawingData } from './types.js';

/**
 * Viewer component for displaying .concepts files in full screen
 */
class ConceptsViewer {
  private readonly renderer: StrokeRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly statusElement: HTMLElement;
  private readonly zoomControlsDiv: HTMLElement;
  private readonly zoomInButton: HTMLButtonElement;
  private readonly zoomOutButton: HTMLButtonElement;
  private readonly resetViewButton: HTMLButtonElement;
  private readonly backButton: HTMLButtonElement;

  constructor() {
    // Get DOM elements
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.statusElement = document.getElementById('status') as HTMLElement;
    this.zoomControlsDiv = document.getElementById('zoom-controls') as HTMLElement;
    this.zoomInButton = document.getElementById('zoom-in') as HTMLButtonElement;
    this.zoomOutButton = document.getElementById('zoom-out') as HTMLButtonElement;
    this.resetViewButton = document.getElementById('reset-view') as HTMLButtonElement;
    this.backButton = document.getElementById('back-button') as HTMLButtonElement;

    if (!this.canvas || !this.statusElement || !this.zoomControlsDiv ||
        !this.zoomInButton || !this.zoomOutButton || !this.resetViewButton || !this.backButton) {
      throw new Error('Required DOM elements not found');
    }

    // Initialize renderer
    this.renderer = new StrokeRenderer(this.canvas);

    // Set up event handlers
    this.setupEventHandlers();

    // Initial canvas sizing
    this.handleResize();

    // Load data from sessionStorage
    this.loadFromStorage();
  }

  private setupEventHandlers(): void {
    // Zoom controls
    this.zoomInButton.addEventListener('click', () => this.renderer.zoomIn());
    this.zoomOutButton.addEventListener('click', () => this.renderer.zoomOut());
    this.resetViewButton.addEventListener('click', () => this.renderer.resetView());

    // Back button
    this.backButton.addEventListener('click', () => {
      // Clear storage and navigate back
      sessionStorage.removeItem('conceptsData');
      window.location.href = 'index.html';
    });

    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.renderer.resize();
  }

  private loadFromStorage(): void {
    try {
      const dataStr = sessionStorage.getItem('conceptsData');

      if (!dataStr) {
        this.showError(new Error('No data found. Please select a file first.'));
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
        return;
      }

      const data: DrawingData = JSON.parse(dataStr);

      this.statusElement.textContent = `Loaded ${data.strokes.length} strokes`;
      this.statusElement.className = 'status success';

      // Resize canvas now that it's visible
      this.renderer.resize();

      // Render the drawing
      this.renderer.render(data);
    } catch (error) {
      this.showError(error instanceof Error ? error : new Error('Failed to load data'));
    }
  }

  private showError(error: Error): void {
    this.statusElement.textContent = `Error: ${error.message}`;
    this.statusElement.className = 'status error';
    console.error('Error:', error);
  }
}

// Initialize the viewer when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log(
    '%c🎨 Concepts File Viewer',
    'font-size: 16px; font-weight: bold; color: #667eea;'
  );

  new ConceptsViewer();
});
