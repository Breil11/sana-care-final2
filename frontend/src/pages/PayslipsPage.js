import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PayslipsPage = ({ user }) => {
  const [payslips, setPayslips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(user.role === 'admin' ? '' : user.id);
  const [period, setPeriod] = useState('');

  useEffect(() => {
    fetchPayslips();
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchPayslips = async () => {
    try {
      const res = await axios.get(`${API}/payslips`);
      setPayslips(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data.filter(u => u.status === 'approved' && u.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/payslips/generate?user_id=${selectedUserId}&period=${period}`);
      toast.success('Fiche de paie générée!');
      setDialogOpen(false);
      setPeriod('');
      fetchPayslips();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération');
    }
  };

  const getUserName = (id) => {
    if (id === user.id) return 'Vous';
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="payslips-title">Fiches de paie</h1>
          <p className="text-gray-600">Consultez vos fiches de paie avec commission de 7%</p>
        </div>

        {user.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold" data-testid="generate-payslip-button">
                <FileText size={20} className="mr-2" />
                Générer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Générer une fiche de paie</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Utilisateur</label>
                  <select
                    data-testid="payslip-user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Période (AAAA-MM)</label>
                  <input
                    type="month"
                    data-testid="payslip-period-input"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value.replace('-', '-'))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
                  La commission de 7% sera automatiquement déduite du montant brut.
                </p>
                <Button type="submit" className="btn-gold w-full" data-testid="payslip-generate-submit">
                  Générer la fiche de paie
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {payslips.map((payslip) => (
          <div key={payslip.id} className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid={`payslip-card-${payslip.id}`}>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-xl">
                <FileText className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{getUserName(payslip.user_id)}</h3>
                    <p className="text-sm text-gray-600">Période: {payslip.period}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant brut:</span>
                    <span className="font-semibold text-gray-800">{payslip.gross_total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Commission (7%):</span>
                    <span className="font-semibold">-{payslip.commission.toFixed(2)}€</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-800 font-semibold">Montant net:</span>
                    <span className="font-bold text-amber-600 text-lg">{payslip.net_total.toFixed(2)}€</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Prestations: {payslip.shifts.length}</p>
                    <p>Générée le: {new Date(payslip.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {payslips.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Aucune fiche de paie</p>
        </div>
      )}
    </div>
  );
};

export default PayslipsPage;
