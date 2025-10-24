import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Plus, Calculator, UserCheck, Wrench } from "lucide-react";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";

const logoUrl = "/fusionlogo.png";

const InstructorDashboard = () => {
  const { navigateTo } = useOptimizedNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { User } = await import("@/api/entities_new");
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        navigateTo('Index');
      }
    };
    loadUser();
  }, [navigateTo]);

  const handleLogout = () => {
    localStorage.clear();
    navigateTo('Index');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-8 w-auto max-w-[120px] object-contain" />
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
            <p className="text-gray-700">Bem-vindo ao painel instrutor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <GraduationCap className="w-6 h-6" />
                  Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Fichas e evolução dos alunos</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("InstructorStudents")}
                >
                  Ver Alunos
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Plus className="w-6 h-6" />
                  Criar Treino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Crie, gerencie e atribua treinos</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("InstructorWorkouts")}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Calculator className="w-6 h-6" />
                  Avaliações Físicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Adipômetro e circunferências</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("InstructorAssessments")}
                >
                  Fazer Avaliações
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <UserCheck className="w-6 h-6" />
                  Visualização de Check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Acompanhe os check-ins das aulas</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("InstructorAttendance")}
                >
                  Visualizar Check-ins
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Wrench className="w-6 h-6" />
                  Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Reportar problemas em equipamentos</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("InstructorMaintenance")}
                >
                  Abrir Chamado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <InstructorBottomNavBar activePage="Index" />
    </div>
  );
};

export default InstructorDashboard;
