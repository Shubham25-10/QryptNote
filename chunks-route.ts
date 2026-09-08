  app.get('/api/messages/:id/chunks', async (req, res) => {
    try {
      const { id } = req.params;
      const adminFirestore = getAdminFirestoreInstance();
      if (!adminFirestore) {
         // Lite mode fallback
         const { getDocs, collection: col } = await import('firebase/firestore/lite');
         const snapshot = await getDocs(col(firestore, \`messages/\${id}/chunks\`));
         const chunks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
         return res.json({ chunks });
      }
      const snapshot = await adminFirestore.collection('messages').doc(id).collection('chunks').get();
      const chunks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ chunks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
