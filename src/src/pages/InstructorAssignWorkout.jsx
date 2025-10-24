import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, ArrowLeft, UserPlus, Dumbbell, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Workout } from "@/api/entities";

export default function InstructorAssignWorkout() {
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setInstructor(currentUser);

      let studentsQuery;
      if (currentUser.condominium_id) {
        studentsQuery = await User.filter({
          user_type: "student",
          condominium_id: currentUser.condominium_id
        });
      } else {
        studentsQuery = await User.filter({ user_type: "student" });
      }

      const instructorWorkouts = await Workout.filter({ 
        instructor_id: currentUser.id,
        is_template: true 
      });

      setStudents(studentsQuery);
      setWorkouts(instructorWorkouts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignWorkout = async () => {
    if (!selectedWorkout || selectedStudents.length === 0) {
      alert("Selecione um treino e pelo menos um aluno.");
      return;
    }

    setIsAssigning(true);
    try {
      const baseWorkout = workouts.find(w => w.id === selectedWorkout);
      
      for (const studentId of selectedStudents) {
        await Workout.create({
          name: baseWorkout.name,
          instructor_id: instructor.id,
          student_id: studentId,
          objective: baseWorkout.objective,
          exercises: baseWorkout.exercises,
          is_template: false
        });
      }

      alert(`Treino atribuído com sucesso para ${selectedStudents.length} aluno(s)!`);
      setSelectedStudents([]);
      setSelectedWorkout("");
    } catch (error) {
      console.error('Erro ao atribuir treino:', error);
      alert("Erro ao atribuir treino. Tente novamente.");
    }
    setIsAssigning(false);
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Atribuir Treinos</h1>
          </div>
          <Link to={createPageUrl("Index")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {/* Seleção de Treino */}
        <Card className="mb-6 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Dumbbell className="h-5 w-5" />
              Selecionar Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Você ainda não criou nenhum treino template.</p>
                <Link to={createPageUrl("InstructorWorkouts")}>
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                    Criar Primeiro Treino
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {workouts.map(workout => (
                  <div
                    key={workout.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedWorkout === workout.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedWorkout(workout.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{workout.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">{workout.objective}</Badge>
                          <span className="text-sm text-gray-600">
                            {workout.exercises?.length || 0} exercícios
                          </span>
                        </div>
                      </div>
                      {selectedWorkout === workout.id && (
                        <CheckCircle className="h-6 w-6 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seleção de Alunos */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Users className="h-5 w-5" />
              Selecionar Alunos ({selectedStudents.length} selecionados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum aluno encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStudents.includes(student.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-orange-600"
                    />
                    <Avatar>
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {student.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{student.full_name || "Nome não informado"}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    {selectedStudents.includes(student.id) && (
                      <CheckCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Atribuir */}
        {selectedWorkout && selectedStudents.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleAssignWorkout}
              disabled={isAssigning}
              className="bg-orange-500 hover:bg-orange-600 px-8 py-3 text-lg"
            >
              {isAssigning ? 'Atribuindo...' : `Atribuir Treino para ${selectedStudents.length} Aluno(s)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}