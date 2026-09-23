import express from 'express';
import path from 'path';
import fs from 'fs';

// Hardcoded users
const USERS = [
  { email: 'lobnanprint@gmail.com', password: 'Aa@12345678' },
  { email: 'raid.salha@gmail.com', password: 'Aa@12345678' }
];

// In-memory store for active sessions: email -> { sessionId, lastSeen }
const activeSessions = new Map<string, { sessionId: string, lastSeen: number }>();

// Clean up dead sessions (no heartbeat for 15 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [email, session] of activeSessions.entries()) {
    if (now - session.lastSeen > 15000) {
      activeSessions.delete(email);
    }
  }
}, 5000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API Routes ---
  
  app.post('/api/login', (req, res) => {
    const { email, password, sessionId } = req.body;
    
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const currentSession = activeSessions.get(email);
    const now = Date.now();
    
    // Check if another device is currently using this email (and hasn't timed out)
    if (currentSession && currentSession.sessionId !== sessionId && (now - currentSession.lastSeen <= 15000)) {
      return res.status(403).json({ error: 'هذا الحساب مستخدم حالياً على جهاز آخر.' });
    }

    // Register or update the session
    activeSessions.set(email, { sessionId, lastSeen: now });
    res.json({ success: true, email });
  });

  app.post('/api/heartbeat', (req, res) => {
    const { email, sessionId } = req.body;
    const currentSession = activeSessions.get(email);
    
    if (currentSession && currentSession.sessionId === sessionId) {
      currentSession.lastSeen = Date.now();
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'تم تسجيل الدخول من جهاز آخر' });
    }
  });

  app.post('/api/logout', (req, res) => {
    const { email, sessionId } = req.body;
    const currentSession = activeSessions.get(email);
    
    if (currentSession && currentSession.sessionId === sessionId) {
      activeSessions.delete(email);
    }
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' ? __dirname : process.cwd());
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
