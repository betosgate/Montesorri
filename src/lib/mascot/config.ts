import type { GradeBand } from '@/lib/types/database';

export interface MascotCharacter {
  id: string;
  emoji: string;
  name: string;
  gradeBand: GradeBand;
  greeting: string;
  voiceId: string;
}

export const MASCOTS: Record<GradeBand, MascotCharacter> = {
  primary: {
    id: 'benny-bear',
    emoji: '\u{1F43B}',
    name: 'Benny Bear',
    gradeBand: 'primary',
    greeting: 'Hi friend! I\'m Benny Bear!',
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_PRIMARY || '',
  },
  lower_elementary: {
    id: 'ollie-owl',
    emoji: '\u{1F989}',
    name: 'Ollie Owl',
    gradeBand: 'lower_elementary',
    greeting: 'Hey there! I\'m Ollie Owl, and I love discovering new things!',
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_LOWER_EL || '',
  },
  upper_elementary: {
    id: 'finn-fox',
    emoji: '\u{1F98A}',
    name: 'Finn Fox',
    gradeBand: 'upper_elementary',
    greeting: 'What\'s up! I\'m Finn Fox. Ready to explore something cool?',
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_UPPER_EL || '',
  },
};

export function getMascot(gradeBand?: string | null): MascotCharacter | null {
  if (!gradeBand) return null;
  return MASCOTS[gradeBand as GradeBand] ?? null;
}
