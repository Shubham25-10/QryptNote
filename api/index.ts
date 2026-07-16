import { createApp } from '../server';

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      cachedApp = await createApp();
    }
    return cachedApp(req, res);
  } catch (error: any) {
    console.error("Handler initialization error:", error);
    res.status(500).json({ error: "Handler initialization error", details: error.message, stack: error.stack });
  }
}
