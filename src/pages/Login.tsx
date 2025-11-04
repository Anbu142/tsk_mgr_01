import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E2A5A] to-[#1A2847] animate-gradientShift px-4">
      <div className="w-full max-w-[420px] animate-fadeInUp">
        <div className="bg-white/10 backdrop-blur-xl border border-white/[0.18] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-12">
          <h1 className="text-[1.85rem] font-bold text-white mb-5">
            Welcome back — let's get things done.
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[0.95rem] font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-[0.85rem] py-[0.85rem] rounded-[10px] bg-white/[0.08] border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[0.95rem] font-medium text-white mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-[0.85rem] py-[0.85rem] rounded-[10px] bg-white/[0.08] border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-[#1E2A5A] font-bold py-4 rounded-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] mt-8"
            >
              Login
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-transparent border border-white/30 text-white font-medium py-4 rounded-[10px] transition-all duration-300 hover:bg-white/5 hover:border-white/40 mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
