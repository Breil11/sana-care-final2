import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SchedulesPage = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: user.id,
    institution_id: '',
    date: '',
    start_time: '',
    end_time: '',
    status: 'available'
  });

  useEffect(() => {
    fetchSchedules();
    fetchInstitutions();
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API}/schedules`);
      setSchedules(res.data);
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
      await axios.post(`${API}/schedules`, formData);
      toast.success('Horaire ajouté!');
      setDialogOpen(false);
      setFormData({
        user_id: user.id,
        institution_id: '',
        date: '',
        start_time: '',
        end_time: '',
        status: 'available'
      });
      fetchSchedules();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="schedules-title">Horaires & Disponibilités</h1>
          <p className="text-gray-600">Gérez vos créneaux de disponibilité</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold" data-testid="add-schedule-button">
              <Plus size={20} className="mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvel horaire</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user.role === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Utilisateur</label>
                  <select
                    data-testid="schedule-user-select"
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
                  data-testid="schedule-institution-select"
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
                  data-testid="schedule-date-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heure début</label>
                  <input
                    type="time"
                    data-testid="schedule-start-input"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heure fin</label>
                  <input
                    type="time"
                    data-testid="schedule-end-input"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="btn-gold w-full" data-testid="schedule-submit-button">
                Ajouter l'horaire
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid={`schedule-card-${schedule.id}`}>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-xl">
                <Calendar className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{getInstitutionName(schedule.institution_id)}</h3>
                {user.role === 'admin' && (
                  <p className="text-sm text-gray-600 mb-2">{getUserName(schedule.user_id)}</p>
                )}
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Date:</strong> {new Date(schedule.date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Horaire:</strong> {schedule.start_time} - {schedule.end_time}</p>
                  <span className={`status-badge status-${schedule.status === 'available' ? 'approved' : schedule.status === 'booked' ? 'pending' : 'rejected'} mt-2 inline-block`}>
                    {schedule.status === 'available' ? 'Disponible' : schedule.status === 'booked' ? 'Réservé' : 'Terminé'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Aucun horaire</p>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;
