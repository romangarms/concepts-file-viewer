import type { ImportedImage, Transform } from './types.js';

/**
 * Handles loading and rendering of imported images
 */
export class ImageRenderer {
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  /**
   * Load image data into HTMLImageElement
   */
  private async loadImage(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData;
    });
  }

  /**
   * Load and cache an image by UUID
   */
  async loadAndCache(uuid: string, imageData: string): Promise<void> {
    if (this.loadedImages.has(uuid)) {
      return;
    }

    try {
      const img = await this.loadImage(imageData);
      this.loadedImages.set(uuid, img);
    } catch (error) {
      console.error(`Failed to load image ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Check if an image is loaded
   */
  has(uuid: string): boolean {
    return this.loadedImages.has(uuid);
  }

  /**
   * Get a loaded image
   */
  get(uuid: string): HTMLImageElement | undefined {
    return this.loadedImages.get(uuid);
  }

  /**
   * Apply Concepts transform to canvas context
   */
  private applyConceptsTransform(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    baseScale: number
  ): void {
    ctx.transform(
      transform.a,
      transform.b,
      transform.c,
      transform.d,
      transform.tx * baseScale,
      transform.ty * baseScale
    );
  }

  /**
   * Render a single image to the canvas
   */
  render(
    ctx: CanvasRenderingContext2D,
    image: ImportedImage,
    baseScale: number
  ): void {
    const img = this.loadedImages.get(image.uuid);
    if (!img) return;

    ctx.save();

    // Apply transform if present
    if (image.transform) {
      this.applyConceptsTransform(ctx, image.transform, baseScale);

      // Transform positions the image CENTER at (tx, ty)
      const halfWidth = (image.size.x * baseScale) / 2;
      const halfHeight = (image.size.y * baseScale) / 2;

      // Flip the image around its own Y-axis (at its center)
      ctx.scale(1, -1);

      // Draw with offset (note: Y is negated because we flipped)
      ctx.drawImage(
        img,
        -halfWidth,
        -halfHeight,
        image.size.x * baseScale,
        image.size.y * baseScale
      );
    } else {
      // No transform - draw at position (bottom-left corner in Concepts coords)
      const drawX = image.position.x * baseScale;
      const drawY = image.position.y * baseScale;
      const width = image.size.x * baseScale;
      const height = image.size.y * baseScale;

      // Translate to image center
      ctx.translate(drawX + width / 2, drawY + height / 2);

      // Flip the image around its own Y-axis
      ctx.scale(1, -1);

      // Draw centered at origin
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
    }

    ctx.restore();
  }
}
