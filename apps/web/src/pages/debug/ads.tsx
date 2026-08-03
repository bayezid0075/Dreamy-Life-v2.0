import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

const ADSENSE_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-9617633768223840';

interface CheckResult {
  label: string;
  status: 'ok' | 'error' | 'warn' | 'pending';
  detail: string;
}

export default function AdsDebugger() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [dnsResult, setDnsResult] = useState<string>('pending');
  const [running, setRunning] = useState(true);
  const adRef = useRef<HTMLModElement>(null);
  const [pushResult, setPushResult] = useState<string>('pending');

  useEffect(() => {
    const results: CheckResult[] = [];

    // 1. Publisher ID
    results.push({
      label: 'Publisher ID',
      status: 'ok',
      detail: ADSENSE_PUBLISHER_ID,
    });

    // 2. Script tag in DOM
    const scriptTag = document.querySelector(
      `script[src*="pagead2.googlesyndication.com"]`,
    );
    results.push({
      label: 'Script tag in DOM',
      status: scriptTag ? 'ok' : 'error',
      detail: scriptTag
        ? `Found: ${(scriptTag as HTMLScriptElement).src}`
        : 'No <script> tag for googlesyndication.com found in DOM',
    });

    // 3. Script loaded (check if it set the adsbygoogle array)
    results.push({
      label: 'window.adsbygoogle',
      status: typeof window !== 'undefined' && window.adsbygoogle ? 'ok' : 'error',
      detail:
        typeof window !== 'undefined' && window.adsbygoogle
          ? `Array exists with ${window.adsbygoogle.length} items`
          : 'window.adsbygoogle is undefined — script did not load',
    });

    // 4. adsbygoogle.push available
    const hasPush =
      typeof window !== 'undefined' &&
      typeof window.adsbygoogle?.push === 'function';
    results.push({
      label: 'adsbygoogle.push()',
      status: hasPush ? 'ok' : 'error',
      detail: hasPush ? 'push method available' : 'push method not available',
    });

    // 5. CrossOrigin attribute
    results.push({
      label: 'crossOrigin attribute',
      status: scriptTag?.getAttribute('crossorigin') ? 'ok' : 'warn',
      detail: scriptTag?.getAttribute('crossorigin')
        ? `crossorigin="${scriptTag.getAttribute('crossorigin')}"`
        : 'No crossorigin attribute — may cause CORS issues',
    });

    // 6. HTTPS check
    const isHttps = window.location.protocol === 'https:';
    results.push({
      label: 'Page served over HTTPS',
      status: isHttps ? 'ok' : 'error',
      detail: isHttps
        ? `Protocol: ${window.location.protocol}`
        : `Protocol: ${window.location.protocol} — Google AdSense requires HTTPS`,
    });

    // 7. CSP check
    const metaCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    results.push({
      label: 'Content-Security-Policy meta tag',
      status: metaCsp ? 'warn' : 'ok',
      detail: metaCsp
        ? `CSP found: ${metaCsp.getAttribute('content')} — may block ad scripts`
        : 'No CSP meta tag blocking scripts',
    });

    // 8. AdSenseBannerAd instances
    const adInstances = document.querySelectorAll('.adsbygoogle');
    results.push({
      label: 'Ad slots on page',
      status: adInstances.length > 0 ? 'ok' : 'warn',
      detail: `${adInstances.length} <ins class="adsbygoogle"> element(s) found`,
    });

    // 9. __adsenseLoadError flag
    results.push({
      label: 'Load error flag',
      status:
        typeof window !== 'undefined' && (window as any).__adsenseLoadError
          ? 'error'
          : 'ok',
      detail:
        typeof window !== 'undefined' && (window as any).__adsenseLoadError
          ? 'window.__adsenseLoadError = true — script onError fired'
          : 'No load error flag set',
    });

    // 10. Ad blocker detection (check if the script fetched but adsbygoogle is still undefined)
    const scriptLoaded = !!scriptTag;
    const adsbygoogleMissing =
      typeof window !== 'undefined' && !window.adsbygoogle;
    results.push({
      label: 'Ad blocker detection',
      status: scriptLoaded && adsbygoogleMissing ? 'error' : 'ok',
      detail:
        scriptLoaded && adsbygoogleMissing
          ? 'Script tag exists but window.adsbygoogle is undefined — likely blocked by ad blocker or CORS'
          : 'No ad blocker detected (or script hasn\'t finished loading yet)',
    });

    setChecks(results);
    setRunning(false);

    // DNS connectivity test
    testDns();
  }, []);

  const testDns = async () => {
    try {
      const start = performance.now();
      const res = await fetch(
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000',
        { mode: 'no-cors', cache: 'no-store' },
      );
      const elapsed = Math.round(performance.now() - start);
      setDnsResult(
        `DNS resolved — fetch completed in ${elapsed}ms (status: ${res.status || 'opaque'})`,
      );
    } catch (e: any) {
      setDnsResult(`DNS or fetch failed — ${e.message || e}`);
    }
  };

  const testPush = () => {
    if (!window.adsbygoogle) {
      setPushResult('Cannot test — window.adsbygoogle is undefined');
      return;
    }
    if (!adRef.current) {
      setPushResult('Cannot test — ad ref not mounted');
      return;
    }
    try {
      window.adsbygoogle.push({});
      setPushResult('push() succeeded — check if ad renders below');
    } catch (e: any) {
      setPushResult(`push() threw: ${e.message || e}`);
    }
  };

  const statusColor = (s: CheckResult['status']) => {
    if (s === 'ok') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (s === 'error') return 'text-red-700 bg-red-50 border-red-200';
    if (s === 'warn') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  const statusIcon = (s: CheckResult['status']) => {
    if (s === 'ok') return '✓';
    if (s === 'error') return '✗';
    if (s === 'warn') return '⚠';
    return '…';
  };

  return (
    <>
      <Head>
        <title>Ads Debugger — Dreamy Life</title>
      </Head>
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Google AdSense Debugger
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Diagnostic checks for ad loading on this page. Access at{' '}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">
              /debug/ads
            </code>
          </p>

          {/* Diagnostic Checks */}
          <div className="space-y-3 mb-8">
            {checks.map((c, i) => (
              <div
                key={i}
                className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${statusColor(c.status)}`}
              >
                <span className="text-lg font-bold mt-0.5 w-5 text-center">
                  {statusIcon(c.status)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.label}</div>
                  <div className="text-xs mt-0.5 opacity-80 break-all">
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DNS Test */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              DNS Connectivity Test
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Attempts to fetch the AdSense script to verify DNS resolution and
              network reachability.
            </p>
            <div
              className={`text-sm font-medium ${
                dnsResult.includes('resolved')
                  ? 'text-emerald-700'
                  : dnsResult.includes('failed')
                    ? 'text-red-700'
                    : 'text-slate-500'
              }`}
            >
              {dnsResult}
            </div>
          </div>

          {/* Test Push */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              Manual Push Test
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Manually call <code>window.adsbygoogle.push({})</code> and observe
              the ad slot below.
            </p>
            <button
              onClick={testPush}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Push
            </button>
            <div className="text-sm mt-3 text-slate-700">{pushResult}</div>

            {/* Test ad slot */}
            <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">
                Test ad slot (300x250):
              </p>
              <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', width: '300px', height: '250px' }}
                data-ad-client={ADSENSE_PUBLISHER_ID}
                data-ad-slot="3051399239"
                data-ad-format=""
              />
            </div>
          </div>

          {/* Raw Config */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Raw Configuration
            </h2>
            <pre className="text-xs bg-slate-100 rounded-lg p-4 overflow-auto text-slate-700">
              {JSON.stringify(
                {
                  publisherId: ADSENSE_PUBLISHER_ID,
                  envVar: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '(undefined)',
                  protocol: window.location?.protocol,
                  hostname: window.location?.hostname,
                  adsbygoogleExists: typeof window !== 'undefined' && !!window.adsbygoogle,
                  adsbygoogleLength: typeof window !== 'undefined' ? window.adsbygoogle?.length : 0,
                  adSlotsOnPage: typeof document !== 'undefined' ? document.querySelectorAll('.adsbygoogle').length : 0,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
