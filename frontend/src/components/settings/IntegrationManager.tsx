import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { integrationApi } from "../../services/api";

const INTEGRATION_PROVIDERS = [
  { id: "cloudinary", name: "Cloudinary", desc: "Image/file storage" },
  { id: "google-maps", name: "Google Maps", desc: "Maps, geocoding and route services" },
  { id: "smtp", name: "Email (SMTP)", desc: "Automated Email Dispatches" },
];

export default function IntegrationManager() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states for the currently edited integration
  const [formEnabled, setFormEnabled] = useState(false);
  const [formCreds, setFormCreds] = useState<any>({});
  
  const [actionStatus, setActionStatus] = useState<{ id: string; type: "success" | "error"; message: string } | null>(null);

  const loadIntegrations = async () => {
    try {
      const res = await integrationApi.getAll();
      if (res.success) {
        setIntegrations(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleEdit = (providerId: string) => {
    const existing = integrations.find(i => i.provider === providerId);
    setFormEnabled(existing ? existing.enabled : false);
    setFormCreds(existing?.credentials || {});
    setEditingId(providerId);
    setActionStatus(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormCreds({});
    setActionStatus(null);
  };

  const handleSave = async (providerId: string) => {
    setActionStatus(null);
    try {
      const res = await integrationApi.save(providerId, {
        enabled: formEnabled,
        credentials: formCreds
      });
      if (res.success) {
        setActionStatus({ id: providerId, type: "success", message: "Configuration saved successfully." });
        await loadIntegrations();
        setEditingId(null);
      }
    } catch (e: any) {
      setActionStatus({ id: providerId, type: "error", message: e.message || "Failed to save configuration." });
    }
  };

  const handleTest = async (providerId: string) => {
    setActionStatus(null);
    try {
      const res = await integrationApi.test(providerId);
      if (res.success) {
         setActionStatus({ id: providerId, type: "success", message: res.message });
      } else {
         setActionStatus({ id: providerId, type: "error", message: res.message });
      }
    } catch (e: any) {
      setActionStatus({ id: providerId, type: "error", message: e.message || "Test connection failed." });
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      {INTEGRATION_PROVIDERS.map(provider => {
        const config = integrations.find(i => i.provider === provider.id);
        const isConnected = !!config;
        const isEditing = editingId === provider.id;
        const status = isConnected ? (config.enabled ? "Connected" : "Disabled") : "Not Configured";
        const msg = actionStatus?.id === provider.id ? actionStatus : null;

        return (
          <div key={provider.id} className="border border-slate-200 rounded-2xl p-5 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{provider.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{provider.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                  status === "Connected" ? "bg-emerald-100 text-emerald-700" :
                  status === "Disabled" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  Status: {status}
                </span>
                {!isEditing && (
                  <button 
                    onClick={() => handleEdit(provider.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {isConnected ? "Edit" : "Configure"}
                  </button>
                )}
              </div>
            </div>

            {msg && !isEditing && (
              <div className={`mb-4 text-xs font-bold p-3 rounded-xl flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {msg.message}
              </div>
            )}

            {isEditing ? (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formEnabled} onChange={e => setFormEnabled(e.target.checked)} className="rounded" />
                  Enable Integration
                </label>
                
                {msg && (
                  <div className={`text-xs font-bold p-3 rounded-xl ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {msg.message}
                  </div>
                )}

                <div className="space-y-3">
                  {provider.id === 'cloudinary' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cloud Name</label>
                        <input type="text" value={formCreds.cloudName || ''} onChange={e => setFormCreds({...formCreds, cloudName: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="e.g. dxyz123" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">API Key</label>
                        <input type="password" value={formCreds.apiKey || ''} onChange={e => setFormCreds({...formCreds, apiKey: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="************" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">API Secret</label>
                        <input type="password" value={formCreds.apiSecret || ''} onChange={e => setFormCreds({...formCreds, apiSecret: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="************" />
                      </div>
                    </>
                  )}
                  {provider.id === 'google-maps' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Google Maps API Key</label>
                      <input type="password" value={formCreds.apiKey || ''} onChange={e => setFormCreds({...formCreds, apiKey: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="AIzaSyD************" />
                    </div>
                  )}
                  {provider.id === 'smtp' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SMTP Host</label>
                          <input type="text" value={formCreds.host || ''} onChange={e => setFormCreds({...formCreds, host: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="smtp.gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SMTP Port</label>
                          <input type="number" value={formCreds.port || ''} onChange={e => setFormCreds({...formCreds, port: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="587" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={formCreds.secure || false} onChange={e => setFormCreds({...formCreds, secure: e.target.checked})} className="rounded" />
                        Use Secure Connection (TLS)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username / Email</label>
                          <input type="text" value={formCreds.user || ''} onChange={e => setFormCreds({...formCreds, user: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="user@example.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                          <input type="password" value={formCreds.password || ''} onChange={e => setFormCreds({...formCreds, password: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono" placeholder="************" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button onClick={() => handleSave(provider.id)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                    Save Configuration
                  </button>
                  <button onClick={handleCancel} className="bg-white text-slate-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              isConnected && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleTest(provider.id)} className="text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                    Test Connection
                  </button>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
