
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, AlertCircle, Info, PartyPopper, Edit, Trash2 } from "lucide-react";
import { Notice } from "@/api/entities";
import { User } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NoticeForm from "../components/notices/NoticeForm";
import BottomNavBar from "../components/student/BottomNavBar";

const getNoticeIcon = (type) => {
  const icons = {
    info: Info,
    warning: AlertCircle,
    urgent: AlertCircle,
    celebration: PartyPopper
  };
  return icons[type] || Info;
};

const getNoticeColors = (type) => {
  const colors = {
    info: "bg-blue-100 text-blue-800 border-blue-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
    celebration: "bg-green-100 text-green-800 border-green-200"
  };
  return colors[type] || colors.info;
};

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [user, setUser] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedNotices, currentUser] = await Promise.all([
        Notice.list('-created_date'),
        User.me()
      ]);
      
      // Filtrar avisos ativos e válidos
      const activeNotices = fetchedNotices.filter(notice => {
        if (!notice.is_active) return false;
        if (notice.valid_until) {
          const validUntil = new Date(notice.valid_until);
          return validUntil >= new Date();
        }
        return true;
      });

      setNotices(activeNotices);
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    await fetchData();
    setIsFormOpen(false);
    setEditingNotice(null);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setIsFormOpen(true);
  };

  const handleDelete = async (noticeId) => {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      await Notice.delete(noticeId);
      await fetchData();
    }
  };

  const isTeacher = user?.user_type === 'admin' || user?.user_type === 'instructor';
  const isStudent = user?.user_type === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className={`container mx-auto p-4 md:p-6 ${isStudent ? 'pb-20' : ''}`}>
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Avisos e Comunicados</h1>
            <p className="text-gray-600">Fique por dentro das novidades e informações importantes.</p>
          </div>
          {isTeacher && (
            <Button 
              onClick={() => { setEditingNotice(null); setIsFormOpen(true); }}
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Aviso
            </Button>
          )}
        </header>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando avisos...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum aviso no momento</h3>
            <p className="text-gray-500">
              {isTeacher ? 'Crie o primeiro aviso clicando no botão acima.' : 'Não há avisos ativos no momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {notices.map((notice) => {
              const IconComponent = getNoticeIcon(notice.type);
              const colorClasses = getNoticeColors(notice.type);
              
              return (
                <Card key={notice.id} className={`border-l-4 ${notice.type === 'urgent' ? 'border-l-red-500' : 'border-l-orange-500'} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${colorClasses} hidden sm:block`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-gray-800 text-lg">{notice.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {notice.target_audience === 'all' ? 'Todos' : 
                               notice.target_audience === 'students' ? 'Alunos' : 'Professores'}
                            </Badge>
                            <Badge className={`${colorClasses} text-xs`}>
                              {notice.type === 'info' ? 'Informativo' :
                               notice.type === 'warning' ? 'Atenção' :
                               notice.type === 'urgent' ? 'Urgente' : 'Comemoração'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(notice.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isTeacher && notice.created_by === user?.email && (
                        <div className="flex items-center gap-1 self-end sm:self-start">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(notice)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700" 
                            onClick={() => handleDelete(notice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                    {notice.valid_until && (
                      <div className="mt-3 text-xs text-gray-500">
                        Válido até: {format(new Date(notice.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isTeacher && (
          <NoticeForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            notice={editingNotice}
            onSave={handleSave}
          />
        )}
      </div>
      {isStudent && <BottomNavBar activePage="Notices" />}
    </div>
  );
}
