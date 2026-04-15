const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
  'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80',
];

export async function mockGenerate(roundIndex: number): Promise<string> {
  await new Promise((r) => setTimeout(r, 2500));
  return MOCK_IMAGES[(roundIndex - 1) % MOCK_IMAGES.length];
}

export function getMockImage(roundIndex: number): string {
  return MOCK_IMAGES[(roundIndex - 1) % MOCK_IMAGES.length];
}
