const MOCK_IMAGES = [
  '/assets/rounds/round-1.jpg',
  '/assets/rounds/round-2.jpg',
  '/assets/rounds/round-3.jpg',
  '/assets/rounds/round-4.jpg',
  '/assets/rounds/round-5.jpg',
  '/assets/rounds/round-6.jpg',
  '/assets/rounds/round-7.jpg',
  '/assets/rounds/round-8.jpg',
];

export async function mockGenerate(roundIndex: number): Promise<string> {
  await new Promise((r) => setTimeout(r, 2500));
  return MOCK_IMAGES[(roundIndex - 1) % MOCK_IMAGES.length];
}

export function getMockImage(roundIndex: number): string {
  return MOCK_IMAGES[(roundIndex - 1) % MOCK_IMAGES.length];
}
