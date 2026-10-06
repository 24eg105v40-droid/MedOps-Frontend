import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { batchApi, medicineApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Batches() {
  const { isManager } = useAuth();
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, EXPIRING_SOON, ACTIVE, EXPIRED
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const [formData, setFormData] = useState({
    medicineId: '',
    batchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    initialQuantity: 100,
    unitCost: 15.0,
    storageLocation: 'Main Dispensary - Rack A1',
  });

  useEffect(() => {
    loadBatches();
    loadMedicinesList();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll();
      // Sort strictly by FEFO (earliest expiry first)
      const sorted = (res.data || []).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      setBatches(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMedicinesList = async () => {
    try {
      const res = await medicineApi.getAllActive();
      setMedicines(res.data || []);
      if (res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, medicineId: res.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAutoExpire = async () => {
    try {
      const res = await batchApi.runAutoExpireCheck();
      setScanMessage(res.data || 'Scan completed.');
      loadBatches();
      setTimeout(() => setScanMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await batchApi.create({
        ...formData,
        currentQuantity: formData.initialQuantity,
      });
      setIsAddModalOpen(false);
      loadBatches();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating batch');
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch = b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.medicineName?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'EXPIRING_SOON') return b.daysUntilExpiry <= 60 && b.status === 'ACTIVE';
    if (filterType === 'EXPIRED') return b.daysUntilExpiry <= 0 || b.status === 'EXPIRED';
    if (filterType === 'ACTIVE') return b.status === 'ACTIVE' && b.currentQuantity > 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-emerald-600" />
            <span>Batch & FEFO Expiry Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Strict First-Expire, First-Out (FEFO) queue sequencing to reduce medicine wastage and ensure patient safety.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAutoExpire}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-2 transition"
            title="Scan database for expired batches"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Run Expiry Scan</span>
          </button>

          {isManager && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine Batch</span>
            </button>
          )}
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search batch number, medicine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'EXPIRING_SOON', 'ACTIVE', 'EXPIRED'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' && 'All Batches'}
              {type === 'EXPIRING_SOON' && '⚠️ Expiring < 60 Days'}
              {type === 'ACTIVE' && '✅ Active Stock'}
              {type === 'EXPIRED' && '⛔ Expired'}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">FEFO Rank</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Medicine SKU</th>
                <th className="py-3.5 px-4">Mfg / Expiry Date</th>
                <th className="py-3.5 px-4">Remaining Shelf Life</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Sorting batch queues by FEFO expiry...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No batches match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b, index) => {
                  const days = b.daysUntilExpiry;
                  const isCritical = days <= 30;
                  const isWarning = days <= 90 && days > 30;
                  const isExpired = days <= 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-black text-xs inline-flex items-center justify-center">
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.batchNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.medicineName}</div>
                        <div className="text-[11px] text-slate-400">{b.medicineCategory}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{b.expiryDate}</div>
                        <div className="text-[10px] text-slate-400">Mfg: {b.manufacturingDate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                            EXPIRED ({Math.abs(days)}d ago)
                          </span>
                        ) : isCritical ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            CRITICAL ({days} days left)
                          </span>
                        ) : isWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {days} days left
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {days} days left
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm">{b.currentQuantity}</span>
                        <span className="text-[11px] text-slate-400"> / {b.initialQuantity}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {b.storageLocation || 'Dispensary Bay'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'DEPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Medicine Batch"
        subtitle="Register new batch with lot number, manufacturing date, and strict expiry date."
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Select Medicine SKU</label>
            <select
              value={formData.medicineId}
              onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.category} • {m.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Batch / Lot Number</label>
              <input
                type="text"
                required
                placeholder="e.g. LOT-2026-X81"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Quantity Received</label>
              <input
                type="number"
                required
                min="1"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Manufacturing Date</label>
              <input
                type="date"
                required
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Expiration Date</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Batch Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Storage Physical Bin</label>
              <input
                type="text"
                placeholder="e.g. Cold Room Shelf 2, Cabinet 4A"
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/30"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
