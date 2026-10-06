import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Thermometer, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { medicineApi, batchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Medicines() {
  const { isManager } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedMedicineBatches, setSelectedMedicineBatches] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    unit: 'Boxes',
    manufacturer: '',
    description: '',
    storageRequirements: 'Controlled Room Temperature (15-25°C)',
    minStockLevel: 50,
    unitPrice: 20.0,
    prescriptionRequired: true,
  });

  useEffect(() => {
    loadMedicines();
    loadCategories();
  }, [search, selectedCategory]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await medicineApi.getMedicines({
        search: search || undefined,
        category: selectedCategory || undefined,
        size: 50,
      });
      setMedicines(res.data.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await medicineApi.getCategories();
      setCategories(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      genericName: '',
      category: categories[0] || 'Antibiotics',
      unit: 'Boxes',
      manufacturer: '',
      description: '',
      storageRequirements: 'Controlled Room Temperature (15-25°C)',
      minStockLevel: 50,
      unitPrice: 20.0,
      prescriptionRequired: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setSelectedMedicine(med);
    setFormData({
      name: med.name,
      genericName: med.genericName || '',
      category: med.category,
      unit: med.unit,
      manufacturer: med.manufacturer || '',
      description: med.description || '',
      storageRequirements: med.storageRequirements || '',
      minStockLevel: med.minStockLevel || 50,
      unitPrice: med.unitPrice || 0,
      prescriptionRequired: med.prescriptionRequired,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenBatches = async (med) => {
    setSelectedMedicine(med);
    setIsBatchModalOpen(true);
    try {
      const res = await batchApi.getByMedicine(med.id);
      setSelectedMedicineBatches(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      if (selectedMedicine && isEditModalOpen) {
        await medicineApi.update(selectedMedicine.id, formData);
        setIsEditModalOpen(false);
      } else {
        await medicineApi.create(formData);
        setIsAddModalOpen(false);
      }
      loadMedicines();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving medicine');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (window.confirm(`Are you sure you want to discontinue "${name}"?`)) {
      try {
        await medicineApi.delete(id);
        loadMedicines();
      } catch (err) {
        alert(err.response?.data?.message || 'Error discontinuing medicine');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Pill className="w-7 h-7 text-emerald-600" />
            <span>Medicine Inventory & Master Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain clinical specifications, unit packaging, storage requirements, and minimum buffer thresholds.
          </p>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine SKU</span>
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search medicine, generic, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500 w-full"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Medicine Details</th>
                <th className="py-3.5 px-4">Category & Unit</th>
                <th className="py-3.5 px-4">Storage Protocol</th>
                <th className="py-3.5 px-4">Stock vs Buffer</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Batches</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading medicines catalog...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => {
                  const isLow = med.totalStock <= med.minStockLevel;
                  const isOut = med.totalStock === 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{med.genericName || 'N/A'} • {med.manufacturer}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {med.category}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-1">{med.unit}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-xs truncate" title={med.storageRequirements}>
                          {med.storageRequirements?.toLowerCase().includes('cold') ? (
                            <Thermometer className="w-3.5 h-3.5 text-clinical-600 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{med.storageRequirements || 'Room Temp'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{med.totalStock}</span>
                          <span className="text-[11px] text-slate-400">/ Min {med.minStockLevel}</span>
                        </div>
                        <div className="mt-1">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">OUT OF STOCK</span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">LOW STOCK</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">HEALTHY</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${med.unitPrice ? med.unitPrice.toFixed(2) : '0.00'}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenBatches(med)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{med.activeBatchesCount} Batch(es)</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isManager && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(med)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="Edit Medicine"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med.id, med.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Discontinue Medicine"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? `Edit Medicine: ${selectedMedicine?.name}` : "Create New Medicine SKU"}
        subtitle="Specify medical formulation, packaging unit, and storage environmental controls."
      >
        <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Brand / Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Amoxicillin 500mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Generic / Active Molecule</label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin Trihydrate"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
              <input
                type="text"
                required
                placeholder="Antibiotics, Cardiology..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Packaging Unit</label>
              <input
                type="text"
                required
                placeholder="Vials, Strips, IV Bags"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="Pfizer, Sanofi, Baxter"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Min Safety Threshold (Buffer Units)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Storage Environmental Specification</label>
            <input
              type="text"
              placeholder="e.g. Strict Cold Chain: Refrigerated (2°C to 8°C)"
              value={formData.storageRequirements}
              onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Indications / Description</label>
            <textarea
              rows="2"
              placeholder="Therapeutic dosage, contraindications, clinical notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/30"
            >
              {isEditModalOpen ? 'Save Changes' : 'Create Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Breakdown Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Batches for ${selectedMedicine?.name}`}
        subtitle={`FEFO Sequence • Total Stock: ${selectedMedicine?.totalStock} ${selectedMedicine?.unit}`}
      >
        <div className="space-y-3">
          {selectedMedicineBatches.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">No active batches recorded for this medicine.</p>
          ) : (
            selectedMedicineBatches.map((batch, index) => {
              const days = batch.daysUntilExpiry;
              const isUrgent = days <= 60;

              return (
                <div key={batch.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Batch: {batch.batchNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Storage: {batch.storageLocation || 'Main Dispensary'} • Mfg: {batch.manufacturingDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-slate-900 text-xs">{batch.currentQuantity} {selectedMedicine?.unit}</div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Expires: {batch.expiryDate} ({days}d left)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

    </div>
  );
}
