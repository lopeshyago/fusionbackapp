import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Activity, BarChart3, MessageCircle, User as UserIcon, AlertCircle } from "lucide-react";
import BottomNavBar from "../components/student/BottomNavBar";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";

const logoUrl = "/fusionlogo.png";

const StudentDashboard = () => {
  const { navigateTo } = useOptimizedNavigation();
  const [user, setUser] = useState(null);
  const [showMedicalWarning, setShowMedicalWarning] = useState(false);
  const [daysLeft, setDaysLeft] = useState(30);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { User } = await import("@/api/entities_new");
        const currentUser = await User.me();
        setUser(currentUser);

        // Medical warning logic
        if (currentUser?.user_type === 'student' && currentUser?.par_q_has_risk && !currentUser?.medical_certificate_url && currentUser?.medical_certificate_required_date) {
          const requiredDate = new Date(currentUser.medical_certificate_required_date);
          const today = new Date();
          const gracePeriodEnd = new Date(requiredDate.getTime() + (30 * 24 * 60 * 60 * 1000));
          const daysDiff = Math.ceil((gracePeriodEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          setDaysLeft(daysDiff);
          setShowMedicalWarning(true);
        }
      } catch (error) {
        navigateTo('Index');
      }
    };
    loadUser();
  }, [navigateTo]);

  const handleLogout = () => {
    localStorage.clear();
    // Clear any cached form data
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }
    navigateTo('Index');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Painel do Aluno</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-white/20">
            Sair
          </Button>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 min-h-screen">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Olá, {user?.full_name}!</h2>
            <p className="text-gray-700">Bem-vindo ao seu espaço fitness.</p>
          </div>

          {showMedicalWarning && (
            <Card className={`mb-6 border-2 ${daysLeft <= 7 ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`h-6 w-6 mt-1 ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold ${daysLeft <= 7 ? 'text-red-800' : 'text-yellow-800'}`}>
                      {daysLeft <= 0 ? "Conta Bloqueada - Atestado Médico Obrigatório" :
                       daysLeft <= 7 ? "Atenção: Prazo para Atestado Médico se Encerrando" :
                       "Atestado Médico Recomendado"}
                    </h3>
                    <p className={`mt-1 ${daysLeft <= 7 ? 'text-red-700' : 'text-yellow-700'}`}>
                      {daysLeft <= 0 ?
                        "Seu acesso foi bloqueado. Anexe seu atestado médico para continuar usando o sistema." :
                        `Você tem ${daysLeft} dias restantes para anexar seu atestado médico. Após esse período, sua conta será bloqueada.`
                      }
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className={daysLeft <= 7 ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"}
                        onClick={() => navigateTo("MedicalCertificate")}
                      >
                        {user.medical_certificate_url ? "Ver Atestado" : "Anexar Atestado"}
                      </Button>
                      {daysLeft > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setShowMedicalWarning(false)}>
                          Lembrar Depois
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <UserIcon className="w-6 h-6" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Visualize e edite seus dados pessoais</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("StudentProfile")}
                >
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Calendar className="w-6 h-6" />
                  Horários das Aulas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Consulte a grade e faça check-in</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("StudentSchedule")}
                >
                  Ver Horários
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Activity className="w-6 h-6" />
                  Meus Treinos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Acesse seus treinos e histórico</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("StudentWorkouts")}
                >
                  Ver Treinos
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <BarChart3 className="w-6 h-6" />
                  Minha Evolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Gráficos e métricas corporais</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("StudentEvolution")}
                >
                  Ver Evolução
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <MessageCircle className="w-6 h-6" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Converse com instrutores</p>
                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all"
                  onClick={() => navigateTo("ChatList")}
                >
                  Abrir Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNavBar activePage="Index" />
    </div>
  );
};

export default StudentDashboard;
