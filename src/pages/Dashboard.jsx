import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, 
  AlertTriangle, 
  Clock, 
  ShoppingCart, 
  ArrowUpRight, 
  CheckCircle,
  Bot
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardApi, aiApi, inventoryApi } from '../services/api';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, txRes] = await Promise.all([
        dashboardApi.getSummary(),
        inventoryApi.getTransactions({ size: 5 })
      ]);
      setData(summaryRes.data);
      setRecentTransactions(txRes.data?.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await aiApi.resolveAlert(id);
      setData((prev) => ({
        ...prev,
        recentAlerts: prev?.recentAlerts?.filter(a => a.id !== id) || [],
        activeAiAlertsCount: Math.max(0, (prev?.activeAiAlertsCount || 1) - 1)
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MedOps Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor medicines, stock, expiry, and purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/inventory"
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <span>Dispense Stock (FEFO)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/ai-intelligence"
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            AI Risk Hub
          </Link>
        </div>
      </div>

      {/* 2. Four Essential KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={data?.totalMedicines || 0}
          subtitle="Active cataloged medicines"
          icon={Pill}
          color="blue"
        />
        <StatCard
          title="Low Stock"
          value={data?.lowStockCount || 0}
          subtitle="Items below safety threshold"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Expiring Soon"
          value={data?.expiringSoonCount || 0}
          subtitle="Batches expiring within 60 days"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Pending Purchase Orders"
          value={data?.pendingPurchaseOrders || 0}
          subtitle="Orders awaiting delivery"
          icon={ShoppingCart}
          color="emerald"
        />
      </div>

      {/* 3. Simple Inventory Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Inventory Alerts</h2>
            <p className="text-xs text-slate-500">Active stockout warnings and medicine expiry risks</p>
          </div>
          <Link
            to="/ai-intelligence"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            View All in Risk Hub
          </Link>
        </div>

        {(!data?.recentAlerts || data.recentAlerts.length === 0) ? (
          <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-700">All inventory levels are healthy.</p>
            <p className="text-slate-400 mt-0.5">No critical stockout or near-expiry risks detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.recentAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {alert.alertType ? alert.alertType.replace('_', ' ') : 'ALERT'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{alert.medicineName || alert.title}</h3>
                  <p className="text-slate-600 mt-1 leading-normal">{alert.message}</p>

                  {alert.aiExplanation && (
                    <div className="mt-2.5 p-2 rounded-lg bg-white/90 border border-slate-200 text-slate-700 text-[11px]">
                      <strong className="text-slate-900 block mb-0.5">AI Analysis:</strong>
                      {alert.aiExplanation}
                    </div>
                  )}

                  {alert.recommendedAction && (
                    <div className="mt-2 text-slate-800 text-[11px]">
                      <strong>Recommended:</strong> {alert.recommendedAction}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-end gap-2">
                  <Link
                    to="/ai-intelligence"
                    className="px-3 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs transition"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Chart & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Stock Movement Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">7-Day Stock Movement</h2>
              <p className="text-xs text-slate-500">Inward received stock vs clinical usage</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Stock In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>Dispensed</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.stockMovementTrends || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="stockIn" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" name="Stock In" />
                <Area type="monotone" dataKey="stockOut" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" name="Dispensed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. AI Knowledge Assistant Entry Point Card (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RAG-powered
              </span>
            </div>

            <h2 className="text-sm font-bold text-slate-900">AI Knowledge Assistant</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ask questions about medicines, inventory, and hospital SOPs.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                • Real-time stockout & batch expiry checks
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                • Cold chain & narcotic compliance guidelines
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              to="/ai-assistant"
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center block transition"
            >
              Open AI Assistant
            </Link>
          </div>
        </div>

      </div>

      {/* 6. Recent Stock Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Stock Transactions</h2>
            <p className="text-xs text-slate-500">Latest recorded stock inward receipts and clinical usage</p>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            View All Transactions
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Medicine</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    No recent transactions recorded.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const isInward = tx.transactionType === 'INWARD';
                  const isUsage = tx.transactionType === 'USAGE';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {tx.medicineName}
                        {tx.batchNumber && tx.batchNumber !== 'N/A' && (
                          <span className="text-[10px] text-slate-400 font-mono ml-2">({tx.batchNumber})</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isInward ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isUsage ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isInward ? 'Received' : isUsage ? 'Dispensed' : tx.transactionType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {isInward ? `+${tx.quantity}` : isUsage ? `-${tx.quantity}` : tx.quantity}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                        {tx.reason || '—'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
