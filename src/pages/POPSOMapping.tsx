import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AppShell } from '../layouts/AppShell';

const EVALUATION_CRITERIA = [
  'R1 - Problem Definition',
  'R1 - Literature Survey',
  'R2 - Architecture Design',
  'R2 - Partial Implementation',
  'R3 - Results & Analysis',
  'R3 - Report Writing',
  'Final - Demo & Presentation'
];

const PO_KEYS = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
const PSO_KEYS = ['PSO1', 'PSO2'];

// Helper to init defaults
const initMatrix = (keys: string[]) => {
  const matrix: Record<string, Record<string, number>> = {};
  EVALUATION_CRITERIA.forEach(crit => {
    matrix[crit] = {};
    keys.forEach(k => { matrix[crit][k] = 0; });
  });
  return matrix;
};

export default function POPSOMapping() {
  const { user, token } = useAuthStore();
  const [poMatrix, setPoMatrix] = useState(() => initMatrix(PO_KEYS));
  const [psoMatrix, setPsoMatrix] = useState(() => initMatrix(PSO_KEYS));
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const fetchMappings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.getMappings(token);
      // If empty, fall back to defaults (which are 0)
      if (res && res.poMatrix && Object.keys(res.poMatrix).length > 0) {
         setPoMatrix(prev => mergeMatrix(prev, res.poMatrix));
      }
      if (res && res.psoMatrix && Object.keys(res.psoMatrix).length > 0) {
         setPsoMatrix(prev => mergeMatrix(prev, res.psoMatrix));
      }
    } catch (error) {
      console.error('Failed to fetch mappings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMappings();
    else setLoading(false);
  }, [token]);

  const mergeMatrix = (base: any, updates: any) => {
    const newM = { ...base };
    for (const crit of Object.keys(updates)) {
      if (!newM[crit]) newM[crit] = {};
      for (const key of Object.keys(updates[crit])) {
        newM[crit][key] = updates[crit][key];
      }
    }
    return newM;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const cyclePO = async (crit: string, po: string) => {
    if (user?.role !== 'COORDINATOR' || !token) return;
    const current = poMatrix[crit][po] || 0;
    const next = (current + 1) % 4; // cycles 0, 1, 2, 3
    setPoMatrix({
      ...poMatrix,
      [crit]: { ...poMatrix[crit], [po]: next }
    });
    try {
      await api.saveMapping(token, { criterion_id: crit, mapping_type: 'PO', outcome_key: po, level: next });
      showToast('Saved');
    } catch (error) {
      console.error(error);
    }
  };

  const cyclePSO = async (crit: string, pso: string) => {
    if (user?.role !== 'COORDINATOR' || !token) return;
    const current = psoMatrix[crit][pso] || 0;
    const next = (current + 1) % 4;
    setPsoMatrix({
      ...psoMatrix,
      [crit]: { ...psoMatrix[crit], [pso]: next }
    });
    try {
      await api.saveMapping(token, { criterion_id: crit, mapping_type: 'PSO', outcome_key: pso, level: next });
      showToast('Saved');
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all mappings to defaults?')) return;
    if (!token) return;
    try {
      await api.resetMappings(token);
      setPoMatrix(initMatrix(PO_KEYS));
      setPsoMatrix(initMatrix(PSO_KEYS));
      showToast('Reset successful');
    } catch (error) {
      console.error(error);
    }
  };

  const getCellColor = (level: number) => {
    switch(level) {
      case 3: return 'bg-indigo-500/80 text-white border-indigo-400/50 font-bold';
      case 2: return 'bg-indigo-500/40 text-indigo-200 border-indigo-500/30 font-semibold';
      case 1: return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20';
      default: return 'bg-white/[0.03] text-white/20 border-white/[0.06] hover:bg-white/[0.06]';
    }
  };

  if (loading) {
    return (
      <AppShell currentPage="/coordinator/po-pso">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentPage="/coordinator/po-pso">
      <div className="space-y-6 relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 z-50">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Card */}
        <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">PO/PSO Mapping</h2>
            <p className="text-white/40 text-sm mt-1">Click cells to toggle correlation level. Changes auto-save.</p>
          </div>
          {user?.role === 'COORDINATOR' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl transition-all hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Program Outcomes (POs) Table */}
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white">Program Outcomes (POs)</h2>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.06]">
              <span className="text-xs text-white/40">Level:</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-white/20">0 – None</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-300">1 – Low</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/40 border border-indigo-500/30 text-indigo-200">2 – Medium</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/80 border border-indigo-400/50 text-white font-bold">3 – High</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-6 py-3 min-w-[200px] text-white/40 uppercase tracking-widest text-xs font-bold">Evaluation Criterion</th>
                    {PO_KEYS.map(po => (
                      <th key={po} className="px-3 py-3 text-center border-l border-white/[0.08] w-16 text-white/40 uppercase tracking-widest text-xs font-bold">{po}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_CRITERIA.map(crit => (
                    <tr key={crit} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-sm text-white">{crit}</td>
                      {PO_KEYS.map(po => (
                        <td key={po} className="p-1 border-l border-white/[0.04]">
                          <button
                            onClick={() => cyclePO(crit, po)}
                            disabled={user?.role !== 'COORDINATOR'}
                            className={`w-full h-10 rounded flex items-center justify-center transition-all border ${getCellColor(poMatrix[crit][po] || 0)} ${user?.role === 'COORDINATOR' ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                          >
                            {poMatrix[crit][po] || '-'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Program Specific Outcomes (PSOs) Table */}
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white">Program Specific Outcomes (PSOs)</h2>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.06]">
              <span className="text-xs text-white/40">Level:</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-white/20">0 – None</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-300">1 – Low</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/40 border border-indigo-500/30 text-indigo-200">2 – Medium</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/80 border border-indigo-400/50 text-white font-bold">3 – High</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-6 py-3 min-w-[200px] text-white/40 uppercase tracking-widest text-xs font-bold">Evaluation Criterion</th>
                    {PSO_KEYS.map(pso => (
                      <th key={pso} className="px-3 py-3 text-center border-l border-white/[0.08] w-24 text-white/40 uppercase tracking-widest text-xs font-bold">{pso}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_CRITERIA.map(crit => (
                    <tr key={crit} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-sm text-white">{crit}</td>
                      {PSO_KEYS.map(pso => (
                        <td key={pso} className="p-1 border-l border-white/[0.04]">
                          <button
                            onClick={() => cyclePSO(crit, pso)}
                            disabled={user?.role !== 'COORDINATOR'}
                            className={`w-full h-10 rounded flex items-center justify-center transition-all border ${getCellColor(psoMatrix[crit][pso] || 0)} ${user?.role === 'COORDINATOR' ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                          >
                            {psoMatrix[crit][pso] || '-'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
