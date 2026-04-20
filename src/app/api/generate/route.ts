import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const runtime = 'nodejs';

fal.config({ credentials: process.env.FAL_KEY });

interface GenerateRequest {
  prompt: string;
  /** Base64 data URL of the rasterized sketch, used as ControlNet canny input. */
  sketchImage?: string;
}

// Shakker-Labs Union Pro supports canny, depth, pose, and other modes via one model.
// We use it in canny mode — our rasterized sketch (outlined shapes + strokes) is
// already edge-like, so canny extraction gives a clean region-boundary signal.
const CONTROLNET_PATH = 'Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro-2.0';

/**
 * Turn a base64 data URL into something Fal storage accepts, upload it, and
 * return the public URL. Fal's control_image_url needs a fetchable URL; some
 * client versions accept data URLs directly but this is more reliable.
 */
async function uploadControlImage(dataUrl: string): Promise<string> {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.+);base64/);
  const mime = mimeMatch?.[1] || 'image/png';
  const buffer = Buffer.from(base64, 'base64');
  const blob = new Blob([buffer], { type: mime });
  const file = new File([blob], 'sketch.png', { type: mime });
  return await fal.storage.upload(file);
}

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY missing' }, { status: 500 });
  }

  const { prompt, sketchImage } = (await req.json()) as GenerateRequest;

  if (!prompt || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  }

  try {
    // When a sketch is provided, condition on it with canny ControlNet — the
    // model is forced to honor the composition. Without a sketch, fall back
    // to plain text-to-image via flux/schnell.
    if (sketchImage) {
      const controlImageUrl = await uploadControlImage(sketchImage);

      const result = await fal.subscribe('fal-ai/flux-general', {
        input: {
          prompt,
          image_size: { width: 1024, height: 688 },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: 'jpeg',
          controlnets: [
            {
              path: CONTROLNET_PATH,
              control_image_url: controlImageUrl,
              // Balanced mid-strength: strong enough to lock region placement,
              // low enough that sketch outlines don't bleed as literal lines.
              conditioning_scale: 0.6,
              start_percentage: 0,
              end_percentage: 0.6,
            },
          ],
        },
        logs: false,
      } as Parameters<typeof fal.subscribe>[1]);

      const data = result.data as { images?: Array<{ url: string }> };
      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) {
        return NextResponse.json({ error: 'no image returned' }, { status: 502 });
      }
      return NextResponse.json({ imageUrl });
    }

    // No sketch — pure text-to-image.
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: { width: 1024, height: 688 },
        num_inference_steps: 4,
        num_images: 1,
      },
      logs: false,
    } as Parameters<typeof fal.subscribe>[1]);

    const data = result.data as { images?: Array<{ url: string }> };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: 'no image returned' }, { status: 502 });
    }
    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
