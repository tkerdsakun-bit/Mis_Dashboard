import { useState } from 'react';
import { supabase } from './supabaseClient';
import type { User } from './supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Query user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', data.id.toString());
      localStorage.setItem('username', data.username);
      localStorage.setItem('loginTime', new Date().toISOString());

      setTimeout(() => {
        setIsLoading(false);
        onLogin(data as User);
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            IT Asset Management
          </h1>
          <p className="text-gray-600">ระบบจัดการทรัพย์สิน IT</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              👤 ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              🔑 รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl hover:scale-105'
            }`}
          >
            {isLoading ? '🔄 กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <p className="text-sm text-gray-700 text-center">
            <strong>ข้อมูลทดสอบ:</strong><br/>
            Username: <code className="bg-white px-2 py-1 rounded">admin</code><br/>
            Password: <code className="bg-white px-2 py-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
