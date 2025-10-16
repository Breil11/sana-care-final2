import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessagesPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      const interval = setInterval(() => fetchMessages(selectedUser.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data.filter(u => u.status === 'approved' && u.id !== user.id));
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const res = await axios.get(`${API}/messages?other_user_id=${otherUserId}`);
      setMessages(res.data);
      
      // Mark messages as read
      const unreadMessages = res.data.filter(m => m.recipient_id === user.id && !m.read);
      for (const msg of unreadMessages) {
        await axios.patch(`${API}/messages/${msg.id}/read`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await axios.post(`${API}/messages`, {
        recipient_id: selectedUser.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedUser.id);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
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
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="messages-title">Messagerie</h1>
        <p className="text-gray-600">Communiquez avec les professionnels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users list */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-4 h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contacts</h2>
          <div className="space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                data-testid={`contact-${u.id}`}
                onClick={() => setSelectedUser(u)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedUser?.id === u.id
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center flex-shrink-0">
                    {u.photo ? (
                      <img src={u.photo} alt={u.first_name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm font-bold text-amber-600">
                        {u.first_name[0]}{u.last_name[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-gray-600 capitalize">{u.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    {selectedUser.photo ? (
                      <img src={selectedUser.photo} alt={selectedUser.first_name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-lg font-bold text-amber-600">
                        {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedUser.first_name} {selectedUser.last_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedUser.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto scrollbar-hide" data-testid="messages-container">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.sender_id === user.id
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user.id ? 'text-amber-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    data-testid="message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    data-testid="send-message-button"
                    className="btn-gold px-6"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-amber-300" />
                <p>Sélectionnez un contact pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
