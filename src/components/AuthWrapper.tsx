import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ email: string; sessionId: string } | null>(null);

  useEffect(() => {
    // Check heartbeat if authenticated
    if (!isAuthenticated || !sessionInfo) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionInfo),
        });
        const data = await res.json();
        
        if (!data.success) {
          // Heartbeat failed (e.g. logged in from another device)
          setIsAuthenticated(false);
          setSessionInfo(null);
          alert(data.error || 'تم إنهاء جلستك. ربما تم تسجيل الدخول من جهاز آخر.');
        }
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    }, 5000); // Heartbeat every 5 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionInfo]);

  // Clean up on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionInfo) {
        // Use keepalive to ensure the request is sent even when the tab is closing
        fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionInfo),
          keepalive: true
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionInfo]);

  const handleLogin = (email: string, sessionId: string) => {
    setSessionInfo({ email, sessionId });
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <>{children}</>;
};

export default AuthWrapper;
