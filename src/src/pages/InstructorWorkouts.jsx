
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Activity, ArrowLeft, Plus, Search, Copy, Edit, Users,
  Target, Clock, Dumbbell, User as UserIcon, Send, Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Workout } from "@/api/entities";
import WorkoutBuilderForm from "../components/instructor/WorkoutBuilderForm";
import AssignWorkoutModal from "../components/instructor/AssignWorkoutModal";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";

export default function InstructorWorkouts() {
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningWorkout, setAssigningWorkout] = useState(null);
  const [workoutView, setWorkoutView] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setInstructor(currentUser);

      const [fetchedWorkouts, fetchedStudents] = await Promise.all([
        Workout.filter({ instructor_id: currentUser.id }),
        User.filter({ user_type: "student" })
      ]);

      setWorkouts(fetchedWorkouts);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    await loadData();
    setIsFormOpen(false);
    setEditingWorkout(null);
    setSelectedStudent(null);
  };

  const handleCreateForStudent = (student) => {
    setSelectedStudent(student);
    setEditingWorkout(null);
    setIsFormOpen(true);
  };

  const handleCreateTemplate = () => {
    setSelectedStudent(null);
    setEditingWorkout(null);
    setIsFormOpen(true);
  };

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setSelectedStudent(workout.student_id ? students.find(s => s.id === workout.student_id) : null);
    setIsFormOpen(true);
  };
  
  const handleOpenAssignModal = (workout) => {
    setAssigningWorkout(workout);
    setIsAssignModalOpen(true);
  };

  const handleAssignWorkout = async (studentId) => {
    if (!assigningWorkout || !studentId) return;

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const assignedWorkout = {
      ...assigningWorkout,
      name: `${assigningWorkout.name} - ${student.full_name}`,
      is_template: false,
      student_id: studentId,
      instructor_id: instructor.id
    };
    delete assignedWorkout.id;
    delete assignedWorkout.created_date;
    delete assignedWorkout.updated_date;
    delete assignedWorkout.created_by;

    await Workout.create(assignedWorkout);
    await loadData();
    setIsAssignModalOpen(false);
    setAssigningWorkout(null);
  };

  const handleCopyWorkout = async (workout) => {
    const copiedWorkout = {
      ...workout,
      name: `${workout.name} (Cópia)`,
      is_template: true,
      student_id: null
    };
    delete copiedWorkout.id;
    delete copiedWorkout.created_date;
    delete copiedWorkout.updated_date;
    delete copiedWorkout.created_by;

    await Workout.create(copiedWorkout);
    await loadData();
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (confirm('Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.')) {
      try {
        await Workout.delete(workoutId);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir treino:', error);
        alert('Não foi possível excluir o treino.');
      }
    }
  };

  const handleCpfSearch = (value) => {
    const cpfValue = value.replace(/\D/g, '');
    const formattedCpf = cpfValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
    setCpfSearch(formattedCpf);
  };

  const filteredStudents = students.filter(student => {
    const searchMatch =
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const cpfMatch = cpfSearch === "" ||
      (student.cpf && student.cpf.includes(cpfSearch.replace(/\D/g, '')));

    return searchMatch && cpfMatch;
  });

  const filteredWorkouts = workouts.filter(w => {
    if (workoutView === 'templates') return w.is_template;
    if (workoutView === 'personalized') return !w.is_template && w.student_id;
    return true; // 'all'
  });

  const getObjectiveColor = (objective) => {
    const colors = {
      hipertrofia: "bg-blue-100 text-blue-800",
      emagrecimento: "bg-red-100 text-red-800",
      resistencia: "bg-green-100 text-green-800",
      forca: "bg-purple-100 text-purple-800",
      reabilitacao: "bg-yellow-100 text-yellow-800"
    };
    return colors[objective] || "bg-gray-100 text-gray-800";
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.full_name : "Aluno não encontrado";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-2xl font-bold">Gestão de Treinos</h1>
          </div>
          <Link to={createPageUrl("Index")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <Tabs defaultValue="students" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full h-auto bg-orange-100 p-2 rounded-xl gap-2 grid-cols-1 sm:grid-cols-2">
              <TabsTrigger 
                value="students" 
                className="flex flex-col sm:flex-row items-center gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-white text-orange-700 shadow-sm hover:bg-orange-200 transition-all font-medium min-h-[50px] sm:min-h-[40px]"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm text-center">Alunos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="flex flex-col sm:flex-row items-center gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-white text-orange-700 shadow-sm hover:bg-orange-200 transition-all font-medium min-h-[50px] sm:min-h-[40px]"
              >
                <Dumbbell className="h-4 w-4" />
                <span className="text-sm text-center">Biblioteca de Treinos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="students" className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Criar Treino para Aluno</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200"
                />
              </div>

              <div className="relative flex-1 max-w-xs">
                <Input
                  placeholder="Buscar por CPF..."
                  value={cpfSearch}
                  onChange={(e) => handleCpfSearch(e.target.value)}
                  className="border-orange-200"
                  maxLength={14}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || cpfSearch ? "Nenhum aluno encontrado" : "Nenhum aluno disponível"}
                </h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredStudents.map((student) => {
                  const studentWorkouts = workouts.filter(w => !w.is_template && w.student_id === student.id);

                  return (
                    <Card key={student.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {student.full_name?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {student.full_name}
                              </h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              {student.cpf && (
                                <p className="text-xs text-gray-500 font-mono">
                                  CPF: {student.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={getObjectiveColor(student.objectives)}>
                                  {student.objectives || "Objetivo não definido"}
                                </Badge>
                                <Badge variant="outline">
                                  {studentWorkouts.length} treino{studentWorkouts.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleCreateForStudent(student)}
                            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Treino
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Biblioteca de Treinos</h2>
              <Button
                onClick={handleCreateTemplate}
                className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Template
              </Button>
            </div>
            
            <Card className="p-4 border-orange-200">
              <RadioGroup defaultValue="all" value={workoutView} onValueChange={setWorkoutView} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="r-all" />
                    <Label htmlFor="r-all">Todos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="templates" id="r-templates" />
                    <Label htmlFor="r-templates">Apenas Templates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personalized" id="r-personalized" />
                    <Label htmlFor="r-personalized">Apenas Personalizados</Label>
                  </div>
              </RadioGroup>
            </Card>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando treinos...</p>
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum treino encontrado</h3>
                <p className="text-gray-500">
                  {workoutView === 'templates' ? 'Crie seu primeiro template reutilizável.' : 
                   workoutView === 'personalized' ? 'Atribua treinos para seus alunos.' :
                   'Crie treinos para seus alunos ou templates reutilizáveis.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredWorkouts.map((workout) => (
                  <Card key={workout.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-800">{workout.name}</h3>
                            <Badge className={getObjectiveColor(workout.objective)}>
                              {workout.objective}
                            </Badge>
                             {workout.is_template && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  Template
                                </Badge>
                             )}
                          </div>

                          <div className="flex items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3 flex-wrap">
                             {workout.student_id && (
                               <span className="flex items-center gap-1 font-medium text-blue-700">
                                 <UserIcon className="h-3 w-3" />
                                 {getStudentName(workout.student_id)}
                               </span>
                             )}
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />
                              {workout.exercises?.length || 0} exercícios
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Criado em {new Date(workout.created_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                          {workout.is_template && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAssignModal(workout)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Send className="h-4 w-4 mr-2"/>
                              Atribuir
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyWorkout(workout)}
                            className="border-orange-200"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(workout)}
                            className="border-orange-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <WorkoutBuilderForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          workout={editingWorkout}
          selectedStudent={selectedStudent}
          instructorId={instructor?.id}
          students={students}
          templates={workouts.filter(w => w.is_template)}
          onSave={handleSave}
        />
        
        <AssignWorkoutModal
          isOpen={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          workout={assigningWorkout}
          students={students}
          onAssign={handleAssignWorkout}
        />
      </div>
      
      <InstructorBottomNavBar activePage="InstructorWorkouts" />
    </div>
  );
}
