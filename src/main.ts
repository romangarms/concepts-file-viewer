import { FileHandler } from './fileHandler.js';
import type { DrawingData } from './types.js';

/**
 * Main application class - handles file selection and navigation to viewer
 */
class ConceptsFileViewer {
  private readonly fileHandler: FileHandler;
  private readonly dropZone: HTMLElement;
  private readonly fileInput: HTMLInputElement;
  private readonly statusElement: HTMLElement;

  constructor() {
    // Get DOM elements
    this.dropZone = document.getElementById('drop-zone') as HTMLElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.statusElement = document.getElementById('status') as HTMLElement;

    if (!this.dropZone || !this.fileInput || !this.statusElement) {
      throw new Error('Required DOM elements not found');
    }

    // Initialize file handler
    this.fileHandler = new FileHandler();

    // Set up event handlers
    this.setupEventHandlers();
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
  }

  private onFileLoaded(data: DrawingData): void {
    this.statusElement.textContent = `Loading ${data.strokes.length} strokes...`;
    this.statusElement.className = 'status success';

    // Store only the drawing data in sessionStorage
    sessionStorage.setItem('conceptsData', JSON.stringify(data));

    // Navigate to viewer
    window.location.href = 'viewer.html';
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
