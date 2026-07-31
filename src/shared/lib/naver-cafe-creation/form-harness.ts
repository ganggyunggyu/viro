import type { CafeTopicPreset } from './presets';

export interface CafeCreateFormContract {
  name: string;
  slug: string;
  presetKey: string;
  description: string;
  keywords: string[];
}

export interface ResolvedCafeCreateForm {
  name: string;
  slug: string;
  categoryMajor: string;
  categoryMinor: string;
  description: string;
  keywords: string[];
}

export const resolveCafeCreateForm = (
  input: CafeCreateFormContract,
  presets: CafeTopicPreset[],
): ResolvedCafeCreateForm | undefined => {
  const { name, slug, presetKey, description, keywords } = input;
  const preset = presets.find(({ key }) => key === presetKey);
  if (!preset) return undefined;

  const { categoryMajor, categoryMinor } = preset;
  return { name, slug, categoryMajor, categoryMinor, description, keywords };
};
