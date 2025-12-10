import { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { apiConfig } from '../config/api';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  id: string;
  name: string;
  email: string;
}

export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { setUser } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiConfig.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Dispatch user to context
      const userData: LoginResponse = data;
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token: userData.token,
      });

      setLoading(false);
      onSuccess?.();
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
        Welcome Back
      </h2>
      <p className="text-xs text-slate-500 mb-6">Sign in to continue</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="Email"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <input
            id="login-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Password"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 text-red-600 px-4 py-3 rounded-xl text-xs border-2 border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center mt-5 text-xs text-slate-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

