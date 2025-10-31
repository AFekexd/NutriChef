/**
 * Measurement unit conversion utilities
 */

export interface ConversionResult {
  value: number;
  unit: string;
  formatted: string;
}

// Conversion factors to grams (for weight)
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

// Conversion factors to milliliters (for volume)
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 236.588,
  cups: 236.588,
  tbsp: 14.787,
  tablespoon: 14.787,
  tablespoons: 14.787,
  tsp: 4.929,
  teaspoon: 4.929,
  teaspoons: 4.929,
  "fl oz": 29.574,
  "fluid ounce": 29.574,
  "fluid ounces": 29.574,
  gal: 3785.41,
  gallon: 3785.41,
  gallons: 3785.41,
  qt: 946.353,
  quart: 946.353,
  quarts: 946.353,
  pt: 473.176,
  pint: 473.176,
  pints: 473.176,
};

/**
 * Convert between weight units
 */
export function convertWeight(
  value: number,
  fromUnit: string,
  toUnit: string
): ConversionResult {
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  if (
    !(normalizedFrom in WEIGHT_TO_GRAMS) ||
    !(normalizedTo in WEIGHT_TO_GRAMS)
  ) {
    return { value, unit: fromUnit, formatted: `${value} ${fromUnit}` };
  }

  const grams = value * WEIGHT_TO_GRAMS[normalizedFrom];
  const converted = grams / WEIGHT_TO_GRAMS[normalizedTo];
  const rounded = Math.round(converted * 100) / 100;

  return {
    value: rounded,
    unit: toUnit,
    formatted: `${rounded} ${toUnit}`,
  };
}

/**
 * Convert between volume units
 */
export function convertVolume(
  value: number,
  fromUnit: string,
  toUnit: string
): ConversionResult {
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  if (!(normalizedFrom in VOLUME_TO_ML) || !(normalizedTo in VOLUME_TO_ML)) {
    return { value, unit: fromUnit, formatted: `${value} ${fromUnit}` };
  }

  const ml = value * VOLUME_TO_ML[normalizedFrom];
  const converted = ml / VOLUME_TO_ML[normalizedTo];
  const rounded = Math.round(converted * 100) / 100;

  return {
    value: rounded,
    unit: toUnit,
    formatted: `${rounded} ${toUnit}`,
  };
}

/**
 * Scale recipe measurements by a multiplier
 */
export function scaleRecipe(value: number, multiplier: number): number {
  const scaled = value * multiplier;
  // Round to reasonable precision
  if (scaled < 1) return Math.round(scaled * 100) / 100;
  if (scaled < 10) return Math.round(scaled * 10) / 10;
  return Math.round(scaled);
}

/**
 * Get all available units for a measurement type
 */
export function getAvailableUnits(type: "weight" | "volume"): string[] {
  if (type === "weight") {
    return Object.keys(WEIGHT_TO_GRAMS);
  }
  return Object.keys(VOLUME_TO_ML);
}
