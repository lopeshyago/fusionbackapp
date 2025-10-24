
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Users, MapPin, Calendar, Activity } from "lucide-react";
import { 
  User, 
  LessonPlan, 
  Booking, 
  Condominium 
} from "@/api/entities_new";
import BottomNavBar from "../components/student/BottomNavBar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOfflineCheckin } from "../components/common/OfflineDataManager";
import { useOffline } from "../components/common/OfflineManager";

export default function StudentCheckin() {
  const [user, setUser] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [condominium, setCondominium] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isOnline, cache } = useOffline();
  const { doCheckin } = useOfflineCheckin();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Tentar carregar do cache se offline, ou da API se online
      let currentUser;
      if (!isOnline) {
        currentUser = cache.get(cache.CACHE_KEYS.USER_PROFILE);
        if (!currentUser) {
          setIsLoading(false);
          // If offline and no user profile cached, we can't proceed.
          // Maybe show an error message or redirect.
          console.warn("Offline but no user profile found in cache.");
          return;
        }
      } else {
        currentUser = await User.me();
      }
      
      setUser(currentUser);
      
      if (!currentUser.condominium_id) {
        setIsLoading(false);
        return;
      }

      // Carregar condomínio
      let condoData;
      if (!isOnline) {
        const cachedCondos = cache.get(cache.CACHE_KEYS.CONDOMINIUMS) || [];
        condoData = cachedCondos.find(c => c.id === currentUser.condominium_id);
      } else {
        const condos = await Condominium.filter({ id: currentUser.condominium_id });
        condoData = condos.length > 0 ? condos[0] : null;
      }
      if (condoData) setCondominium(condoData);

      // Pegar data de hoje
      const today = new Date();
      
      // Carregar aulas de hoje
      let fetchedLessonPlans;
      if (!isOnline) {
        const cachedSchedule = cache.get(`${cache.CACHE_KEYS.SCHEDULE}_${currentUser.condominium_id}`) || [];
        fetchedLessonPlans = cachedSchedule; // This cached data should ideally be pre-filtered by date or handle all dates.
                                            // The current outline implies the cached schedule might contain all lessons for the condominiun,
                                            // and we then filter it for today.
      } else {
        fetchedLessonPlans = await LessonPlan.filter({ 
          condominium_id: currentUser.condominium_id 
        });
      }

      // Filtrar apenas as aulas de hoje, corrigindo problema de fuso horário
      const todayLessonPlans = fetchedLessonPlans.filter(plan => {
        // Adicionar 'T00:00:00' para tratar a data como local e evitar erros de fuso
        const planDate = new Date(plan.date + 'T00:00:00');
        return planDate.toDateString() === today.toDateString();
      });
      
      setTodayClasses(todayLessonPlans);

      // Carregar bookings do usuário para hoje
      let bookings;
      if (!isOnline) {
        bookings = cache.get(`bookings_${currentUser.id}`) || [];
      } else {
        bookings = await Booking.filter({ user_id: currentUser.id });
      }
      setUserBookings(bookings);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Optionally, show a user-friendly error message if data couldn't be loaded even from cache
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, cache]);

  useEffect(() => {
    loadData();
  }, [loadData]); // Re-run loadData when online status changes to attempt re-sync or fetch fresh data

  const handleCheckin = async (lessonPlanId) => {
    try {
      const result = await doCheckin(lessonPlanId, user.id);
      
      if (result.success) {
        if (result.offline) {
          alert("Check-in salvo! Será sincronizado quando a conexão for restabelecida.");
        } else {
          alert("Check-in realizado com sucesso!");
        }
        
        // Atualizar estado local para refletir o novo booking imediatamente
        // This simulates what a successful booking would look like in the local state.
        // The `id` might not be the real database ID but it's enough for local rendering.
        const newBooking = {
          id: Date.now(), // Unique ID for local state, not necessarily the server ID
          user_id: user.id,
          lesson_plan_id: lessonPlanId,
          status: "presente"
        };
        
        // Check if a booking for this lesson plan already exists in userBookings
        // If it exists and its status is not 'presente', update it.
        // If it doesn't exist, add the new booking.
        let updatedBookings;
        const existingBookingIndex = userBookings.findIndex(b => b.lesson_plan_id === lessonPlanId);
        
        if (existingBookingIndex !== -1) {
            updatedBookings = [...userBookings];
            updatedBookings[existingBookingIndex] = { 
                ...updatedBookings[existingBookingIndex], 
                status: "presente" 
            };
        } else {
            updatedBookings = [...userBookings, newBooking];
        }

        setUserBookings(updatedBookings);
        
        // Atualizar cache de bookings
        cache.set(`bookings_${user.id}`, updatedBookings, cache.CACHE_DURATION.SHORT);

      } else {
        // If doCheckin returns success: false, it means an error occurred within it.
        alert('Erro ao fazer check-in. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      alert('Erro ao fazer check-in. Tente novamente.');
    }
  };

  const getBookingStatus = (lessonPlanId) => {
    const booking = userBookings.find(b => b.lesson_plan_id === lessonPlanId);
    return booking?.status || null;
  };

  const isCheckedIn = (lessonPlanId) => {
    return getBookingStatus(lessonPlanId) === "presente";
  };

  const canCheckin = (lessonPlan) => {
    const now = new Date();
    const classTime = new Date();
    const [hours, minutes] = lessonPlan.time.split(':');
    
    // Set classTime to today's date with the lesson's time
    classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const isSameDay = now.toDateString() === classTime.toDateString();
    // Permite check-in a qualquer hora no dia da aula, até o final da aula.
    const checkinEnd = new Date(classTime.getTime() + lessonPlan.duration * 60 * 1000);
    
    return isSameDay && now <= checkinEnd;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CheckCircle className="h-8 w-8" />
            Check-in
            {!isOnline && <span className="bg-orange-500 px-2 py-1 rounded-full text-sm ml-2">OFFLINE</span>}
          </h1>
          <p className="text-sm opacity-80">
            {isOnline ? "Faça check-in nas suas aulas de hoje" : "Check-ins offline serão sincronizados automaticamente"}
          </p>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6 pb-20">
        {!user?.condominium_id ? (
          <Card className="border-orange-200 text-center">
            <CardContent className="p-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Condomínio não associado</h3>
              <p className="text-gray-500">Complete seu perfil para fazer check-in nas aulas.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando aulas de hoje...</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <Card className="border-orange-200 text-center">
            <CardContent className="p-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma aula hoje</h3>
              <p className="text-gray-500">Não há aulas programadas para hoje no seu condomínio.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Aulas de Hoje - {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayClasses
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((lessonPlan) => {
                      const checkedIn = isCheckedIn(lessonPlan.id);
                      const canDoCheckin = canCheckin(lessonPlan);
                      
                      return (
                        <div 
                          key={lessonPlan.id} 
                          className="p-4 border border-orange-200 rounded-lg bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                {lessonPlan.activity_name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{lessonPlan.time} - {lessonPlan.duration} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{lessonPlan.capacity} vagas</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{condominium?.areas?.[0] || "Local"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {checkedIn ? (
                                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Check-in Feito
                                </Badge>
                              ) : canDoCheckin ? (
                                <Button 
                                  onClick={() => handleCheckin(lessonPlan.id)}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Fazer Check-in
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Check-in Encerrado
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {!canDoCheckin && !checkedIn && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              O check-in para esta aula já foi encerrado.
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <BottomNavBar activePage="StudentCheckin" />
    </div>
  );
}
