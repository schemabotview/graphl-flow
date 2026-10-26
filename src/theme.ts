import type { ThemeKey, Tone } from './types'

// A theme owns the SHADE; a tone owns the HUE FAMILY, identical in every theme.
// Values stay 6-digit hex so they can be concatenated with alpha later.

export interface ToneColors { accent: string; tint: string }

export interface Theme {
  bg: string
  surface: string
  line: string
  ink: string
  muted: string
  tones: Record<Tone, ToneColors>
}

export const THEMES: Record<ThemeKey, Theme> = {
  dark: {
    bg: '#14171c', surface: '#1c2027', line: '#2c323c', ink: '#eef2f8', muted: '#9aa4b2',
    tones: {
      neutral: { accent: '#9aa4b2', tint: '#181b20' },
      source:  { accent: '#a3adbb', tint: '#1b1e24' },
      ingest:  { accent: '#4f8ff7', tint: '#111d2e' },
      store:   { accent: '#37b877', tint: '#122419' },
      serve:   { accent: '#c98bff', tint: '#1e1428' },
      consume: { accent: '#f0656f', tint: '#2a1416' },
      infra:   { accent: '#f0902f', tint: '#241c12' },
    },
  },
  light: {
    bg: '#ffffff', surface: '#ffffff', line: '#d9dee5', ink: '#1b1f24', muted: '#5a6675',
    tones: {
      neutral: { accent: '#5a6675', tint: '#f3f5f8' },
      source:  { accent: '#4b5563', tint: '#f1f2f4' },
      ingest:  { accent: '#1f5fc4', tint: '#e8effc' },
      store:   { accent: '#177a4a', tint: '#e7f7ee' },
      serve:   { accent: '#7b3fbf', tint: '#f3eafd' },
      consume: { accent: '#c0303c', tint: '#fdeaec' },
      infra:   { accent: '#b4610f', tint: '#fdf1e4' },
    },
  },
}
