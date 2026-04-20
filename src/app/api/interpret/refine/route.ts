import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You compose inpainting prompts for Flux. Given the overall image prompt, a set of user marks on specific regions, and optional adjustment directives, write ONE paragraph (30-70 words) describing what should appear in the marked "remove" regions after regeneration.

The prompt should:
- Describe NEW content for the masked regions, not the whole image
- Carry forward style, mood, medium, and lighting from the overall prompt
- Fold each remove-mark's annotation into the description in order of centroid position (top-to-bottom, left-to-right)
- Apply any adjustment directives as modifiers (e.g. "with noticeably brighter lighting", "in a more muted palette") — these bias the ENTIRE output, including the inpainted regions
- Use specific sensory language (textures, light, color) that diffusion models follow well

Do NOT include meta-commentary or headers. Output only the prompt paragraph.`;

interface Adjustments {
  lighting: number;
  saturation: number;
  style: number;
  detail: number;
  mood: number;
  contrast: number;
}

interface MarkSummary {
  type: 'keep' | 'remove' | 'redirect';
  annotation: string | null;
  cx: number;
  cy: number;
}

interface RefineInterpretRequest {
  masterPrompt: string;
  marks: MarkSummary[];
  adjustments?: Adjustments;
}

/**
 * Turn a 0-100 slider value into a natural-language directive, or return
 * null for neutral (35-65 ignored, so small adjustments don't skew the prompt).
 */
function sliderToDirective(value: number, leftWord: string, rightWord: string): string | null {
  if (value >= 35 && value <= 65) return null;
  const pushRight = value > 65;
  const word = pushRight ? rightWord : leftWord;
  const intensity =
    value <= 10 || value >= 90 ? 'strongly' : value <= 20 || value >= 80 ? 'noticeably' : 'slightly';
  return `${intensity} ${word}`;
}

function adjustmentsToDirectives(adj: Adjustments | undefined): string[] {
  if (!adj) return [];
  const pairs: Array<[number, string, string]> = [
    [adj.lighting, 'darker', 'brighter'],
    [adj.saturation, 'more muted', 'more vibrant'],
    [adj.style, 'more photoreal', 'more stylized'],
    [adj.detail, 'simpler and less detailed', 'denser and more detailed'],
    [adj.mood, 'calmer and more still', 'more energetic and dynamic'],
    [adj.contrast, 'lower-contrast and flatter', 'higher-contrast'],
  ];
  const directives: string[] = [];
  for (const [value, left, right] of pairs) {
    const d = sliderToDirective(value, left, right);
    if (d) directives.push(d);
  }
  return directives;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  const { masterPrompt, marks, adjustments } = (await req.json()) as RefineInterpretRequest;

  const removeMarks = marks.filter((m) => m.type === 'remove');
  const directives = adjustmentsToDirectives(adjustments);

  if (removeMarks.length === 0 && directives.length === 0) {
    return NextResponse.json({ refinePrompt: masterPrompt });
  }

  const ordered = [...removeMarks].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const markLines = ordered
    .map((m) => {
      const region = `at (${m.cx.toFixed(2)}, ${m.cy.toFixed(2)})`;
      const note = m.annotation?.trim() || '(no annotation)';
      return `- remove mark ${region}: ${note}`;
    })
    .join('\n');

  const directivesBlock =
    directives.length > 0 ? directives.map((d) => `- ${d}`).join('\n') : '(none)';

  const userMessage = `Overall image prompt:
${masterPrompt}

Remove marks (regions to regenerate):
${markLines || '(none)'}

Adjustment directives (apply as modifiers to the whole image):
${directivesBlock}

Compose the inpainting prompt.`;

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

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
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
