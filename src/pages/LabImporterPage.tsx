import React, { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Layers,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { SimulationDevice } from '../types/scenario';
import {
  PktExtractionReport,
  ImportedDraftScenario,
} from '../types/importer';
import {
  InteractiveScenarioData,
} from '../types/simulation';
import { InteractiveScenarioPlayer } from '../components/InteractiveScenarioPlayer';

interface LabImporterPageProps {
  onBackToOverview: () => void;
  onPreviewScenario?: (data: InteractiveScenarioData) => void;
}

const DEFAULT_DEVICE_TEMPLATE: SimulationDevice = {
  name: 'New Host',
  type: 'PC',
  ipAddress: '192.168.0.50',
  subnetMask: '255.255.255.0',
  defaultGateway: '192.168.0.1',
  dnsServer: '192.168.0.10',
  role: 'Workstation / client endpoint',
};

export const LabImporterPage: React.FC<LabImporterPageProps> = ({
  onBackToOverview,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [report, setReport] = useState<PktExtractionReport | null>(null);

  // Active Draft
  const [draft, setDraft] = useState<ImportedDraftScenario>({
    id: 'draft-' + Date.now(),
    scenarioId: 'DNS-01',
    title: 'Imported Cisco Packet Tracer Experiment',
    category: 'Name Resolution (UDP 53)',
    teachingGoal: 'Observe network behavior under controlled fault injection.',
    verificationStatus: 'draft',
    devices: [
      {
        name: 'Client Laptop',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'Client opening web destination',
      },
      {
        name: 'HomeRouter-PT-AC',
        type: 'Router',
        ipAddress: '192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'Default Gateway',
      },
      {
        name: 'DNS Server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Authoritative resolver with A-record',
      },
      {
        name: 'Web Server',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Hosts web application',
      },
    ],
    connections: [
      'Client Laptop <-> HomeRouter-PT-AC',
      'DNS Server <-> HomeRouter-PT-AC',
      'Web Server <-> HomeRouter-PT-AC',
    ],
    baselineBehavior: {
      userAction: 'Open browser and visit domain name',
      expectedDnsQuery: 'Queries DNS server for domain name and receives IP',
      expectedBrowserOutput: 'Website renders successfully',
    },
    faultInjection: {
      faultType: 'Incorrect DNS address configured',
      configurationChange: 'Set laptop DNS resolver to 192.168.0.99',
      affectedComponent: 'Client OS DNS resolver',
    },
    failureBehavior: {
      userAction: 'Attempt to browse domain name',
      observedDnsResult: 'DNS query times out after 3 attempts',
      observedBrowserOutput: 'Browser halts with server not found error',
      observedPingResult: 'Direct IP ping to 192.168.0.20 succeeds 100%',
      contrastInsight: 'DNS failure breaks domain names while IP transport works.',
    },
    baselineEvents: [
      {
        step: 1,
        name: 'DNS Query (A Record)',
        fromNodeId: 'laptop',
        toNodeId: 'dns',
        pathNodeIds: ['laptop', 'router', 'dns'],
        protocol: 'DNS',
        port: 'UDP 53',
        summary: 'Query: domain -> resolver',
        payloadDetail: 'DNS A record request',
        outcome: 'success',
        simpleExplanation: 'Client sends DNS query to resolver.',
        technicalExplanation: 'UDP 53 lookup.',
      },
      {
        step: 2,
        name: 'TCP Handshake & HTTP 200 OK',
        fromNodeId: 'laptop',
        toNodeId: 'web',
        pathNodeIds: ['laptop', 'router', 'web'],
        protocol: 'HTTP',
        port: 'TCP 80',
        summary: 'TCP 3-way handshake and HTTP 200 OK',
        payloadDetail: 'HTTP response delivered',
        outcome: 'success',
        simpleExplanation: 'Web page loads cleanly.',
        technicalExplanation: 'HTTP transport succeeds.',
      },
    ],
    faultEvents: [
      {
        step: 1,
        name: 'DNS Query to 192.168.0.99',
        fromNodeId: 'laptop',
        toNodeId: 'router',
        pathNodeIds: ['laptop', 'router'],
        protocol: 'DNS',
        port: 'UDP 53',
        summary: 'Query sent to invalid resolver IP 192.168.0.99',
        payloadDetail: 'No route / no host',
        outcome: 'failure',
        simpleExplanation: 'Query sent to wrong IP address.',
        technicalExplanation: 'Unroutable / nonexistent host.',
      },
      {
        step: 2,
        name: 'DNS Timeout & Halted',
        fromNodeId: 'laptop',
        toNodeId: 'laptop',
        pathNodeIds: ['laptop'],
        protocol: 'DNS',
        summary: 'Query timeout. No TCP SYN packet generated.',
        payloadDetail: 'Execution halted before Transport layer',
        outcome: 'timeout',
        simpleExplanation: 'Browser cannot connect because IP is unknown.',
        technicalExplanation: 'L4 socket creation aborted.',
      },
    ],
    reproductionSteps: [
      'Open .pkt in Cisco Packet Tracer 8.x',
      'Verify baseline reachability',
      'Apply fault injection to client IP configuration',
      'Verify failure with nslookup and ping',
    ],
    evidenceNotes: ['Verified with Packet Tracer 8.x simulation mode.'],
    lastModified: Date.now(),
  });

  const [savedDrafts, setSavedDrafts] = useState<ImportedDraftScenario[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'topology' | 'scenario' | 'events' | 'preview'>('upload');
  const [editingDeviceIndex, setEditingDeviceIndex] = useState<number | null>(null);
  const [newConnection, setNewConnection] = useState<string>('');

  // Load drafts on mount
  useEffect(() => {
    fetch('/api/drafts')
      .then((res) => res.json())
      .then((data) => {
        if (data.drafts && Array.isArray(data.drafts)) {
          setSavedDrafts(data.drafts);
        }
      })
      .catch(() => {
        // Fallback to localStorage if server unavailable
        try {
          const local = localStorage.getItem('pkt_lab_drafts');
          if (local) setSavedDrafts(JSON.parse(local));
        } catch {}
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pkt') && !file.name.toLowerCase().endsWith('.pka')) {
        setUploadError('Invalid file type. Please upload a Cisco Packet Tracer (.pkt or .pka) file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);

          const res = await fetch('/api/pkt-parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: selectedFile.name,
              base64Data,
            }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `Upload failed with status ${res.status}`);
          }

          const rep: PktExtractionReport = await res.json();
          setReport(rep);

          // Update Draft with real extraction report
          setDraft((prev) => ({
            ...prev,
            rawPktFileName: rep.fileName,
            rawPktFileSize: rep.fileSize,
            rawPktSha256: rep.sha256,
            verificationStatus: rep.extractionSuccess ? 'topology_configured' : 'imported_needs_review',
            devices: rep.extractedDevices.length > 0 ? rep.extractedDevices : prev.devices,
            connections: rep.extractedConnections.length > 0 ? rep.extractedConnections : prev.connections,
            evidenceNotes: rep.notes,
          }));

          setActiveTab('topology');
        } catch (err: any) {
          setUploadError(err?.message || 'Error parsing Packet Tracer file.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err?.message || 'Failed to read file.');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        // Refresh drafts
        const getRes = await fetch('/api/drafts');
        const data = await getRes.json();
        if (data.drafts) setSavedDrafts(data.drafts);
      }
      // Also backup to localStorage
      localStorage.setItem('pkt_lab_drafts', JSON.stringify([...savedDrafts.filter((d) => d.id !== draft.id), draft]));
      alert('Scenario draft saved successfully!');
    } catch {
      alert('Draft saved locally in browser storage.');
    }
  };

  const handleAddDevice = () => {
    setDraft((prev) => ({
      ...prev,
      devices: [...prev.devices, { ...DEFAULT_DEVICE_TEMPLATE, name: `Node-${prev.devices.length + 1}` }],
    }));
    setEditingDeviceIndex(draft.devices.length);
  };

  const handleRemoveDevice = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      devices: prev.devices.filter((_, i) => i !== idx),
    }));
    if (editingDeviceIndex === idx) setEditingDeviceIndex(null);
  };

  const handleAddConnection = () => {
    if (!newConnection.trim()) return;
    setDraft((prev) => ({
      ...prev,
      connections: [...prev.connections, newConnection.trim()],
    }));
    setNewConnection('');
  };

  const handleRemoveConnection = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      connections: prev.connections.filter((_, i) => i !== idx),
    }));
  };

  // Convert draft into interactive simulation data for live preview
  const generatePreviewData = (): InteractiveScenarioData => {
    const nodes = draft.devices.map((d, idx) => {
      let x = 15;
      let y = 50;
      if (d.type === 'PC') {
        x = 12;
        y = 50;
      } else if (d.type === 'Router' || d.type === 'Switch') {
        x = 48;
        y = 50;
      } else if (d.type === 'Server') {
        x = 84;
        y = idx % 2 === 0 ? 25 : 75;
      }
      return {
        id: `node-${idx}`,
        name: d.name,
        type: d.type,
        ipAddress: d.ipAddress,
        subnetMask: d.subnetMask,
        defaultGateway: d.defaultGateway,
        dnsServer: d.dnsServer,
        role: d.role,
        x,
        y,
      };
    });

    const links = draft.connections.map((conn, idx) => {
      return {
        id: `link-${idx}`,
        sourceId: 'node-0',
        targetId: idx < nodes.length ? `node-${Math.min(idx + 1, nodes.length - 1)}` : 'node-1',
        label: conn,
        status: 'up' as const,
      };
    });

    return {
      scenarioId: draft.scenarioId,
      title: draft.title,
      userFacingSymptom: draft.teachingGoal,
      learningGoal: draft.teachingGoal,
      nodes,
      links,
      baselineEvents: draft.baselineEvents,
      faultEvents: draft.faultEvents,
      faultDescription: draft.faultInjection.configurationChange,
      baselineSummary: draft.baselineBehavior.expectedBrowserOutput,
      failureSummary: draft.failureBehavior.observedBrowserOutput,
      contrastInsight: draft.failureBehavior.contrastInsight,
      ciscoVerificationNotes: draft.evidenceNotes,
    };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 sm:py-12">
      {/* Header & Maintainer Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <button
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Application Overview
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-800">
            <Layers className="h-3.5 w-3.5" /> Project Maintainer Tool
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Cisco Packet Tracer Lab Importer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
            Import Cisco Packet Tracer (.pkt) lab files, extract or verify topology details, and generate
            browser-based interactive network simulations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-brand-800 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="h-4 w-4" /> Save Scenario Draft
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-3 text-xs sm:text-sm font-semibold">
          {[
            { id: 'upload', label: '1. File Upload & Extraction' },
            { id: 'topology', label: '2. Review & Edit Topology' },
            { id: 'scenario', label: '3. Scenario Metadata' },
            { id: 'events', label: '4. Simulation Events' },
            { id: 'preview', label: '5. Live Player Preview' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: Upload & Extraction */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">Upload Packet Tracer Lab File</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Select a Cisco Packet Tracer file (<code className="bg-slate-100 px-1 py-0.5 rounded">.pkt</code> or{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">.pka</code>). The server will inspect the file
              headers, verify the binary container structure, and attempt automated topology extraction.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-brand-500 transition-all bg-slate-50/50">
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <input
                type="file"
                id="pkt-upload-input"
                accept=".pkt,.pka"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="pkt-upload-input"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-brand-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Browse File...</span>
              </label>

              {selectedFile && (
                <div className="mt-4 p-3 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-left">
                  <div className="font-bold text-slate-900 truncate">{selectedFile.name}</div>
                  <div className="text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleUploadAndParse}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
              >
                {isUploading ? 'Inspecting & Parsing...' : 'Process Lab File'}
              </button>
            </div>
          </div>

          {/* Extraction Report Card */}
          {report && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                {report.extractionSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Info className="h-5 w-5 text-brand-600" />
                )}
                <span>Parser Inspection Summary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase">Format</span>
                  <span className="font-bold text-slate-800">{report.formatDescription}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase">File Size</span>
                  <span className="font-bold text-slate-800">{report.fileSize} bytes</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase">SHA-256</span>
                  <span className="font-bold text-slate-800 truncate block" title={report.sha256}>
                    {report.sha256.substring(0, 16)}...
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-slate-900">{report.message}</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {report.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('topology')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-semibold text-xs hover:bg-brand-800 cursor-pointer"
                >
                  Proceed to Topology Review →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Topology Review & Edit */}
      {activeTab === 'topology' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Detected & Configured Devices</h2>
                <p className="text-xs text-slate-500">
                  Inspect and edit extracted devices or add missing components.
                </p>
              </div>
              <button
                onClick={handleAddDevice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Device
              </button>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draft.devices.map((device, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white hover:border-brand-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{device.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {device.type}
                    </span>
                  </div>

                  <div className="font-mono text-xs space-y-1 text-slate-600">
                    <div>IP: <span className="text-slate-900 font-bold">{device.ipAddress}</span></div>
                    <div>Mask: {device.subnetMask}</div>
                    <div>Gateway: {device.defaultGateway}</div>
                    {device.dnsServer && <div>DNS: {device.dnsServer}</div>}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">{device.role}</p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingDeviceIndex(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-blue-50 cursor-pointer"
                      title="Edit Device"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveDevice(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      title="Remove Device"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Device Edit Modal / Drawer */}
            {editingDeviceIndex !== null && draft.devices[editingDeviceIndex] && (
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-brand-200 space-y-4">
                <div className="flex items-center justify-between font-bold text-sm text-brand-900">
                  <span>Edit Device: {draft.devices[editingDeviceIndex].name}</span>
                  <button
                    onClick={() => setEditingDeviceIndex(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Name</label>
                    <input
                      value={draft.devices[editingDeviceIndex].name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], name: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type</label>
                    <select
                      value={draft.devices[editingDeviceIndex].type}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], type: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                    >
                      <option value="PC">PC</option>
                      <option value="Router">Router</option>
                      <option value="Server">Server</option>
                      <option value="Switch">Switch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">IP Address</label>
                    <input
                      value={draft.devices[editingDeviceIndex].ipAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], ipAddress: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Subnet Mask</label>
                    <input
                      value={draft.devices[editingDeviceIndex].subnetMask}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], subnetMask: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gateway</label>
                    <input
                      value={draft.devices[editingDeviceIndex].defaultGateway}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], defaultGateway: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">DNS Server</label>
                    <input
                      value={draft.devices[editingDeviceIndex].dnsServer || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const copy = [...prev.devices];
                          copy[editingDeviceIndex] = { ...copy[editingDeviceIndex], dnsServer: val };
                          return { ...prev, devices: copy };
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cable Connections Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Interconnections & Cabling</h3>
              <div className="space-y-2">
                {draft.connections.map((conn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono"
                  >
                    <span>{conn}</span>
                    <button
                      onClick={() => handleRemoveConnection(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  value={newConnection}
                  onChange={(e) => setNewConnection(e.target.value)}
                  placeholder="e.g. Client Laptop <-> HomeRouter FastEthernet0/1"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <button
                  onClick={handleAddConnection}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 cursor-pointer"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Scenario Metadata */}
      {activeTab === 'scenario' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn">
          <h2 className="text-lg font-bold text-slate-900">Scenario Educational Metadata</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Scenario ID</label>
              <select
                value={draft.scenarioId}
                onChange={(e) => setDraft({ ...draft, scenarioId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-mono"
              >
                <option value="DNS-01">DNS-01: DNS Failure While Direct IP Works</option>
                <option value="SRV-04">SRV-04: Port Closed / Service Down</option>
                <option value="HTTP-05">HTTP-05: HTTP 500 Application Error</option>
                <option value="GW-02">GW-02: Missing Default Gateway</option>
                <option value="LAN-03">LAN-03: Cable Disconnected</option>
                <option value="DNS-06">DNS-06: Secondary DNS Fallback</option>
                <option value="IND-07">IND-07: WAN Link Outage</option>
                <option value="CUSTOM-DRAFT">CUSTOM-DRAFT: New Custom Experiment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Scenario Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Learning Goal</label>
              <textarea
                value={draft.teachingGoal}
                onChange={(e) => setDraft({ ...draft, teachingGoal: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fault Introduced</label>
              <input
                value={draft.faultInjection.faultType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    faultInjection: { ...draft.faultInjection, faultType: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Configuration Change</label>
              <input
                value={draft.faultInjection.configurationChange}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    faultInjection: { ...draft.faultInjection, configurationChange: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contrast Insight</label>
              <textarea
                value={draft.failureBehavior.contrastInsight}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    failureBehavior: { ...draft.failureBehavior, contrastInsight: e.target.value },
                  })
                }
                rows={2}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Simulation Events */}
      {activeTab === 'events' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Configured Simulation Events</h2>
            <div className="text-xs text-slate-500 font-mono">
              Baseline: {draft.baselineEvents.length} events | Fault: {draft.faultEvents.length} events
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-800">Baseline Event Sequence</h3>
            <div className="space-y-2">
              {draft.baselineEvents.map((ev, idx) => (
                <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Step {ev.step}: {ev.name}</span>
                    <span className="font-mono text-[10px] bg-emerald-200 px-2 py-0.5 rounded text-emerald-900 font-bold">
                      {ev.protocol}
                    </span>
                  </div>
                  <div className="text-slate-600">{ev.summary}</div>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-rose-800 pt-4">Fault Event Sequence</h3>
            <div className="space-y-2">
              {draft.faultEvents.map((ev, idx) => (
                <div key={idx} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Step {ev.step}: {ev.name}</span>
                    <span className="font-mono text-[10px] bg-rose-200 px-2 py-0.5 rounded text-rose-900 font-bold">
                      {ev.protocol}
                    </span>
                  </div>
                  <div className="text-slate-600">{ev.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Live Player Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-brand-50 border border-brand-200 p-4 text-xs text-brand-900 flex items-center justify-between">
            <span>
              <strong>Draft Simulation Preview:</strong> This interactive canvas is rendered dynamically
              from your confirmed topology and scenario event sequence.
            </span>
            <button
              onClick={handleSaveDraft}
              className="px-3 py-1.5 rounded-lg bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Save Draft
            </button>
          </div>

          <InteractiveScenarioPlayer
            scenarioData={generatePreviewData()}
            hasVerifiedPkt={Boolean(draft.rawPktFileName)}
            pktFileName={draft.rawPktFileName || 'Scenario 1. DNS Failure Cisco Simulation.pkt'}
          />
        </div>
      )}
    </div>
  );
};
