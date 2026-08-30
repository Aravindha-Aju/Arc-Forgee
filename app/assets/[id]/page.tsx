'use client';
import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Server, Database, CheckCircle, XCircle, Globe } from 'lucide-react';

interface SecurityContext {
  asset: any;
  business_context: any;
  events: any[];
  vulnerabilities: any[];
  controls: any[];
  dependencies: any[];
  intelligence: any[];
  evidence: any[];
}

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [context, setContext] = useState<SecurityContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/security-context/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setContext(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch context:", err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">Loading Security Context...</div>;
  if (!context) return <div className="text-red-500">Failed to load asset data.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Server className="w-6 h-6 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">{context.asset.name}</h1>
          {context.asset.internet_exposed && (
            <span className="flex items-center gap-1 text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-800">
              <Globe className="w-3 h-3" /> INTERNET-FACING
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm mt-3">
          <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded border border-gray-700">
            Type: <span className="text-white">{context.asset.type}</span>
          </span>
          <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded border border-gray-700">
            Environment: <span className="text-white capitalize">{context.asset.environment}</span>
          </span>
          {context.business_context && (
            <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded border border-purple-800">
              Criticality: <span className="font-bold">{context.business_context.criticality}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Intelligence & Context */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Intelligence Card */}
          {context.intelligence.length > 0 && (
            <div className="bg-surface border border-gray-800 rounded-lg p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">Security Intelligence</h2>
              </div>
              
              {context.intelligence.map((intel, idx) => (
                <div key={idx} className="mb-4 p-4 bg-background rounded border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-yellow-400 uppercase tracking-wide text-sm">
                      ⚠ {intel.classification.replace(/_/g, ' ')}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded font-mono ${
                      intel.validation_status === 'validated' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-orange-900/30 text-orange-400 border border-orange-800'
                    }`}>
                      {intel.validation_status === 'validated' ? 'AI VALIDATED' : 'FALLBACK'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">{intel.explanation}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                    <span>MITRE ATT&CK: <span className="text-blue-400 font-mono">{intel.mitre_technique}</span></span>
                    <span>Confidence: <span className="text-white">{(intel.confidence * 100).toFixed(0)}%</span></span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">SUPPORTING EVIDENCE:</p>
                    <div className="flex flex-wrap gap-2">
                      {intel.evidence.map((evId: string) => (
                        <span key={evId} className="text-xs bg-gray-800 text-blue-300 px-2 py-1 rounded border border-gray-700 font-mono cursor-pointer hover:bg-gray-700 transition">
                          {evId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vulnerabilities & Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Vulnerabilities ({context.vulnerabilities.length})
              </h3>
              <div className="space-y-2">
                {context.vulnerabilities.map((v: any) => (
                  <div key={v.id} className="text-xs p-3 bg-red-950/20 border border-red-900/50 rounded flex justify-between items-center">
                    <div>
                      <span className="font-bold text-red-300">{v.cve}</span>
                      <span className="text-gray-400 ml-2">({v.severity})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.patch_status === 'unpatched' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                      {v.patch_status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Security Controls
              </h3>
              <div className="space-y-2">
                {context.controls.map((c: any) => (
                  <div key={c.name} className="flex justify-between items-center text-sm p-2 hover:bg-gray-800/50 rounded transition">
                    <span className="text-gray-300">{c.name}</span>
                    {c.status === 'enabled' ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Disabled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Raw Evidence Inspector */}
        <div className="bg-surface border border-gray-800 rounded-lg p-4 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Raw Evidence Inspector</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Immutable source data backing the intelligence claims.</p>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {context.evidence.map((ev: any) => (
              <div key={ev.id} className="bg-background p-3 rounded border border-gray-800 text-xs font-mono">
                <div className="flex justify-between text-gray-500 mb-2 border-b border-gray-800 pb-1">
                  <span className="text-blue-400 font-bold">{ev.id}</span>
                  <span className="uppercase">{ev.source}</span>
                </div>
                <pre className="text-green-400/80 whitespace-pre-wrap break-all">
                  {JSON.stringify(ev.raw_event, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
