import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShiftsPage = ({ user }) => {
  const [shifts, setShifts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: user.id,
    institution_id: '',
    date: '',
    hours: '',
    hourly_rate: '',
    travel_cost: '0'
  });

  useEffect(() => {
    fetchShifts();
    fetchInstitutions();
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await axios.get(`${API}/shifts`);
      setShifts(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get(`${API}/institutions`);
      setInstitutions(res.data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data.filter(u => u.status === 'approved'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/shifts`, {
        ...formData,
        hours: parseFloat(formData.hours),
        hourly_rate: parseFloat(formData.hourly_rate),
        travel_cost: parseFloat(formData.travel_cost)
      });
      toast.success('Prestation ajoutée!');
      setDialogOpen(false);
      setFormData({
        user_id: user.id,
        institution_id: '',
        date: '',
        hours: '',
        hourly_rate: '',
        travel_cost: '0'
      });
      fetchShifts();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const updateShiftStatus = async (shiftId, status) => {
    try {
      await axios.patch(`${API}/shifts/${shiftId}/status?status=${status}`);
      toast.success('Statut mis à jour!');
      fetchShifts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getInstitutionName = (id) => {
    const inst = institutions.find(i => i.id === id);
    return inst ? inst.name : 'N/A';
  };

  const getUserName = (id) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.first_name} ${u.last_name}` : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="shifts-title">Prestations</h1>
          <p className="text-gray-600">Gérez vos prestations et rémunérations</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold" data-testid="add-shift-button">
              <Plus size={20} className="mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvelle prestation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user.role === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Utilisateur</label>
                  <select
                    data-testid="shift-user-select"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Établissement</label>
                <select
                  data-testid="shift-institution-select"
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Sélectionner un établissement</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  data-testid="shift-date-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heures</label>
                  <input
                    type="number"
                    step="0.5"
                    data-testid="shift-hours-input"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Taux horaire (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    data-testid="shift-rate-input"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Frais déplacement (€)</label>
                <input
                  type="number"
                  step="0.01"
                  data-testid="shift-travel-input"
                  value={formData.travel_cost}
                  onChange={(e) => setFormData({ ...formData, travel_cost: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <Button type="submit" className="btn-gold w-full" data-testid="shift-submit-button">
                Ajouter la prestation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid={`shift-card-${shift.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-xl">
                  <Clock className="text-amber-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{getInstitutionName(shift.institution_id)}</h3>
                  {user.role === 'admin' && (
                    <p className="text-sm text-gray-600 mb-2">{getUserName(shift.user_id)}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <p><strong>Date:</strong> {new Date(shift.date).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Heures:</strong> {shift.hours}h</p>
                    <p><strong>Taux:</strong> {shift.hourly_rate}€/h</p>
                    <p><strong>Déplacement:</strong> {shift.travel_cost}€</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold">
                      <DollarSign size={18} />
                      <span>{shift.total.toFixed(2)}€</span>
                    </div>
                    <span className={`status-badge status-${shift.status === 'validated' ? 'approved' : shift.status === 'pending' ? 'pending' : shift.status === 'paid' ? 'approved' : 'rejected'}`}>
                      {shift.status === 'pending' ? 'En attente' : shift.status === 'validated' ? 'Validé' : 'Payé'}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === 'admin' && shift.status === 'pending' && (
                <Button
                  data-testid={`validate-shift-${shift.id}`}
                  onClick={() => updateShiftStatus(shift.id, 'validated')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Valider
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {shifts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Aucune prestation</p>
        </div>
      )}
    </div>
  );
};

export default ShiftsPage;
