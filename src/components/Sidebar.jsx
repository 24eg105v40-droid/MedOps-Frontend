import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  Layers, 
  ArrowLeftRight, 
  Truck, 
  ShoppingCart, 
  BrainCircuit, 
  Bot, 
  History, 
  Users,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const { isAdmin, isManager } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Medicines', path: '/medicines', icon: Pill },
    { name: 'Batches & Expiry (FEFO)', path: '/batches', icon: Layers },
    { name: 'Stock Transactions', path: '/inventory', icon: ArrowLeftRight },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'AI Intelligence', path: '/ai-intelligence', icon: BrainCircuit },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  ];

  if (isManager || isAdmin) {
    navItems.push({ name: 'Audit & Compliance', path: '/audit-logs', icon: History });
  }

  if (isAdmin) {
    navItems.push({ name: 'User Management', path: '/users', icon: Users });
  }

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none z-40">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight">
            Med<span className="text-emerald-400">Ops</span>
          </h1>
          <p className="text-[11px] text-slate-400">Medical Inventory</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400">
        <span className="text-slate-300 font-medium block">Hospital System</span>
        <span>FEFO & Cold Chain Active</span>
      </div>
    </aside>
  );
}
