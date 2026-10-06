import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  Trash2,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { supplierApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Suppliers() {
  const { isManager } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    categoriesSupplied: 'Antibiotics, IV Fluids',
    averageLeadTimeDays: 7,
    reliabilityRating: 4.8,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.getAll();
      setSuppliers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: 'SUP-' + Math.floor(100 + Math.random() * 900),
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      categoriesSupplied: 'Antibiotics, IV Fluids',
      averageLeadTimeDays: 7,
      reliabilityRating: 4.8,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name,
      code: sup.code || '',
      contactPerson: sup.contactPerson || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      categoriesSupplied: sup.categoriesSupplied || '',
      averageLeadTimeDays: sup.averageLeadTimeDays || 7,
      reliabilityRating: sup.reliabilityRating || 4.8,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier && isEditModalOpen) {
        await supplierApi.update(selectedSupplier.id, formData);
        setIsEditModalOpen(false);
      } else {
        await supplierApi.create(formData);
        setIsAddModalOpen(false);
      }
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving supplier');
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (window.confirm(`Deactivate supplier "${name}"?`)) {
      try {
        await supplierApi.delete(id);
        loadSuppliers();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting supplier');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.categoriesSupplied?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-emerald-600" />
            <span>Supplier Directory & Vendor Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain certified pharmaceutical manufacturers, fulfillment turnaround SLAs, and reliability scorecards.
          </p>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Vendor</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vendor name, categories supplied..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Vendor Name & Code</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Categories Supplied</th>
                <th className="py-3.5 px-4">Average Lead Time</th>
                <th className="py-3.5 px-4">Reliability Score</th>
                <th className="py-3.5 px-4">Fulfillment Stats</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading vendor registry...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold">{s.contactPerson || 'Dispatch Team'}</div>
                      <div className="text-[10px] text-slate-400">{s.email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-700 truncate">{s.categoriesSupplied || 'General Supplies'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{s.averageLeadTimeDays} Days</span>
                      <span className="text-[10px] text-slate-400 block">Contracted SLA</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-black text-amber-600">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{s.reliabilityRating ? s.reliabilityRating.toFixed(1) : '5.0'} / 5.0</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-bold">{s.totalOrders || 0} Total Orders</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{s.onTimeOrders || 0} on-time ({s.delayedOrders || 0} delayed)</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isManager && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id, s.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? `Edit Supplier: ${selectedSupplier?.name}` : "Register Pharmaceutical Vendor"}
        subtitle="Manage logistics SLA, contact credentials, and product classifications."
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company / Vendor Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pfizer Hospital Logistics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Vendor Code</label>
              <input
                type="text"
                required
                placeholder="SUP-PFZ-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Key Account Manager</label>
              <input
                type="text"
                placeholder="Contact Person Name"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Dispatch Email</label>
              <input
                type="email"
                required
                placeholder="orders@vendor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Direct Phone</label>
              <input
                type="text"
                placeholder="+1 (800) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Contract Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.averageLeadTimeDays}
                onChange={(e) => setFormData({ ...formData, averageLeadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Quality & Reliability Score (0.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                required
                value={formData.reliabilityRating}
                onChange={(e) => setFormData({ ...formData, reliabilityRating: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Categories Supplied (Comma Separated)</label>
            <input
              type="text"
              placeholder="Antibiotics, Vaccines, Biologics, IV Fluids"
              value={formData.categoriesSupplied}
              onChange={(e) => setFormData({ ...formData, categoriesSupplied: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Logistics Hub Address</label>
            <input
              type="text"
              placeholder="Full address / dispatch depot"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              {isEditModalOpen ? 'Save Vendor' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
