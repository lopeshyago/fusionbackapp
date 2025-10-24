
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, FileText, Activity, Calendar, 
  TrendingUp, Weight, Ruler, Target, Clock, RotateCcw, Dumbbell,
  CheckCircle, Download, AlertTriangle, // Existing imports for medical certificate
  User, Calculator, MessageCircle, BarChart2 // New imports for profile header
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User as UserEntity } from "@/api/entities"; // Renamed User to UserEntity to avoid conflict with Lucide icon
import { Workout } from "@/api/entities";
import { PhysicalAssessment } from "@/api/entities";
import WorkoutBuilderForm from "../components/instructor/WorkoutBuilderForm";

export default function StudentDetail() {
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const location = useLocation();
  const studentId = new URLSearchParams(location.search).get('student_id');

  const formatCPF = (cpf) => {
    if (!cpf) return "Não informado";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const loadStudentData = useCallback(async () => {
    if (!studentId) return;
    
    setIsLoading(true);
    try {
      const [currentUser, allUsers, studentWorkouts, studentAssessments] = await Promise.all([
        UserEntity.me(),
        UserEntity.list(),
        Workout.filter({ student_id: studentId }),
        PhysicalAssessment.filter({ student_id: studentId })
      ]);
      
      const studentData = allUsers.find(u => u.id === studentId);
      
      if (!studentData) {
        console.error('Aluno não encontrado');
        setIsLoading(false);
        return;
      }
      
      setInstructor(currentUser);
      setStudent(studentData);
      setWorkouts(studentWorkouts);
      setAssessments(studentAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date)));
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, loadStudentData]);

  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setIsEditingWorkout(true);
  };

  const handleWorkoutSave = async () => {
    await loadStudentData(); // Recarregar os dados
    setIsEditingWorkout(false);
    setEditingWorkout(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-screen">
        <p className="text-gray-600">Aluno não encontrado.</p>
      </div>
    );
  }

  const latestAssessment = assessments[0];
  const bmi = latestAssessment?.weight && latestAssessment?.height ? 
    (latestAssessment.weight / Math.pow(latestAssessment.height / 100, 2)).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Ficha do Aluno</h1>
          </div>
          <Link to={createPageUrl("InstructorStudents")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {/* Informações do Aluno (main summary card) */}
        <Card className="mb-6 border-orange-200">
          <CardContent className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                <AvatarFallback className="text-3xl bg-orange-100 text-orange-700">
                  {student.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold">{student.full_name}</h2>
                <p className="text-gray-600">{student.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Status</p>
                <Badge variant={student.plan_status === 'active' ? 'default' : 'secondary'}>
                  {student.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Telefone</p>
                <p className="text-sm text-gray-600">{student.phone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">PAR-Q</p>
                <Badge variant={student.par_q_completed ? 'default' : 'destructive'}>
                  {student.par_q_completed ? 'Completo' : 'Pendente'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Objetivos</p>
                <p className="text-sm text-gray-600">{student.objectives || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Restrições Físicas</p>
                <p className="text-sm text-gray-600">{student.physical_restrictions || 'Nenhuma'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Rápido */}
        {latestAssessment && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <Weight className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{latestAssessment.weight}kg</p>
                <p className="text-sm text-gray-600">Peso Atual</p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <Ruler className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{latestAssessment.height}cm</p>
                <p className="text-sm text-gray-600">Altura</p>
              </CardContent>
            </Card>
            
            {bmi && (
              <Card className="border-orange-200">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-700">{bmi}</p>
                  <p className="text-sm text-gray-600">IMC</p>
                </CardContent>
              </Card>
            )}
            
            {latestAssessment.body_fat && (
              <Card className="border-orange-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-700">{latestAssessment.body_fat}%</p>
                  <p className="text-sm text-gray-600">Gordura Corporal</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6"> {/* New grid container for additional info cards */}
          {/* Informações Pessoais */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-700">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">CPF:</p>
                <p className="text-gray-600">{formatCPF(student.cpf)}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">Data de Nascimento:</p>
                <p className="text-gray-600">{student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">Gênero:</p>
                <p className="text-gray-600">{student.gender || 'Não informado'}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">Endereço:</p>
                <p className="text-gray-600">{student.address || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Atestado Médico */}
          {student?.par_q_has_risk && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Atestado Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.medical_certificate_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Atestado Anexado</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completo</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                    >
                      <a 
                        href={student.medical_certificate_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Visualizar/Baixar Atestado
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Atestado Pendente</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Este aluno possui fatores de risco no PAR-Q e ainda não anexou o atestado médico.
                      {student.medical_certificate_required_date && (
                        <>
                          <br />
                          <span className="font-medium">
                            Data limite: {new Date(new Date(student.medical_certificate_required_date).getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workouts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workouts">Treinos</TabsTrigger>
            <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workouts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Treinos do Aluno</h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                  ✏️ Modo Edição Disponível
                </div>
                <Link to={createPageUrl("InstructorWorkouts")}>
                  <Button variant="outline" className="border-orange-200">
                    Nova Biblioteca
                  </Button>
                </Link>
              </div>
            </div>
            
            {workouts.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhum treino criado</h4>
                  <p className="text-gray-500 mb-4">Este aluno ainda não possui treinos.</p>
                  <Link to={createPageUrl("InstructorWorkouts")}>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Criar Primeiro Treino
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <Card key={workout.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{workout.name}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge className="bg-orange-100 text-orange-800">
                                {workout.objective}
                              </Badge>
                              <Badge variant="outline">
                                {workout.exercises?.length || 0} exercícios
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Desktop: Botão à direita */}
                          <div className="hidden md:flex items-center gap-2">
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(workout.created_date).toLocaleDateString('pt-BR')}
                            </div>
                            <Button
                              onClick={() => handleEditWorkout(workout)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                        
                        {/* Mobile: Botão e data embaixo */}
                        <div className="md:hidden flex justify-between items-center">
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(workout.created_date).toLocaleDateString('pt-BR')}
                          </div>
                          <Button
                            onClick={() => handleEditWorkout(workout)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workout.exercises && workout.exercises.length > 0 ? (
                        <div className="space-y-2">
                          {workout.exercises.map((exercise, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-semibold text-sm flex-shrink-0">
                                  {index + 1}
                                </div>
                                <Dumbbell className="h-5 w-5 text-orange-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 truncate">{exercise.exercise_name}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                                    <span className="bg-white px-2 py-1 rounded text-xs">{exercise.sets} séries</span>
                                    <span className="text-gray-400">×</span>
                                    <span className="bg-white px-2 py-1 rounded text-xs">{exercise.reps} reps</span>
                                    {exercise.weight && (
                                      <span className="bg-orange-50 px-2 py-1 rounded text-xs font-medium text-orange-700">{exercise.weight}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                {exercise.rest && (
                                  <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mb-1">
                                    <RotateCcw className="h-3 w-3" />
                                    <span>{exercise.rest}</span>
                                  </div>
                                )}
                                {exercise.notes && (
                                  <p className="text-xs text-gray-500 max-w-20 text-right truncate" title={exercise.notes}>
                                    {exercise.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum exercício cadastrado neste treino.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assessments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Avaliações Físicas</h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                  📊 Modo Visualização
                </div>
                <Link to={createPageUrl("InstructorAssessments")}>
                  <Button variant="outline" className="border-orange-200">
                    Nova Avaliação
                  </Button>
                </Link>
              </div>
            </div>
            
            {assessments.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma avaliação realizada</h4>
                  <p className="text-gray-500 mb-4">Este aluno ainda não foi avaliado.</p>
                  <Link to={createPageUrl("InstructorAssessments")}>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Ir para Avaliações
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment, index) => (
                  <Card key={assessment.id} className="border-orange-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          Avaliação - {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">Mais Recente</Badge>
                          )}
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(assessment.created_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-700">Dados Gerais</h4>
                          <div className="space-y-1 text-sm bg-blue-50 p-3 rounded-lg">
                            <p><strong>Peso:</strong> {assessment.weight}kg</p>
                            <p><strong>Altura:</strong> {assessment.height}cm</p>
                            {assessment.body_fat && <p><strong>Gordura:</strong> {assessment.body_fat}%</p>}
                            {assessment.muscle_mass && <p><strong>Massa Muscular:</strong> {assessment.muscle_mass}kg</p>}
                          </div>
                        </div>
                        
                        {assessment.measurements && (
                          <div>
                            <h4 className="font-semibold mb-2 text-green-700">Medidas</h4>
                            <div className="space-y-1 text-sm bg-green-50 p-3 rounded-lg">
                              {assessment.measurements.chest && <p><strong>Peito:</strong> {assessment.measurements.chest}cm</p>}
                              {assessment.measurements.waist && <p><strong>Cintura:</strong> {assessment.measurements.waist}cm</p>}
                              {assessment.measurements.hip && <p><strong>Quadril:</strong> {assessment.measurements.hip}cm</p>}
                              {assessment.measurements.arm && <p><strong>Braço:</strong> {assessment.measurements.arm}cm</p>}
                              {assessment.measurements.thigh && <p><strong>Coxa:</strong> {assessment.measurements.thigh}cm</p>}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-orange-700">Observações</h4>
                          <div className="text-sm bg-orange-50 p-3 rounded-lg">
                            <p className="text-gray-700">
                              {assessment.notes || 'Nenhuma observação registrada.'}
                            </p>
                            {assessment.next_assessment && (
                              <p className="text-orange-600 mt-2 font-medium">
                                <strong>Próxima:</strong> {new Date(assessment.next_assessment).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Edição de Treino */}
        <WorkoutBuilderForm
          isOpen={isEditingWorkout}
          onOpenChange={setIsEditingWorkout}
          workout={editingWorkout}
          selectedStudent={student}
          instructorId={instructor?.id}
          students={[student]} // Passar apenas o aluno atual
          templates={[]} // Não precisamos de templates neste contexto
          onSave={handleWorkoutSave}
        />
      </div>
    </div>
  );
}

