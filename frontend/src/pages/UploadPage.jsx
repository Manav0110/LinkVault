import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Lock, Clock, Eye, Download, Shield } from 'lucide-react';
import { uploadContent } from '../services/api';
import { clearAuthSession, getCurrentUser } from '../utils/auth';

const UploadPage = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [uploadType, setUploadType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState('10');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimeView, setOneTimeView] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [uploadedExpiresAt, setUploadedExpiresAt] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();

      if (uploadType === 'text') {
        if (!textContent.trim()) {
          setError('Please enter some text');
          setLoading(false);
          return;
        }
        formData.append('text', textContent);
      } else {
        if (!file) {
          setError('Please select a file');
          setLoading(false);
          return;
        }
        formData.append('file', file);
      }

      formData.append('expiryMinutes', expiryMinutes);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (expiryTime) formData.append('expiryTime', expiryTime);
      if (password) formData.append('password', password);
      formData.append('oneTimeView', oneTimeView);
      if (maxViews) formData.append('maxViews', maxViews);

      const response = await uploadContent(formData);

      if (response.success) {
        setShareLink(response.data.shareLink);
        setUploadedExpiresAt(response.data.expiresAt);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    // Could add a toast notification here
  };

  const resetForm = () => {
    setShareLink('');
    setTextContent('');
    setFile(null);
    setPassword('');
    setOneTimeView(false);
    setMaxViews('');
    setExpiryMinutes('10');
    setExpiryDate('');
    setExpiryTime('');
    setUploadedExpiresAt('');
  };

  if (shareLink) {
    return (
      <div className="min-h-screen grid-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="gradient-border rounded-2xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-vault-accent/10 rounded-full mb-4">
                <Shield className="w-12 h-12 text-vault-accent" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Upload Successful!</h2>
              <p className="text-vault-text-dim">Your content has been securely stored</p>
            </div>

            <div className="bg-vault-bg rounded-xl p-6 mb-6">
              <label className="block text-sm text-vault-text-dim mb-2">Share this link:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-vault-card border border-vault-border rounded-lg px-4 py-3 text-vault-text font-mono text-sm focus:outline-none focus:border-vault-accent"
                />
                <button
                  onClick={copyToClipboard}
                  className="cyber-button bg-vault-accent hover:bg-vault-accent-dark text-vault-bg px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-vault-bg rounded-lg p-4">
                <div className="flex items-center gap-2 text-vault-text-dim mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Expires at</span>
                </div>
                <div className="text-vault-text font-semibold">
                  {uploadedExpiresAt ? new Date(uploadedExpiresAt).toLocaleString() : '10 minutes'}
                </div>
              </div>
              <div className="bg-vault-bg rounded-lg p-4">
                <div className="flex items-center gap-2 text-vault-text-dim mb-1">
                  {password ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  <span>Protection</span>
                </div>
                <div className="text-vault-text font-semibold">
                  {password ? 'Password Protected' : 'Link Only'}
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full cyber-button bg-vault-card hover:bg-vault-border text-vault-text py-3 rounded-lg font-semibold transition-all border border-vault-border"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="flex justify-end gap-2 mb-4">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="cyber-button bg-vault-card text-vault-text border border-vault-border px-3 py-2 rounded-lg text-sm"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  navigate('/auth');
                }}
                className="cyber-button bg-vault-card text-vault-text border border-vault-border px-3 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="cyber-button bg-vault-card text-vault-text border border-vault-border px-3 py-2 rounded-lg text-sm"
            >
              Login / Register
            </button>
          )}
        </div>
        <div className="text-center mb-8 fade-in">
          <h1 className="text-5xl font-display font-bold mb-3 bg-gradient-to-r from-vault-accent to-cyan-400 bg-clip-text text-transparent">
            LinkVault
          </h1>
          <p className="text-vault-text-dim text-lg">Secure, temporary file and text sharing</p>
        </div>

        <div className="gradient-border rounded-2xl p-8 fade-in" style={{animationDelay: '0.1s'}}>
          <form onSubmit={handleSubmit}>
            {/* Upload Type Selection */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setUploadType('text')}
                className={`flex-1 cyber-button flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  uploadType === 'text'
                    ? 'bg-vault-accent text-vault-bg'
                    : 'bg-vault-card text-vault-text border border-vault-border hover:border-vault-accent'
                }`}
              >
                <FileText className="w-5 h-5" />
                Text
              </button>
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`flex-1 cyber-button flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  uploadType === 'file'
                    ? 'bg-vault-accent text-vault-bg'
                    : 'bg-vault-card text-vault-text border border-vault-border hover:border-vault-accent'
                }`}
              >
                <Upload className="w-5 h-5" />
                File
              </button>
            </div>

            {/* Text Input */}
            {uploadType === 'text' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-vault-text">
                  Your Text
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your text here..."
                  rows={8}
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-vault-text placeholder-vault-text-dim focus:outline-none focus:border-vault-accent resize-none font-mono text-sm"
                />
              </div>
            )}

            {/* File Input */}
            {uploadType === 'file' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-vault-text">
                  Choose File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cyber-button flex items-center justify-center gap-3 w-full bg-vault-card border-2 border-dashed border-vault-border hover:border-vault-accent rounded-xl px-4 py-8 cursor-pointer transition-all"
                  >
                    <Upload className="w-6 h-6 text-vault-accent" />
                    <span className="text-vault-text">
                      {file ? file.name : 'Click to select file'}
                    </span>
                  </label>
                </div>
                {file && (
                  <p className="text-xs text-vault-text-dim mt-2">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            )}

            {/* Expiry Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-vault-text flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expiry (date/time or default minutes)
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
                />
                <input
                  type="time"
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(e.target.value)}
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
                />
                <input
                  type="number"
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(e.target.value)}
                  min="1"
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-vault-text focus:outline-none focus:border-vault-accent"
                  placeholder="Default: 10 minutes"
                />
              </div>
              <p className="text-xs text-vault-text-dim mt-2">
                If date/time is not selected, content expires in 10 minutes by default.
              </p>
            </div>

            {/* Optional Features */}
            <div className="bg-vault-bg rounded-xl p-6 mb-6 space-y-4">
              <h3 className="text-sm font-semibold text-vault-text mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Optional Security Features
              </h3>

              {/* Password Protection */}
              <div>
                <label className="block text-sm mb-2 text-vault-text-dim flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password Protection
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-4 py-2 text-vault-text placeholder-vault-text-dim focus:outline-none focus:border-vault-accent text-sm"
                />
              </div>

              {/* One-time View */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="oneTimeView"
                  checked={oneTimeView}
                  onChange={(e) => setOneTimeView(e.target.checked)}
                  className="w-4 h-4 accent-vault-accent"
                />
                <label htmlFor="oneTimeView" className="text-sm text-vault-text-dim flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  One-time view (self-destruct after viewing)
                </label>
              </div>

              {/* Max Views */}
              <div>
                <label className="block text-sm mb-2 text-vault-text-dim flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Maximum Views (optional)
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-4 py-2 text-vault-text placeholder-vault-text-dim focus:outline-none focus:border-vault-accent text-sm"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cyber-button w-full bg-vault-accent hover:bg-vault-accent-dark text-vault-bg py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-vault-accent/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-vault-bg border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </span>
              ) : (
                'Generate Secure Link'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-vault-text-dim text-sm fade-in" style={{animationDelay: '0.2s'}}>
          <p>All uploads are encrypted and automatically deleted after expiry</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
