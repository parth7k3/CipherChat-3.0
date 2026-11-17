import React, { useState } from 'react';
import { Shield, Lock, Server, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/matrix/authService';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [homeserver, setHomeserver] = useState(import.meta.env.VITE_MATRIX_HOMESERVER_URL || 'http://localhost:8008');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await AuthService.login(homeserver, username, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials and homeserver URL.');
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
          <h1 className="text-xl font-bold tracking-tight text-white">CipherChat 3.0</h1>
          <p className="text-xs text-cipher-400">End-to-End Encrypted Communication</p>
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
            Matrix Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-cipher-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="alice or @alice:cipherchat.local"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
            Password
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-950/40"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating & Initializing E2EE...</span>
            </>
          ) : (
            <>
              <span>Sign In Securely</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-cipher-800 text-center text-xs text-cipher-400">
        Don't have an account on this homeserver?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};
