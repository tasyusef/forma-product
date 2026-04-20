import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const runtime = 'nodejs';
// Vercel Hobby caps maxDuration at 300s. The skip-ControlNet warmup path has
// been landing in 6-227s in practice, so 300 is enough headroom for a cold
// flux-general boot. Bump to 600 if we ever move to Pro+.
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

/**
 * Pre-boot the Fal flux-general container so the next /api/generate lands on
 * a hot model. The expensive step is loading flux-dev weights into GPU
 * memory (~20GB); the ControlNet adapter loads fast once the container is
 * warm, so we skip ControlNet here and avoid the storage-upload path.
 *
 * Run with: curl.exe -X POST http://localhost:3000/api/warmup   (Windows/PS)
 *           curl     -X POST http://localhost:3000/api/warmup   (bash/WSL)
 *
 * Costs one Flux-dev generation (~$0.06). Fire 30-60s before recording,
 * then stay active — Fal idles out after ~10-15 min of no calls.
 */
export async function POST() {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY missing' }, { status: 500 });
  }

  const started = Date.now();

  try {
    await fal.subscribe('fal-ai/flux-general', {
      input: {
        prompt: 'warmup',
        image_size: { width: 1024, height: 688 },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
      },
      logs: false,
    } as Parameters<typeof fal.subscribe>[1]);

    return NextResponse.json({ ok: true, elapsedMs: Date.now() - started });
  } catch (err) {
    console.error('warmup failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Fal's error surface is inconsistent — dump every property we can find
    // so we actually see the underlying HTTP status / body.
    const anyErr = err as Record<string, unknown>;
    const detail = {
      body: anyErr?.body,
      status: anyErr?.status,
      statusText: anyErr?.statusText,
      name: err instanceof Error ? err.name : undefined,
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 4).join('\n') : undefined,
      keys: err && typeof err === 'object' ? Object.keys(err) : [],
    };
    return NextResponse.json(
      { error: message, detail, elapsedMs: Date.now() - started },
      { status: 500 }
    );
  }
}
