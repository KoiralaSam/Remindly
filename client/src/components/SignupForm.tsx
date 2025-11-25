import { useState, FormEvent } from 'react';

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

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
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

    // Simulate form submission (no API call)
    setTimeout(() => {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ...(formData.phone && { phone: formData.phone }),
      };
      console.log('Signup form data:', signupData);
      setLoading(false);
      onSuccess?.();
    }, 500);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-1 text-slate-900 tracking-tight">
        Create Account
      </h2>
      <p className="text-sm text-indigo-600 mb-5">Join Remindly to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium mb-1.5 text-slate-900">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="John Doe"
            disabled={loading}
            className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-md bg-white text-slate-900 placeholder:text-indigo-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5 text-slate-900">
            Email
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-phone" className="block text-sm font-medium mb-1.5 text-slate-900">
            Phone (Optional)
          </label>
          <input
            id="signup-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            disabled={loading}
            className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-md bg-white text-slate-900 placeholder:text-indigo-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5 text-slate-900">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="At least 6 characters"
            disabled={loading}
            className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-md bg-white text-slate-900 placeholder:text-indigo-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-1.5 text-slate-900">
            Confirm Password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
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
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-indigo-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-primary underline underline-offset-2 hover:text-[#7c3aed] transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

