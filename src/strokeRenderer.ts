import type { Stroke, DrawingData } from './types.js';

export class StrokeRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private baseScale: number = 1;
  private userScale: number = 2; // Start at 2x zoom
  private panX: number = 0;
  private panY: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private currentDrawingData: DrawingData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.setupInteractions();
  }

  /**
   * Set up mouse/touch interactions for pan and zoom
   */
  private setupInteractions(): void {
    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = this.userScale * zoomFactor;

      // Limit zoom range
      if (newScale < 0.5 || newScale > 10) return;

      // Zoom towards mouse position
      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.userScale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.userScale);

      this.userScale = newScale;
      this.redraw();
    });

    // Pan with mouse drag
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.panX += deltaX;
      this.panY += deltaY;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.redraw();
    });

    // Use window for mouseup to catch releases outside canvas
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      // Don't reset dragging on leave, only on mouseup
      if (!this.isDragging) {
        this.canvas.style.cursor = 'grab';
      }
    });

    // Prevent default drag behavior
    this.canvas.addEventListener('dragstart', (e: DragEvent) => {
      e.preventDefault();
      return false;
    });

    // Touch support for mobile/tablets
    let lastTouchX = 0;
    let lastTouchY = 0;
    let lastTouchDistance = 0;

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        // Single touch - pan
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        // Single touch - pan
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;

        this.panX += deltaX;
        this.panY += deltaY;

        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;

        this.redraw();
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance > 0) {
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = this.canvas.getBoundingClientRect();
          const canvasX = centerX - rect.left;
          const canvasY = centerY - rect.top;

          const zoomFactor = distance / lastTouchDistance;
          const newScale = this.userScale * zoomFactor;

          // Limit zoom range
          if (newScale >= 0.5 && newScale <= 10) {
            // Zoom towards pinch center
            this.panX = canvasX - (canvasX - this.panX) * (newScale / this.userScale);
            this.panY = canvasY - (canvasY - this.panY) * (newScale / this.userScale);
            this.userScale = newScale;
            this.redraw();
          }
        }

        lastTouchDistance = distance;
      }
    });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length < 2) {
        lastTouchDistance = 0;
      }
    });

    // Set initial cursor
    this.canvas.style.cursor = 'grab';
  }

  /**
   * Public methods to control zoom
   */
  zoomIn(): void {
    this.userScale = Math.min(10, this.userScale * 1.2);
    this.redraw();
  }

  zoomOut(): void {
    this.userScale = Math.max(0.5, this.userScale / 1.2);
    this.redraw();
  }

  resetView(): void {
    this.userScale = 2;
    this.panX = 0;
    this.panY = 0;
    this.redraw();
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
    this.currentDrawingData = drawingData;
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

    // Calculate bounds and base scaling
    const bounds = this.calculateBounds(strokes);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const padding = 40;
    const scaleX = (this.canvas.width - padding * 2) / width;
    const scaleY = (this.canvas.height - padding * 2) / height;
    this.baseScale = Math.min(scaleX, scaleY);

    this.offsetX = padding - bounds.minX * this.baseScale;
    this.offsetY = padding - bounds.minY * this.baseScale;

    this.redraw();
  }

  /**
   * Redraw the canvas with current pan/zoom settings
   */
  private redraw(): void {
    if (!this.currentDrawingData) return;

    this.clear();

    // Apply canvas-level transformations for pan and user zoom
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.userScale, this.userScale);

    // Render each stroke
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const stroke of this.currentDrawingData.strokes) {
      this.renderStroke(stroke);
    }

    // Restore canvas state
    this.ctx.restore();
  }

  /**
   * Render a single stroke
   */
  private renderStroke(stroke: Stroke): void {
    if (stroke.points.length === 0) return;

    // Set stroke width (scale it with the drawing - use baseScale only, userScale is applied at canvas level)
    this.ctx.lineWidth = stroke.width * this.baseScale;

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
      this.ctx.transform(t.a, t.b, t.c, t.d, t.tx * this.baseScale, -t.ty * this.baseScale);
    }

    this.ctx.beginPath();

    const firstPoint = stroke.points[0];
    this.ctx.moveTo(
      firstPoint.x * this.baseScale + this.offsetX,
      this.canvas.height - (firstPoint.y * this.baseScale + this.offsetY)
    );

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      this.ctx.lineTo(
        point.x * this.baseScale + this.offsetX,
        this.canvas.height - (point.y * this.baseScale + this.offsetY)
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
   * Accounts for device pixel ratio for sharp rendering on high-DPI displays
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size in actual pixels (accounting for device pixel ratio)
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale the context to match, so we can still draw at logical pixel coordinates
    this.ctx.scale(dpr, dpr);
  }
}
