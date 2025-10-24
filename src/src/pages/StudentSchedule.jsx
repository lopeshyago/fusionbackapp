
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Activity as ActivityIcon, Sun, CheckCircle, XCircle, Slash } from "lucide-react";
import { WeeklySchedule } from "@/api/entities";
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { Booking } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavBar from "../components/student/BottomNavBar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { useOffline } from "../components/common/OfflineManager";

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
];
const weekDayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState({});
  const [user, setUser] = useState(null);
  const [condominium, setCondominium] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsCount, setBookingsCount] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { isOnline } = useOffline();
  
  // Memoize date calculations to prevent re-creation on every render, which was causing an infinite loop
  const { weekStart, weekEnd, weekDates, today } = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return { weekStart, weekEnd, weekDates, today };
  }, []); // Empty dependency array ensures this runs only once per component mount

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (!currentUser.condominium_id) {
        throw new Error("Você não está associado a um condomínio. Por favor, complete seu perfil.");
      }
      
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');

      const [allSchedules, condos, weeklyBookings] = await Promise.all([
        WeeklySchedule.list(),
        Condominium.list(),
        Booking.filter({ 
          booking_date: { 
            '$gte': startDate, 
            '$lte': endDate 
          }
        })
      ]);
      
      const userCondo = condos.find(c => c.id === currentUser.condominium_id);
      setCondominium(userCondo);

      const condoSchedules = allSchedules.filter(schedule => 
        schedule.condominium_id === userCondo?.name?.toLowerCase() || 
        schedule.condominium_id === currentUser.condominium_id
      );

      const bookingsCountData = weeklyBookings.reduce((acc, booking) => {
        const key = `${booking.weekly_schedule_id}_${booking.booking_date}`;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key]++;
        return acc;
      }, {});
      setBookingsCount(bookingsCountData);

      const currentUserBookings = weeklyBookings.filter(b => b.user_id === currentUser.id);
      setUserBookings(currentUserBookings);

      const scheduleData = {};
      for (const item of condoSchedules) {
        if (!scheduleData[item.day_of_week]) scheduleData[item.day_of_week] = {};
        scheduleData[item.day_of_week][item.time] = item;
      }
      setSchedule(scheduleData);

    } catch (e) {
      if (e.message.includes('Rate limit exceeded') || e.message.includes('429')) {
        setError("O servidor está sobrecarregado. Por favor, aguarde alguns segundos e tente recarregar a página.");
      } else {
        setError(e.message);
      }
    }
    setIsLoading(false);
  }, [weekStart, weekEnd]); // Dependencies are now stable due to useMemo

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckin = async (scheduleItem) => {
    if (!user || !scheduleItem) return;

    if (isCheckedIn(scheduleItem.id)) {
      alert("Você já fez check-in para esta aula hoje.");
      return;
    }

    try {
      await Booking.create({
        user_id: user.id,
        weekly_schedule_id: scheduleItem.id,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        status: "presente",
        checkin_time: new Date().toISOString()
      });
      alert("Check-in realizado com sucesso!");
      // Re-fetch all data to update counts
      await loadData();
    } catch (error) {
      console.error("Erro no check-in:", error);
      alert("Não foi possível fazer o check-in.");
    }
  };

  const isCheckedIn = (scheduleId) => {
    // Changed to use selectedDate, which is currently always today
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return userBookings.some(b => 
      b.weekly_schedule_id === scheduleId && 
      b.booking_date === dateString
    );
  };
  
  const renderDaySchedule = (date) => {
    const dayName = weekDayNames[date.getDay()];
    const dailyActivities = schedule[dayName] ? Object.values(schedule[dayName]).sort((a, b) => a.time.localeCompare(b.time)) : [];
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

    return (
      <Card key={dayName} className="border-orange-200 overflow-hidden shadow-md">
        <CardHeader className="p-0">
          <CardTitle className={`text-white text-center py-2 text-lg font-semibold ${isToday ? 'bg-gradient-to-r from-orange-600 to-orange-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}>
            {dayName} - {format(date, 'dd/MM')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3 bg-orange-50/50">
          {dailyActivities.length > 0 ? (
            dailyActivities.map((item) => {
              
              const dateString = format(date, 'yyyy-MM-dd');
              const bookingKey = `${item.id}_${dateString}`;
              const currentBookings = bookingsCount[bookingKey] || 0;
              const spotsLeft = item.capacity - currentBookings;
              const isFull = spotsLeft <= 0;

              let isPastClassTime = false;
              if (isToday) {
                const now = new Date();
                const [hours, minutes] = item.time.split(':');
                const classTimeToday = new Date();
                classTimeToday.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                isPastClassTime = now > classTimeToday;
              }

              return (
                <div key={item.id} className="p-3 bg-white border border-orange-200 rounded-lg shadow-sm flex flex-col gap-3">
                  <div className="flex items-start gap-3 w-full">
                    {/* Added fallback color 'bg-orange-500' if item.color is undefined */}
                    <div className={`w-2 shrink-0 h-full min-h-[50px] rounded-full ${item.color || 'bg-orange-500'}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-800">{item.activity_name}</h4>
                        <Badge className="bg-orange-600 text-white font-semibold px-2 py-0.5">{item.time}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{item.duration} min</span></div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className={`${isFull ? 'text-red-600 font-semibold' : ''}`}>
                            {isFull ? "Esgotado" : `${spotsLeft} vagas restantes`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1"><MapPin className="h-3 w-3" /><span>{condominium?.name || "Local"}</span></div>
                    </div>
                  </div>
                  {isToday && (
                    <div className="w-full">
                      {isCheckedIn(item.id) ? (
                        <Badge className="bg-green-100 text-green-800 w-full justify-center py-2 flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4" /> Check-in Feito
                        </Badge>
                      ) : isPastClassTime ? (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300 w-full justify-center py-2 flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4" /> Tempo Esgotado
                        </Badge>
                      ) : isFull ? (
                         <Badge variant="destructive" className="w-full justify-center py-2 flex items-center gap-2 text-sm">
                          <Slash className="h-4 w-4" /> Aula Cheia
                        </Badge>
                      ) : (
                        <Button onClick={() => handleCheckin(item)} className="w-full bg-orange-500 hover:bg-orange-600">
                          <CheckCircle className="h-4 w-4 mr-2" /> Fazer Check-in
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : <p className="text-center text-gray-500 py-6">Nenhuma atividade agendada.</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto p-4 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Grade de Horários</h1>
            <p className="text-gray-600 mt-1">{condominium ? condominium.name : "Consulte os horários da semana"}</p>
          </div>
        </div>
        
        {isLoading ? <LoadingSpinner text="Carregando horários..." /> :
         error ? <ErrorMessage title="Erro ao carregar" message={error} onRetry={loadData} /> :
         (
          <div className="space-y-4">
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-orange-200">
              <h2 className="text-xl font-bold text-orange-700">Horários da Semana</h2>
              <p className="text-gray-600">Aulas disponíveis de {format(weekStart, 'dd/MM')} a {format(weekEnd, 'dd/MM')}</p>
            </div>
            {weekDates.map(date => renderDaySchedule(date))}
          </div>
         )
        }
      </div>
      <BottomNavBar activePage="StudentSchedule" />
    </div>
  );
}
