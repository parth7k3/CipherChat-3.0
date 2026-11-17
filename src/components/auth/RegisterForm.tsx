import React, { useState } from 'react';
import { Shield, Lock, Server, User, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../../services/matrix/authService';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [homeserver, setHomeserver] = useState(import.meta.env.VITE_MATRIX_HOMESERVER_URL || 'http://localhost:8008');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password validation checks
  const checks = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const isPasswordValid =
    checks.length && checks.uppercase && checks.lowercase && checks.digit && checks.special && checks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password security requirements.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await AuthService.register(homeserver, username, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. The username may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-cipher-900 border border-cipher-800 rounded-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-cipher-800 rounded-lg border border-cipher-700">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-xs text-cipher-400">Generate New Cryptographic Identity</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
            Homeserver URL
          </label>
          <div className="relative">
            <Server className="absolute left-3 top-3 w-4 h-4 text-cipher-400" />
            <input
              type="url"
              required
              value={homeserver}
              onChange={(e) => setHomeserver(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="http://localhost:8008"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
            Desired Matrix Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-cipher-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full pl-9 pr-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="alice"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
            Master Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-cipher-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-cipher-400" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        {/* Security complexity checklist */}
        <div className="p-3 bg-cipher-950 border border-cipher-800 rounded-lg space-y-1 text-xs">
          <p className="font-semibold text-cipher-300 mb-1">Cryptographic Password Policy:</p>
          <div className="grid grid-cols-2 gap-1 text-cipher-400">
            <span className={`flex items-center gap-1 ${checks.length ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Min 10 chars
            </span>
            <span className={`flex items-center gap-1 ${checks.uppercase ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Uppercase (A-Z)
            </span>
            <span className={`flex items-center gap-1 ${checks.lowercase ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Lowercase (a-z)
            </span>
            <span className={`flex items-center gap-1 ${checks.digit ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Number (0-9)
            </span>
            <span className={`flex items-center gap-1 ${checks.special ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Symbol (!@#$)
            </span>
            <span className={`flex items-center gap-1 ${checks.match ? 'text-emerald-400 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Passwords match
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isPasswordValid}
          className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-950/40"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Identity & Keys...</span>
            </>
          ) : (
            <>
              <span>Create Identity & Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-cipher-800 text-center text-xs text-cipher-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
