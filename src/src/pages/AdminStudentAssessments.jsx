
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from 'react-router-dom';
import { User } from '@/api/entities';
import { DetailedAssessment } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Edit, Trash2, ArrowLeft, Calendar, BarChart2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DetailedAssessmentForm from "../components/assessment/DetailedAssessmentForm";

export default function AdminStudentAssessments() {
  const [student, setStudent] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  
  const studentId = new URLSearchParams(location.search).get('student_id');

  const loadData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const [studentData, studentAssessments, adminUser] = await Promise.all([
        User.get(studentId),
        DetailedAssessment.filter({ student_id: studentId }, '-assessment_date'),
        User.me()
      ]);
      setStudent(studentData);
      setAssessments(studentAssessments);
      setCurrentUser(adminUser);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  }, [studentId]); // studentId is a dependency for loadData

  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is now a stable function reference due to useCallback

  const handleCreate = () => {
    setEditingAssessment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setIsFormOpen(true);
  };

  const handleDelete = async (assessmentId) => {
    if (confirm("Tem certeza que deseja excluir esta avaliação? Esta ação é irreversível.")) {
      try {
        await DetailedAssessment.delete(assessmentId);
        await loadData();
      } catch (error) {
        console.error("Erro ao excluir avaliação:", error);
        alert("Falha ao excluir a avaliação.");
      }
    }
  };

  const handleSave = async () => {
    setIsFormOpen(false);
    setEditingAssessment(null);
    await loadData();
  };

  if (isLoading) return <LoadingSpinner text="Carregando avaliações do aluno..." />;
  if (!student) return <div className="p-8 text-center">Aluno não encontrado.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Avaliações do Aluno</h1>
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
            Nova Avaliação
          </Button>
        </div>

        {assessments.length > 0 ? (
          <div className="space-y-4">
            {assessments.map(assessment => (
              <Card key={assessment.id} className="border-orange-200">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-600"/>
                        Avaliação de {new Date(assessment.assessment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span>Peso: {assessment.weight} kg</span>
                        <span>% Gordura: {assessment.calculated_metrics?.body_fat_percentage?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(assessment)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(assessment.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma avaliação encontrada para este aluno.</p>
          </div>
        )}
      </div>

      <DetailedAssessmentForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        assessmentToEdit={editingAssessment}
        studentId={student.id}
        instructorId={currentUser?.id}
        studentName={student.full_name}
        onSave={handleSave}
      />
    </div>
  );
}
