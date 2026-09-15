declare global { interface Window { Razorpay: any; } }

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Razorpay SDK failed to load');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
