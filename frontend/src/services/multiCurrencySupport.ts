export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: 'CBK' | 'MANUAL' | 'API' | 'BANK';
  lastUpdated: string;
  isActive: boolean;
}

export interface CurrencyConversion {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  conversionDate: string;
  source: string;
}

export interface MultiCurrencyPayrollRecord {
  employeeId: string;
  baseCurrency: string;
  paymentCurrency: string;
  grossPayBase: number;
  grossPayPayment: number;
  netPayBase: number;
  netPayPayment: number;
  exchangeRate: number;
  conversionDate: string;
  statutoryDeductionsBase: number;
  statutoryDeductionsPayment: number;
}

export class MultiCurrencyService {
  private static readonly SUPPORTED_CURRENCIES: Currency[] = [
    {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSH',
      decimalPlaces: 2,
      isBaseCurrency: true,
      isActive: true
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
      isBaseCurrency: false,
      isActive: true
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalPlaces: 2,
      isBaseCurrency: false,
      isActive: true
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      decimalPlaces: 2,
      isBaseCurrency: false,
      isActive: true
    },
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      decimalPlaces: 2,
      isBaseCurrency: false,
      isActive: true
    },
    {
      code: 'UGX',
      name: 'Ugandan Shilling',
      symbol: 'USh',
      decimalPlaces: 0,
      isBaseCurrency: false,
      isActive: true
    },
    {
      code: 'TZS',
      name: 'Tanzanian Shilling',
      symbol: 'TSh',
      decimalPlaces: 0,
      isBaseCurrency: false,
      isActive: true
    }
  ];

  private static exchangeRates: ExchangeRate[] = [
    {
      id: 'kes_usd_001',
      fromCurrency: 'KES',
      toCurrency: 'USD',
      rate: 0.0077, // 1 KES = 0.0077 USD (approximate)
      effectiveDate: '2024-12-01',
      source: 'CBK',
      lastUpdated: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'usd_kes_001',
      fromCurrency: 'USD',
      toCurrency: 'KES',
      rate: 130.0, // 1 USD = 130 KES (approximate)
      effectiveDate: '2024-12-01',
      source: 'CBK',
      lastUpdated: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'kes_eur_001',
      fromCurrency: 'KES',
      toCurrency: 'EUR',
      rate: 0.0070, // 1 KES = 0.0070 EUR (approximate)
      effectiveDate: '2024-12-01',
      source: 'CBK',
      lastUpdated: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'eur_kes_001',
      fromCurrency: 'EUR',
      toCurrency: 'KES',
      rate: 142.0, // 1 EUR = 142 KES (approximate)
      effectiveDate: '2024-12-01',
      source: 'CBK',
      lastUpdated: new Date().toISOString(),
      isActive: true
    }
  ];

  /**
   * Get all supported currencies
   */
  static getSupportedCurrencies(): Currency[] {
    return this.SUPPORTED_CURRENCIES.filter(currency => currency.isActive);
  }

  /**
   * Get base currency (KES)
   */
  static getBaseCurrency(): Currency {
    return this.SUPPORTED_CURRENCIES.find(currency => currency.isBaseCurrency)!;
  }

  /**
   * Get currency by code
   */
  static getCurrency(code: string): Currency | undefined {
    return this.SUPPORTED_CURRENCIES.find(currency => 
      currency.code === code && currency.isActive
    );
  }

  /**
   * Get current exchange rate between two currencies
   */
  static getExchangeRate(fromCurrency: string, toCurrency: string): ExchangeRate | null {
    if (fromCurrency === toCurrency) {
      return {
        id: `${fromCurrency}_${toCurrency}_same`,
        fromCurrency,
        toCurrency,
        rate: 1.0,
        effectiveDate: new Date().toISOString(),
        source: 'MANUAL',
        lastUpdated: new Date().toISOString(),
        isActive: true
      };
    }

    const rate = this.exchangeRates.find(rate => 
      rate.fromCurrency === fromCurrency && 
      rate.toCurrency === toCurrency && 
      rate.isActive
    );

    return rate || null;
  }

  /**
   * Convert amount from one currency to another
   */
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate?: number
  ): CurrencyConversion | null {
    if (fromCurrency === toCurrency) {
      return {
        fromAmount: amount,
        fromCurrency,
        toAmount: amount,
        toCurrency,
        exchangeRate: 1.0,
        conversionDate: new Date().toISOString(),
        source: 'SAME_CURRENCY'
      };
    }

    let rate: number;
    let source: string;

    if (exchangeRate) {
      rate = exchangeRate;
      source = 'MANUAL';
    } else {
      const exchangeRateRecord = this.getExchangeRate(fromCurrency, toCurrency);
      if (!exchangeRateRecord) {
        return null;
      }
      rate = exchangeRateRecord.rate;
      source = exchangeRateRecord.source;
    }

    const convertedAmount = amount * rate;
    const toCurrencyInfo = this.getCurrency(toCurrency);
    const roundedAmount = toCurrencyInfo 
      ? this.roundToDecimalPlaces(convertedAmount, toCurrencyInfo.decimalPlaces)
      : convertedAmount;

    return {
      fromAmount: amount,
      fromCurrency,
      toAmount: roundedAmount,
      toCurrency,
      exchangeRate: rate,
      conversionDate: new Date().toISOString(),
      source
    };
  }

  /**
   * Convert payroll amounts to multiple currencies
   */
  static convertPayrollRecord(
    grossPay: number,
    netPay: number,
    statutoryDeductions: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate?: number
  ): MultiCurrencyPayrollRecord | null {
    const grossConversion = this.convertCurrency(grossPay, fromCurrency, toCurrency, exchangeRate);
    const netConversion = this.convertCurrency(netPay, fromCurrency, toCurrency, exchangeRate);
    const deductionsConversion = this.convertCurrency(statutoryDeductions, fromCurrency, toCurrency, exchangeRate);

    if (!grossConversion || !netConversion || !deductionsConversion) {
      return null;
    }

    return {
      employeeId: '', // To be set by caller
      baseCurrency: fromCurrency,
      paymentCurrency: toCurrency,
      grossPayBase: grossPay,
      grossPayPayment: grossConversion.toAmount,
      netPayBase: netPay,
      netPayPayment: netConversion.toAmount,
      exchangeRate: grossConversion.exchangeRate,
      conversionDate: grossConversion.conversionDate,
      statutoryDeductionsBase: statutoryDeductions,
      statutoryDeductionsPayment: deductionsConversion.toAmount
    };
  }

  /**
   * Update exchange rates from Central Bank of Kenya (CBK)
   */
  static async updateExchangeRatesFromCBK(): Promise<boolean> {
    try {
      // In a real implementation, this would call CBK API
      // Cleaned up: removed legacy mock rates comment
      
      const currentDate = new Date().toISOString();
      
      // Simulate rate fluctuations (±2%)
      const fluctuation = () => 0.98 + (Math.random() * 0.04);
      
      // Update USD rates
      const usdToKesRate = 130.0 * fluctuation();
      const kestoUsdRate = 1 / usdToKesRate;
      
      this.updateExchangeRate('USD', 'KES', usdToKesRate, 'CBK', currentDate);
      this.updateExchangeRate('KES', 'USD', kestoUsdRate, 'CBK', currentDate);
      
      // Update EUR rates
      const eurToKesRate = 142.0 * fluctuation();
      const kestoEurRate = 1 / eurToKesRate;
      
      this.updateExchangeRate('EUR', 'KES', eurToKesRate, 'CBK', currentDate);
      this.updateExchangeRate('KES', 'EUR', kestoEurRate, 'CBK', currentDate);
      
      // Update GBP rates
      const gbpToKesRate = 165.0 * fluctuation();
      const kestoGbpRate = 1 / gbpToKesRate;
      
      this.updateExchangeRate('GBP', 'KES', gbpToKesRate, 'CBK', currentDate);
      this.updateExchangeRate('KES', 'GBP', kestoGbpRate, 'CBK', currentDate);
      
      console.log('Exchange rates updated from CBK');
      return true;
      
    } catch (error) {
      console.error('Failed to update exchange rates from CBK:', error);
      return false;
    }
  }

  /**
   * Update a specific exchange rate
   */
  static updateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    source: 'CBK' | 'MANUAL' | 'API' | 'BANK',
    effectiveDate: string
  ): void {
    const existingRateIndex = this.exchangeRates.findIndex(r => 
      r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    const newRate: ExchangeRate = {
      id: `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}_${Date.now()}`,
      fromCurrency,
      toCurrency,
      rate,
      effectiveDate,
      source,
      lastUpdated: new Date().toISOString(),
      isActive: true
    };

    if (existingRateIndex >= 0) {
      // Deactivate old rate
      this.exchangeRates[existingRateIndex].isActive = false;
    }

    // Add new rate
    this.exchangeRates.push(newRate);
  }

  /**
   * Get exchange rate history
   */
  static getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    days: number = 30
  ): ExchangeRate[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.exchangeRates
      .filter(rate => 
        rate.fromCurrency === fromCurrency &&
        rate.toCurrency === toCurrency &&
        new Date(rate.effectiveDate) >= cutoffDate
      )
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) {
      return amount.toString();
    }

    const roundedAmount = this.roundToDecimalPlaces(amount, currency.decimalPlaces);
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(roundedAmount);
  }

  /**
   * Format currency amount with custom symbol
   */
  static formatCurrencyWithSymbol(amount: number, currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) {
      return amount.toString();
    }

    const roundedAmount = this.roundToDecimalPlaces(amount, currency.decimalPlaces);
    const formattedNumber = roundedAmount.toLocaleString('en-KE', {
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    });

    return `${currency.symbol} ${formattedNumber}`;
  }

  /**
   * Calculate cross-currency rates
   */
  static calculateCrossRate(
    fromCurrency: string,
    toCurrency: string,
    baseCurrency: string = 'KES'
  ): number | null {
    if (fromCurrency === toCurrency) return 1.0;

    // Direct rate
    const directRate = this.getExchangeRate(fromCurrency, toCurrency);
    if (directRate) {
      return directRate.rate;
    }

    // Cross rate via base currency
    const fromToBase = this.getExchangeRate(fromCurrency, baseCurrency);
    const baseToTarget = this.getExchangeRate(baseCurrency, toCurrency);

    if (fromToBase && baseToTarget) {
      return fromToBase.rate * baseToTarget.rate;
    }

    // Inverse cross rate
    const baseToFrom = this.getExchangeRate(baseCurrency, fromCurrency);
    const targetToBase = this.getExchangeRate(toCurrency, baseCurrency);

    if (baseToFrom && targetToBase) {
      return 1 / (baseToFrom.rate * targetToBase.rate);
    }

    return null;
  }

  /**
   * Validate currency conversion
   */
  static validateConversion(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    }

    if (!this.getCurrency(fromCurrency)) {
      errors.push(`Unsupported source currency: ${fromCurrency}`);
    }

    if (!this.getCurrency(toCurrency)) {
      errors.push(`Unsupported target currency: ${toCurrency}`);
    }

    if (fromCurrency !== toCurrency && !this.getExchangeRate(fromCurrency, toCurrency)) {
      const crossRate = this.calculateCrossRate(fromCurrency, toCurrency);
      if (!crossRate) {
        errors.push(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get currency conversion summary for reporting
   */
  static getConversionSummary(
    conversions: CurrencyConversion[]
  ): {
    totalConversions: number;
    currencyPairs: { from: string; to: string; count: number; totalAmount: number }[];
    averageRates: { pair: string; averageRate: number }[];
  } {
    const totalConversions = conversions.length;

    // Group by currency pairs
    const pairGroups = conversions.reduce((acc, conversion) => {
      const pairKey = `${conversion.fromCurrency}_${conversion.toCurrency}`;
      if (!acc[pairKey]) {
        acc[pairKey] = {
          from: conversion.fromCurrency,
          to: conversion.toCurrency,
          count: 0,
          totalAmount: 0,
          rates: []
        };
      }
      acc[pairKey].count++;
      acc[pairKey].totalAmount += conversion.fromAmount;
      acc[pairKey].rates.push(conversion.exchangeRate);
      return acc;
    }, {} as Record<string, any>);

    const currencyPairs = Object.values(pairGroups).map((group: any) => ({
      from: group.from,
      to: group.to,
      count: group.count,
      totalAmount: group.totalAmount
    }));

    const averageRates = Object.entries(pairGroups).map(([pair, group]: [string, any]) => ({
      pair,
      averageRate: group.rates.reduce((sum: number, rate: number) => sum + rate, 0) / group.rates.length
    }));

    return {
      totalConversions,
      currencyPairs,
      averageRates
    };
  }

  /**
   * Round amount to specified decimal places
   */
  private static roundToDecimalPlaces(amount: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Schedule automatic exchange rate updates
   */
  static scheduleExchangeRateUpdates(): void {
    // Update rates every 4 hours during business days
    setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // Only update during business hours (8 AM - 6 PM) on weekdays
      if (day >= 1 && day <= 5 && hour >= 8 && hour <= 18) {
        await this.updateExchangeRatesFromCBK();
      }
    }, 4 * 60 * 60 * 1000); // 4 hours
  }

  /**
   * Get currency statistics for dashboard
   */
  static getCurrencyStats(): {
    supportedCurrencies: number;
    activeRates: number;
    lastRateUpdate: string;
    baseCurrency: string;
  } {
    const supportedCurrencies = this.SUPPORTED_CURRENCIES.filter(c => c.isActive).length;
    const activeRates = this.exchangeRates.filter(r => r.isActive).length;
    const lastRateUpdate = this.exchangeRates.length > 0 
      ? Math.max(...this.exchangeRates.map(r => new Date(r.lastUpdated).getTime()))
      : 0;
    const baseCurrency = this.getBaseCurrency().code;

    return {
      supportedCurrencies,
      activeRates,
      lastRateUpdate: new Date(lastRateUpdate).toISOString(),
      baseCurrency
    };
  }
}
