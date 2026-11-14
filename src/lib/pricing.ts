export const BUSINESS_DEFAULTS = {
  currency: 'USD',
  overheadRate: 0.08,
  pricingMethod: 'gross_margin',
  grossMarginRate: 0.25,
  minimumGrossMarginRate: 0.2,
  defaultOrderQuantity: 1000,
  /** Taxes, freight, duties, NRE/tooling, and yield/scrap are excluded unless entered separately. */
  includedCharges: ['direct_cost', 'overhead'] as const,
} as const;

export interface PricingInput {
  directCost: number;
  orderQuantity: number;
  overheadRate?: number;
  grossMarginRate?: number;
}

export interface PricingResult {
  currency: typeof BUSINESS_DEFAULTS.currency;
  directCostPerUnit: number;
  overheadPerUnit: number;
  manufacturingCostPerUnit: number;
  grossMarginRate: number;
  sellingPricePerUnit: number;
  profitPerUnit: number;
  orderTotal: number;
  belowMinimumMargin: boolean;
}

/** Frontend USD preview calculator. Backend decimal arithmetic is authoritative for production quotes. */
export function calculatePricing(input: PricingInput): PricingResult {
  const directCost = Number(input.directCost);
  const orderQuantity = Number(input.orderQuantity);
  const overheadRate = input.overheadRate ?? BUSINESS_DEFAULTS.overheadRate;
  const grossMarginRate = input.grossMarginRate ?? BUSINESS_DEFAULTS.grossMarginRate;

  if (!Number.isFinite(directCost) || directCost < 0) {
    throw new RangeError('Direct cost must be a finite, non-negative USD amount.');
  }
  if (!Number.isFinite(orderQuantity) || orderQuantity < 0) {
    throw new RangeError('Order quantity must be a finite, non-negative number.');
  }
  if (!Number.isFinite(overheadRate) || overheadRate < 0 || overheadRate > 1) {
    throw new RangeError('Overhead rate must be between 0 and 1.');
  }
  if (!Number.isFinite(grossMarginRate) || grossMarginRate < 0 || grossMarginRate >= 1) {
    throw new RangeError('Gross margin rate must be at least 0 and less than 1.');
  }

  const overheadPerUnit = directCost * overheadRate;
  const manufacturingCostPerUnit = directCost + overheadPerUnit;
  const sellingPricePerUnit = manufacturingCostPerUnit / (1 - grossMarginRate);
  const profitPerUnit = sellingPricePerUnit - manufacturingCostPerUnit;

  return {
    currency: BUSINESS_DEFAULTS.currency,
    directCostPerUnit: directCost,
    overheadPerUnit,
    manufacturingCostPerUnit,
    grossMarginRate,
    sellingPricePerUnit,
    profitPerUnit,
    orderTotal: sellingPricePerUnit * orderQuantity,
    belowMinimumMargin: grossMarginRate < BUSINESS_DEFAULTS.minimumGrossMarginRate,
  };
}
