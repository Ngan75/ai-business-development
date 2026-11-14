export type ProductCategory = 'pcba' | 'wire_harness' | 'iot';
/** MVP is intentionally USD-only. Supporting other currencies requires an explicit FX design. */
export type CurrencyCode = 'USD';
export type PricingMethod = 'gross_margin' | 'markup';
export type RevisionStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'superseded';
export type RfqStatus = 'new' | 'triage' | 'costing' | 'quoted' | 'won' | 'lost' | 'cancelled';

/** API money values are decimal strings, never JS floating-point numbers. */
export interface Money {
  amount: string;
  currency: CurrencyCode;
}

export interface Customer {
  id: string;
  code: string;
  legalName: string;
  displayName?: string;
  industry?: string;
  countryCode?: string;
  status: 'lead' | 'prospect' | 'active' | 'vip' | 'inactive';
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductProject {
  id: string;
  customerId?: string;
  code: string;
  name: string;
  category: ProductCategory;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rfq {
  id: string;
  code: string;
  customerId: string;
  opportunityId?: string;
  productProjectId?: string;
  category: ProductCategory;
  requestedQuantity: string;
  currency: CurrencyCode;
  status: RfqStatus;
  receivedAt: string;
  dueAt?: string;
  requirements?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CostLine {
  id: string;
  lineNo: number;
  costType: 'component' | 'material' | 'pcb_fabrication' | 'assembly' | 'labor' | 'test' | 'tooling' | 'nre' | 'freight' | 'other';
  description: string;
  quantityPerUnit: string;
  uom: string;
  unitCost: Money;
  extendedCost: Money;
  includedInDirectCost: boolean;
  sourceType: 'customer_bom' | 'supplier_quote' | 'manual' | 'sample' | 'ai_suggestion';
  sourceReferenceId?: string;
  sourceNote?: string;
}

export interface CostingTotals {
  directCost: Money;
  setupCost: Money;
  overheadBase: Money;
  overheadAmount: Money;
  manufacturingCost: Money;
  profitPerUnit: Money;
  sellingPrice: Money;
  orderTotal: Money;
}

export interface CostingRevision {
  id: string;
  productProjectId: string;
  rfqId?: string;
  revisionNo: number;
  category: ProductCategory;
  status: RevisionStatus;
  currency: CurrencyCode;
  orderQuantity: string;
  overheadRate: string;
  pricingMethod: PricingMethod;
  pricingRate: string;
  lines: CostLine[];
  totals: CostingTotals;
  assumptions: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRevision {
  id: string;
  quoteId: string;
  revisionNo: number;
  costingRevisionId: string;
  status: 'draft' | 'in_review' | 'approved' | 'issued' | 'superseded';
  currency: CurrencyCode;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  totalAmount: Money;
  issuedAt?: string;
  issuedBy?: string;
  createdAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
    requestId?: string;
  };
}

export interface PageResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
