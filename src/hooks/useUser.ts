import { useState, useEffect } from 'react';

export function useUser() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [proFeatures, setProFeatures] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('qryptnote_user_email');
    if (!email) {
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
  }, []);

  return { userEmail, isPro, proFeatures, loading };
}
