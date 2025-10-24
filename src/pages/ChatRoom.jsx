
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Channel } from '@/api/entities';
import { Message } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Archive } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ChatRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const channelId = searchParams.get('id');

  const loadChatData = useCallback(async () => {
    try {
      if (!channelId) {
        setError('ID do canal não fornecido');
        setIsLoading(false);
        return;
      }

      const user = await User.me();
      setCurrentUser(user);

      const channels = await Channel.filter({ id: channelId });
      if (channels.length === 0) {
        setError('Canal não encontrado');
        setIsLoading(false);
        return;
      }
      const currentChannel = channels[0];
      
      if (user.user_type === 'admin' && !currentChannel.participantes.includes(user.id)) {
        const updatedParticipants = [...currentChannel.participantes, user.id];
        await Channel.update(channelId, { participantes: updatedParticipants });
        currentChannel.participantes = updatedParticipants;
      }

      setChannel(currentChannel);

      const channelMessages = await Message.filter({ canal_id: channelId }, '-enviado_em');
      setMessages(channelMessages.reverse());

      // Identificar o aluno no chat
      if (currentChannel.participantes) {
        const studentId = currentChannel.participantes.find(pId => pId !== user.id);
        if (studentId && user.user_type === 'admin') {
            const studentUsers = await User.filter({id: studentId});
            setOtherUser(studentUsers.length > 0 ? studentUsers[0] : { full_name: 'Aluno Removido' });
        } else if (studentId && user.user_type === 'student' && studentId === user.id) { // The student is the current user, other user is the admin
            const adminUsers = await User.filter({ user_type: 'admin' }); // Assuming one admin or taking the first
            setOtherUser(adminUsers.length > 0 ? adminUsers[0] : { full_name: 'Suporte' });
        }
        else {
             setOtherUser({ full_name: 'Suporte' }); // Fallback if no specific other user identified
        }
      } else {
        setOtherUser({ full_name: 'Suporte' }); // Fallback if no participants data
      }
      
    } catch (err) {
      console.error('Erro ao carregar chat:', err);
      setError('Erro ao carregar o chat. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    loadChatData();
    // Refresh chat data every 10 seconds, but only if not currently sending a message
    const interval = setInterval(loadChatData, 10000); 
    return () => clearInterval(interval);
  }, [loadChatData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !channel) return;

    try {
      // Se o chat está fechado e o usuário é um aluno, reabre o chat
      if (channel.status === 'closed' && currentUser.user_type === 'student') {
        await Channel.update(channel.id, { status: 'open' });
      }

      // Adicionar a nova mensagem
      await Message.create({
        canal_id: channel.id,
        remetente_id: currentUser.id,
        texto: newMessage,
        enviado_em: new Date().toISOString(),
      });
      setNewMessage('');
      await loadChatData(); // Recarrega os dados para refletir o novo status e a mensagem
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem. Tente novamente.");
    }
  };
  
  const handleCloseChat = async () => {
      if(currentUser.user_type !== 'admin' || !channel) return;
      if(confirm('Tem certeza que deseja encerrar e arquivar esta conversa?')) {
          try {
              await Channel.update(channel.id, { status: 'closed' });
              alert('Conversa arquivada!');
              navigate(createPageUrl('ChatList'));
          } catch(error) {
              alert('Não foi possível arquivar a conversa.');
          }
      }
  };

  if (isLoading) return <LoadingSpinner text="Carregando conversa..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate(createPageUrl('ChatList'))} />;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('ChatList'))}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src={otherUser?.profile_photo_url} />
              <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-800">{otherUser?.full_name}</h2>
              <p className={`text-xs ${channel?.status === 'open' ? 'text-green-500' : 'text-gray-500'}`}>
                {channel?.status === 'open' ? 'Online' : 'Conversa Arquivada'}
              </p>
            </div>
        </div>
        {currentUser?.user_type === 'admin' && channel?.status === 'open' && (
            <Button variant="outline" size="sm" onClick={handleCloseChat}>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
            </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isCurrentUser = msg.remetente_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isCurrentUser ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="text-sm">{msg.texto}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        {channel?.status === 'closed' && currentUser?.user_type === 'admin' ? (
             <div className="text-center text-gray-500 text-sm">Esta conversa foi arquivada.</div>
        ) : (
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={channel?.status === 'closed' && currentUser?.user_type === 'student' ? "Enviar uma mensagem para reabrir..." : "Digite uma mensagem..."}
                className="flex-1 bg-gray-100 border-none focus:ring-orange-500"
              />
              <Button onClick={handleSendMessage} className="bg-orange-500 hover:bg-orange-600">
                <Send className="h-5 w-5" />
              </Button>
            </div>
        )}
      </footer>
    </div>
  );
}
