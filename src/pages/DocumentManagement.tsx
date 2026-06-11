import React, { useState, useEffect } from 'react';
import { AppShell } from '../layouts/AppShell';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import { 
  FolderOpen, 
  Download, 
  Upload, 
  FileText, 
  Copy, 
  ExternalLink, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Group {
  group_id: string;
  group_name: string;
}

interface UploadedFile {
  url: string;
  filename: string;
  uploadedAt: string;
}

export default function DocumentManagement() {
  const { token } = useAuthStore();
  
  // Groups for report generation
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Uploaded files list
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Toast
  const [toast, setToast] = useState('');

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const data = await api.getGroups(token!);
        setGroups(data);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (token) {
      fetchGroups();
    }
  }, [token]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      setUploadError('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();

      // Add to uploaded files list
      const newFile: UploadedFile = {
        url: data.url,
        filename: documentTitle || selectedFile.name,
        uploadedAt: new Date().toISOString(),
      };
      setUploadedFiles([newFile, ...uploadedFiles]);

      // Reset form
      setSelectedFile(null);
      setDocumentTitle('');
      showToast('File uploaded successfully!');

      // Clear file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!');
  };

  const downloadReport = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <AppShell currentPage="/coordinator/documents">
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 z-50 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Documents</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Document Management</h1>
            <p className="text-white/60">Upload, download and manage project documents</p>
          </div>
        </div>

        {/* SECTION A - Generate Reports */}
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" />
            Generate Reports
          </h2>

          <div className="space-y-4">
            {/* Group Selector */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Select Group
              </label>
              {loadingGroups ? (
                <div className="flex items-center gap-2 text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading groups...</span>
                </div>
              ) : (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/25 transition-all"
                >
                  <option value="" className="bg-slate-800">Select a group...</option>
                  {groups.map((group) => (
                    <option key={group.group_id} value={group.group_id} className="bg-slate-800">
                      {group.group_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => downloadReport(`${API_BASE}/reports/marksheet/${selectedGroupId}`)}
                disabled={!selectedGroupId}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Marksheet PDF
              </button>

              <button
                onClick={() => downloadReport(`${API_BASE}/reports/batch?year=2025`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" />
                Batch Report
              </button>

              <button
                onClick={() => downloadReport(`${API_BASE}/reports/compliance?year=2025`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" />
                Compliance Report
              </button>
            </div>
          </div>
        </div>

        {/* SECTION B - Upload Document */}
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5" />
            Upload Document
          </h2>

          <div className="space-y-4">
            {/* Document Title */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Document Title / Description <span className="text-white/40">(Optional)</span>
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g., Final Report Q1 2025"
                className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/25 transition-all"
              />
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Select File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.jpg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl focus:outline-none focus:border-white/25 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
              />
              <p className="text-xs text-white/40 mt-2">
                Accepted formats: PDF, DOCX, JPG, PNG • Max size: 5MB
              </p>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-300">{uploadError}</span>
              </div>
            )}

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <FileText className="w-5 h-5 text-white/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-white/40">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION C - Recent Uploads */}
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            Recent Uploads
          </h2>

          {uploadedFiles.length === 0 ? (
            /* Empty State */
            <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-12 text-center">
              <Upload className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No files uploaded yet</p>
              <p className="text-sm text-white/30 mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            /* Files List */
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all"
                >
                  <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{file.filename}</p>
                    <p className="text-xs text-white/40">
                      {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                      title="Copy link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>

                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                      title="Open file"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
