import type { Role } from '@kailani/types';
import { U } from './fixtures/people';

export interface DemoPersona {
  role: Role;
  userId: string;
  title: string;
  description: string;
  dashboard: string;
}

// One persona per role. The login picker shows one card per enabled persona.
// Brand, Photographer, and Admin are enabled in later slices.
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'MODEL',
    userId: U.kaia,
    title: 'Model',
    description: 'Kaia Mercer, a Honolulu swimwear and commercial model. Browse and swipe campaigns, track applications, and message brands.',
    dashboard: '/model/dashboard',
  },
];

export function personaForRole(role: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.role === role);
}
