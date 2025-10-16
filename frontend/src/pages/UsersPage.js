import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, X, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, filterStatus, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await axios.patch(`${API}/users/${userId}/status?status=${status}`);
      toast.success(`Statut mis à jour: ${status}`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="users-title">Gestion des utilisateurs</h1>
        <p className="text-gray-600">Approuver ou rejeter les demandes d'inscription</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              data-testid="users-search-input"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            data-testid="users-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Users list */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid={`user-card-${u.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                  {u.photo ? (
                    <img src={u.photo} alt={u.first_name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xl font-bold text-amber-600">
                      {u.first_name[0]}{u.last_name[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{u.first_name} {u.last_name}</h3>
                  <p className="text-gray-600 text-sm">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 capitalize">{u.role.replace('_', ' ')}</span>
                    <span className={`status-badge status-${u.status}`}>
                      {u.status === 'approved' ? 'Approuvé' : u.status === 'pending' ? 'En attente' : 'Rejeté'}
                    </span>
                  </div>
                </div>
              </div>

              {u.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    data-testid={`approve-user-${u.id}`}
                    onClick={() => updateUserStatus(u.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={18} />
                    <span>Approuver</span>
                  </button>
                  <button
                    data-testid={`reject-user-${u.id}`}
                    onClick={() => updateUserStatus(u.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={18} />
                    <span>Rejeter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Aucun utilisateur trouvé</p>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
