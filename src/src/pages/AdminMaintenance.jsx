
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Image as ImageIcon, Video, AlertCircle, CheckCircle, Clock, ChevronDown, User as UserIcon, Building2 } from 'lucide-react';
import { MaintenanceItem } from '@/api/entities';
import { User } from '@/api/entities';
import { Condominium } from '@/api/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MediaViewerModal from '../components/maintenance/MediaViewerModal';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    reportado: { label: 'Reportado', icon: <AlertCircle className="h-4 w-4" />, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    em_andamento: { label: 'Em Andamento', icon: <Clock className="h-4 w-4" />, className: 'bg-blue-100 text-blue-800 border-blue-200' },
    concluido: { label: 'Concluído', icon: <CheckCircle className="h-4 w-4" />, className: 'bg-green-100 text-green-800 border-green-200' }
  };
  const currentStatus = statusStyles[status] || statusStyles.reportado;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full border ${currentStatus.className}`}>
      {currentStatus.icon}
      <span>{currentStatus.label}</span>
    </div>
  );
};

export default function AdminMaintenance() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState({});
  const [condominiums, setCondominiums] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedItems, fetchedUsers, fetchedCondos] = await Promise.all([
        MaintenanceItem.list('-created_date'),
        User.list(),
        Condominium.list()
      ]);
      setItems(fetchedItems);
      setUsers(fetchedUsers.reduce((acc, user) => ({ ...acc, [user.email]: user }), {}));
      setCondominiums(fetchedCondos.reduce((acc, condo) => ({ ...acc, [condo.id]: condo }), {}));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await MaintenanceItem.update(itemId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
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
            <h1 className="text-xl font-bold text-gray-800">Painel de Manutenção</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {isLoading ? (
          <p>Carregando chamados...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-700">Tudo em ordem!</p>
              <p className="text-gray-500">Nenhum chamado de manutenção aberto no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const reporter = users[item.created_by];
              const condo = condominiums[item.condominium_id];
              return (
                <Card key={item.id} className="overflow-hidden shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between bg-gray-50 p-4 border-b">
                    <div>
                      <CardTitle>{item.equipment_name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{condo?.name || 'N/A'}</span>
                        <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" />{reporter?.full_name || item.created_by}</span>
                      </CardDescription>
                    </div>
                    <StatusBadge status={item.status} />
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-700 mb-4">{item.description}</p>
                    {item.media_urls && item.media_urls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Mídia Anexada:</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.media_urls.map((url, index) => (
                            <button 
                              key={index} 
                              onClick={() => openMediaViewer(url)}
                              className="relative w-24 h-24 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                            >
                              {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 
                                <img src={url} alt={`Mídia ${index + 1}`} className="w-full h-full object-cover" /> : 
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                  <Video className="h-8 w-8 text-white" />
                                </div>
                              }
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <ImageIcon className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-3">
                       <p className="text-xs text-gray-500">Reportado em: {format(new Date(item.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            Mudar Status <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'reportado')}>Reportado</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'em_andamento')}>Em Andamento</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'concluido')}>Concluído</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <MediaViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaUrl={selectedMedia}
      />
    </div>
  );
}
