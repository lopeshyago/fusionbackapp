
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Image as ImageIcon, Video, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { MaintenanceItem } from '@/api/entities';
import { User } from '@/api/entities';
import { Condominium } from '@/api/entities';
import MaintenanceFormModal from '../components/maintenance/MaintenanceFormModal';
import MediaViewerModal from '../components/maintenance/MediaViewerModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    reportado: {
      label: 'Reportado',
      icon: <AlertCircle className="h-4 w-4" />,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    em_andamento: {
      label: 'Em Andamento',
      icon: <Clock className="h-4 w-4" />,
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    concluido: {
      label: 'Concluído',
      icon: <CheckCircle className="h-4 w-4" />,
      className: 'bg-green-100 text-green-800 border-green-200'
    }
  };

  const currentStatus = statusStyles[status] || statusStyles.reportado;

  return (
    <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full border ${currentStatus.className}`}>
      {currentStatus.icon}
      <span>{currentStatus.label}</span>
    </div>
  );
};

export default function InstructorMaintenance() {
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [user, setUser] = useState(null);
  const [condominium, setCondominium] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.condominium_id) {
        const items = await MaintenanceItem.filter({ condominium_id: currentUser.condominium_id }, '-created_date');
        setMaintenanceItems(items);

        const condos = await Condominium.filter({ id: currentUser.condominium_id });
        if (condos.length > 0) {
          setCondominium(condos[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados de manutenção:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSave = () => {
    setIsFormOpen(false);
    loadData();
  };

  const openMediaViewer = (url) => {
    setSelectedMedia(url);
    setIsViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-800">Manutenção de Equipamentos</h1>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="fusion-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {isLoading ? (
          <p>Carregando...</p>
        ) : !user?.condominium_id ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">Você não está associado a um condomínio.</p>
              <p className="text-gray-500">Por favor, contate um administrador para ser vinculado a um local.</p>
            </CardContent>
          </Card>
        ) : maintenanceItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-700">Nenhum problema reportado.</p>
              <p className="text-gray-500">Parece que todos os equipamentos estão funcionando bem!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {maintenanceItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between bg-gray-50 p-4 border-b">
                  <div>
                    <CardTitle>{item.equipment_name}</CardTitle>
                    <CardDescription>
                      Reportado em: {format(new Date(item.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <StatusBadge status={item.status} />
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700 mb-4">{item.description}</p>
                  {item.media_urls && item.media_urls.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Mídia Anexada:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.media_urls.map((url, index) => (
                           <button 
                              key={index} 
                              onClick={() => openMediaViewer(url)}
                              className="relative w-24 h-24 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                            >
                              {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <img src={url} alt={`Mídia ${index + 1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center"><Video className="h-8 w-8 text-white" /></div>}
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <ImageIcon className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />}
                              </div>
                            </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {isFormOpen && (
        <MaintenanceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleFormSave}
          condominiumId={user?.condominium_id}
        />
      )}
      
      <MediaViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaUrl={selectedMedia}
      />
    </div>
  );
}
