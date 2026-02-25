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
    id: 'betsy-bear',
    emoji: '\u{1F43B}',
    name: 'Betsy Bear',
    gradeBand: 'primary',
    greeting: 'Hi friend! I\'m Betsy Bear!',
    voiceId: 'en-US-Neural2-H',
  },
  lower_elementary: {
    id: 'ollie-owl',
    emoji: '\u{1F989}',
    name: 'Ollie Owl',
    gradeBand: 'lower_elementary',
    greeting: 'Hey there! I\'m Ollie Owl, and I love discovering new things!',
    voiceId: 'en-US-Neural2-I',
  },
  upper_elementary: {
    id: 'finn-fox',
    emoji: '\u{1F98A}',
    name: 'Finn Fox',
    gradeBand: 'upper_elementary',
    greeting: 'What\'s up! I\'m Finn Fox. Ready to explore something cool?',
    voiceId: 'en-US-Neural2-I',
  },
};

export function getMascot(gradeBand?: string | null): MascotCharacter | null {
  if (!gradeBand) return null;
  return MASCOTS[gradeBand as GradeBand] ?? null;
}
