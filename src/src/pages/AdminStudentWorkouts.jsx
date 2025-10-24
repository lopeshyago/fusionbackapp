
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from 'react-router-dom';
import { User } from '@/api/entities';
import { Workout } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Plus, Edit, Trash2, ArrowLeft, Clock, User as UserIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import WorkoutBuilderForm from "../components/instructor/WorkoutBuilderForm";

export default function AdminStudentWorkouts() {
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  const studentId = new URLSearchParams(location.search).get('student_id');

  const loadData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const [studentData, studentWorkouts, adminUser] = await Promise.all([
        User.get(studentId),
        Workout.filter({ student_id: studentId }, '-created_date'),
        User.me()
      ]);
      setStudent(studentData);
      setWorkouts(studentWorkouts);
      setCurrentUser(adminUser);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingWorkout(null);
    setIsFormOpen(true);
  };

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setIsFormOpen(true);
  };

  const handleDelete = async (workoutId) => {
    if (confirm("Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.")) {
      try {
        await Workout.delete(workoutId);
        await loadData();
      } catch (error) {
        console.error("Erro ao excluir treino:", error);
        alert("Falha ao excluir o treino.");
      }
    }
  };

  const handleSave = async () => {
    setIsFormOpen(false);
    setEditingWorkout(null);
    await loadData();
  };

  if (isLoading) return <LoadingSpinner text="Carregando treinos do aluno..." />;
  if (!student) return <div className="p-8 text-center">Aluno não encontrado.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Treinos do Aluno</h1>
              <p className="text-sm text-gray-300">{student.full_name}</p>
            </div>
          </div>
          <Link to={createPageUrl(`AdminStudentDetail?student_id=${studentId}`)}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreate} className="fusion-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Treino
          </Button>
        </div>

        {workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map(workout => (
              <Card key={workout.id} className="border-orange-200">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{workout.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <Badge variant="secondary">{workout.objective}</Badge>
                        <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" />{workout.exercises?.length || 0} exercícios</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Criado em {new Date(workout.created_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(workout)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(workout.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum treino encontrado para este aluno.</p>
          </div>
        )}
      </div>

      <WorkoutBuilderForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        workout={editingWorkout}
        selectedStudent={student}
        instructorId={currentUser?.id}
        onSave={handleSave}
      />
    </div>
  );
}
