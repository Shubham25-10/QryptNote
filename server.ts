import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import cors from 'cors';

import Razorpay from 'razorpay';
import { initializeApp as initAdminApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';








// Initialize Firebase
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestore: any;

try {
  let config: any = null;
  
  if (process.env.VITE_FIREBASE_API_KEY) {
    config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID
    };
    if (!config.firestoreDatabaseId && fs.existsSync(firebaseConfigPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      config.firestoreDatabaseId = fileConfig.firestoreDatabaseId;
    }
  } else if (fs.existsSync(firebaseConfigPath)) {
    config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  }

  if (config) {
    const app = initializeApp(config);
    firestore = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    } as any, "ai-studio-a9ba2121-a2c8-437a-9558-29699c445cf9");
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration not found in environment variables or firebase-applet-config.json. Database will not work.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Encryption constants
const ALGORITHM = 'aes-256-gcm';
// Default to a 32-byte key for demo if not provided, but ideally this is set in environment.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); 
const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedObj: { iv: string, content: string, authTag: string }) {
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, Buffer.from(encryptedObj.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
  let decrypted = decipher.update(encryptedObj.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


// Lazy Initialize Firebase Admin for secure backend operations
let adminApp: any;
function getAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  try {
    let adminCred;
    if (fs.existsSync('firebase-service-account.json')) {
      const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
      console.log("Service account project_id from file:", serviceAccount.project_id);
      adminCred = cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (err) {
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/\\n/g, '\n'));
        } catch (innerErr) {
          console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not a valid JSON string.");
          return null;
        }
      }
      console.log("Service account project_id from env:", serviceAccount.project_id);
      adminCred = cert(serviceAccount);
    } else {
      adminCred = applicationDefault();
    }
    adminApp = initAdminApp({
      credential: adminCred,
    });
    console.log("Firebase Admin initialized successfully");
    return adminApp;
  } catch (error: any) {
    console.error("Firebase Admin initialization failed:", error.message);
    return null;
  }
}

function getAdminFirestoreInstance() {
  const app = getAdminApp();
  if (!app) return null;
  return getAdminFirestore(app, "ai-studio-a9ba2121-a2c8-437a-9558-29699c445cf9");
}

let _razorpayInstance: any = null;
function getRazorpayInstance() {
  if (!_razorpayInstance) {
    _razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }
  return _razorpayInstance;
}

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));

  app.use(cors({
    origin: [
      "https://qrypt-note.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true
  }));

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api/', apiLimiter);

  // API Routes

  // Background cleanup job for expired messages (runs every hour)
  setInterval(async () => {
    try {
      if (!firestore) return;
      const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
      
      const messagesRef = collection(firestore, 'messages');
      const now = Date.now();
      const expiredQuery = query(messagesRef, where('expiryTimestamp', '<', now), where('expiryTimestamp', '!=', null));
      
      const snapshot = await getDocs(expiredQuery);
      if (snapshot.empty) return;
      
      const batch = writeBatch(firestore);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired messages.`);
    } catch (error) {
      console.error("Failed to run cleanup job:", error);
    }
  }, 60 * 60 * 1000);

  app.post('/api/messages', async (req, res) => {
    try {
      if (!firestore) throw new Error("Database not initialized");
      const { message, expiryHours, viewLimit, password } = req.body;
      
      if (!message || message.length > 5000) {
        return res.status(400).json({ error: "Invalid message length" });
      }

      const id = crypto.randomBytes(4).toString('hex');
      const encryptedData = encrypt(message);

      let passwordHash = null;
      if (password) {
        passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      }

      const expiryTimestamp = expiryHours 
        ? Date.now() + (expiryHours * 60 * 60 * 1000)
        : null; // null for never

      const messageDoc = {
        id,
        encryptedMessage: encryptedData,
        expiryTimestamp,
        viewLimit: viewLimit || 1, // default 1
        viewCount: 0,
        passwordHash,
        createdAt: Date.now()
      };

      await setDoc(doc(firestore, 'messages', id), messageDoc);

      res.json({ id });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to create message" });
    }
  });

  app.get('/api/messages/:id/metadata', async (req, res) => {
    try {
      if (!firestore) throw new Error("Database not initialized");
      const { id } = req.params;
      const docRef = doc(firestore, 'messages', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Message not found or expired." });
      }

      const data = docSnap.data();

      // Check expiry
      if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
        return res.status(404).json({ error: "Message not found or expired." });
      }

      // Check view limit
      if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
        return res.status(404).json({ error: "Message has reached its view limit." });
      }

      res.json({
        id: data.id,
        isPasswordProtected: !!data.passwordHash,
        createdAt: data.createdAt,
        viewLimit: data.viewLimit,
        viewCount: data.viewCount
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to fetch message metadata" });
    }
  });

  app.post('/api/messages/:id/view', async (req, res) => {
    try {
      if (!firestore) throw new Error("Database not initialized");
      const { id } = req.params;
      const { password } = req.body;
      
      const docRef = doc(firestore, 'messages', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Message not found or expired." });
      }

      const data = docSnap.data();

      // Check password
      if (data.passwordHash) {
        if (!password) {
          return res.status(401).json({ error: "Password required." });
        }
        const providedHash = crypto.createHash('sha256').update(password).digest('hex');
        if (providedHash !== data.passwordHash) {
          return res.status(401).json({ error: "Incorrect password." });
        }
      }

      // Check expiry
      if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
        return res.status(404).json({ error: "Message not found or expired." });
      }

      // Check view limit
      if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
        return res.status(404).json({ error: "Message has reached its view limit." });
      }

      // Decrypt message
      let decrypted;
      try {
        decrypted = decrypt(data.encryptedMessage);
      } catch (e) {
        return res.status(500).json({ error: "Failed to decrypt message." });
      }

      // Increment view count
      const newViewCount = data.viewCount + 1;
      await updateDoc(docRef, { viewCount: newViewCount });

      res.json({ message: decrypted, readAt: Date.now() });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to view message" });
    }
  });

  app.get('/sitemap.xml', (req, res) => {
    try {
      const baseUrl = 'https://qrypt-note.vercel.app';
      const staticRoutes = [
        '/',
        '/create',
        '/pricing',
        '/privacy-policy',
        '/terms-of-service'
      ];
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      const date = new Date().toISOString().split('T')[0];
      
      staticRoutes.forEach(route => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${route}</loc>\n`;
        xml += `    <lastmod>${date}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
        xml += '  </url>\n';
      });
      
      xml += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (e) {
      console.error("Error generating sitemap:", e);
      res.status(500).end();
    }
  });

  
  
  
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const adminFirestore = getAdminFirestoreInstance();
      if (!adminFirestore) throw new Error("Admin Database not initialized");
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });

      const userRef = adminFirestore.collection('users').doc(userId);
      const userSnap = await userRef.get();
      let customerId = '';
      
      if (userSnap.exists) {
        const data = userSnap.data();
        customerId = data.razorpayCustomerId || '';
      }
      
      if (!customerId) {
        const customer = await getRazorpayInstance().customers.create({
          notes: { userId }
        });
        customerId = customer.id;
      }
      
      const subscription = await getRazorpayInstance().subscriptions.create({
        plan_id: process.env.RAZORPAY_PRO_PLAN_ID || 'plan_default',
        customer_id: customerId,
        total_count: 12,
        notes: { userId }
      });
      
      await userRef.set({
        razorpayCustomerId: customerId,
        razorpaySubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        updatedAt: Date.now()
      }, { merge: true });

      res.json({ subscriptionId: subscription.id });
    } catch (error: any) {
      console.error('Create sub error:', error);
      res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
  });

  app.post('/api/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const adminFirestore = getAdminFirestoreInstance();
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error("Razorpay secret not configured");
      const signature = req.headers['x-razorpay-signature'] as string;
      
      const bodyString = req.body.toString('utf8');
      
      const expectedSignature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
      
      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
      
      const event = JSON.parse(bodyString);
      const subId = event.payload?.subscription?.entity?.id;
      let userId = event.payload?.subscription?.entity?.notes?.userId;
      
      if (!userId) {
         const usersSnap = await adminFirestore.collection('users').where('razorpaySubscriptionId', '==', subId).get();
         if (!usersSnap.empty) {
            userId = usersSnap.docs[0].id;
         }
      }

      if (userId && subId) {
        const userRef = adminFirestore.collection('users').doc(userId);
        
        switch (event.event) {
          case 'subscription.activated':
          case 'subscription.charged':
            await userRef.set({
              isPro: true,
              subscriptionStatus: 'active',
              proFeaturesUnlocked: {
                customExpiry: true,
                unlimitedViews: true,
                passwordProtection: true,
                customQrDesign: true
              },
              updatedAt: Date.now()
            }, { merge: true });
            break;
            
          case 'subscription.cancelled':
          case 'subscription.halted':
          case 'subscription.completed':
            await userRef.set({
              isPro: false,
              subscriptionStatus: event.event.split('.')[1],
              proFeaturesUnlocked: {
                customExpiry: false,
                unlimitedViews: false,
                passwordProtection: false,
                customQrDesign: false
              },
              updatedAt: Date.now()
            }, { merge: true });
            break;
        }
      }
      
      res.json({ status: 'ok' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/users/:userId/pro-status', async (req, res) => {
    try {
      const adminFirestore = getAdminFirestoreInstance();
      if (!adminFirestore) throw new Error("Admin Database not initialized");
      const { userId } = req.params;
      const userRef = adminFirestore.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return res.json({ isPro: false });
      }
      const data = userSnap.data();
      res.json({ isPro: !!data?.isPro, status: data?.subscriptionStatus, proFeatures: data?.proFeaturesUnlocked || {} });
    } catch (error: any) {
       console.error(error);
       res.status(500).json({ error: error.message });
    }
  });


  // Helper to inject meta tags for /msg/:id
  const injectMetaTags = async (url: string, template: string) => {
    if (!url.startsWith('/msg/')) return template;
    const match = url.match(/\/msg\/([^/?]+)/);
    if (!match || !firestore) return template;
    
    const id = match[1];
    let title = "QryptNote";
    let desc = "Secure, self-destructing encrypted messages with 3D UI.";
    
    try {
      const docRef = doc(firestore, 'messages', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
           title = "Message Expired - QryptNote";
           desc = "This message has expired and is no longer available.";
        } else if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
           title = "Message Destroyed - QryptNote";
           desc = "This message has reached its view limit and has been destroyed.";
        } else {
           title = "Secure Message - QryptNote";
           desc = "You have received a secure, self-destructing message.";
        }
      } else {
        title = "Message Not Found - QryptNote";
        desc = "The message you are looking for does not exist or has been destroyed.";
      }
      
      template = template.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
      template = template.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
      template = template.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${desc}" />`);
      template = template.replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${title}" />`);
      template = template.replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${desc}" />`);
      template = template.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${desc}" />`);
    } catch (e) {
      console.error("Error injecting meta tags:", e);
    }
    return template;
  };

  app.post('/api/create-message', async (req, res) => {
    try {
      const adminFirestore = getAdminFirestoreInstance();
      console.log("ENCRYPTION_KEY present:", !!process.env.ENCRYPTION_KEY);
      console.log("FIREBASE_SERVICE_ACCOUNT_JSON present:", !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

      const { id, encryptedMessage, expiryTimestamp, viewLimit, passwordHash, userId } = req.body;
      if (!id || !encryptedMessage) {
        return res.status(400).json({ error: 'Missing id or encryptedMessage' });
      }
      let isPro = false;
      if (userId && adminFirestore) {
        try {
          const userRef = adminFirestore.collection('users').doc(userId);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            isPro = userDoc.data().isPro === true;
          }
        } catch (err) {
          console.error("Error checking user status:", err);
        }
      }
      
      if (!isPro && req.body.paidFeatureUnlock && req.body.razorpayOrderId && req.body.razorpayPaymentId) {
        try {
          const order = await getRazorpayInstance().orders.fetch(req.body.razorpayOrderId);
          if (order.status === 'paid' && order.amount === 10000) {
            isPro = true; 
          }
        } catch(e) {
          console.error("Order fetch failed:", e);
        }
      }

      let finalExpiry = expiryTimestamp;
      let finalViewLimit = viewLimit || 1;
      let finalPasswordHash = passwordHash;
      if (!isPro) {
        const defaultExpiry = Date.now() + (24 * 60 * 60 * 1000);
        if (!finalExpiry || finalExpiry > defaultExpiry) {
          finalExpiry = defaultExpiry;
        }
        finalViewLimit = 1;
        finalPasswordHash = null;
      }
      const messageDoc: any = {
        id,
        encryptedMessage,
        expiryTimestamp: finalExpiry,
        viewLimit: finalViewLimit,
        viewCount: 0,
        passwordHash: finalPasswordHash,
        createdAt: Date.now()
      };
      
      if (req.body.paidFeatureUnlock) {
        messageDoc.paidFeatureUnlock = true;
        messageDoc.razorpayOrderId = req.body.razorpayOrderId;
        messageDoc.razorpayPaymentId = req.body.razorpayPaymentId;
      }

      if (adminFirestore) {
        await adminFirestore.collection('messages').doc(id).set(messageDoc);
      } else if (firestore) {
        await setDoc(doc(firestore, 'messages', id), messageDoc);
      } else {
        throw new Error("No Firestore instance available. Check FIREBASE_SERVICE_ACCOUNT_JSON or VITE_FIREBASE_API_KEY.");
      }
      res.json({ success: true, messageDoc });
    } catch (error: any) {
      console.error("create-message error:", error);
      return res.status(500).json({ error: "Failed to create message", details: error.message || error.toString() });
    }
  });
  app.post('/api/create-order', async (req, res) => {
    try {
      const options = {
        amount: 100 * 100, // 100 INR in paise
        currency: "INR",
        receipt: "receipt_order_" + Date.now(),
      };
      const order = await getRazorpayInstance().orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/verify-payment', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error("Razorpay secret not configured");

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // app.use(vite.middlewares) will handle SPA routing fallback
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await injectMetaTags(url, template);
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        if (url.startsWith('/msg/')) {
          let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
          template = await injectMetaTags(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          res.sendFile(path.join(distPath, 'index.html'));
        }
      } catch (e) {
        next(e);
      }
    });
  }

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createApp().then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
