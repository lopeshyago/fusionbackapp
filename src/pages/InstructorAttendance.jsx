
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, ArrowLeft, Clock, Users, Calendar, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { WeeklySchedule } from "@/api/entities";
import { Booking } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";
import { rateLimiter } from "../components/common/RateLimiter";
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function InstructorAttendance() {
  const [instructor, setInstructor] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadClassesForCondo = useCallback(async (condoId) => {
    if (!condoId || condominiums.length === 0) {
      setTodayClasses([]);
      setIsLoading(false); // Ensure loading is turned off if no condo selected
      return;
    }
    
    setIsLoading(true);
    try {
      // Use rate limiter to control API calls
      const result = await rateLimiter.executeRequest(async () => {
        const todayString = format(new Date(), 'yyyy-MM-dd');
        const selectedCondo = condominiums.find(c => c.id === condoId);
        
        // Single request to get all schedules
        const allSchedules = await WeeklySchedule.list();
        
        const weeklySchedules = allSchedules.filter(schedule => 
          schedule.condominium_id === selectedCondo?.name?.toLowerCase() || 
          schedule.condominium_id === condoId
        );
        
        if (weeklySchedules.length === 0) {
          return [];
        }

        const scheduleIds = weeklySchedules.map(ws => ws.id);
        
        // Single request to get all bookings
        const allBookings = await Booking.list();
        const todayBookings = allBookings.filter(booking => 
          booking.booking_date === todayString &&
          scheduleIds.includes(booking.weekly_schedule_id) &&
          booking.status === "presente"
        );

        // Group bookings by schedule
        const bookingsBySchedule = todayBookings.reduce((acc, booking) => {
          if (!acc[booking.weekly_schedule_id]) {
            acc[booking.weekly_schedule_id] = [];
          }
          acc[booking.weekly_schedule_id].push(booking);
          return acc;
        }, {});

        // Get user data if needed
        const userIds = todayBookings.map(b => b.user_id);
        let usersById = {};
        if (userIds.length > 0) {
          const allUsers = await User.list();
          const users = allUsers.filter(u => userIds.includes(u.id));
          usersById = users.reduce((acc, u) => {
            acc[u.id] = u;
            return acc;
          }, {});
        }

        // Build final structure
        const classesForToday = weeklySchedules
          .map(schedule => {
            const bookingsForThisClass = bookingsBySchedule[schedule.id] || [];
            const enrichedBookings = bookingsForThisClass.map(booking => ({
              ...booking,
              user: usersById[booking.user_id]
            }));
            return { ...schedule, bookings: enrichedBookings };
          })
          .sort((a, b) => a.time.localeCompare(b.time));
        
        return classesForToday;
      }, `classes-${condoId}`); // Unique key for this request
      
      setTodayClasses(result);

    } catch (error) {
      console.error("Erro ao carregar dados de frequência:", error);
      if (error.message && error.message.includes('429')) {
        alert("Muitas requisições. Por favor, aguarde alguns segundos antes de tentar novamente.");
      }
    }
    setIsLoading(false);
  }, [condominiums]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use rate limiter for initial data loading
      const result = await rateLimiter.executeRequest(async () => {
        const [currentUser, allCondos] = await Promise.all([
          User.me(),
          Condominium.list()
        ]);
        return { currentUser, allCondos };
      }, 'initial-data'); // Unique key for this request
      
      const { currentUser, allCondos } = result;
      setInstructor(currentUser);
      setCondominiums(allCondos);

      // Set initial condo ID
      const initialCondoId = currentUser.condominium_id && allCondos.some(c => c.id === currentUser.condominium_id) 
        ? currentUser.condominium_id 
        : allCondos[0]?.id || '';
        
      setSelectedCondoId(initialCondoId);

    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      if (error.message && error.message.includes('429')) {
        alert("Servidor sobrecarregado. Aguarde alguns segundos e recarregue a página.");
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Depend on loadInitialData since it's useCallback

  // Only load classes when both condoId and condominiums are available
  useEffect(() => {
    if (selectedCondoId && condominiums.length > 0) {
      // Add a small delay to prevent rapid successive calls (debouncing)
      const timeoutId = setTimeout(() => {
        loadClassesForCondo(selectedCondoId);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or re-render
    }
  }, [selectedCondoId, condominiums, loadClassesForCondo]); // Depend on loadClassesForCondo since it's useCallback

  const selectedCondo = condominiums.find(c => c.id === selectedCondoId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserCheck className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-2xl font-bold">Controle de Frequência</h1>
          </div>
          <Link to={createPageUrl("Index")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Seletor de Condomínio */}
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <MapPin className="h-5 w-5" />
                <span>Selecionar Condomínio:</span>
              </div>
              
              {condominiums.length === 0 && isLoading ? (
                <LoadingSpinner text="Carregando condomínios..." />
              ) : condominiums.length === 0 && !isLoading ? (
                <p className="text-gray-500">Nenhum condomínio disponível.</p>
              ) : (
                <Select value={selectedCondoId} onValueChange={setSelectedCondoId}>
                  <SelectTrigger className="w-full bg-orange-50 border-orange-300">
                    <SelectValue placeholder="Escolha um condomínio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                          {instructor?.condominium_id === c.id && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Meu condomínio</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check-ins do Condomínio Selecionado */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Check-ins de Hoje - {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
            {selectedCondo && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedCondo.name}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCondoId ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Selecione um condomínio para visualizar os check-ins.</p>
              </div>
            ) : isLoading ? (
              <LoadingSpinner text="Carregando check-ins..." />
            ) : todayClasses.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhuma aula cadastrada para hoje neste condomínio.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {todayClasses.map((lessonPlan) => (
                  <Card key={lessonPlan.id} className="border-orange-100">
                    <CardHeader className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <CardTitle className="text-orange-700 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          {lessonPlan.activity_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {lessonPlan.time}
                          </Badge>
                          <Badge className={`flex items-center gap-1 ${lessonPlan.bookings.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            <CheckCircle className="h-4 w-4" />
                            {lessonPlan.bookings.length} check-ins
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Capacidade: {lessonPlan.capacity}
                          </span>
                          <span>Duração: {lessonPlan.duration} min</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {lessonPlan.bookings.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p>Nenhum aluno fez check-in ainda.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700 mb-3">
                            Alunos presentes ({lessonPlan.bookings.length}):
                          </h4>
                          {lessonPlan.bookings.map(booking => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={booking.user?.profile_photo_url} alt={booking.user?.full_name} />
                                  <AvatarFallback className="bg-green-100 text-green-700">
                                    {booking.user?.full_name?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">
                                    {booking.user?.full_name || 'Nome não disponível'}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Check-in: {booking.checkin_time ? format(new Date(booking.checkin_time), 'HH:mm') : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Presente
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <InstructorBottomNavBar activePage="InstructorAttendance" />
    </div>
  );
}
