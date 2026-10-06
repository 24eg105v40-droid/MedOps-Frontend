import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Plus, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { inventoryApi, medicineApi, batchApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function InventoryTransactions() {
  const { isManager } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [fefoPreview, setFefoPreview] = useState(null);

  // Dispense Form
  const [dispenseForm, setDispenseForm] = useState({
    medicineId: '',
    batchId: '', // if empty, auto-FEFO is applied
    quantity: 10,
    reason: 'Routine Ward Dispensation',
    referenceNumber: 'DISP-' + Math.floor(1000 + Math.random() * 9000),
  });

  // Adjust Form
  const [adjustForm, setAdjustForm] = useState({
    medicineId: '',
    batchId: '',
    newQuantity: 50,
    reason: 'Physical Audit Discrepancy Correction',
  });
  const [adjustBatches, setAdjustBatches] = useState([]);

  useEffect(() => {
    loadTransactions();
    loadMedicines();
  }, [selectedType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getTransactions({
        type: selectedType || undefined,
        size: 50,
      });
      setTransactions(res.data.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMedicines = async () => {
    try {
      const res = await medicineApi.getAllActive();
      setMedicines(res.data || []);
      if (res.data?.length > 0) {
        setDispenseForm((prev) => ({ ...prev, medicineId: res.data[0].id }));
        setAdjustForm((prev) => ({ ...prev, medicineId: res.data[0].id }));
        fetchBatchesForAdjust(res.data[0].id);
        fetchFefoPreview(res.data[0].id, 10);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFefoPreview = async (medId, qty) => {
    if (!medId) return;
    try {
      const res = await aiApi.getFefoRecommendation(medId, qty || 1);
      setFefoPreview(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBatchesForAdjust = async (medId) => {
    if (!medId) return;
    try {
      const res = await batchApi.getByMedicine(medId);
      setAdjustBatches(res.data || []);
      if (res.data?.length > 0) {
        setAdjustForm((prev) => ({ ...prev, batchId: res.data[0].id, newQuantity: res.data[0].currentQuantity }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispenseMedicineChange = (e) => {
    const medId = e.target.value;
    setDispenseForm({ ...dispenseForm, medicineId: medId, batchId: '' });
    fetchFefoPreview(medId, dispenseForm.quantity);
  };

  const handleDispenseQuantityChange = (e) => {
    const qty = parseInt(e.target.value) || 0;
    setDispenseForm({ ...dispenseForm, quantity: qty });
    fetchFefoPreview(dispenseForm.medicineId, qty);
  };

  const handleRecordDispense = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.recordUsage({
        medicineId: Number(dispenseForm.medicineId),
        batchId: dispenseForm.batchId ? Number(dispenseForm.batchId) : null,
        quantity: Number(dispenseForm.quantity),
        reason: dispenseForm.reason,
        referenceNumber: dispenseForm.referenceNumber,
      });
      setIsDispenseModalOpen(false);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error dispensing stock');
    }
  };

  const handleRecordAdjust = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.adjustStock({
        medicineId: Number(adjustForm.medicineId),
        batchId: Number(adjustForm.batchId),
        newQuantity: Number(adjustForm.newQuantity),
        reason: adjustForm.reason,
      });
      setIsAdjustModalOpen(false);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const filteredTxs = transactions.filter((t) =>
    t.medicineName?.toLowerCase().includes(search.toLowerCase()) ||
    t.reason?.toLowerCase().includes(search.toLowerCase()) ||
    t.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.batchNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 text-emerald-600" />
            <span>Stock Movements & Clinical Transactions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Audit-ready log of inward receipts, ward dispensations, adjustments, and returns with automated balance verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isManager && (
            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Audit Stock Adjustment</span>
            </button>
          )}

          <button
            onClick={() => setIsDispenseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Usage (FEFO Dispense)</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search medicine, batch, dispense ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500 w-full"
          >
            <option value="">All Movement Types</option>
            <option value="USAGE">Usage / Dispensation</option>
            <option value="INWARD">Inward Receipt</option>
            <option value="ADJUSTMENT">Audit Adjustment</option>
            <option value="RETURN">Return</option>
            <option value="DISPOSAL">Disposal</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Medicine SKU</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Clinical Reason & Ref</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading ledger transactions...
                  </td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((t) => {
                  const isUsage = t.transactionType === 'USAGE';
                  const isInward = t.transactionType === 'INWARD';
                  const isAdjust = t.transactionType === 'ADJUSTMENT';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {t.medicineName}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {t.batchNumber || 'Auto-FEFO'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isInward ? 'bg-emerald-100 text-emerald-800' :
                          isUsage ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isInward && <ArrowDownLeft className="w-3 h-3" />}
                          {isUsage && <ArrowUpRight className="w-3 h-3" />}
                          {t.transactionType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {isInward ? `+${t.quantity}` : isUsage ? `-${t.quantity}` : `${t.quantity}`}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{t.reason}</div>
                        {t.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {t.referenceNumber}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {t.performedBy}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {t.balanceAfter} units
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Usage (FEFO Dispense) Modal */}
      <Modal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        title="Record Medicine Usage (FEFO Dispense)"
        subtitle="MedOps automatically applies First-Expire, First-Out allocation to minimize wastage."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRecordDispense} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Select Medicine SKU</label>
            <select
              value={dispenseForm.medicineId}
              onChange={handleDispenseMedicineChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — Current Stock: {m.totalStock} {m.unit} (Min: {m.minStockLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Quantity to Dispense</label>
              <input
                type="number"
                required
                min="1"
                value={dispenseForm.quantity}
                onChange={handleDispenseQuantityChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Reference / Rx Number</label>
              <input
                type="text"
                required
                value={dispenseForm.referenceNumber}
                onChange={(e) => setDispenseForm({ ...dispenseForm, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Real-time FEFO Allocation Breakdown */}
          {fefoPreview && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  FEFO Batch Allocation Strategy:
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  fefoPreview.fullyFulfillable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {fefoPreview.fullyFulfillable ? 'Fully Available' : 'Shortage Warning'}
                </span>
              </div>

              <div className="space-y-1.5">
                {fefoPreview.allocations?.map((alloc) => (
                  <div key={alloc.batchId} className="flex items-center justify-between text-[11px] bg-white/90 p-2 rounded-xl border border-emerald-100">
                    <div className="text-slate-800">
                      <span className="font-mono font-bold">{alloc.batchNumber}</span> (Exp: {alloc.expiryDate}, {alloc.daysUntilExpiry}d left)
                    </div>
                    <div className="font-bold text-emerald-700">
                      Deduct {alloc.allocatedQuantity} units
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800 italic mt-1">{fefoPreview.guidance}</p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Department / Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. ICU Sepsis Protocol, Ward 4A Dispense"
              value={dispenseForm.reason}
              onChange={(e) => setDispenseForm({ ...dispenseForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDispenseModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/30"
            >
              Confirm & Dispense Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Physical Inventory Audit Adjustment"
        subtitle="Manually correct batch physical stock discrepancies following shift cycle count."
      >
        <form onSubmit={handleRecordAdjust} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Select Medicine SKU</label>
            <select
              value={adjustForm.medicineId}
              onChange={(e) => {
                const medId = e.target.value;
                setAdjustForm({ ...adjustForm, medicineId: medId });
                fetchBatchesForAdjust(medId);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Select Batch</label>
            <select
              value={adjustForm.batchId}
              onChange={(e) => {
                const bId = e.target.value;
                const b = adjustBatches.find(x => String(x.id) === bId);
                setAdjustForm({ ...adjustForm, batchId: bId, newQuantity: b ? b.currentQuantity : 0 });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {adjustBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  Lot: {b.batchNumber} (Current Count: {b.currentQuantity}, Exp: {b.expiryDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">New Verified Physical Count</label>
            <input
              type="number"
              required
              min="0"
              value={adjustForm.newQuantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Audit Justification</label>
            <input
              type="text"
              required
              placeholder="e.g. End of shift count correction, damaged vial breakage"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-700/30"
            >
              Record Audit Adjustment
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
