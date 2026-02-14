import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Link as LinkIcon, Power, Shield } from 'lucide-react';
import { deactivateMyLink, getMyLinks } from '../services/api';
import { clearAuthSession, getCurrentUser } from '../utils/auth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [counts, setCounts] = useState({ active: 0, expired: 0, deactivated: 0 });
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState('');
  const user = getCurrentUser();

  const fetchLinks = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMyLinks();
      if (response.success) {
        setLinks(response.data.links);
        setCounts(response.data.counts);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      if (err.response?.status === 401) {
        clearAuthSession();
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDeactivate = async (id) => {
    setDeactivatingId(id);
    setError('');
    try {
      await deactivateMyLink(id);
      await fetchLinks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate link');
    } finally {
      setDeactivatingId('');
    }
  };

  const grouped = useMemo(() => {
    return {
      active: links.filter((item) => item.status === 'active'),
      expired: links.filter((item) => item.status === 'expired'),
      deactivated: links.filter((item) => item.status === 'deactivated')
    };
  }, [links]);

  return (
    <div className="min-h-screen grid-background p-4">
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Dashboard</h1>
            <p className="text-vault-text-dim">Manage your active and expired links</p>
            <p className="text-vault-text-dim text-sm mt-1">
              {user ? `Signed in as ${user.name}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="cyber-button bg-vault-card text-vault-text border border-vault-border px-4 py-2 rounded-lg"
            >
              New Upload
            </button>
            <button
              onClick={() => {
                clearAuthSession();
                navigate('/auth');
              }}
              className="cyber-button bg-vault-card text-vault-text border border-vault-border px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-vault-bg border border-vault-border rounded-xl p-4">
            <div className="text-vault-text-dim text-sm mb-1">Active</div>
            <div className="text-2xl font-bold text-vault-accent">{counts.active}</div>
          </div>
          <div className="bg-vault-bg border border-vault-border rounded-xl p-4">
            <div className="text-vault-text-dim text-sm mb-1">Expired</div>
            <div className="text-2xl font-bold text-yellow-400">{counts.expired}</div>
          </div>
          <div className="bg-vault-bg border border-vault-border rounded-xl p-4">
            <div className="text-vault-text-dim text-sm mb-1">Deactivated</div>
            <div className="text-2xl font-bold text-red-400">{counts.deactivated}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-vault-bg border border-vault-border rounded-xl p-8 text-center text-vault-text-dim">
            Loading links...
          </div>
        ) : (
          <div className="space-y-6">
            <LinkGroup
              title="Active Links"
              links={grouped.active}
              onDeactivate={handleDeactivate}
              deactivatingId={deactivatingId}
              allowDeactivate
            />
            <LinkGroup title="Expired Links" links={grouped.expired} onDeactivate={handleDeactivate} />
            <LinkGroup title="Deactivated Links" links={grouped.deactivated} onDeactivate={handleDeactivate} />
          </div>
        )}
      </div>
    </div>
  );
};

const LinkGroup = ({ title, links, onDeactivate, deactivatingId, allowDeactivate = false }) => (
  <div className="bg-vault-bg border border-vault-border rounded-xl p-4">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {links.length === 0 ? (
      <p className="text-vault-text-dim text-sm">No links in this section.</p>
    ) : (
      <div className="space-y-3">
        {links.map((item) => (
          <div
            key={item.uniqueId}
            className="bg-vault-card border border-vault-border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 text-vault-text">
                <LinkIcon className="w-4 h-4 text-vault-accent" />
                <a href={item.shareLink} target="_blank" rel="noreferrer" className="hover:text-vault-accent">
                  {item.uniqueId}
                </a>
              </div>
              <div className="flex items-center gap-3 text-vault-text-dim text-sm mt-1">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {item.type === 'file' ? item.fileType || 'file' : 'text'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(item.expiresAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {item.status}
                </span>
              </div>
            </div>
            {allowDeactivate && (
              <button
                onClick={() => onDeactivate(item.uniqueId)}
                disabled={deactivatingId === item.uniqueId}
                className="cyber-button bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Power className="w-4 h-4" />
                {deactivatingId === item.uniqueId ? 'Deactivating...' : 'Deactivate'}
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default DashboardPage;
