import { useState, useEffect } from 'react';

export function useUser() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [proFeatures, setProFeatures] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const email = localStorage.getItem('qryptnote_user_email');
      if (!email) {
        setUserEmail('');
        setIsPro(false);
        setProFeatures({});
        setLoading(false);
        return;
      }
      
      setUserEmail(email);
      fetch(`/api/users/${email}/pro-status`)
        .then(r => r.json())
        .then(data => {
          setIsPro(data.isPro);
          setProFeatures(data.proFeatures || {});
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    checkUser();

    // Listen for cross-tab changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'qryptnote_user_email') {
        checkUser();
      }
    });
    
    // Custom event for same-tab updates
    window.addEventListener('qryptnote-user-updated', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('qryptnote-user-updated', checkUser);
    };
  }, []);

  return { userEmail, isPro, proFeatures, loading };
}
