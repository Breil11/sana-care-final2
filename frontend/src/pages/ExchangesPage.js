import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeftRight, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExchangesPage = ({ user }) => {
  const [exchanges, setExchanges] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchExchanges();
    fetchShifts();
    fetchUsers();
  }, []);

  const fetchExchanges = async () => {
    try {
      const res = await axios.get(`${API}/exchanges`);
      setExchanges(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await axios.get(`${API}/shifts`);
      // Only show user's own validated/pending shifts
      setShifts(res.data.filter(s => s.user_id === user.id && s.status !== 'paid'));
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data.filter(u => u.status === 'approved' && u.id !== user.id && u.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/exchanges`, {
        shift_id: selectedShift,
        to_user_id: selectedUser
      });
      toast.success('Demande d\'échange envoyée!');
      setDialogOpen(false);
      setSelectedShift('');
      setSelectedUser('');
      fetchExchanges();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la demande');
    }
  };

  const updateExchange = async (exchangeId, status) => {
    try {
      await axios.patch(`${API}/exchanges/${exchangeId}?status=${status}`);
      toast.success(`Échange ${status === 'accepted' ? 'accepté' : 'refusé'}!`);
      fetchExchanges();
      fetchShifts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getShiftDetails = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    return shift || {};
  };

  const getUserName = (userId) => {
    if (userId === user.id) return 'Vous';
    const u = users.find(u => u.id === userId);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="exchanges-title">Échanges de prestations</h1>
          <p className="text-gray-600">Échangez vos prestations avec d'autres professionnels</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold" data-testid="create-exchange-button">
              <ArrowLeftRight size={20} className="mr-2" />
              Proposer un échange
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Proposer un échange</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre prestation</label>
                <select
                  data-testid="exchange-shift-select"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Sélectionner une prestation</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {new Date(shift.date).toLocaleDateString('fr-FR')} - {shift.hours}h - {shift.total.toFixed(2)}€
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proposer à</label>
                <select
                  data-testid="exchange-user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Sélectionner un professionnel</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="btn-gold w-full" data-testid="exchange-submit-button">
                Envoyer la proposition
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {exchanges.map(exchange => {
          const shift = getShiftDetails(exchange.shift_id);
          const isReceived = exchange.to_user_id === user.id;
          
          return (
            <div
              key={exchange.id}
              data-testid={`exchange-card-${exchange.id}`}
              className="bg-white rounded-xl shadow-lg p-6 card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-xl">
                    <ArrowLeftRight className="text-amber-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`status-badge status-${
                        exchange.status === 'accepted' ? 'approved' :
                        exchange.status === 'rejected' ? 'rejected' : 'pending'
                      }`}>
                        {exchange.status === 'pending' ? 'En attente' :
                         exchange.status === 'accepted' ? 'Accepté' : 'Refusé'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {isReceived ? 'Reçu' : 'Envoyé'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>De:</strong> {getUserName(exchange.from_user_id)}</p>
                      <p><strong>À:</strong> {getUserName(exchange.to_user_id)}</p>
                      {shift.date && (
                        <>
                          <p><strong>Date:</strong> {new Date(shift.date).toLocaleDateString('fr-FR')}</p>
                          <p><strong>Heures:</strong> {shift.hours}h - <strong>Montant:</strong> {shift.total?.toFixed(2)}€</p>
                        </>
                      )}
                      <p className="text-xs text-gray-500">
                        Créé le: {new Date(exchange.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {isReceived && exchange.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      data-testid={`accept-exchange-${exchange.id}`}
                      onClick={() => updateExchange(exchange.id, 'accepted')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} />
                      <span>Accepter</span>
                    </button>
                    <button
                      data-testid={`reject-exchange-${exchange.id}`}
                      onClick={() => updateExchange(exchange.id, 'rejected')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={18} />
                      <span>Refuser</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {exchanges.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <ArrowLeftRight size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Aucun échange de prestation</p>
        </div>
      )}
    </div>
  );
};

export default ExchangesPage;
