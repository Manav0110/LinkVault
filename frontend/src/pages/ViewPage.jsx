import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Copy, Lock, AlertCircle, CheckCircle, Eye, Clock } from 'lucide-react';
import { getContent, downloadFile } from '../services/api';

const ViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async (pwd = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await getContent(id, pwd);
      
      if (response.success) {
        setContent(response.data);
        setRequiresPassword(false);
      }
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.requiresPassword) {
        setRequiresPassword(true);
        setError('');
      } else if (err.response?.status === 404) {
        setError('Content not found or has expired');
      } else if (err.response?.status === 410) {
        setError('This content has expired and is no longer available');
      } else if (err.response?.status === 403) {
        setError('Maximum view count reached');
      } else {
        setError(err.response?.data?.message || 'Failed to retrieve content');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      fetchContent(password);
    }
  };

  const handleCopy = () => {
    if (content?.textContent) {
      navigator.clipboard.writeText(content.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await downloadFile(id, password || null);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = content.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vault-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-vault-text-dim">Loading content...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen grid-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-vault-accent/10 rounded-full mb-4">
                <Lock className="w-12 h-12 text-vault-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Password Protected</h2>
              <p className="text-vault-text-dim">This content requires a password to view</p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-vault-text placeholder-vault-text-dim focus:outline-none focus:border-vault-accent mb-4"
              />
              
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="cyber-button w-full bg-vault-accent hover:bg-vault-accent-dark text-vault-bg py-3 rounded-xl font-semibold transition-all"
              >
                Unlock Content
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
  }

  if (error) {
    return (
      <div className="min-h-screen grid-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-border rounded-2xl p-8 text-center">
            <div className="inline-block p-4 bg-red-500/10 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Oops!</h2>
            <p className="text-vault-text-dim mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="cyber-button bg-vault-accent hover:bg-vault-accent-dark text-vault-bg px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Create New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="gradient-border rounded-2xl p-8 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold mb-1">
                {content.type === 'text' ? 'Text Content' : 'File Available'}
              </h2>
              <p className="text-vault-text-dim text-sm">Secure temporary content</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-vault-text-dim text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Expires in</span>
              </div>
              <div className="text-vault-accent font-bold">
                {formatTimeRemaining(content.expiresAt)}
              </div>
            </div>
          </div>

          {/* View Stats */}
          {(content.viewCount !== undefined || content.maxViews) && (
            <div className="bg-vault-bg rounded-xl p-4 mb-6 flex items-center gap-4">
              <Eye className="w-5 h-5 text-vault-accent" />
              <div className="flex-1">
                <div className="text-sm text-vault-text-dim mb-1">View Count</div>
                <div className="text-vault-text font-semibold">
                  {content.viewCount || 0}
                  {content.maxViews && ` / ${content.maxViews}`}
                </div>
              </div>
            </div>
          )}

          {/* Text Content */}
          {content.type === 'text' && (
            <div className="mb-6">
              <div className="bg-vault-card rounded-xl p-6 border border-vault-border">
                <pre className="text-vault-text font-mono text-sm whitespace-pre-wrap break-words">
                  {content.textContent}
                </pre>
              </div>
              <button
                onClick={handleCopy}
                className="cyber-button mt-4 w-full bg-vault-accent hover:bg-vault-accent-dark text-vault-bg py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          )}

          {/* File Content */}
          {content.type === 'file' && (
            <div className="mb-6">
              <div className="bg-vault-card rounded-xl p-6 border border-vault-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-vault-accent/10 rounded-lg">
                    <FileText className="w-8 h-8 text-vault-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="text-vault-text font-semibold mb-1">{content.fileName}</div>
                    <div className="text-vault-text-dim text-sm">{content.fileType}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="cyber-button mt-4 w-full bg-vault-accent hover:bg-vault-accent-dark text-vault-bg py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-vault-bg border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download File
                  </>
                )}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-vault-border pt-6">
            <button
              onClick={() => navigate('/')}
              className="text-vault-text-dim hover:text-vault-text text-sm transition-colors"
            >
              ← Create your own secure link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPage;