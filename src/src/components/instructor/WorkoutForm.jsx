import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { Workout } from "@/api/entities";

export default function WorkoutForm({ isOpen, onOpenChange, workout, studentId, instructorId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    objective: 'hipertrofia',
    exercises: []
  });

  useEffect(() => {
    if (workout) {
      setFormData(workout);
    } else {
      setFormData({
        name: '',
        objective: 'hipertrofia',
        exercises: []
      });
    }
  }, [workout, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exercise_name: '',
        sets: 3,
        reps: '12',
        weight: '',
        rest: '60s',
        video_url: '',
        notes: ''
      }]
    }));
  };

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      student_id: studentId,
      instructor_id: instructorId
    };
    
    if (workout && workout.id) {
      await Workout.update(workout.id, dataToSave);
    } else {
      await Workout.create(dataToSave);
    }
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? "Editar Treino" : "Criar Novo Treino"}</DialogTitle>
          <DialogDescription>
            Configure o plano de treino personalizado para o aluno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Treino</Label>
              <Input 
                placeholder="Ex: Treino A - Peito e Tríceps" 
                value={formData.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={formData.objective} onValueChange={(v) => handleChange('objective', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="resistencia">Resistência</SelectItem>
                  <SelectItem value="forca">Força</SelectItem>
                  <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Exercícios</h3>
              <Button onClick={addExercise} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </div>

            {formData.exercises.map((exercise, index) => (
              <Card key={index} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Exercício {index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Exercício</Label>
                      <Input 
                        placeholder="Ex: Supino reto com barra"
                        value={exercise.exercise_name}
                        onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Séries</Label>
                      <Input 
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Repetições</Label>
                      <Input 
                        placeholder="Ex: 8-12 ou 15"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Carga</Label>
                      <Input 
                        placeholder="Ex: 50kg ou 70% 1RM"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descanso</Label>
                      <Input 
                        placeholder="Ex: 60s ou 1-2min"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>URL do Vídeo (opcional)</Label>
                      <Input 
                        placeholder="Link para demonstração"
                        value={exercise.video_url}
                        onChange={(e) => updateExercise(index, 'video_url', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Observações</Label>
                    <Textarea 
                      placeholder="Instruções específicas para este exercício..."
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {formData.exercises.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">Nenhum exercício adicionado ainda.</p>
                <Button onClick={addExercise} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Exercício
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            {workout ? "Atualizar" : "Criar"} Treino
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}