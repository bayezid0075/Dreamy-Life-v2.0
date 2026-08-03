import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LogEntry {
  time: string;
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
}

export default function UploadDebugger() {
  const { accessToken } = useAuthStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const log = (type: LogEntry['type'], message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev, { time, type, message }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Environment checks
  useEffect(() => {
    log('info', '=== Upload Debugger Started ===');
    log('info', `API_URL: ${API_URL}`);
    log('info', `Protocol: ${window.location.protocol}`);
    log('info', `Hostname: ${window.location.hostname}`);

    // Auth check
    if (accessToken) {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          const exp = new Date(payload.exp * 1000);
          const now = new Date();
          if (exp > now) {
            log('success', `Auth token valid — expires ${exp.toLocaleString()}`);
          } else {
            log('error', `Auth token EXPIRED at ${exp.toLocaleString()}`);
          }
        } catch {
          log('warn', 'Auth token present but could not decode payload');
        }
      } else {
        log('warn', 'Auth token format is not a standard JWT');
      }
    } else {
      log('error', 'No auth token found — user may not be logged in');
    }

    // File input check
    log('info', `File input supported: ${typeof document !== 'undefined' ? 'yes' : 'no'}`);

    // FormData check
    log('info', `FormData available: ${typeof FormData !== 'undefined' ? 'yes' : 'no'}`);

    // Check for file input elements on page
    const fileInputs = document.querySelectorAll('input[type="file"]');
    log('info', `File inputs on page: ${fileInputs.length}`);

    // Check accept attribute support
    const testInput = document.createElement('input');
    testInput.type = 'file';
    testInput.accept = 'image/*';
    log('info', `accept attribute support: ${typeof testInput.accept === 'string' ? 'yes' : 'no'}`);

    // Check if running in WebView
    const isWebView =
      /WebView|wv|Android.*Chrome\/(?!.*Chrome\/\d)/i.test(navigator.userAgent);
    if (isWebView) {
      log('warn', 'Detected WebView environment — file upload may have limitations');
      log('info', `User-Agent: ${navigator.userAgent}`);
    } else {
      log('info', `User-Agent: ${navigator.userAgent}`);
    }
  }, [accessToken]);

  // File selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      log('warn', 'No file selected');
      return;
    }

    log('info', `File selected: ${file.name}`);
    log('info', `Type: ${file.type}`);
    log('info', `Size: ${(file.size / 1024).toFixed(1)} KB`);

    // Validate
    if (!file.type.startsWith('image/')) {
      log('error', `Invalid file type: ${file.type} — expected image/*`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      log('error', `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB — max 10 MB`);
      return;
    }

    log('success', 'File validation passed');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadResult(null);
  };

  // Test upload
  const testUpload = async () => {
    if (!selectedFile) {
      log('error', 'No file selected — pick a file first');
      return;
    }
    if (!accessToken) {
      log('error', 'No auth token — cannot upload without authentication');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    log('info', '--- Starting upload test ---');

    // Build FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    log('info', `POST ${API_URL}/media/upload`);
    log('info', `Content-Type: multipart/form-data (auto-set by fetch)`);
    log('info', `File in FormData: name=${selectedFile.name}, type=${selectedFile.type}, size=${selectedFile.size}`);

    const startTime = performance.now();

    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const elapsed = Math.round(performance.now() - startTime);
      log('info', `Response received in ${elapsed}ms`);
      log('info', `Status: ${res.status} ${res.statusText}`);

      // Log response headers
      const contentType = res.headers.get('content-type');
      log('info', `Content-Type: ${contentType || '(not set)'}`);

      const data = await res.json();
      setUploadResult(data);

      if (res.ok) {
        log('success', `Upload succeeded — URL: ${data.url || data.data?.url || '(no URL in response)'}`);
        log('info', `Full response: ${JSON.stringify(data, null, 2)}`);
      } else {
        log('error', `Upload failed — ${res.status}: ${data.message || data.error || JSON.stringify(data)}`);
      }
    } catch (e: any) {
      const elapsed = Math.round(performance.now() - startTime);
      log('error', `Network error after ${elapsed}ms: ${e.message || e}`);

      if (e.message?.includes('Failed to fetch')) {
        log('error', 'Failed to fetch — possible causes:');
        log('error', '  1. API server is down or unreachable');
        log('error', '  2. CORS blocking the request');
        log('error', '  3. Network connectivity issue');
        log('error', '  4. Mixed content (HTTP API from HTTPS page)');
      }
    } finally {
      setUploading(false);
    }
  };

  // Test connectivity only (no upload)
  const testConnectivity = async () => {
    log('info', `Testing connectivity to ${API_URL}...`);
    try {
      const start = performance.now();
      const res = await fetch(`${API_URL}/`, { method: 'HEAD' });
      const elapsed = Math.round(performance.now() - start);
      log('success', `API reachable — ${res.status} in ${elapsed}ms`);
    } catch (e: any) {
      log('error', `Cannot reach API: ${e.message}`);
    }
  };

  // Test CORS
  const testCors = async () => {
    log('info', `Testing CORS preflight to ${API_URL}/media/upload...`);
    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'OPTIONS',
        headers: {
          Origin: window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Authorization, Content-Type',
        },
      });
      const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
      if (allowOrigin) {
        log('success', `CORS OK — Access-Control-Allow-Origin: ${allowOrigin}`);
      } else {
        log('error', 'CORS issue — no Access-Control-Allow-Origin header in response');
      }
    } catch (e: any) {
      log('error', `CORS test failed: ${e.message}`);
    }
  };

  const statusColor = (type: LogEntry['type']) => {
    if (type === 'success') return 'text-emerald-600';
    if (type === 'error') return 'text-red-600';
    if (type === 'warn') return 'text-amber-600';
    return 'text-slate-600';
  };

  return (
    <>
      <Head>
        <title>Upload Debugger — Dreamy Life</title>
      </Head>
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Image Upload Debugger
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Diagnostic tool for image upload issues. Access at{' '}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">
              /debug/upload
            </code>
          </p>

          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Pick Image
              </button>
              <button
                onClick={testUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Test Upload'}
              </button>
              <button
                onClick={testConnectivity}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Test API Connectivity
              </button>
              <button
                onClick={testCors}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test CORS
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Selected File
              </h2>
              <div className="flex items-start gap-4">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                  />
                )}
                <div className="text-sm text-slate-700">
                  <div>
                    <strong>Name:</strong> {selectedFile.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedFile.type}
                  </div>
                  <div>
                    <strong>Size:</strong>{' '}
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Upload Response
              </h2>
              <pre className="text-xs bg-slate-100 rounded-lg p-4 overflow-auto text-slate-700 max-h-48">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
              {uploadResult.url && (
                <div className="mt-3">
                  <a
                    href={uploadResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open uploaded image ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Log Console */}
          <div className="bg-slate-900 rounded-xl p-5">
            <h2 className="text-sm font-bold text-white mb-3">Console Log</h2>
            <div className="max-h-96 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 && (
                <div className="text-slate-500">Waiting for actions...</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">{log.time}</span>
                  <span className={`shrink-0 ${statusColor(log.type)}`}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
