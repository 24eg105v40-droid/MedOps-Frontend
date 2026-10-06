import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Truck, 
  Sparkles, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle,
  Calendar,
  ArrowRight,
  Calculator,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend 
} from 'recharts';
import { aiApi, medicineApi } from '../services/api';

export default function AiIntelligence() {
  const [activeTab, setActiveTab] = useState('EXPIRY_RISKS'); // EXPIRY_RISKS, STOCKOUT_RISKS, DEMAND_FORECAST, FEFO_TOOL, SUPPLIER_INTEL
  const [loading, setLoading] = useState(false);

  // Data states
  const [expiryRisks, setExpiryRisks] = useState([]);
  const [stockoutRisks, setStockoutRisks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [supplierInsights, setSupplierInsights] = useState([]);

  // FEFO Tool state
  const [fefoMedId, setFefoMedId] = useState('');
  const [fefoQuantity, setFefoQuantity] = useState(50);
  const [fefoResult, setFefoResult] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [expRes, stkRes, medRes, supRes] = await Promise.all([
        aiApi.getExpiryRisks(),
        aiApi.getStockoutRisks(),
        medicineApi.getAllActive(),
        aiApi.getSupplierInsights()
      ]);

      setExpiryRisks(expRes.data || []);
      setStockoutRisks(stkRes.data || []);
      setMedicines(medRes.data || []);
      setSupplierInsights(supRes.data || []);

      if (medRes.data?.length > 0) {
        setSelectedMedicineId(medRes.data[0].id);
        setFefoMedId(medRes.data[0].id);
        loadForecast(medRes.data[0].id);
        loadFefoSim(medRes.data[0].id, 50);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async (medId) => {
    if (!medId) return;
    try {
      const res = await aiApi.getDemandForecast(medId);
      setForecastData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFefoSim = async (medId, qty) => {
    if (!medId) return;
    try {
      const res = await aiApi.getFefoRecommendation(medId, qty);
      setFefoResult(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const totalPotentialLoss = expiryRisks.reduce((acc, curr) => acc + (curr.estimatedFinancialLoss || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              AI Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-600" />
            <span>Inventory Intelligence & Forecasts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Predictive risk forecasting, stockout runway calculations, demand regression, and supplier performance scorecards.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left md:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total At-Risk Inventory Value</span>
          <span className="text-lg font-bold text-slate-900">${totalPotentialLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'EXPIRY_RISKS', label: 'Expiry Risks', count: expiryRisks.length },
          { id: 'STOCKOUT_RISKS', label: 'Stockout Risks', count: stockoutRisks.length },
          { id: 'DEMAND_FORECAST', label: 'Demand Forecast' },
          { id: 'FEFO_TOOL', label: 'FEFO Dispatch' },
          { id: 'SUPPLIER_INTEL', label: 'Supplier Reliability', count: supplierInsights.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: AI EXPIRY RISKS */}
      {activeTab === 'EXPIRY_RISKS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              Identifies batches with high probability of expiration before clinical consumption based on 90-day velocity.
            </p>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              {expiryRisks.length} At-Risk Batches Identified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiryRisks.map((risk) => (
              <div
                key={risk.batchId}
                className={`p-5 rounded-3xl border transition hover:shadow-md ${
                  risk.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50/50 border-rose-200'
                    : risk.riskLevel === 'HIGH'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      risk.riskLevel === 'CRITICAL' ? 'bg-rose-600 text-white' :
                      risk.riskLevel === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {risk.riskLevel} EXPIRY RISK
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2">{risk.medicineName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Batch: {risk.batchNumber} • Category: {risk.category}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Financial Loss</span>
                    <span className="text-sm font-black text-rose-600">${risk.estimatedFinancialLoss?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-white/80 border border-slate-200/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Current Stock</span>
                    <span className="text-xs font-black text-slate-900">{risk.currentQuantity} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Days Until Expiry</span>
                    <span className="text-xs font-black text-rose-600">{risk.daysUntilExpiry} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Projected Unused</span>
                    <span className="text-xs font-black text-slate-900">{risk.projectedUnusedUnitsAtExpiry} units</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Explainable Diagnosis:
                    </span>
                    {risk.explanation}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold">
                    <span className="font-bold block mb-0.5 text-emerald-950">Recommended Action:</span>
                    {risk.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI STOCKOUT RISKS */}
      {activeTab === 'STOCKOUT_RISKS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              Identifies medicines whose consumption runway is shorter than the supplier lead time window.
            </p>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              {stockoutRisks.length} Shortage Alerts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockoutRisks.map((risk) => (
              <div
                key={risk.medicineId}
                className={`p-5 rounded-3xl border transition hover:shadow-md ${
                  risk.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      risk.riskLevel === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {risk.riskLevel} SHORTAGE WARNING
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2">{risk.medicineName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Category: {risk.category}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time SLA</span>
                    <span className="text-sm font-black text-slate-800">{risk.supplierLeadTimeDays} Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-white/80 border border-slate-200/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Current Total Stock</span>
                    <span className="text-xs font-black text-slate-900">{risk.currentStock} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Days of Supply Left</span>
                    <span className="text-xs font-black text-rose-600">{risk.daysOfSupplyRemaining} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Estimated Runout</span>
                    <span className="text-xs font-black text-slate-900">{risk.projectedStockoutDate}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Root Cause Analysis:
                    </span>
                    {risk.explanation}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-emerald-950">Procurement Advice:</span>
                      {risk.recommendedAction}
                    </div>
                    <span className="shrink-0 bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-sm">
                      Reorder: {risk.recommendedReorderQuantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND FORECASTER */}
      {activeTab === 'DEMAND_FORECAST' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Medicine to Forecast Demand
              </label>
              <select
                value={selectedMedicineId}
                onChange={(e) => {
                  setSelectedMedicineId(e.target.value);
                  loadForecast(e.target.value);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-emerald-500 w-full md:w-80"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>
            </div>

            {forecastData && (
              <div className="flex items-center gap-4 text-xs font-semibold w-full md:w-auto justify-end">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Monthly Consumption</span>
                  <span className="text-sm font-black text-slate-900">{forecastData.averageMonthlyUsage} units</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-right">
                  <span className="text-[10px] text-emerald-600 block uppercase">Growth Velocity</span>
                  <span className="text-sm font-black text-emerald-800">{forecastData.trendGrowthRatePercentage > 0 ? `+${forecastData.trendGrowthRatePercentage}%` : `${forecastData.trendGrowthRatePercentage}%`}</span>
                </div>
              </div>
            )}
          </div>

          {forecastData && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  4-Month Projected Demand vs Historical Usage: {forecastData.medicineName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated with linear regression slope and upper/lower 85-115% confidence interval boundaries.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.forecastPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="forecastedDemand" stroke="#10b981" strokeWidth={3} fill="url(#forecastArea)" name="Projected Demand" />
                    <Line type="monotone" dataKey="historicalUsage" stroke="#0ea5e9" strokeWidth={2.5} name="Historical Usage" />
                    <Line type="monotone" dataKey="upperConfidenceBound" stroke="#94a3b8" strokeDasharray="3 3" name="Upper Confidence (+15%)" />
                    <Line type="monotone" dataKey="lowerConfidenceBound" stroke="#cbd5e1" strokeDasharray="3 3" name="Lower Confidence (-15%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Seasonality & Demand Planning Insight:
                </div>
                <p className="text-slate-700">{forecastData.seasonalityInsight}. {forecastData.aiSummary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FEFO TOOL */}
      {activeTab === 'FEFO_TOOL' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Interactive FEFO Dispatch Simulator</h3>
              <p className="text-xs text-slate-500">Test how the FEFO algorithmic dispatcher sequences batch deductions for a target dispensation quantity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Medicine</label>
                <select
                  value={fefoMedId}
                  onChange={(e) => {
                    setFefoMedId(e.target.value);
                    loadFefoSim(e.target.value, fefoQuantity);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} (Stock: {m.totalStock} {m.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Requested Quantity to Dispense</label>
                <input
                  type="number"
                  min="1"
                  value={fefoQuantity}
                  onChange={(e) => {
                    const q = parseInt(e.target.value) || 1;
                    setFefoQuantity(q);
                    loadFefoSim(fefoMedId, q);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => loadFefoSim(fefoMedId, fefoQuantity)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Recalculate Batch Splits</span>
                </button>
              </div>
            </div>

            {fefoResult && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Total Available in Inventory: <span className="text-emerald-600">{fefoResult.totalAvailable} units</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    fefoResult.fullyFulfillable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {fefoResult.fullyFulfillable ? '✅ Fully Fulfillable' : '⚠️ Insufficient Stock'}
                  </span>
                </div>

                <div className="space-y-2">
                  {fefoResult.allocations?.map((alloc, idx) => (
                    <div key={alloc.batchId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">Batch: {alloc.batchNumber}</div>
                          <div className="text-[11px] text-slate-500">
                            Expires: {alloc.expiryDate} ({alloc.daysUntilExpiry}d left) • Available in Batch: {alloc.availableQuantity}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-emerald-700 text-sm">Deduct {alloc.allocatedQuantity} units</div>
                        <div className="text-[10px] text-slate-400">Remaining: {alloc.remainingAfterAllocation} units</div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-600 italic bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  {fefoResult.guidance}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SUPPLIER INTEL */}
      {activeTab === 'SUPPLIER_INTEL' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              Evaluates vendor fulfillment punctuality, lead-time variance, and risk grading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierInsights.map((s) => (
              <div key={s.supplierId} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      s.riskTier === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800' :
                      s.riskTier === 'RELIABLE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.riskTier} TIER
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{s.supplierName}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Reliability Score</span>
                    <span className="text-base font-black text-emerald-600">⭐ {s.reliabilityScore?.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">On-Time Rate</span>
                    <span className="font-black text-slate-900">{s.onTimeDeliveryRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Avg Turnaround</span>
                    <span className="font-black text-slate-900">{s.averageLeadTimeActual} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Total POs</span>
                    <span className="font-black text-slate-900">{s.totalOrders}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Procurement Assessment:
                  </span>
                  {s.aiEvaluation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
