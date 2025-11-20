import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Rs. 0.00';
  }
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export function generateProductCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function calculateShippingCost(weight: number, baseRate: number): number {
  const weightInKg = weight / 1000;
  return Math.ceil(weightInKg) * baseRate;
}
