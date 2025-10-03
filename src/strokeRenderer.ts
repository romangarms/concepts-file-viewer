import type { Stroke, DrawingData } from './types.js';

export class StrokeRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
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
   * Apply transform to a point
   */
  private transformPoint(point: { x: number; y: number }, transform?: import('./types.js').Transform): { x: number; y: number } {
    if (!transform) {
      return point;
    }

    const { a, b, c, d, tx, ty } = transform;
    return {
      x: a * point.x + c * point.y + tx,
      y: b * point.x + d * point.y + ty,
    };
  }

  /**
   * Calculate bounds of all strokes to fit them in the viewport
   * Takes transforms into account
   */
  private calculateBounds(strokes: Stroke[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of strokes) {
      for (const point of stroke.points) {
        // Apply transform if present
        const transformedPoint = this.transformPoint(point, stroke.transform);

        minX = Math.min(minX, transformedPoint.x);
        minY = Math.min(minY, transformedPoint.y);
        maxX = Math.max(maxX, transformedPoint.x);
        maxY = Math.max(maxY, transformedPoint.y);
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

    // Debug: log transforms
    const strokesWithTransforms = strokes.filter(s => s.transform);
    if (strokesWithTransforms.length > 0) {
      console.log(`Found ${strokesWithTransforms.length} strokes with transforms:`);
      strokesWithTransforms.forEach((s, i) => {
        console.log(`  Stroke ${i}:`, s.transform);
      });
    } else {
      console.log('No strokes have transforms');
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

    // Apply transform if present
    if (stroke.transform) {
      this.ctx.save();
      const t = stroke.transform;
      // Apply the affine transform matrix (negate ty for Y-axis flip)
      this.ctx.transform(t.a, t.b, t.c, t.d, t.tx * this.scale, -t.ty * this.scale);
    }

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

    // Close the path if marked as closed
    if (stroke.closed) {
      this.ctx.closePath();
    }

    this.ctx.stroke();

    // Restore context if we applied a transform
    if (stroke.transform) {
      this.ctx.restore();
    }
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
