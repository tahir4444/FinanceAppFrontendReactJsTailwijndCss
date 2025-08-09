import React, { useEffect, useMemo, useState } from 'react';
import { getAuditLogs } from '../services/audit.service';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { FiActivity, FiDownload, FiUsers, FiSettings, FiFileText, FiShield, FiSliders, FiSearch, FiTable, FiClock, FiList } from 'react-icons/fi';

dayjs.extend(utc);
dayjs.extend(timezone);

const AuditLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('all'); // all | 24h | 7d | 30d
  const [showMeta, setShowMeta] = useState(null); // the metadata to preview in modal
  const [viewMode, setViewMode] = useState('table'); // table | timeline
  const [density, setDensity] = useState('comfortable'); // comfortable | compact

  const load = async (p = 1, l = limit) => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ page: p, limit: l, action, userId });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const filteredLogs = useMemo(() => {
    let list = Array.isArray(logs) ? [...logs] : [];
    // client-side quick time range filter on current page
    if (range !== 'all') {
      const now = dayjs();
      let from;
      if (range === '24h') from = now.subtract(24, 'hour');
      if (range === '7d') from = now.subtract(7, 'day');
      if (range === '30d') from = now.subtract(30, 'day');
      if (from) {
        list = list.filter((log) => {
          const ts = dayjs(log.created_at || log.createdAt);
          return ts.isAfter(from);
        });
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((log) => {
        const actionStr = (log.action || '').toLowerCase();
        const userStr = String(log.user_id ?? '').toLowerCase();
        const resType = (log.resource_type || log.resourceType || '').toLowerCase();
        const resId = String(log.resource_id || log.resourceId || '').toLowerCase();
        const ip = (log.ip_address || log.ipAddress || '').toLowerCase();
        const ua = (log.user_agent || log.userAgent || '').toLowerCase();
        const meta = JSON.stringify(log.metadata || {}).toLowerCase();
        return (
          actionStr.includes(q) || userStr.includes(q) || resType.includes(q) ||
          resId.includes(q) || ip.includes(q) || ua.includes(q) || meta.includes(q)
        );
      });
    }
    return list;
  }, [logs, search, range]);

  const formatTs = (v) => {
    if (!v) return '-';
    return dayjs(v).tz('Asia/Kolkata').format('DD-MMM-YYYY HH:mm:ss');
  };

  const actionCategory = (a) => {
    if (!a) return { label: 'Other', color: 'bg-gray-100 text-gray-700' };
    if (a.startsWith('user_')) return { label: 'Users', color: 'bg-indigo-100 text-indigo-700' };
    if (a.startsWith('role_') || a === 'permissions_updated') return { label: 'Roles', color: 'bg-amber-100 text-amber-700' };
    if (a.startsWith('emi_')) return { label: 'Loans', color: 'bg-teal-100 text-teal-700' };
    if (a.startsWith('expense_')) return { label: 'Expenses', color: 'bg-rose-100 text-rose-700' };
    if (a.startsWith('support_')) return { label: 'Support', color: 'bg-fuchsia-100 text-fuchsia-700' };
    if (a.startsWith('app_')) return { label: 'App Update', color: 'bg-blue-100 text-blue-700' };
    if (a.includes('login')) return { label: 'Auth', color: 'bg-emerald-100 text-emerald-700' };
    return { label: 'Other', color: 'bg-gray-100 text-gray-700' };
  };

  const iconForAction = (a) => {
    if (!a) return FiActivity;
    if (a.startsWith('user_')) return FiUsers;
    if (a.startsWith('role_') || a === 'permissions_updated') return FiSettings;
    if (a.startsWith('emi_')) return FiCreditCard;
    if (a.startsWith('expense_')) return FiFileText;
    if (a.startsWith('support_')) return FiShield;
    if (a.startsWith('app_')) return FiDownload;
    if (a.includes('login')) return FiShield;
    return FiActivity;
  };

  const exportCSV = () => {
    const headers = ['time_ist','user_id','action','category','resource_type','resource_id','ip_address','user_agent','metadata'];
    const rows = filteredLogs.map((log) => {
      const cat = actionCategory(log.action).label;
      const row = [
        formatTs(log.created_at || log.createdAt),
        log.user_id ?? '',
        log.action ?? '',
        cat,
        log.resource_type || log.resourceType || '',
        log.resource_id || log.resourceId || '',
        log.ip_address || log.ipAddress || '',
        (log.user_agent || log.userAgent || '').replaceAll('\n',' '),
        JSON.stringify(log.metadata || {})
      ];
      return row.map((c) => `"${String(c).replaceAll('"','""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || (user.role || user?.Role?.name) !== 'superadmin') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Not authorized</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-6">
      {/* Hero Header */}
      <div className="rounded-none md:rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-5">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><FiActivity className="opacity-90" /> Audit Logs</h1>
              <p className="text-blue-100 text-sm">Search, analyze, and export your system-wide audit trail</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={()=>setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode==='table'?'bg-white text-blue-700':'text-white hover:bg-white/20'}`}><FiTable/> Table</button>
                <button onClick={()=>setViewMode('timeline')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode==='timeline'?'bg-white text-blue-700':'text-white hover:bg-white/20'}`}><FiClock/> Timeline</button>
              </div>
              <button onClick={exportCSV} className="px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm shadow-sm">Export CSV</button>
            </div>
          </div>
          {/* Filters Bar */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2">
              <FiSliders className="mr-2"/>
              <input className="bg-transparent placeholder-blue-100 text-white focus:outline-none text-sm flex-1" placeholder="Action (exact)" value={action} onChange={(e)=>setAction(e.target.value)} />
            </div>
            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2">
              <FiUsers className="mr-2"/>
              <input className="bg-transparent placeholder-blue-100 text-white focus:outline-none text-sm flex-1" placeholder="User ID" value={userId} onChange={(e)=>setUserId(e.target.value)} />
            </div>
            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2 lg:col-span-2">
              <FiSearch className="mr-2"/>
              <input className="bg-transparent placeholder-blue-100 text-white focus:outline-none text-sm flex-1" placeholder="Search resource, IP, UA, metadata" value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <select className="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" value={range} onChange={(e)=>setRange(e.target.value)}>
                <option className="text-gray-900" value="all">All time (page)</option>
                <option className="text-gray-900" value="24h">Last 24h</option>
                <option className="text-gray-900" value="7d">Last 7 days</option>
                <option className="text-gray-900" value="30d">Last 30 days</option>
              </select>
              <button onClick={()=>load(1)} className="px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm">Apply</button>
            </div>
          </div>
          {/* Category Chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              {key:'', label:'All'},
              {key:'user_', label:'Users'},
              {key:'role_', label:'Roles'},
              {key:'permissions_updated', label:'Permissions'},
              {key:'emi_', label:'Loans'},
              {key:'expense_', label:'Expenses'},
              {key:'support_', label:'Support'},
              {key:'app_', label:'App Update'},
              {key:'login', label:'Auth'}
            ].map((c)=>{
              const isActive = action && (c.key === action || (c.key.endsWith('_') && action.startsWith(c.key)) || (c.key==='login' && action.includes('login')));
              return (
                <button key={c.key}
                  onClick={()=>{ if (c.key==='') setAction(''); else if (c.key.endsWith('_')) setAction(c.key); else setAction(c.key); load(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${isActive? 'bg-white text-blue-700 border-white':'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                >{c.label}</button>
              );
            })}
          </div>
        </div>
        {/* Quick Stats */}
        <div className="bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {(() => {
              const groups = filteredLogs.reduce((acc, l) => { const k = actionCategory(l.action).label; acc[k]=(acc[k]||0)+1; return acc; }, {});
              const items = Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,4);
              const all = [
                {label:'Total', value: filteredLogs.length},
                ...items.map(([k,v])=>({label:k, value:v}))
              ];
              return all.map((it, idx)=>(
                <div key={idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">{it.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{it.value}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-white rounded-none md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiList/>
            <span>Showing {filteredLogs.length} of {total} (page {page} of {totalPages})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1 bg-white">
              <button onClick={()=>setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode==='table'?'bg-gray-900 text-white':'text-gray-700 hover:bg-gray-100'}`}><FiTable/> Table</button>
              <button onClick={()=>setViewMode('timeline')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode==='timeline'?'bg-gray-900 text-white':'text-gray-700 hover:bg-gray-100'}`}><FiClock/> Timeline</button>
            </div>
            <select className="border rounded px-2 py-1 text-sm" value={limit} onChange={(e)=>{const v=parseInt(e.target.value,10); setLimit(v); load(1, v);}}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <select className="border rounded px-2 py-1 text-sm" value={density} onChange={(e)=>setDensity(e.target.value)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className={`min-w-full ${density==='compact'?'text-xs':'text-sm'}`}>
              <thead className="bg-gray-50">
                <tr>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold`}>Time (IST)</th>
                   <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold`}>User</th>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold`}>Action</th>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold`}>Resource</th>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold hidden md:table-cell`}>IP</th>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold hidden lg:table-cell`}>User-Agent</th>
                  <th className={`${density==='compact'?'px-3 py-2':'px-4 py-3'} text-left text-gray-600 font-semibold`}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={`${density==='compact'?'px-3 py-4':'px-4 py-6'}`} colSpan={7}>Loading...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td className={`${density==='compact'?'px-3 py-4':'px-4 py-6'} text-gray-500`} colSpan={7}>No logs</td></tr>
                ) : filteredLogs.map((log) => {
                  const cat = actionCategory(log.action);
                  return (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'} whitespace-nowrap`}>{formatTs(log.created_at || log.createdAt)}</td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'}`}>{log.actor?.name || log.actor?.email || log.user_id || '-'}</td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${density==='compact'?'text-[10px]':'text-xs'} font-medium ${cat.color}`}>{cat.label}</span>
                          <span className="text-gray-900 font-medium">{log.action}</span>
                        </div>
                      </td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'}`}>{(log.resource_type || log.resourceType || '-')}/{log.resource_id || log.resourceId || '-'}</td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'} hidden md:table-cell`}>{log.ip_address || log.ipAddress || '-'}</td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'} truncate max-w-xs hidden lg:table-cell`} title={log.user_agent || log.userAgent}>{log.user_agent || log.userAgent}</td>
                      <td className={`${density==='compact'?'px-3 py-1.5':'px-4 py-2'}`}>
                        <button onClick={()=>setShowMeta(log.metadata || {})} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Timeline View
          <div className="p-4">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-gray-500">No logs</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"/>
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const cat = actionCategory(log.action);
                    const Icon = iconForAction(log.action);
                    return (
                      <div key={log.id} className="relative pl-12">
                        <div className="absolute left-2 top-2 w-4 h-4 rounded-full ring-4 ring-white" style={{backgroundColor: cat.color.includes('blue')?'#60a5fa':cat.color.includes('indigo')?'#818cf8':cat.color.includes('amber')?'#fbbf24':cat.color.includes('teal')?'#2dd4bf':cat.color.includes('rose')?'#fb7185':cat.color.includes('fuchsia')?'#e879f9':cat.color.includes('emerald')?'#34d399':'#9ca3af'}}></div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 border`}>
                                <Icon className="text-gray-600" />
                              </div>
                              <div>
                                <div className="text-gray-900 font-medium">{log.action}</div>
                                <div className="text-xs text-gray-500">{(log.resource_type || log.resourceType || '-')}/{log.resource_id || log.resourceId || '-'}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">{formatTs(log.created_at || log.createdAt)}</div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="text-xs text-gray-600"><span className="text-gray-400">User:</span> {log.user_id ?? '-'}</div>
                            <div className="text-xs text-gray-600 md:truncate"><span className="text-gray-400">IP:</span> {log.ip_address || log.ipAddress || '-'}</div>
                            <div className="text-xs text-gray-600 md:truncate" title={log.user_agent || log.userAgent}><span className="text-gray-400">UA:</span> {log.user_agent || log.userAgent}</div>
                          </div>
                          <div className="mt-2">
                            <button onClick={()=>setShowMeta(log.metadata || {})} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border">View Metadata</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Total: {total}</div>
          <div className="flex items-center gap-2">
            <button onClick={()=>load(Math.max(1, page-1))} disabled={page<=1} className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button onClick={()=>load(page+1)} disabled={page>=totalPages} className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
            <select className="border rounded px-2 py-1 text-sm" value={limit} onChange={(e)=>{const v=parseInt(e.target.value,10); setLimit(v); load(1, v);}}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metadata modal */}
      {showMeta !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setShowMeta(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Log Metadata</h3>
              <button className="text-gray-500 hover:text-gray-800" onClick={()=>setShowMeta(null)}>✕</button>
            </div>
            <div className="p-5">
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 border rounded p-3 overflow-auto max-h-[60vh]">{JSON.stringify(showMeta, null, 2)}</pre>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded border" onClick={()=>{
                navigator.clipboard?.writeText(JSON.stringify(showMeta, null, 2));
              }}>Copy</button>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={()=>setShowMeta(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;


