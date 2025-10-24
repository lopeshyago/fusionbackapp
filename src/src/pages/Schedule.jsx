
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Activity as ActivityIcon, Plus, Edit, Trash2, Calendar, CalendarPlus } from "lucide-react";
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { WeeklySchedule } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScheduleSlotForm from "../components/schedule/ScheduleSlotForm";
import BatchScheduleForm from "../components/schedule/BatchScheduleForm";
import LoadingSpinner from '../components/common/LoadingSpinner';

const timeSlots = [
  "06:00", "06:15", "06:30", "06:45",
  "07:00", "07:15", "07:30", "07:45", 
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45"
];
const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const ScheduleGrid = ({ days, schedule, timeSlots, onSlotClick, canEdit, onDelete }) => (
  <div className="hidden md:block overflow-x-auto bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl shadow-inner border border-orange-200">
    <div className="min-w-[600px]">
      <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
        <div className="flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-lg shadow-sm">
          Horário
        </div>
        {days.map(day => (
          <div key={day} className="flex items-center justify-center p-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold text-sm rounded-lg shadow-sm">
            {day}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {timeSlots.map(time => (
          <div key={time} className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
            <div className="flex items-center justify-center p-3 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 font-bold text-sm rounded-lg border border-orange-300">
              {time}
            </div>
            {days.map(day => {
              const scheduleItems = schedule[day]?.[time] || []; // Array de aulas no mesmo horário
              const items = Array.isArray(scheduleItems) ? scheduleItems : (scheduleItems ? [scheduleItems] : []);
              
              return (
                <div key={`${day}-${time}`} className="min-h-[80px] p-1 group relative">
                  {items.length > 0 ? (
                    <div className="space-y-1 h-full">
                      {items.map((scheduleItem, index) => (
                        <div 
                          key={scheduleItem.id || `${time}-${index}`} // Use a composite key for uniqueness
                          className={`${scheduleItem.color} text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between border-2 border-white/20 ${canEdit ? 'cursor-pointer' : ''} ${items.length > 1 ? 'min-h-[35px]' : 'h-full'}`}
                          onClick={() => canEdit && onSlotClick(day, time, scheduleItem)}
                        >
                          <div>
                            <div className="font-bold text-xs leading-tight mb-1 text-center truncate">
                              {scheduleItem.activity_name}
                            </div>
                            <div className="flex items-center justify-center gap-1 opacity-90">
                              <Users className="h-3 w-3" />
                              <span className="text-xs font-medium">{scheduleItem.capacity}</span>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0 flex gap-1">
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onSlotClick(day, time, scheduleItem); }}>
                                <Edit className="h-2 w-2" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-white hover:bg-red-500/50" onClick={(e) => { e.stopPropagation(); onDelete(scheduleItem.id); }}>
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Indicador de múltiplas aulas */}
                      {items.length > 1 && (
                        <div className="text-center mt-1">
                          <Badge variant="outline" className="text-xs bg-white/90 text-orange-600 border-orange-300">
                            +{items.length} aulas
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`h-full border-2 border-dashed rounded-lg transition-all ${ canEdit ? 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 cursor-pointer flex items-center justify-center' : 'border-gray-200'}`}
                      onClick={() => canEdit && onSlotClick(day, time)}
                    >
                      {canEdit && <Plus className="h-6 w-6 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MobileScheduleView = ({ days, schedule, condominium, onSlotClick, canEdit, onDelete }) => (
  <div className="space-y-4 md:hidden">
    {days.map(day => {
      const dailySchedule = schedule[day] || {};
      const dailyActivities = [];
      
      // Processar horários para lidar com múltiplas aulas
      Object.entries(dailySchedule).forEach(([time, scheduleItems]) => {
        const items = Array.isArray(scheduleItems) ? scheduleItems : (scheduleItems ? [scheduleItems] : []);
        items.forEach(item => {
          if (item) dailyActivities.push({ time, ...item });
        });
      });
      
      dailyActivities.sort((a, b) => a.time.localeCompare(b.time));
      
      return (
        <Card key={day} className="border-orange-200 overflow-hidden shadow-md">
          <CardHeader className="p-0">
            <CardTitle className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-lg font-semibold">{day}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3 bg-orange-50/50">
            {dailyActivities.length > 0 ? (
              dailyActivities.map((scheduleItem, index) => (
                 <div key={`${scheduleItem.id || scheduleItem.time}-${index}`} className={`${scheduleItem.color} p-3 rounded-lg shadow-sm flex flex-col gap-3 text-white`}>
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold">{scheduleItem.activity_name}</h4>
                          <Badge className="bg-white/20 text-white font-semibold px-2 py-0.5">{scheduleItem.time}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-90">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{scheduleItem.duration} min</span></div>
                          <div className="flex items-center gap-1"><Users className="h-3 w-3" /><span>{scheduleItem.capacity} vagas</span></div>
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-90 mt-1"><MapPin className="h-3 w-3" /><span>{condominium?.name || "Local"}</span></div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 w-full mt-2 border-t border-white/20 pt-2">
                        <Button onClick={() => onSlotClick(day, scheduleItem.time, scheduleItem)} size="sm" variant="ghost" className="flex-1 bg-white/10 hover:bg-white/20">
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button onClick={() => onDelete(scheduleItem.id)} size="sm" variant="ghost" className="flex-1 bg-white/10 hover:bg-red-500/20">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">
                <p>Nenhuma atividade agendada.</p>
                {canEdit && <Button onClick={() => onSlotClick(day, '08:00')} size="sm" className="mt-2 bg-orange-500 hover:bg-orange-600"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>}
              </div>
            )}
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export default function Schedule() {
  const [schedule, setSchedule] = useState({});
  const [condominiums, setCondominiums] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState({ day: '', time: '', condominiumId: '' });
  const [selectedCondoId, setSelectedCondoId] = useState('');

  const loadScheduleForCondo = useCallback(async (condoId) => {
    if (!condoId) {
      setSchedule({});
      return;
    }
    
    // Buscar todos os horários e filtrar pelo condomínio selecionado
    const allSchedules = await WeeklySchedule.list();
    const selectedCondo = condominiums.find(c => c.id === condoId);
    
    // Filter schedules based on condominium_id matching either the condo ID or its lowercase name
    const condoSchedules = allSchedules.filter(scheduleItem => 
      scheduleItem.condominium_id === condoId ||
      (selectedCondo && scheduleItem.condominium_id === selectedCondo.name?.toLowerCase())
    );
    
    const scheduleData = {};
    
    for (const item of condoSchedules) {
      if (!scheduleData[item.day_of_week]) scheduleData[item.day_of_week] = {};
      
      // Ensure the slot holds an array of schedule items
      if (!scheduleData[item.day_of_week][item.time]) {
        scheduleData[item.day_of_week][item.time] = [];
      }
      
      // If it's not already an array (e.g., from old data structure), convert it
      if (!Array.isArray(scheduleData[item.day_of_week][item.time])) {
        scheduleData[item.day_of_week][item.time] = [scheduleData[item.day_of_week][item.time]];
      }
      
      scheduleData[item.day_of_week][item.time].push(item);
    }
    
    setSchedule(scheduleData);
  }, [condominiums]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [currentUser, allCondos] = await Promise.all([
      User.me().catch(() => null),
      Condominium.list()
    ]);
    setUser(currentUser);
    setCondominiums(allCondos);

    const initialCondoId = currentUser?.condominium_id && allCondos.some(c => c.id === currentUser.condominium_id) 
      ? currentUser.condominium_id 
      : allCondos[0]?.id || '';
      
    setSelectedCondoId(initialCondoId);
    
    // The initial load will happen via the useEffect watching selectedCondoId
    // If initialCondoId is empty, schedule will be set to {} by loadScheduleForCondo
    
    setIsLoading(false);
  }, []); // fetchData no longer needs loadScheduleForCondo in its deps, as loadScheduleForCondo is called indirectly via selectedCondoId's effect.

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Only load schedule if condominiums are loaded and selectedCondoId is set
    if (selectedCondoId && condominiums.length > 0) {
      loadScheduleForCondo(selectedCondoId);
    } else if (selectedCondoId === '' && condominiums.length > 0) {
      // If no condo is selected (e.g., no default or user is not assigned), clear schedule
      setSchedule({});
    }
  }, [selectedCondoId, condominiums, loadScheduleForCondo]);

  const isAdmin = user?.user_type === 'admin';

  const handleSlotClick = (day, time, existingSchedule = null) => {
    if (!isAdmin) return;
    setSelectedSlot({ day, time, condominiumId: selectedCondoId });
    setEditingSchedule(existingSchedule);
    setIsSlotFormOpen(true);
  };

  const handleSave = async () => {
    await loadScheduleForCondo(selectedCondoId);
    setIsSlotFormOpen(false);
    setIsBatchFormOpen(false);
    setEditingSchedule(null);
  };

  const handleDelete = async (scheduleId) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza que deseja excluir este horário?')) {
      await WeeklySchedule.delete(scheduleId);
      await loadScheduleForCondo(selectedCondoId);
    }
  };

  const selectedCondo = condominiums.find(c => c.id === selectedCondoId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto p-4 md:p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-md"><Calendar className="h-8 w-8 text-orange-600" /></div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Grade de Horários</h1>
                <p className="text-gray-600 mt-1">{isAdmin ? 'Gerencie a grade semanal fixa' : 'Consulte os horários das atividades'}</p>
              </div>
            </div>
          </div>
        </header>

        <Card className="border-orange-200 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6 border-b border-orange-200">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                   <CardTitle className="text-orange-700 text-xl flex items-center gap-3">
                     <ActivityIcon className="h-6 w-6" />
                     Horários Fixos da Semana
                   </CardTitle>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsBatchFormOpen(true)} variant="outline" className="flex-1 border-orange-300 text-orange-600">
                       <CalendarPlus className="h-4 w-4 mr-2" />
                       Adicionar em Lote
                    </Button>
                  </div>
                )}
             </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? <LoadingSpinner text="Carregando dados..." /> :
              condominiums.length === 0 ? <div className="text-center py-8 text-gray-500"><p>Nenhum condomínio cadastrado.</p></div> :
              (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Condomínio:</label>
                    <Select value={selectedCondoId} onValueChange={setSelectedCondoId}>
                      <SelectTrigger className="w-full bg-orange-50 border-orange-300"><SelectValue placeholder="Escolha um condomínio..." /></SelectTrigger>
                      <SelectContent>{condominiums.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCondoId ? (
                    <>
                      <MobileScheduleView days={weekDays} schedule={schedule} condominium={selectedCondo} onSlotClick={handleSlotClick} canEdit={isAdmin} onDelete={handleDelete} />
                      <ScheduleGrid days={weekDays} schedule={schedule} timeSlots={timeSlots} onSlotClick={handleSlotClick} canEdit={isAdmin} onDelete={handleDelete} />
                    </>
                  ) : <p className="text-center text-gray-500">Por favor, selecione um condomínio para ver a grade.</p>}
                </>
              )
            }
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <ScheduleSlotForm
              isOpen={isSlotFormOpen}
              onOpenChange={setIsSlotFormOpen}
              slot={selectedSlot}
              existingSchedule={editingSchedule}
              onSave={handleSave}
            />
            <BatchScheduleForm
              isOpen={isBatchFormOpen}
              onOpenChange={setIsBatchFormOpen}
              condominiumId={selectedCondoId}
              onSave={handleSave}
            />
          </>
        )}
      </div>
    </div>
  );
}
