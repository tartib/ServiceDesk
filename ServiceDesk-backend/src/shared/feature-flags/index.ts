/**
 * Feature Flags — Barrel Export
 */

export { default as FeatureFlagService } from './FeatureFlagService';
export { featureGate } from './featureGate';
export { defaultFlags } from './flags';
export {
  FeatureFlag,
  FeatureFlagCategory,
  FeatureFlagContext,
  FeatureFlagUpdate,
} from './types';
