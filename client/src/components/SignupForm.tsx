import { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { apiConfig } from '../config/api';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface SignupResponse {
  token: string;
  id: string;
  name: string;
  email: string;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { setUser } = useUser();
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiConfig.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Dispatch user to context
      const userData: SignupResponse = data;
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
      <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
        Create Account
      </h2>
      <p className="text-xs text-slate-500 mb-6">Join Remindly to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="signup-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Full Name"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <input
            id="signup-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="Email"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <input
            id="signup-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone (Optional)"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <input
            id="signup-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Password"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm Password"
            disabled={loading}
            className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-2"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center mt-5 text-xs text-slate-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-pink-700 transition-all"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

