import { Mark, SketchData } from './types';

/**
 * Render the sketch to a PNG data URL that can be sent to a diffusion model
 * as an image-to-image seed. The output is intentionally rough — flux denoises
 * heavily at strength 0.85 — so the goal is legible spatial layout, not fidelity.
 */
export function rasterizeSketch(sketch: SketchData, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Medium gray background — pairs with darker fills below so canny reads
  // soft value gradients as region boundaries, not hairline outlines.
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  // Filter blurs the whole sketch so canny extracts blob-like edges rather
  // than sharp geometric lines. Keeps composition signal, loses "hand-drawn
  // rectangles" bleed.
  ctx.filter = 'blur(6px)';

  for (const shape of sketch.shapes) {
    const x = shape.x * width;
    const y = shape.y * height;
    const w = shape.width * width;
    const h = shape.height * height;

    if (shape.type === 'stroke' && shape.path && shape.path.length > 1) {
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.9)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < shape.path.length; i++) {
        const p = shape.path[i];
        const px = p.x * width;
        const py = p.y * height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      continue;
    }

    if (shape.type === 'group') continue;

    // Solid fill only — no outline stroke. Canny gets one soft boundary
    // per region instead of a traceable geometric perimeter.
    ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';

    if (shape.type === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.filter = 'none';
  return canvas.toDataURL('image/png');
}

/**
 * Build a binary inpainting mask from a set of marks.
 * White = regenerate (remove marks dilated to a region); black = preserve.
 */
export function buildRefineMask(marks: Mark[], width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  // Dilate stroke into a region ~1/18 of the larger dim (~57px at 1024px).
  ctx.lineWidth = Math.max(width, height) / 18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const mark of marks) {
    if (mark.type !== 'remove' || mark.path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(mark.path[0].x * width, mark.path[0].y * height);
    for (let i = 1; i < mark.path.length; i++) {
      ctx.lineTo(mark.path[i].x * width, mark.path[i].y * height);
    }
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Composite the user's keep regions from the prior image onto the new image.
 * A belt-and-suspenders on top of the mask: even if inpainting bleeds, the
 * user-marked keep regions survive. Uses a soft alpha fade at the path edge.
 */
export async function compositeKeepRegions(
  priorImageUrl: string,
  newImageUrl: string,
  keeps: Mark[],
  width: number,
  height: number
): Promise<string> {
  if (keeps.length === 0) return newImageUrl;

  const [prior, next] = await Promise.all([loadImage(priorImageUrl), loadImage(newImageUrl)]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return newImageUrl;

  ctx.drawImage(next, 0, 0, width, height);

  for (const mark of keeps) {
    if (mark.type !== 'keep' || mark.path.length < 3) continue;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mark.path[0].x * width, mark.path[0].y * height);
    for (let i = 1; i < mark.path.length; i++) {
      ctx.lineTo(mark.path[i].x * width, mark.path[i].y * height);
    }
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(prior, 0, 0, width, height);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

