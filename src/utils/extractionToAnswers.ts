/**
 * extractionToAnswers.ts
 *
 * Converts AI-extracted item properties into the wizard answer format
 * consumed by the deterministic rules engine (evaluateRules).
 *
 * This is the bridge between AI extraction and the rules engine.
 * The AI extracts facts; this module maps them to answers; rules.ts decides.
 */

import type { AiExtraction } from './classifier';

/**
 * Converts AI-detected properties into the canonical wizard answer map
 * so that evaluateRules() can produce a deterministic verdict.
 */
export function extractionToAnswers(
  categoryId: string,
  extraction: AiExtraction
): Record<string, string | number | boolean> {
  const props = extraction.detectedProperties || {};
  const answers: Record<string, string | number | boolean> = {};

  // Compute Wh if not provided directly
  const wh =
    props.wh != null
      ? props.wh
      : props.mah != null && props.voltage != null
      ? (props.mah * props.voltage) / 1000
      : null;

  switch (categoryId) {
    case 'battery-spare':
      if (wh != null) {
        answers['battery-size'] = wh > 160 ? 'xlarge' : wh >= 100 ? 'large' : 'small';
      }
      break;

    case 'battery-installed':
      if (wh != null) {
        // Devices with installed batteries use looser rules than spare batteries
        // < 100 Wh → small, 100-160 Wh → medium (allowed w/ restrictions), > 160 Wh → large (prohibited)
        answers['device-type'] = wh > 160 ? 'large' : wh >= 100 ? 'medium' : 'small';
      }
      break;

    case 'liquids':
      if (props.volume_ml != null) {
        answers['container-size'] = props.volume_ml > 100 ? 'large' : 'small';
        // AI cannot reliably determine liquid type; default to regular
        // If the user needs medication/duty-free exception, they should use wizard
        answers['liquid-type'] = 'regular';
      }
      break;

    case 'knife':
      if (props.blade_length_cm != null) {
        answers['knife-blade'] = props.blade_length_cm >= 6 ? 'long' : 'short';
      }
      break;

    case 'scissors':
      if (props.blade_length_cm != null) {
        answers['scissors-blade'] = props.blade_length_cm >= 6 ? 'long' : 'short';
      }
      break;

    case 'tools':
      if (props.blade_length_cm != null) {
        answers['tool-size'] = props.blade_length_cm >= 6 ? 'long' : 'short';
      }
      break;

    default:
      // Static-rule categories (lighter, matches, e-cigarettes, etc.) need no answers
      break;
  }

  return answers;
}

/**
 * Returns true if we have enough data from AI extraction to skip the wizard
 * and run the rules engine directly.
 *
 * Safety rule: when in doubt, route through wizard. Never skip unless certain.
 */
export function canSkipWizardWithExtraction(
  categoryId: string,
  extraction: AiExtraction
): boolean {
  // If AI explicitly flagged missing critical data, always route to wizard
  if (extraction.missingCriticalData) return false;

  const props = extraction.detectedProperties || {};
  const wh =
    props.wh != null
      ? props.wh
      : props.mah != null && props.voltage != null
      ? (props.mah * props.voltage) / 1000
      : null;

  switch (categoryId) {
    case 'battery-spare':
    case 'battery-installed':
      return wh != null;

    case 'liquids':
      return props.volume_ml != null;

    case 'knife':
    case 'scissors':
    case 'tools':
      return props.blade_length_cm != null;

    default:
      // Static-rule categories always skip wizard
      return true;
  }
}
