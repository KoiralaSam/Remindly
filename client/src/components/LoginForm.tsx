import { useState, FormEvent } from 'react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    // Simulate form submission (no API call)
    setTimeout(() => {
      console.log('Login form data:', formData);
      setLoading(false);
      onSuccess?.();
    }, 500);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-1 text-slate-900 tracking-tight">
        Welcome Back
      </h2>
      <p className="text-sm text-indigo-600 mb-5">Sign in to your Remindly account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1.5 text-slate-900">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="you@example.com"
            disabled={loading}
            className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-md bg-white text-slate-900 placeholder:text-indigo-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1.5 text-slate-900">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Enter your password"
            disabled={loading}
            className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-md bg-white text-slate-900 placeholder:text-indigo-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-md text-xs border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-6 rounded-md text-sm font-medium bg-primary text-white hover:bg-[#7c3aed] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-indigo-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-primary underline underline-offset-2 hover:text-[#7c3aed] transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

