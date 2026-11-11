// Frontend validation mirroring the contract bounds exactly.
// Code-point counts ([...str].length) match Python len() on the contract.
import { CATEGORIES, MAX_BUDGET_GEN } from './chain';

const cpLen = (s: string) => [...s].length;

export type VErr = string | null;

export function validateRequirements(v: string): VErr {
  const n = cpLen(v.trim());
  if (n < 20) return 'req_short';
  if (n > 2000) return 'req_long';
  return null;
}
export function validateCategory(v: string): VErr {
  return CATEGORIES.includes(v) ? null : 'cat_bad';
}
export function validateBudget(v: string): VErr {
  if (!/^\d+$/.test(v.trim())) return 'budget_bad';
  const n = Number(v);
  if (n < 1 || n > MAX_BUDGET_GEN) return 'budget_bad';
  return null;
}
export function validatePrice(v: string, budget: number): VErr {
  if (!/^\d+$/.test(v.trim())) return 'price_bad';
  const n = Number(v);
  if (n < 1 || n > budget) return 'price_bad';
  return null;
}
export function validateTerms(v: string): VErr {
  const n = cpLen(v.trim());
  if (n < 10) return 'terms_short';
  if (n > 2000) return 'terms_long';
  return null;
}
export const countOf = cpLen;
