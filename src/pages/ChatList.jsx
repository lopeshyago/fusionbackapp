import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Channel } from '@/api/entities';
import { Message } from '@/api/entities';
import { Condominium } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquarePlus, UserCheck, Trash2, Archive, Inbox, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BottomNavBar from '../components/student/BottomNavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ChatList() {
  const [currentUser, setCurrentUser] = useState(null);
  const [groupedChats, setGroupedChats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [channels, allUsers, condominiums] = await Promise.all([
        Channel.filter({ tipo: 'support' }),
        User.list(),
        Condominium.list()
      ]);

      const condoMap = condominiums.reduce((acc, condo) => {
        acc[condo.id] = condo;
        return acc;
      }, {});

      const chats = await Promise.all(
        channels.map(async (channel) => {
          const student = allUsers.find(u => channel.participantes.includes(u.id) && u.user_type === 'student');
          return { channel, student };
        })
      );

      const grouped = chats.reduce((acc, { channel, student }) => {
        const condoId = student?.condominium_id || 'unassigned';
        
        if (!acc[condoId]) {
          acc[condoId] = {
            name: condoMap[condoId]?.name || 'Sem Condomínio',
            active: [],
            archived: []
          };
        }

        if (channel.status === 'open') {
          acc[condoId].active.push({ channel, student });
        } else {
          acc[condoId].archived.push({ channel, student });
        }

        return acc;
      }, {});

      setGroupedChats(grouped);

    } catch (error) {
      console.error('Erro ao carregar chats de admin:', error);
    }
    setIsLoading(false);
  };
  
  const loadStudentData = async (user) => {
    const channels = await Channel.filter({ 
      participantes: { '$in': [user.id] },
      tipo: 'support'
    });
    setGroupedChats({
        student_chats: { active: channels.map(c => ({ channel: c })) }
    });
    setIsLoading(false);
  }

  useEffect(() => {
    const init = async () => {
        const user = await User.me();
        setCurrentUser(user);
        if (user.user_type === 'admin') {
            loadAdminData();
        } else {
            loadStudentData(user);
        }
    };
    init();
  }, []);

  const handleStartSupportChat = async () => {
    try {
      const userChannels = await Channel.filter({
          participantes: { '$in': [currentUser.id] },
          tipo: 'support',
          status: 'open'
      });
      if(userChannels.length > 0) {
          navigate(createPageUrl(`ChatRoom?id=${userChannels[0].id}`));
          return;
      }
      
      const newChannel = await Channel.create({
        tipo: 'support',
        participantes: [currentUser.id],
        nome: `Suporte - ${currentUser.full_name}`,
        status: 'open'
      });
      navigate(createPageUrl(`ChatRoom?id=${newChannel.id}`));
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      alert('Erro ao iniciar conversa. Tente novamente.');
    }
  };

  const handleDeleteChat = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa permanentemente?')) {
        try {
            await Channel.delete(channelId);
            await loadAdminData();
        } catch (error) {
            console.error('Erro ao excluir chat:', error);
            alert('Não foi possível excluir a conversa.');
        }
    }
  };

  const isStudent = currentUser?.user_type === 'student';

  if (isLoading) {
    return <LoadingSpinner text="Carregando conversas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className={`container mx-auto p-4 md:p-6 ${isStudent ? 'pb-20' : ''}`}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Chat</h1>
          <p className="text-gray-600">
            {isStudent ? 'Converse com nossa equipe.' : 'Conversas de suporte com alunos.'}
          </p>
        </header>

        {isStudent ? (
          <div className="space-y-4">
            <Card className="border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-700">
                  <UserCheck className="h-6 w-6" /> Suporte Administrativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Tem alguma dúvida ou precisa de ajuda? Fale conosco.</p>
                <Button onClick={handleStartSupportChat} className="w-full bg-orange-500 hover:bg-orange-600">
                  <MessageSquarePlus className="h-4 w-4 mr-2"/> Iniciar Conversa
                </Button>
              </CardContent>
            </Card>

            {groupedChats.student_chats?.active.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-700">Minhas Conversas</h2>
                {groupedChats.student_chats.active.map(({ channel }) => (
                  <Link to={createPageUrl(`ChatRoom?id=${channel.id}`)} key={channel.id}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Suporte Fusion</h3>
                          <p className="text-sm text-gray-500">Conversa em andamento</p>
                        </div>
                        <MessageCircle className="h-5 w-5 text-orange-500" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedChats).length === 0 ? (
                 <Card className="text-center p-8">
                   <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                   <p className="text-gray-500">Nenhuma conversa de suporte no momento.</p>
                 </Card>
            ) : Object.entries(groupedChats).map(([condoId, data]) => (
                <Card key={condoId} className="border-orange-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-orange-800">
                            <Building className="h-6 w-6" /> {data.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Tabs defaultValue="active">
                          <TabsList className="grid w-full grid-cols-2">
                             <TabsTrigger value="active">
                                <Inbox className="h-4 w-4 mr-2" /> Ativas ({data.active.length})
                             </TabsTrigger>
                             <TabsTrigger value="archived">
                                <Archive className="h-4 w-4 mr-2" /> Arquivadas ({data.archived.length})
                             </TabsTrigger>
                          </TabsList>
                          <TabsContent value="active" className="pt-4 space-y-3">
                             {data.active.length === 0 ? <p className="text-center text-gray-500 py-4">Nenhuma conversa ativa.</p> :
                                data.active.map(({ channel, student }) => (
                                    <Link to={createPageUrl(`ChatRoom?id=${channel.id}`)} key={channel.id}>
                                      <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div>
                                              <h3 className="font-semibold">{student?.full_name || 'Usuário'}</h3>
                                              <p className="text-sm text-gray-500">Solicitação de suporte</p>
                                            </div>
                                            <MessageCircle className="h-5 w-5 text-green-500" />
                                        </CardContent>
                                      </Card>
                                    </Link>
                                ))}
                          </TabsContent>
                          <TabsContent value="archived" className="pt-4 space-y-3">
                             {data.archived.length === 0 ? <p className="text-center text-gray-500 py-4">Nenhuma conversa arquivada.</p> :
                                data.archived.map(({ channel, student }) => (
                                    <Link to={createPageUrl(`ChatRoom?id=${channel.id}`)} key={channel.id}>
                                      <Card className="hover:shadow-md transition-shadow bg-gray-50 opacity-80">
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold">{student?.full_name || 'Usuário'}</h3>
                                                <p className="text-sm text-gray-500">Conversa encerrada</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="h-5 w-5 text-gray-400" />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={(e) => handleDeleteChat(e, channel.id)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                      </Card>
                                    </Link>
                                ))}
                          </TabsContent>
                       </Tabs>
                    </CardContent>
                </Card>
            ))}
          </div>
        )}
      </div>
      
      {isStudent && <BottomNavBar activePage="ChatList" />}
    </div>
  );
}