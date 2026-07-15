# QryptNote

Send Secrets, Not Screenshots. Turn any private message into a self-destructing QR code. Scan to read, then it vanishes forever. Secure, fast, and simple.

## Features
- **End-to-End Encryption**: Messages are encrypted at rest using AES-256 (GCM).
- **QR Code Generation**: Generate a unique shortlink QR code for every message.
- **Burn After Reading**: Configurable view limits, defaulting to 1 (one-time view).
- **Password Protection**: Pro users can add a password layer to encrypted messages.

## Tech Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- Database: Firebase Firestore
- Hosting Target: Vercel (Frontend), Render/Railway (Backend) or simply self-contained.

## Setup Instructions

### Local Development

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   ENCRYPTION_KEY="your_32_byte_hex_string_here"
   ```
   *Note: If no encryption key is provided, a random one will be generated for development, but messages won't persist securely across restarts.*

4. **Configure Firebase**:
   Add your Firebase service account credentials to `firebase-applet-config.json` at the root if you want the backend to connect to a real database.

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

## Deployment Instructions

Since this is a full-stack Express app serving Vite in production, it is most easily deployed as a single unit to a Node.js-friendly host like Render or Railway.

### Deploying to Render / Railway (Full Stack)
1. Push your repository to GitHub.
2. In Render/Railway, create a new Web Service and link your GitHub repository.
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start`
5. **Environment Variables**:
   - Add `NODE_ENV=production`
   - Add `ENCRYPTION_KEY="your_secure_32_byte_string"`
   - Provide Firebase credentials via environment variables or a configuration file.

### Deploying to Vercel (Split Stack)
If you prefer, you can split the frontend and backend:
1. **Frontend**: Deploy the Vite output on Vercel (`npm run build`). Change your frontend fetch calls from `/api/messages` to target your backend URL.
2. **Backend**: Host `server.ts` on Render/Railway. Set up standard CORS middleware in `server.ts` to allow requests from your Vercel domain.

## Tests
Run the API tests using vitest:
```bash
npm run test
```

## Razorpay Pro Subscription Setup

To set up the Razorpay subscription for the Pro tier ($3/month):
1. Log in to your Razorpay Dashboard.
2. Navigate to **Subscriptions > Plans**.
3. Create a new plan for $3 (or equivalent local currency) per month.
4. Copy the resulting Plan ID.
5. In your project, set the \`RAZORPAY_PRO_PLAN_ID\` environment variable to this Plan ID.
6. Retrieve your Razorpay API Key and Secret from **Settings > API Keys** in the Razorpay Dashboard.
7. Set \`RAZORPAY_KEY_ID\` and \`VITE_RAZORPAY_KEY_ID\` to your API Key.
8. Set \`RAZORPAY_KEY_SECRET\` to your API Secret.
9. Configure a Webhook in the Razorpay Dashboard pointing to \`https://<your-domain>/api/razorpay-webhook\`.
10. Select the following events for the webhook:
    - \`subscription.activated\`
    - \`subscription.charged\`
    - \`subscription.cancelled\`
    - \`subscription.completed\`
    - \`subscription.halted\`
11. Set the Webhook Secret to match your \`RAZORPAY_KEY_SECRET\`.
