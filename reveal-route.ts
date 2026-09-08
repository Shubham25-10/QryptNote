  app.post('/api/reveal-message', async (req, res) => {
    try {
      const { id, passwordHash } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const adminFirestore = getAdminFirestoreInstance();
      if (!adminFirestore) {
        // Fallback for lite SDK
        const docRef = doc(firestore, 'messages', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return res.status(404).json({ error: 'Message not found' });
        const data = docSnap.data();
        if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
           await deleteDoc(docRef);
           return res.status(404).json({ error: 'Message expired' });
        }
        if (data.passwordHash && data.passwordHash !== passwordHash) {
           return res.status(401).json({ error: 'Invalid password' });
        }
        if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
           await deleteDoc(docRef);
           return res.status(404).json({ error: 'Message destroyed' });
        }
        
        const newViewCount = data.viewCount + 1;
        if (data.viewLimit !== -1 && newViewCount >= data.viewLimit) {
           await deleteDoc(docRef);
           // Try to delete chunks if they exist
           if (data.chunkCount > 0) {
             const { writeBatch } = await import('firebase/firestore/lite');
             for (let i = 0; i < data.chunkCount; i += 10) {
                const batch = writeBatch(firestore);
                const limit = Math.min(10, data.chunkCount - i);
                for(let j=0; j<limit; j++) {
                  batch.delete(doc(firestore, `messages/${id}/chunks/chunk_${i+j}`));
                }
                await batch.commit();
             }
           }
        } else {
           await updateDoc(docRef, { viewCount: newViewCount });
        }
        return res.json({ encryptedMessage: data.encryptedMessage, iv: data.iv, salt: data.salt, chunkCount: data.chunkCount });
      }

      let payloadData: any = null;
      let shouldDeleteChunks = false;
      let chunkCount = 0;

      await adminFirestore.runTransaction(async (t) => {
        const docRef = adminFirestore.collection('messages').doc(id);
        const docSnap = await t.get(docRef);
        if (!docSnap.exists) {
          throw new Error('NOT_FOUND');
        }
        const data = docSnap.data()!;
        if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
          t.delete(docRef);
          shouldDeleteChunks = true;
          chunkCount = data.chunkCount || 0;
          throw new Error('NOT_FOUND');
        }
        if (data.passwordHash && data.passwordHash !== passwordHash) {
          throw new Error('INVALID_PASSWORD');
        }
        if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
          t.delete(docRef);
          shouldDeleteChunks = true;
          chunkCount = data.chunkCount || 0;
          throw new Error('NOT_FOUND');
        }

        const newViewCount = (data.viewCount || 0) + 1;
        if (data.viewLimit !== -1 && newViewCount >= data.viewLimit) {
          t.delete(docRef);
          shouldDeleteChunks = true;
          chunkCount = data.chunkCount || 0;
        } else {
          t.update(docRef, { viewCount: newViewCount });
        }
        payloadData = { encryptedMessage: data.encryptedMessage, iv: data.iv, salt: data.salt, chunkCount: data.chunkCount || 0 };
      });

      if (shouldDeleteChunks && chunkCount > 0) {
         // Delete chunks in background
         (async () => {
           for (let i = 0; i < chunkCount; i += 10) {
             const batch = adminFirestore.batch();
             const limit = Math.min(10, chunkCount - i);
             for(let j=0; j<limit; j++) {
               batch.delete(adminFirestore.collection('messages').doc(id).collection('chunks').doc(`chunk_${i+j}`));
             }
             await batch.commit();
           }
         })().catch(console.error);
      }

      res.json(payloadData);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Message not found' });
      if (err.message === 'INVALID_PASSWORD') return res.status(401).json({ error: 'Invalid password' });
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/delete-message', async (req, res) => {
     try {
        const { id, destructionToken } = req.body;
        if (!id || !destructionToken) return res.status(400).json({ error: 'Missing id or token' });
        const adminFirestore = getAdminFirestoreInstance();
        if (!adminFirestore) {
           return res.status(500).json({ error: 'Not supported in lite mode' });
        }
        const docRef = adminFirestore.collection('messages').doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) return res.status(404).json({ error: 'Not found' });
        if (docSnap.data()?.destructionToken !== destructionToken) return res.status(403).json({ error: 'Invalid token' });
        
        const chunkCount = docSnap.data()?.chunkCount || 0;
        await docRef.delete();
        if (chunkCount > 0) {
           for (let i = 0; i < chunkCount; i += 10) {
             const batch = adminFirestore.batch();
             const limit = Math.min(10, chunkCount - i);
             for(let j=0; j<limit; j++) {
               batch.delete(adminFirestore.collection('messages').doc(id).collection('chunks').doc(`chunk_${i+j}`));
             }
             await batch.commit();
           }
        }
        res.json({ success: true });
     } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
     }
  });
