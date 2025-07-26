/**
 * Currency utility functions for formatting amounts in KSH (Kenyan Shillings)
 */

export const CURRENCY_SYMBOL = 'KSH';
export const CURRENCY_CODE = 'KES'; // ISO currency code for Kenyan Shilling

/**
 * Format a number as currency in KSH
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formattedAmount = amount.toLocaleString('en-KE', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return showSymbol ? `${CURRENCY_SYMBOL} ${formattedAmount}` : formattedAmount;
};

/**
 * Format currency for display in tables and compact spaces
 * @param amount - The amount to format
 * @returns Formatted currency string without decimals for whole numbers
 */
export const formatCurrencyCompact = (amount: number): string => {
  const isWholeNumber = amount % 1 === 0;
  return formatCurrency(amount, {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format currency for input fields (without symbol)
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export const formatCurrencyInput = (amount: number): string => {
  return formatCurrency(amount, { showSymbol: false });
};

/**
 * Parse currency string to number
 * @param currencyString - String containing currency amount
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbol and any non-numeric characters except decimal point
  const cleanString = currencyString
    .replace(new RegExp(CURRENCY_SYMBOL, 'g'), '')
    .replace(/[^\d.-]/g, '');
  
  return parseFloat(cleanString) || 0;
};

/**
 * Legacy function to maintain compatibility with existing code
 * @deprecated Use formatCurrency instead
 */
export const toCurrency = (amount: number): string => {
  return formatCurrency(amount);
};
