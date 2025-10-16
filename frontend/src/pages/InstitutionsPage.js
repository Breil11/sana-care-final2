import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InstitutionsPage = ({ user }) => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get(`${API}/institutions`);
      setInstitutions(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/institutions`, formData);
      toast.success('Établissement ajouté!');
      setDialogOpen(false);
      setFormData({ name: '', address: '', phone: '', email: '' });
      fetchInstitutions();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="institutions-title">Établissements</h1>
          <p className="text-gray-600">Liste des établissements de santé</p>
        </div>

        {user.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold" data-testid="add-institution-button">
                <Plus size={20} className="mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvel établissement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    data-testid="institution-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    data-testid="institution-address-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    data-testid="institution-phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    data-testid="institution-email-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <Button type="submit" className="btn-gold w-full" data-testid="institution-submit-button">
                  Ajouter l'établissement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {institutions.map((inst) => (
          <div key={inst.id} className="bg-white rounded-xl shadow-lg p-6 card-hover" data-testid={`institution-card-${inst.id}`}>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-xl">
                <Building2 className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{inst.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{inst.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{inst.phone}</span>
                  </div>
                  {inst.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{inst.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {institutions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Aucun établissement</p>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;
