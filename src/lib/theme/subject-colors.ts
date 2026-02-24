// Subject color theme system
// Each subject gets a warm, child-friendly palette applied via CSS custom properties.

export interface SubjectTheme {
  bg: string;
  bgMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  text: string;
  textLight: string;
}

const themes: Record<string, SubjectTheme> = {
  practical_life: {
    bg: '#fdf5f0',
    bgMuted: '#f8ebe2',
    accent: '#c06a3e',
    accentHover: '#a85a34',
    border: '#e8cfc0',
    text: '#7a4528',
    textLight: '#b0785a',
  },
  sensorial: {
    bg: '#fdf8ee',
    bgMuted: '#f8f0db',
    accent: '#c4a230',
    accentHover: '#a88c28',
    border: '#e8dbb0',
    text: '#7a6518',
    textLight: '#b09850',
  },
  language: {
    bg: '#f0f7f0',
    bgMuted: '#e2f0e2',
    accent: '#5b8c5a',
    accentHover: '#4a7a4a',
    border: '#bcd8bc',
    text: '#3a5c3a',
    textLight: '#7aa67a',
  },
  math: {
    bg: '#eef5fa',
    bgMuted: '#deedf5',
    accent: '#4a7c9b',
    accentHover: '#3c6a87',
    border: '#b4d2e4',
    text: '#2e5570',
    textLight: '#6a9ab8',
  },
  geometry: {
    bg: '#f3f0f8',
    bgMuted: '#e8e2f2',
    accent: '#7b68ae',
    accentHover: '#695898',
    border: '#c8bce0',
    text: '#4c3d72',
    textLight: '#9a8cc4',
  },
  geography: {
    bg: '#fdf5ee',
    bgMuted: '#f8ead8',
    accent: '#d4915e',
    accentHover: '#bf7d4c',
    border: '#e8d0b4',
    text: '#7a5530',
    textLight: '#c4985e',
  },
  history: {
    bg: '#f8f0ec',
    bgMuted: '#f0e2da',
    accent: '#a0522d',
    accentHover: '#8a4526',
    border: '#d8bfb0',
    text: '#6a3820',
    textLight: '#b87a5a',
  },
  science: {
    bg: '#f2f7ee',
    bgMuted: '#e4f0da',
    accent: '#6b8e23',
    accentHover: '#5a7a1e',
    border: '#c0d8a0',
    text: '#455c18',
    textLight: '#8ab040',
  },
  art_music: {
    bg: '#fdf0f0',
    bgMuted: '#f8e0e0',
    accent: '#cd5c5c',
    accentHover: '#b84c4c',
    border: '#e8bebe',
    text: '#7a3030',
    textLight: '#d08080',
  },
  culture: {
    bg: '#f8f3ea',
    bgMuted: '#f0e8d4',
    accent: '#b8860b',
    accentHover: '#9e7208',
    border: '#dcc890',
    text: '#6a5008',
    textLight: '#c8a040',
  },
  read_aloud: {
    bg: '#eef4fa',
    bgMuted: '#dce9f4',
    accent: '#5b8fa8',
    accentHover: '#4c7d96',
    border: '#b4cee0',
    text: '#3a6078',
    textLight: '#7aacca',
  },
};

const fallback: SubjectTheme = {
  bg: '#f9f7f5',
  bgMuted: '#f0ece8',
  accent: '#8b7355',
  accentHover: '#776245',
  border: '#d8cfc4',
  text: '#5a4a38',
  textLight: '#a0907a',
};

export function getSubjectTheme(name: string | undefined | null): SubjectTheme {
  if (!name) return fallback;
  return themes[name.toLowerCase()] ?? fallback;
}

/** Convert a theme to CSS custom properties for inline style application. */
export function themeToStyle(theme: SubjectTheme): React.CSSProperties {
  return {
    '--slide-bg': theme.bg,
    '--slide-bg-muted': theme.bgMuted,
    '--slide-accent': theme.accent,
    '--slide-accent-hover': theme.accentHover,
    '--slide-border': theme.border,
    '--slide-text': theme.text,
    '--slide-text-light': theme.textLight,
  } as React.CSSProperties;
}

/** Pretty display names for subject badges */
const displayNames: Record<string, string> = {
  practical_life: 'Practical Life',
  sensorial: 'Sensorial',
  language: 'Language Arts',
  math: 'Mathematics',
  geometry: 'Geometry',
  geography: 'Geography',
  history: 'History',
  science: 'Science',
  art_music: 'Art & Music',
  culture: 'Culture',
  read_aloud: 'Read Aloud',
};

export function getSubjectDisplayName(name: string | undefined | null): string {
  if (!name) return 'Lesson';
  return displayNames[name.toLowerCase()] ?? name.replace(/_/g, ' ');
}
