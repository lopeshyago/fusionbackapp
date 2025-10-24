import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Condominium } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Dumbbell, Calculator } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminStudentDetail() {
  const [student, setStudent] = useState(null);
  const [condominium, setCondominium] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studentId = params.get('student_id');

    if (!studentId) {
      setError('ID do aluno não fornecido.');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const studentData = await User.get(studentId);
        setStudent(studentData);

        if (studentData.condominium_id) {
          const condoData = await Condominium.get(studentData.condominium_id);
          setCondominium(condoData);
        }
      } catch (err) {
        setError('Não foi possível carregar os dados do aluno.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [location.search]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando dados do aluno..." />;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!student) {
    return <div className="text-center p-8 text-gray-500">Aluno não encontrado.</div>;
  }

  const studentId = student.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-2xl font-bold">Gerenciar Aluno</h1>
          </div>
          <Link to={createPageUrl("AdminUsers")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Usuários
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
                {student.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{student.full_name}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
              {condominium && <CardDescription>Local: {condominium.name}</CardDescription>}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-700">
                <Dumbbell className="h-6 w-6" />
                Treinos do Aluno
              </CardTitle>
              <CardDescription>Crie, visualize e edite os planos de treino atribuídos a este aluno.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={createPageUrl(`AdminStudentWorkouts?student_id=${studentId}`)}>
                <Button className="w-full fusion-gradient">Gerenciar Treinos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-700">
                <Calculator className="h-6 w-6" />
                Avaliações Físicas
              </CardTitle>
              <CardDescription>Gerencie o histórico de avaliações físicas, adicione novas ou edite existentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={createPageUrl(`AdminStudentAssessments?student_id=${studentId}`)}>
                <Button className="w-full fusion-gradient">Gerenciar Avaliações</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}