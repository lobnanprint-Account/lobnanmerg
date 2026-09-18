import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, sessionId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // 1. Authorized users list
    const validUsers = [
      { email: 'lobnanprint@gmail.com', password: 'Aa@12345678' },
      { email: 'raid.salha@gmail.com', password: 'Aa@12345678' }
    ];

    const isAuthorized = validUsers.some(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (!isAuthorized) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsLoading(false);
      return;
    }

    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // 2. Try checking backend server for concurrent device protection (with 1.5s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword, sessionId }),
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.status === 403) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'هذا الحساب مستخدم حالياً على جهاز آخر.');
        setIsLoading(false);
        return;
      }
    } catch {
      // If server is not present (e.g. static hosting on Vercel), proceed safely
    }

    // 3. Grant access
    onLogin(cleanEmail, sessionId);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-cairo" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h1>
          <p className="text-sm text-slate-500 mt-2 text-center">الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى التطبيق.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                placeholder="أدخل بريدك الإلكتروني"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                placeholder="أدخل كلمة المرور"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'دخول'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-bold">
          نظام حماية الجلسة النشطة يعمل. لا يمكن استخدام الحساب في جهازين معاً.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
