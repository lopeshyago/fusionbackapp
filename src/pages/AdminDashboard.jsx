import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap, Bell, Calendar, BarChart3, Users } from "lucide-react";
import AdminBottomNavBar from "../components/admin/AdminBottomNavBar";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";

const logoUrl = "/fusionlogo.png";

const AdminDashboard = () => {
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
            <p className="text-gray-700">Bem-vindo ao painel administrativo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Building2 className="w-6 h-6" />
                  Condomínios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Cadastre e gerencie locais</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminCondominiums")}
                >
                  Gerenciar Locais
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <GraduationCap className="w-6 h-6" />
                  Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Instrutores e permissões</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminTeam")}
                >
                  Ver Equipe
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Bell className="w-6 h-6" />
                  Avisos e Comunicados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Envie avisos para todos os usuários</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("Notices")}
                >
                  Gerenciar Avisos
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Calendar className="w-6 h-6" />
                  Grade de Horários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Adicione e edite aulas</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("Schedule")}
                >
                  Gerenciar Grade
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <Users className="w-6 h-6" />
                  Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Gerenciar alunos e instrutores</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminUsers")}
                >
                  Gerenciar Usuários
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <BarChart3 className="w-6 h-6" />
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Análises e métricas</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminReports")}
                >
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AdminBottomNavBar activePage="Index" />
    </div>
  );
};

export default AdminDashboard;
