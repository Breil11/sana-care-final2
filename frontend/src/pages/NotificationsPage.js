import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationsPage = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`);
      setNotifications(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API}/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`);
      toast.success('Toutes les notifications ont été marquées comme lues');
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getNotificationIcon = (type) => {
    return '🔔';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="notifications-title">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes les notifications sont lues'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} className="btn-gold" data-testid="mark-all-read-button">
            <Check size={20} className="mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            data-testid={`notification-${notification.id}`}
            className={`bg-white rounded-xl shadow-lg p-6 card-hover ${
              !notification.read ? 'border-l-4 border-amber-500' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                !notification.read
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-100'
                  : 'bg-gray-100'
              }`}>
                <Bell className={!notification.read ? 'text-amber-600' : 'text-gray-400'} size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-amber-600 uppercase">
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{notification.content}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      data-testid={`mark-read-${notification.id}`}
                      onClick={() => markAsRead(notification.id)}
                      className="text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Aucune notification</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
