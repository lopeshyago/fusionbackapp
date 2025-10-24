import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Calendar, ArrowLeft, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Class } from "@/api/entities";
import { Booking } from "@/api/entities";

export default function AdminReports() {
  const [reportData, setReportData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const [users, classes, bookings] = await Promise.all([User.list(), Class.list(), Booking.list()]);
        const students = users.filter(u => u.user_type === 'student');
        const activeBookings = bookings.filter(b => b.status === 'reservado' || b.status === 'confirmado');
        
        setReportData({
          totalStudents: students.length,
          activeStudents: students.filter(s => s.plan_status === 'active').length,
          totalInstructors: users.filter(u => u.user_type === 'instructor').length,
          totalClasses: classes.length,
          totalBookings: activeBookings.length,
          utilizationRate: classes.length > 0 ? Math.round((activeBookings.length / (classes.length * (classes[0]?.capacidade || 10))) * 100) : 0,
        });
      } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error);
      }
      setIsLoading(false);
    };
    loadReportData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8" />
              <h1 className="text-lg md:text-2xl font-bold">Relatórios</h1>
            </div>
            <Link to={createPageUrl("Index")}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Cards de Métricas - Mobile Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <Users className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-blue-600" />
              <p className="text-2xl md:text-3xl font-bold text-blue-700">{reportData.totalStudents || 0}</p>
              <p className="text-xs md:text-sm text-gray-600">Total de Alunos</p>
              <p className="text-xs text-green-600 mt-1">{reportData.activeStudents || 0} ativos</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <TrendingUp className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-green-600" />
              <p className="text-2xl md:text-3xl font-bold text-green-700">{reportData.totalBookings || 0}</p>
              <p className="text-xs md:text-sm text-gray-600">Reservas Totais</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <Calendar className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-purple-600" />
              <p className="text-2xl md:text-3xl font-bold text-purple-700">{reportData.totalClasses || 0}</p>
              <p className="text-xs md:text-sm text-gray-600">Aulas Programadas</p>
              <p className="text-xs text-blue-600 mt-1">{reportData.utilizationRate || 0}% ocupação</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <Activity className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-orange-600" />
              <p className="text-2xl md:text-3xl font-bold text-orange-700">{reportData.totalInstructors || 0}</p>
              <p className="text-xs md:text-sm text-gray-600">Instrutores</p>
            </CardContent>
          </Card>
        </div>

        {/* Card de Funcionalidades Futuras */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Funcionalidades em Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="text-center py-8 md:py-12">
                <BarChart3 className="h-16 w-16 md:h-24 md:w-24 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-3">
                  Relatórios Avançados em Breve
                </h3>
                <div className="max-w-md mx-auto space-y-2 text-sm md:text-base text-gray-600">
                  <p>📊 Gráficos detalhados de crescimento</p>
                  <p>📈 Frequência por modalidade</p>
                  <p>👥 Análise de engajamento dos alunos</p>
                  <p>💪 Métricas de performance</p>
                  <p>📋 Relatórios personalizados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}