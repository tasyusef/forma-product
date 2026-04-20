import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You merge short per-layer prompts into ONE cohesive layer prompt.

You receive a list of prompts that describe parts of a single spatial region on a sketch. The user has just grouped these parts together. Write one short prompt (10-25 words) that captures the combined semantic meaning of all parts. Preserve every concrete detail mentioned (colors, objects, actions, modifiers). Do not add new details that weren't in the inputs.

Output only the merged prompt. No headers, no explanation, no quotes.`;

interface MergeRequest {
  memberPrompts: string[];
  memberLabels?: string[];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  const { memberPrompts, memberLabels } = (await req.json()) as MergeRequest;

  const nonEmpty = memberPrompts.filter((p) => p && p.trim().length > 0);

  if (nonEmpty.length === 0) {
    const fallback = memberLabels?.filter((l) => l.trim()).join(', ') || '';
    return NextResponse.json({ merged: fallback });
  }

  if (nonEmpty.length === 1) {
    return NextResponse.json({ merged: nonEmpty[0] });
  }

  const userMessage = `Merge these per-layer prompts into one cohesive prompt:\n\n${nonEmpty.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const merged = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return NextResponse.json({ merged });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
