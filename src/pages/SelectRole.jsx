import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, Clock, Bell, Activity, ArrowRight, Plus, QrCode, MessageCircle, BarChart3, AlertTriangle, Play, Calculator, ArrowLeft, Building2, CheckCircle, UserCheck, AlertCircle, User as UserIcon, Wrench, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities_new";
import { ParqResponse } from "@/api/entities_new";
import { AdminInvite } from "@/api/entities_new";
import BottomNavBar from "../components/student/BottomNavBar";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";
import AdminBottomNavBar from "../components/admin/AdminBottomNavBar";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const logoUrl = "/fusionlogo.png";

const StudentDashboard = ({ user, onBack }) => {
  const { navigateTo } = useOptimizedNavigation();
  const [showMedicalWarning, setShowMedicalWarning] = useState(false);
  const [daysLeft, setDaysLeft] = useState(30);

  useEffect(() => {
    // Only show warning if user is a student, has risk, no certificate, and a required date
    if (user?.user_type === 'student' && user?.par_q_has_risk && !user?.medical_certificate_url && user?.medical_certificate_required_date) {
      const requiredDate = new Date(user.medical_certificate_required_date);
      const today = new Date();
      // Calculate days remaining until the 30-day grace period ends (requiredDate + 30 days)
      const gracePeriodEnd = new Date(requiredDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      const daysDiff = Math.ceil((gracePeriodEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

      setDaysLeft(daysDiff); // Directly use daysDiff, it can be negative for overdue
      setShowMedicalWarning(true);
    } else {
      setShowMedicalWarning(false); // Hide warning if conditions are not met
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-2xl">
        <div className="container mx-auto flex items-center"> {/* Removed justify-between as there's only one item */}
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
            {/* Botão "Voltar ao Menu" removido para o aluno */}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6">
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
            {/* Removed the dedicated "Check-in" card */}
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

const InstructorDashboard = ({ user, onBack }) => {
  const { navigateTo } = useOptimizedNavigation();

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
          </div>
          <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Menu
          </Button>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Dashboard Instrutor</h2>
            <p className="text-gray-700">Gerencie suas turmas, alunos e treinos.</p>
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
            {/* O CARD DE AVISOS FOO REMOVIDO DAQUI */}
          </div>
        </div>
      </div>
      <InstructorBottomNavBar activePage="Index" />
    </div>
  );
};

const AdminDashboard = ({ user, onBack }) => {
  const { navigateTo } = useOptimizedNavigation();

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
          </div>
           <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Menu
          </Button>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Painel Administrativo</h2>
            <p className="text-gray-700">Gestão completa da plataforma Fusion.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <KeyRound className="w-6 h-6" />
                  Conceder Acesso Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Promova usuários a administradores</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("GrantAdminAccess")}
                >
                  Acessar Ferramenta
                </Button>
              </CardContent>
            </Card>

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
                  <Users className="w-6 h-6" />
                  Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Gerenciar todos os usuários</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminUsers")}
                >
                  Gerenciar
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
                  <Wrench className="w-6 h-6" />
                  Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Ver e gerenciar chamados</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("AdminMaintenance")}
                >
                  Gerenciar
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

            <Card className="glass-effect fusion-shadow hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-600">
                  <MessageCircle className="w-6 h-6" />
                  Chat com Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Canal de suporte e comunicação</p>
                <Button
                  className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigateTo("ChatList")}
                >
                  Abrir Chat
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

export default function Index() {
  const { navigateTo } = useOptimizedNavigation();
  const [user, setUser] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showInstructorInviteModal, setShowInstructorInviteModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [instructorInviteCode, setInstructorInviteCode] = useState("");
  const [instructorInviteError, setInstructorInviteError] = useState("");

  const loadUserWithRetry = useCallback(async (maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const currentUser = await User.me();
        setRetryCount(0);
        return currentUser;
      } catch (error) {
        console.log(`Tentativa ${attempt + 1} falhou:`, error);
        if (attempt === maxRetries - 1) {
          console.log("Todas as tentativas falharam, usuário não logado");
          setRetryCount(attempt + 1);
          throw error;
        } else {
          setRetryCount(attempt + 1);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }, []);

  useEffect(() => {
    const initLoad = async () => {
      try {
        const currentUser = await loadUserWithRetry();
        setUser(currentUser);

        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        // --- Lógica de Bloqueio por Atestado ---
        if (currentUser.user_type === 'student' && currentUser.par_q_has_risk && currentUser.medical_certificate_required_date) {
          const requiredDate = new Date(currentUser.medical_certificate_required_date);
          const today = new Date();
          const gracePeriodEnd = new Date(requiredDate.getTime() + (30 * 24 * 60 * 60 * 1000));
          const daysDiff = Math.ceil((gracePeriodEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

          if (daysDiff <= 0 && !currentUser.account_blocked) {
            await User.updateMyUserData({ account_blocked: true });
            navigateTo('MedicalCertificate', {}, true);
            return;
          } else if (currentUser.account_blocked && (currentUser.medical_certificate_url || !currentUser.par_q_has_risk)) {
             await User.updateMyUserData({ account_blocked: false });
             currentUser.account_blocked = false;
             setUser({...currentUser, account_blocked: false});
          }
        }
        // --- Fim da Lógica de Bloqueio ---

        // *** LÓGICA DE DIRECIONAMENTO CORRIGIDA ***

        // 1. Aluno: Direcionamento direto
        if (currentUser.user_type === 'student') {
          const isSetupComplete = currentUser.cpf &&
                                  currentUser.phone &&
                                  currentUser.address &&
                                  currentUser.par_q_completed &&
                                  currentUser.condominium_id;

          if (!isSetupComplete) {
            navigateTo('StudentSetup', {}, true);
          } else {
            setSelectedUserType('student');
          }
          return; // Finaliza a execução aqui para o aluno
        }

        // 2. Instrutor: Direcionamento direto
        if (currentUser.user_type === 'instructor') {
          if (!currentUser.condominium_id || !currentUser.cpf) {
             navigateTo('InstructorProfile', {}, true);
          } else {
             setSelectedUserType('instructor');
          }
          return; // Finaliza a execução aqui para o instrutor
        }

        // 3. Para ADMIN, vai direto para o painel administrativo
        if (currentUser.user_type === 'admin') {
          setSelectedUserType('admin');
          return;
        }

      } catch (error) {
        console.log("Usuário não logado ou erro ao carregar, exibindo tela de seleção.", error);
        setSelectedUserType(null); // Mostra tela de seleção apenas em caso de erro.
      } finally {
        setIsLoading(false);
      }
    };

    initLoad();
  }, [loadUserWithRetry, navigateTo]);


  // Effect to scroll page to top when a panel is selected
  useEffect(() => {
    if (selectedUserType) {
      window.scrollTo(0, 0);
    }
  }, [selectedUserType]);

  const handleAdminPasswordValidation = () => {
    if (adminPassword === "2501") {
      // Aqui, ao invés de definir o tipo para 'admin', promovemos o usuário
      // e depois recarregamos a página para que o `useEffect` o leve para o painel de admin.
      User.updateMyUserData({ user_type: 'admin' }).then(() => {
        alert("Privilégios de administrador concedidos. A página será recarregada.");
        window.location.reload();
      });
    } else {
      setPasswordError("Senha incorreta. Tente novamente.");
    }
  };

  const handleInstructorCodeValidation = async () => {
    if (!instructorInviteCode.trim()) {
      setInstructorInviteError("Por favor, insira um código.");
      return;
    }

    setInstructorInviteError("");
    try {
      const invites = await AdminInvite.filter({
        code: instructorInviteCode.trim(),
        status: 'pending',
        type: 'instructor'
      });

      if (invites.length === 0) {
        setInstructorInviteError("Código inválido ou já utilizado.");
        return;
      }

      const invite = invites[0];
      if (new Date(invite.expires_at) < new Date()) {
        setInstructorInviteError("Este código de convite expirou.");
        return;
      }

      await User.updateMyUserData({ user_type: 'instructor' });
      await AdminInvite.update(invite.id, {
        status: 'used',
        used_by_user: user.email
      });

      alert("Parabéns! Você agora é um instrutor.");
      setShowInstructorInviteModal(false);

      const updatedUser = await User.me();
      setUser(updatedUser);

      // After promoting to instructor, check if profile setup is needed
      if (!updatedUser.condominium_id || !updatedUser.cpf) {
        navigateTo('InstructorProfile', {}, true);
      } else {
        // If profile is already complete, navigate to the instructor dashboard manually
        setSelectedUserType('instructor');
      }

    } catch (error) {
      console.error("Erro ao validar código de instrutor:", error);
      setInstructorInviteError("Ocorreu um erro ao validar o código. Tente novamente.");
    }
  };


  const handleSelectUserType = async (type) => {
    // Esta função é usada para quando o usuário clica em um card após voltar de um painel,
    // ou se eles não foram redirecionados automaticamente na carga inicial.
    if (!user) {
      try {
        // Redirect to the appropriate login page based on selected user type
        const loginPage = type.charAt(0).toUpperCase() + type.slice(1) + 'Login';
        window.location.href = `/${loginPage}`;
      } catch (e) {
        console.error('Erro no redirecionamento:', e);
        alert('Erro ao redirecionar para login. Por favor, verifique sua conexão com a internet ou tente novamente.');
      }
      return;
    }

    if (type === 'admin') {
      // Se já for admin, abre o painel. Caso contrário, ir para a página de login de admin.
      if (user?.user_type === 'admin') {
        setSelectedUserType('admin');
      } else {
        const loginPage = 'AdminLogin';
        window.location.href = `/${loginPage}`;
      }
      return;
    }

    if (type === 'instructor') {
      // Caso 1: Usuário é um ADMIN. Conceder acesso direto à visualização de instrutor.
      if (user.user_type === 'admin') {
        setSelectedUserType('instructor');
        return;
      }

      // Caso 2: Usuário já é um INSTRUTOR. Verificar se o perfil está completo.
      // Esta verificação de setup não é tratada pelo useEffect principal para instrutores.
      if (user.user_type === 'instructor') {
        if (!user.condominium_id || !user.cpf) {
          navigateTo('InstructorProfile', {}, true);
        } else {
          setSelectedUserType('instructor');
        }
        return;
      }

      // Caso 3: Usuário é um ALUNO ou outro tipo. Pedir código de convite.
      setShowInstructorInviteModal(true);
      return;
    }

    if (type === 'student') {
      // Se o usuário é admin ou instrutor, ele pode visualizar o painel do aluno.
      if (user.user_type === 'admin' || user.user_type === 'instructor') {
        setSelectedUserType('student');
        return;
      }

      // Se o usuário já é um aluno (ou um usuário sem tipo que está se tornando aluno).
      // A lógica de redirecionamento para 'StudentSetup' para perfis incompletos
      // é agora tratada pelo `useEffect` na carga inicial da página.
      // Portanto, aqui simplesmente definimos o tipo selecionado.
      setSelectedUserType('student');
      return;
    }
  };

  const handleBackToMenu = () => {
    setSelectedUserType(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
        <div className="text-center">
          <img src={logoUrl} alt="Fusion Logo" className="h-20 w-56 mx-auto mb-4 drop-shadow-2xl filter brightness-110" />
          <p className="text-gray-600 text-lg">Carregando...</p>

        </div>
      </div>
    );
  }

  // A renderização agora decide o que mostrar com base no 'selectedUserType'
  // que foi definido no useEffect. O carregamento inicial garante que nunca
  // mostremos a tela de seleção para um aluno já configurado.
  if (selectedUserType === 'student') {
    return <StudentDashboard user={user} onBack={() => {}} />;
  }

  if (selectedUserType === 'instructor') {
    return <InstructorDashboard user={user} onBack={handleBackToMenu} />;
  }

  if (selectedUserType === 'admin') {
    return <AdminDashboard user={user} onBack={handleBackToMenu} />;
  }

  // O fallback final é a tela de seleção de perfil, se selectedUserType for null
  return (
    <div className="min-h-screen bg-white">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-orange-500" />

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <div className="mb-8">
            <img src={logoUrl} alt="Fusion Logo" className="h-20 w-56 mx-auto drop-shadow-2xl filter brightness-110" />
          </div>



          {user?.user_type === 'admin' && (
            <div className="mb-8 p-4 bg-orange-100 rounded-lg border border-orange-200">
              <p className="text-orange-800 font-medium">
                🔑 Você está logado como <strong>Administrador</strong> e tem acesso total a todas as funcionalidades
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card
              className="glass-effect border-0 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
              onClick={() => handleSelectUserType('student')}
            >
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Aluno</h3>
                <p className="text-gray-600 mb-6">
                  Acesse agenda, treinos e faça check-in.
                </p>
                <Button className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all">
                  Entrar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={(e) => { e.stopPropagation(); window.location.href = "/StudentRegistration"; }}
                >
                  Cadastrar
                </Button>
              </CardContent>
            </Card>

            <Card
              className="glass-effect border-0 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
              onClick={() => handleSelectUserType('instructor')}
            >
              <CardContent className="p-8 text-center">
                <GraduationCap className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Instrutor</h3>
                <p className="text-gray-600 mb-6">
                  Gerencie turmas, alunos e treinos.
                </p>
                <Button className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all">
                  Entrar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={(e) => { e.stopPropagation(); window.location.href = "/InstructorRegistration"; }}
                >
                  Cadastrar
                </Button>
              </CardContent>
            </Card>

            <Card
              className="glass-effect border-0 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
              onClick={() => handleSelectUserType('admin')}
            >
              <CardContent className="p-8 text-center">
                <KeyRound className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Administrador</h3>
                <p className="text-gray-600 mb-6">
                  Gestão completa da plataforma.
                </p>
                <Button className="w-full fusion-gradient text-white shadow-lg hover:shadow-xl transition-all">
                  Entrar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Password Modal */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirmação de Acesso Administrativo</CardTitle>
              <CardDescription>
                Digite a senha para acessar o painel administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminPassword">Senha</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite a senha"
                  />
                  {passwordError && (
                    <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAdminPasswordValidation}
                    className="flex-1 fusion-gradient text-white"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdminPasswordModal(false);
                      setAdminPassword("");
                      setPasswordError("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructor Invite Modal */}
      {showInstructorInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Convite para Instrutor</CardTitle>
              <CardDescription>
                Digite o código de convite enviado pelo administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="instructorCode">Código de Convite</Label>
                  <Input
                    id="instructorCode"
                    value={instructorInviteCode}
                    onChange={(e) => setInstructorInviteCode(e.target.value)}
                    placeholder="Digite o código"
                  />
                  {instructorInviteError && (
                    <p className="text-red-600 text-sm mt-1">{instructorInviteError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstructorCodeValidation}
                    className="flex-1 fusion-gradient text-white"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInstructorInviteModal(false);
                      setInstructorInviteCode("");
                      setInstructorInviteError("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
