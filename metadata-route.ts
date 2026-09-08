  app.get('/api/messages/:id/metadata', async (req, res) => {
    try {
       const { id } = req.params;
       const adminFirestore = getAdminFirestoreInstance();
       if (!adminFirestore) {
         const docRef = doc(firestore, 'messages', id);
         const docSnap = await getDoc(docRef);
         if (!docSnap.exists()) return res.status(404).json({ error: 'Message not found' });
         const data = docSnap.data();
         return res.json({ id, hasPassword: !!data.passwordHash, createdAt: data.createdAt, viewLimit: data.viewLimit, viewCount: data.viewCount });
       }
       const docSnap = await adminFirestore.collection('messages').doc(id).get();
       if (!docSnap.exists) return res.status(404).json({ error: 'Message not found' });
       const data = docSnap.data()!;
       if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
          await adminFirestore.collection('messages').doc(id).delete();
          return res.status(404).json({ error: 'Message expired' });
       }
       if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
          await adminFirestore.collection('messages').doc(id).delete();
          return res.status(404).json({ error: 'Message destroyed' });
       }
       res.json({ id, hasPassword: !!data.passwordHash, createdAt: data.createdAt, viewLimit: data.viewLimit, viewCount: data.viewCount });
    } catch (err) {
       console.error(err);
       res.status(500).json({ error: 'Server error' });
    }
  });
