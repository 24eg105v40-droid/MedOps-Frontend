import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { aiApi } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveAlerts = async () => {
    try {
      const res = await aiApi.getAlerts({ status: 'ACTIVE' });
      setAlerts(res.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveAlert = async (id, e) => {
    e.stopPropagation();
    try {
      await aiApi.resolveAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium border border-slate-200">Admin</span>;
      case 'ROLE_INVENTORY_MANAGER':
        return <span className="bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 rounded font-medium border border-emerald-200">Manager</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded font-medium border border-blue-200">Staff</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Info */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Hospital Central Inventory</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Assistant Link */}
          <Link
            to="/ai-assistant"
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            AI Assistant
          </Link>

          {/* Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Inventory Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-800">Active Alerts ({alerts.length})</h4>
                  </div>
                  <Link 
                    to="/ai-intelligence" 
                    onClick={() => setShowAlertsDropdown(false)}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      No active alerts.
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div 
                        key={a.id} 
                        className={`p-2.5 rounded-lg border text-xs ${
                          a.severity === 'CRITICAL' ? 'bg-rose-50/60 border-rose-200' : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900">{a.title}</div>
                          <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded uppercase ${
                            a.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {a.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{a.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={(e) => handleResolveAlert(a.id, e)}
                            className="text-[11px] font-medium text-emerald-700 hover:underline"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200"></div>

          {/* User Profile Bar */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.fullName || 'User'}</div>
              <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
