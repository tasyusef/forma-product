import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SketchData } from '@/lib/types';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You compose single-paragraph generation prompts for a text-to-image diffusion model (Flux).

You receive a structured sketch: a set of labeled regions on a 3:2 canvas, each with a position, a size, and an optional per-region prompt. You also receive a global prompt covering overall mood, style, medium, and lighting.

Your output is ONE paragraph, 40-80 words, written as a diffusion prompt. Preserve spatial intent using positional language (upper-third, lower-left, center, foreground, background, horizon line, etc). Weave each region's semantic content into the paragraph in the order it reads on the canvas (top to bottom, left to right). Respect the global prompt's mood, style, and medium across all regions.

Do NOT include meta-commentary, explanations, or headers. Output only the prompt paragraph.`;

interface InterpretRequest {
  sketch: SketchData;
  canvasAspect?: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  let body: InterpretRequest;
  try {
    body = (await req.json()) as InterpretRequest;
  } catch {
    // Aborted fetches sometimes land here with an empty body — reject cleanly
    // instead of throwing a 500 that shows up as "failed to pipe response".
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const { sketch } = body;

  // Propagate client disconnect to Anthropic. Without this, aborted streams
  // keep burning our concurrent-connection quota and subsequent interprets
  // start hitting 429s.
  const upstream = new AbortController();
  req.signal.addEventListener('abort', () => upstream.abort(), { once: true });

  const regionDescriptions = sketch.shapes
    .filter((s) => s.type !== 'group')
    .map((s) => {
      const cx = (s.x + s.width / 2).toFixed(2);
      const cy = (s.y + s.height / 2).toFixed(2);
      const area = (s.width * s.height).toFixed(2);
      const label = s.label || '(unlabeled)';
      // prompt field added in phase 1
      const prompt = (s as unknown as { prompt?: string }).prompt?.trim() || '';
      return `- ${s.type} "${label}" at (${cx}, ${cy}), area ${area}${prompt ? `: ${prompt}` : ''}`;
    })
    .join('\n');

  const groupDescriptions = sketch.shapes
    .filter((s) => s.type === 'group')
    .map((s) => {
      const cx = (s.x + s.width / 2).toFixed(2);
      const cy = (s.y + s.height / 2).toFixed(2);
      const prompt = (s as unknown as { prompt?: string }).prompt?.trim() || s.label || '(unlabeled group)';
      return `- group at (${cx}, ${cy}): ${prompt}`;
    })
    .join('\n');

  const userMessage = `Canvas: 3:2, coordinates 0-1 (origin top-left).

Regions:
${regionDescriptions || '(none)'}

Groups:
${groupDescriptions || '(none)'}

Global prompt (mood, style, medium): ${sketch.textPrompt || '(none)'}

Compose the generation prompt.`;

  try {
    const stream = await anthropic.messages.stream(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: upstream.signal }
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      // Fires when the downstream consumer (the fetch response body) is
      // cancelled — e.g. the client aborted. Kill the Anthropic stream too.
      cancel() {
        upstream.abort();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
