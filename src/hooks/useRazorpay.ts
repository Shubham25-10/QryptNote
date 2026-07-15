import { useState, useEffect } from 'react';

declare global { interface Window { Razorpay: any; } }

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Razorpay SDK failed to load');
    document.body.appendChild(script);

    return () => {
      // document.body.removeChild(script);
    };
  }, []);

  return isLoaded;
}
