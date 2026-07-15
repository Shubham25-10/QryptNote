import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'INR' | 'AED';

export const exchangeRates: Record<Currency, number> = {
  USD: 1,
  INR: 83, // Approximate
  AED: 3.67 // Approximate
};

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  AED: 'د.إ'
};

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const cachedCurrency = sessionStorage.getItem('user_currency') as Currency;
        if (cachedCurrency && ['USD', 'INR', 'AED'].includes(cachedCurrency)) {
          setCurrency(cachedCurrency);
          setLoading(false);
          return;
        }

        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();

        let detectedCurrency: Currency = 'USD';
        if (data.country_code === 'IN') {
          detectedCurrency = 'INR';
        } else if (data.country_code === 'AE') {
          detectedCurrency = 'AED';
        }

        setCurrency(detectedCurrency);
        sessionStorage.setItem('user_currency', detectedCurrency);
      } catch (error) {
        console.error('Error fetching location for currency:', error);
        // Fallback to USD
        setCurrency('USD');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const formatPrice = (usdAmount: number) => {
    if (currency === 'USD') {
      return {
        display: `$${usdAmount}`,
        isEstimate: false,
        usdText: `$${usdAmount} USD`
      };
    }
    
    const convertedAmount = Math.round(usdAmount * exchangeRates[currency]);
    return {
      display: `${currencySymbols[currency]}${convertedAmount}`,
      estimateText: `Approximate price in your local currency. You will be charged $${usdAmount} USD.`,
      isEstimate: true,
      usdText: `$${usdAmount} USD`
    };
  };

  return { currency, loading, formatPrice };
}
