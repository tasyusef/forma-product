import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const runtime = 'nodejs';
// Same story as /api/generate — Fal inpaint calls can take 30s-5min on cold
// boots. Hobby caps at 300s; bump to 600 on Pro+.
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

interface RefineRequest {
  /** URL or data URL of the prior image being refined */
  imageUrl: string;
  /** Base64 data URL of a binary mask: white = inpaint, black = preserve */
  maskDataUrl: string;
  /** The refinement prompt (Claude-composed from marks + annotations) */
  prompt: string;
  /** 0-1 strength of the inpaint */
  strength?: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY missing' }, { status: 500 });
  }

  const { imageUrl, maskDataUrl, prompt, strength = 0.9 } = (await req.json()) as RefineRequest;

  if (!imageUrl || !maskDataUrl || !prompt) {
    return NextResponse.json({ error: 'imageUrl, maskDataUrl, and prompt required' }, { status: 400 });
  }

  try {
    const result = await fal.subscribe('fal-ai/flux-general/inpainting', {
      input: {
        prompt,
        image_url: imageUrl,
        mask_url: maskDataUrl,
        strength,
        num_inference_steps: 28,
      },
      logs: false,
    } as Parameters<typeof fal.subscribe>[1]);

    const data = result.data as { images?: Array<{ url: string }> };
    const refinedUrl = data.images?.[0]?.url;

    if (!refinedUrl) {
      return NextResponse.json({ error: 'no image returned' }, { status: 502 });
    }

    return NextResponse.json({ imageUrl: refinedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
