import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { Class } from "@/api/entities_new";
import { User } from "@/api/entities_new";
import { Condominium } from "@/api/entities_new";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSchedule() {
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedClasses, allUsers, condos] = await Promise.all([
        Class.list('-inicio'),
        User.filter({ user_type: 'instructor' }),
        Condominium.list()
      ]);
      
      setClasses(fetchedClasses);
      setInstructors(allUsers);
      setCondominiums(condos);
      
      if (condos.length > 0) {
        setSelectedCondoId(condos[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    }
    setIsLoading(false);
  };

  const getInstructorName = (instructorId) => {
    const instructor = instructors.find(i => i.id === instructorId);
    return instructor?.full_name || "Instrutor não encontrado";
  };

  const getCondominiumName = (condoId) => {
    const condo = condominiums.find(c => c.id === condoId);
    return condo?.name || "Local não encontrado";
  };

  const filteredClasses = selectedCondoId === 'all' 
    ? classes 
    : classes.filter(cls => cls.condominio_id === selectedCondoId);

  const getClassesByDate = () => {
    const grouped = {};
    filteredClasses.forEach(cls => {
      const date = new Date(cls.inicio).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(cls);
    });
    return grouped;
  };

  const classesByDate = getClassesByDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-orange-700 mb-6">Agenda Global</h1>
        <div className="mb-6 flex items-center gap-4">
          <select
            value={selectedCondoId}
            onChange={(e) => setSelectedCondoId(e.target.value)}
            className="p-2 border border-orange-200 rounded-md"
          >
            <option value="all">Todos os Locais</option>
            {condominiums.map(condo => (
              <option key={condo.id} value={condo.id}>{condo.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando agenda...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(classesByDate).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma aula agendada</h3>
                <p className="text-gray-500">Não há aulas programadas para o filtro selecionado.</p>
              </div>
            ) : (
              Object.entries(classesByDate)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([date, dayClasses]) => (
                  <Card key={date} className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-700">
                        {new Date(date).toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {dayClasses
                          .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
                          .map(cls => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-100 shadow-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className="bg-orange-100 text-orange-800">{cls.modalidade}</Badge>
                                  <span className="text-sm text-gray-600">{cls.area}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(cls.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                                    {new Date(cls.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {cls.capacidade} vagas
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {getCondominiumName(cls.condominio_id)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mt-2">
                                  <strong>Instrutor:</strong> {getInstructorName(cls.instrutor_id)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}