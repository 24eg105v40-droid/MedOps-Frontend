import React, { useState, useEffect } from 'react';
import { Users, Shield, Mail, Phone, Building, CheckCircle, Search, UserCheck } from 'lucide-react';
import { authApi } from '../services/api';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAllUsers();
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Authorized User & Access Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Role-based authorization and departmental access control for clinical staff and managers.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search users by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{filteredUsers.length} Users Registered</span>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading user profiles...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No users match the search criteria.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div key={u.id} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{u.fullName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.email}</span>
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' :
                  u.role === 'ROLE_INVENTORY_MANAGER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {u.role.replace('ROLE_', '')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 text-xs space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Dept: <strong className="text-slate-800">{u.department || 'Clinical Wards'}</strong></span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{u.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Active Session
                </span>
                <span className="text-slate-400">Role ID #{u.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
