import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  PackageCheck, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  DollarSign
} from 'lucide-react';
import { purchaseOrderApi, supplierApi, medicineApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function PurchaseOrders() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create PO Form
  const [createForm, setCreateForm] = useState({
    supplierId: '',
    notes: '',
    expectedDeliveryDate: '',
    items: [
      { medicineId: '', quantityOrdered: 100, unitPrice: 20.0 }
    ]
  });

  // Receive PO Form
  const [receiveItems, setReceiveItems] = useState([]);
  const [receiveNotes, setReceiveNotes] = useState('');

  useEffect(() => {
    loadOrders();
    loadSuppliersAndMedicines();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await purchaseOrderApi.getAll();
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersAndMedicines = async () => {
    try {
      const [supRes, medRes] = await Promise.all([
        supplierApi.getAll(),
        medicineApi.getAllActive()
      ]);
      setSuppliers(supRes.data || []);
      setMedicines(medRes.data || []);
      if (supRes.data?.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          supplierId: supRes.data[0].id,
          expectedDeliveryDate: new Date(Date.now() + (supRes.data[0].averageLeadTimeDays || 7) * 86400000).toISOString().split('T')[0]
        }));
      }
      if (medRes.data?.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          items: [{ medicineId: medRes.data[0].id, quantityOrdered: 100, unitPrice: medRes.data[0].unitPrice || 20.0 }]
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItemRow = () => {
    if (medicines.length === 0) return;
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        { medicineId: medicines[0].id, quantityOrdered: 50, unitPrice: medicines[0].unitPrice || 15.0 }
      ]
    });
  };

  const handleRemoveItemRow = (idx) => {
    const updated = createForm.items.filter((_, i) => i !== idx);
    setCreateForm({ ...createForm, items: updated });
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...createForm.items];
    updated[idx][field] = value;
    if (field === 'medicineId') {
      const med = medicines.find(m => String(m.id) === String(value));
      if (med && med.unitPrice) {
        updated[idx].unitPrice = med.unitPrice;
      }
    }
    setCreateForm({ ...createForm, items: updated });
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      await purchaseOrderApi.create({
        supplierId: Number(createForm.supplierId),
        expectedDeliveryDate: createForm.expectedDeliveryDate,
        notes: createForm.notes,
        items: createForm.items.map(i => ({
          medicineId: Number(i.medicineId),
          quantityOrdered: Number(i.quantityOrdered),
          unitPrice: Number(i.unitPrice)
        }))
      });
      setIsCreateModalOpen(false);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating purchase order');
    }
  };

  const handleOpenReceive = (order) => {
    setSelectedOrder(order);
    const initialReceive = (order.items || []).map(item => ({
      itemId: item.id,
      medicineName: item.medicineName,
      medicineUnit: item.medicineUnit,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityOrdered - (item.quantityReceived || 0),
      batchNumber: 'LOT-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      storageLocation: 'Central Quarantine Bay A',
    }));
    setReceiveItems(initialReceive);
    setReceiveNotes('Full consignment verified against supplier invoice.');
    setIsReceiveModalOpen(true);
  };

  const handleReceivePoSubmit = async (e) => {
    e.preventDefault();
    try {
      await purchaseOrderApi.receive({
        purchaseOrderId: selectedOrder.id,
        notes: receiveNotes,
        items: receiveItems.map(i => ({
          itemId: i.itemId,
          quantityReceived: Number(i.quantityReceived),
          batchNumber: i.batchNumber,
          manufacturingDate: i.manufacturingDate,
          expiryDate: i.expiryDate,
          storageLocation: i.storageLocation
        }))
      });
      setIsReceiveModalOpen(false);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing PO receipt');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await purchaseOrderApi.updateStatus(orderId, status);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            <span>Procurement & Purchase Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Requisition medical supplies, track supplier lead-times, and receive verified batches directly into inventory.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search PO number, supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'DRAFT', 'ORDERED', 'RECEIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Order Date</th>
                <th className="py-3.5 px-4">Expected Delivery</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const isReceived = po.status === 'RECEIVED';
                  const isOrdered = po.status === 'ORDERED';
                  const isDraft = po.status === 'DRAFT';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {po.orderNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-400">Raised by: {po.createdBy || 'Manager'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {po.orderDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{po.expectedDeliveryDate}</div>
                        {po.actualDeliveryDate && (
                          <div className="text-[10px] text-emerald-600 font-medium">Recv: {po.actualDeliveryDate}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {po.items?.length || 0} Line Item(s)
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ${po.totalAmount ? po.totalAmount.toFixed(2) : '0.00'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isReceived ? 'bg-emerald-100 text-emerald-800' :
                          isOrdered ? 'bg-blue-100 text-blue-800' :
                          isDraft ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {po.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isDraft && isManager && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'ORDERED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition"
                            >
                              Dispatch Order
                            </button>
                          )}

                          {isOrdered && isManager && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold shadow-sm transition"
                            >
                              Receive Shipment
                            </button>
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

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order Requisition"
        subtitle="Specify vendor, line item quantities, and negotiated contract prices."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned Supplier</label>
              <select
                value={createForm.supplierId}
                onChange={(e) => {
                  const sId = e.target.value;
                  const s = suppliers.find(x => String(x.id) === sId);
                  setCreateForm({
                    ...createForm,
                    supplierId: sId,
                    expectedDeliveryDate: new Date(Date.now() + (s?.averageLeadTimeDays || 7) * 86400000).toISOString().split('T')[0]
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (Lead SLA: {s.averageLeadTimeDays}d)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Expected Delivery Date</label>
              <input
                type="date"
                required
                value={createForm.expectedDeliveryDate}
                onChange={(e) => setCreateForm({ ...createForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider">Order Line Items</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {createForm.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Medicine SKU</label>
                  <select
                    value={item.medicineId}
                    onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="w-28">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantityOrdered}
                    onChange={(e) => handleItemChange(idx, 'quantityOrdered', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div className="w-28">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItemRow(idx)}
                  disabled={createForm.items.length === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 mt-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Requisition Notes & Instructions</label>
            <input
              type="text"
              placeholder="e.g. Priority ICU emergency replenishment, deliver to Loading Dock B"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/30"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Purchase Order Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Receive Shipment for ${selectedOrder?.orderNumber}`}
        subtitle="Receiving shipment automatically creates batch records and logs inward stock transactions."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleReceivePoSubmit} className="space-y-4 text-xs font-medium">
          <div className="space-y-3">
            {receiveItems.map((item, idx) => (
              <div key={item.itemId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>{item.medicineName}</span>
                  <span className="text-xs text-slate-500 font-normal">Ordered: {item.quantityOrdered} {item.medicineUnit}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Quantity Received</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantityReceived}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].quantityReceived = parseInt(e.target.value) || 0;
                        setReceiveItems(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Assign Batch/Lot #</label>
                    <input
                      type="text"
                      required
                      value={item.batchNumber}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].batchNumber = e.target.value;
                        setReceiveItems(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={item.expiryDate}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].expiryDate = e.target.value;
                        setReceiveItems(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Storage Location</label>
                    <input
                      type="text"
                      value={item.storageLocation}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].storageLocation = e.target.value;
                        setReceiveItems(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Receipt Inspection Notes</label>
            <input
              type="text"
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/30"
            >
              Confirm Receipt & Create Batches
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
