import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Shield } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { setAuthSession } from '../utils/auth';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = mode === 'register' ? { name, email, password } : { email, password };
      const response = mode === 'register' ? await registerUser(payload) : await loginUser(payload);

      if (response.success) {
        setAuthSession(response.data);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="gradient-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-vault-accent/10 rounded-full mb-4">
              <Shield className="w-10 h-10 text-vault-accent" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Account Access</h1>
            <p className="text-vault-text-dim text-sm">
              Register to manage your links from one dashboard
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-vault-accent text-vault-bg'
                  : 'bg-vault-card text-vault-text border border-vault-border'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-vault-accent text-vault-bg'
                  : 'bg-vault-card text-vault-text border border-vault-border'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-vault-text-dim mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'register'}
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-vault-text-dim mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-vault-card border border-vault-border rounded-lg px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
              />
            </div>

            <div>
              <label className="text-sm text-vault-text-dim mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-vault-card border border-vault-border rounded-lg px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cyber-button w-full bg-vault-accent hover:bg-vault-accent-dark text-vault-bg py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Login'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-vault-text-dim hover:text-vault-text text-sm transition-colors"
          >
            ← Back to upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
