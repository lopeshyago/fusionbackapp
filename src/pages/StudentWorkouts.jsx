
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, CheckCircle, Clock, Calendar, ArrowLeft, 
  TrendingUp, Target, Award 
} from "lucide-react";
// Removed Link import as it's no longer directly used for navigation within this component's header
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Workout } from "@/api/entities";
import { WorkoutSession } from "@/api/entities";
import WorkoutTimer from "../components/student/WorkoutTimer";
import WorkoutSessionSelector from "../components/student/WorkoutSessionSelector";
import BottomNavBar from "../components/student/BottomNavBar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage"; // New import
import { useOptimizedNavigation } from '../components/common/NavigationHelper'; // New import

export default function StudentWorkouts() {
  const { navigateTo } = useOptimizedNavigation(); // Initialize optimized navigation
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // New state for error handling

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors on new load attempt
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Buscar treinos atribuídos ao aluno
      const assignedWorkouts = await Workout.filter({ student_id: currentUser.id });
      setWorkouts(assignedWorkouts);
      
      // Buscar sessões de treino (histórico)
      const sessions = await WorkoutSession.filter({ student_id: currentUser.id });
      setWorkoutSessions(sessions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)));
    } catch (err) { // Renamed 'error' to 'err' to avoid conflict with state variable
      console.error('Erro ao carregar treinos:', err);
      setError('Não foi possível carregar seus treinos. Verifique sua conexão e tente novamente.'); // Set user-friendly error message
    }
    setIsLoading(false);
  }, []); // Empty dependency array as loadData itself doesn't depend on changing props/state for its definition

  useEffect(() => {
    loadData(); // Call loadData when component mounts
  }, [loadData]); // Dependency on memoized loadData ensures it's called only when necessary

  const startWorkout = (workout, sessionLetter = null) => {
    setActiveWorkout({ ...workout, selectedSession: sessionLetter });
  };

  const completeWorkout = async (workoutId, exercises, duration) => {
    try {
      await WorkoutSession.create({
        student_id: user.id,
        workout_id: workoutId,
        exercises_completed: exercises,
        completed_at: new Date().toISOString(),
        duration_minutes: duration
      });
      
      setActiveWorkout(null);
      await loadData(); // Reload data to show updated history
    } catch (err) { // Renamed 'error' to 'err'
      console.error('Erro ao completar treino:', err);
      setError('Não foi possível registrar o treino. Tente novamente.'); // Set error message
    }
  };

  const getWorkoutStats = () => {
    const thisWeekSessions = workoutSessions.filter(session => {
      const sessionDate = new Date(session.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });
    
    return {
      totalSessions: workoutSessions.length,
      thisWeekSessions: thisWeekSessions.length,
    };
  };

  const stats = getWorkoutStats();

  if (activeWorkout) {
    return (
      <WorkoutTimer 
        workout={activeWorkout} 
        onComplete={completeWorkout}
        onCancel={() => setActiveWorkout(null)}
      />
    );
  }

  if (isLoading) {
    // During initial loading, only display the spinner
    return <LoadingSpinner text="Carregando seus treinos..." />;
  }

  // Function to render the main content, separated for conditional rendering
  const renderWorkoutContent = () => {
    return (
      <>
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-orange-700">{stats.totalSessions}</p>
              <p className="text-sm text-gray-600">Treinos Concluídos</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{stats.thisWeekSessions}</p>
              <p className="text-sm text-gray-600">Esta Semana</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Treinos Ativos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {workouts.length === 0 ? (
              <EmptyState 
                icon={Activity}
                title="Nenhum treino ativo"
                description="Seu instrutor ainda não atribuiu treinos para você."
                className="mt-6"
              />
            ) : (
              <div className="workout-list space-y-4">
                {workouts.map((workout) => (
                  <Card key={workout.id} className="border-orange-200 hover:shadow-lg transition-shadow interactive-element">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl text-gray-800">{workout.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-orange-100 text-orange-800">
                              {workout.objective}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                       <WorkoutSessionSelector
                          workout={workout}
                          onSessionSelect={(sessionLetter) => startWorkout(workout, sessionLetter)}
                        />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {workoutSessions.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="Nenhum treino concluído"
                description="Complete seu primeiro treino para ver o histórico aqui."
                className="mt-6"
              />
            ) : (
              <div className="workout-list space-y-4">
                {workoutSessions.map((session) => (
                  <Card key={session.id} className="border-orange-200 interactive-element">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              Treino Concluído
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(session.completed_at).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.duration_minutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {session.exercises_completed?.length || 0} exercícios
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Completo
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Main content container with consistent padding */}
      <div className="container mx-auto p-4 md:p-6 pb-24 scroll-container">
        {/* New header structure with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('Index')} className="text-gray-600 hover:bg-gray-200 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-md">
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Meus Treinos</h1>
              <p className="text-gray-600 mt-1">Acompanhe sua rotina e evolução</p>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorMessage title="Erro ao carregar" message={error} onRetry={loadData} />
        ) : (
          renderWorkoutContent() // Render main content if no error
        )}
      </div>
      <BottomNavBar activePage="StudentWorkouts" />
    </div>
  );
}
