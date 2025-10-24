
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowLeft, Calendar, Eye, BarChart3, LineChart, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { DetailedAssessment } from "@/api/entities";
import EvolutionReport from "../components/assessment/EvolutionReport";
import BottomNavBar from "../components/student/BottomNavBar";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentEvolution() {
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      console.log('Carregando avaliações para o usuário:', currentUser.id);
      
      const userAssessments = await DetailedAssessment.filter({ 
        student_id: currentUser.id 
      });
      
      console.log('Avaliações encontradas:', userAssessments);
      
      const sortedAssessments = userAssessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      );
      
      setAssessments(sortedAssessments);
      if (sortedAssessments.length > 0) {
        setSelectedAssessment(sortedAssessments[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de evolução:', error);
      setError('Erro ao carregar suas avaliações. Tente novamente.');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Carregando dados de evolução...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto p-4 md:p-6 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Minha Evolução</h1>
            <p className="text-gray-600 mt-1">Acompanhe seu progresso físico</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-semibold">Erro:</span>
              <span>{error}</span>
            </div>
            <button 
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {assessments.length === 0 ? (
          <Card className="text-center p-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-500">Peça ao seu instrutor para realizar sua primeira avaliação física.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            <EvolutionReport assessments={assessments} selectedAssessment={selectedAssessment} />

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Calendar className="h-5 w-5" />
                  Histórico de Avaliações ({assessments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessments.map((assessment, index) => (
                    <div 
                      key={assessment.id} 
                      onClick={() => setSelectedAssessment(assessment)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAssessment?.id === assessment.id 
                          ? 'bg-orange-100 border-orange-300 shadow-md' 
                          : 'bg-orange-50/50 border-orange-100 hover:bg-orange-100/50'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          Avaliação #{assessments.length - index} - {format(parseISO(assessment.assessment_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Peso: {assessment.weight}kg</span>
                          <span>Gordura: {assessment.calculated_metrics?.body_fat_percentage?.toFixed(1) || '--'}%</span>
                        </div>
                      </div>
                      <Eye className="h-5 w-5 text-orange-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <BottomNavBar activePage="StudentProfile" />
    </div>
  );
}
