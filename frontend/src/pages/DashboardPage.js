import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Building2, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/dashboard/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const AdminDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="dashboard-title">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-total-users">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_users}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-xl">
              <Users className="text-amber-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-pending-users">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">En attente</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending_users}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-red-100 p-4 rounded-xl">
              <AlertCircle className="text-orange-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-institutions">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Établissements</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_institutions}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-xl">
              <Building2 className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-total-shifts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total Prestations</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_shifts}</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl">
              <Clock className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-pending-shifts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Prestations en attente</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending_shifts}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-4 rounded-xl">
              <AlertCircle className="text-yellow-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-revenue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Revenu (30j)</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.recent_revenue.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-xl">
              <DollarSign className="text-amber-600" size={28} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UserDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="dashboard-title">Mon tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-my-shifts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Mes Prestations</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_shifts}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-xl">
              <Clock className="text-amber-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-hours">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Heures totales</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_hours.toFixed(1)}h</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-xl">
              <TrendingUp className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-earned">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total payé</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_earned.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl">
              <DollarSign className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid="stat-pending">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">En attente</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending_amount.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-4 rounded-xl">
              <AlertCircle className="text-yellow-600" size={28} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardPage;
