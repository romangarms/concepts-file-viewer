import type { Stroke, DrawingData } from './types.js';

export class StrokeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
  }

  /**
   * Calculate bounds of all strokes to fit them in the viewport
   */
  private calculateBounds(strokes: Stroke[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of strokes) {
      for (const point of stroke.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render all strokes to the canvas
   */
  render(drawingData: DrawingData): void {
    const { strokes } = drawingData;

    if (strokes.length === 0) {
      console.warn('No strokes to render');
      return;
    }

    this.clear();

    // Calculate bounds and scaling
    const bounds = this.calculateBounds(strokes);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const padding = 40;
    const scaleX = (this.canvas.width - padding * 2) / width;
    const scaleY = (this.canvas.height - padding * 2) / height;
    this.scale = Math.min(scaleX, scaleY);

    this.offsetX = padding - bounds.minX * this.scale;
    this.offsetY = padding - bounds.minY * this.scale;

    // Render each stroke
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      this.renderStroke(stroke);
    }
  }

  /**
   * Render a single stroke
   */
  private renderStroke(stroke: Stroke): void {
    if (stroke.points.length === 0) return;

    // Set stroke width (scale it with the drawing)
    this.ctx.lineWidth = stroke.width * this.scale;

    // Set stroke color (convert 0-1 range to 0-255)
    const r = Math.round(stroke.color.r * 255);
    const g = Math.round(stroke.color.g * 255);
    const b = Math.round(stroke.color.b * 255);
    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${stroke.color.a})`;

    this.ctx.beginPath();

    const firstPoint = stroke.points[0];
    this.ctx.moveTo(
      firstPoint.x * this.scale + this.offsetX,
      this.canvas.height - (firstPoint.y * this.scale + this.offsetY)
    );

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      this.ctx.lineTo(
        point.x * this.scale + this.offsetX,
        this.canvas.height - (point.y * this.scale + this.offsetY)
      );
    }

    this.ctx.stroke();
  }

  /**
   * Resize the canvas to match its display size
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
}
