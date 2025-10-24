import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, Copy, Dumbbell, Video, 
  Save, Search 
} from "lucide-react";
import { Exercise } from "@/api/entities";

export default function WorkoutBuilder({ student, instructor, templates, onWorkoutCreated, onCancel }) {
  const [workoutData, setWorkoutData] = useState({
    name: '',
    objective: student?.objectives || 'hipertrofia',
    exercises: []
  });

  const [newExercise, setNewExercise] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
    rest: '',
    notes: '',
    video_url: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [exerciseDatabase, setExerciseDatabase] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExerciseDatabase();
  }, []);

  const loadExerciseDatabase = async () => {
    setIsLoading(true);
    try {
      const exercises = await Exercise.list();
      setExerciseDatabase(exercises);
    } catch (error) {
      console.error('Erro ao carregar banco de exercícios:', error);
    }
    setIsLoading(false);
  };

  const muscleGroups = [
    { value: 'all', label: 'Todos os Grupos' },
    { value: 'peito', label: 'Peito' },
    { value: 'costas', label: 'Costas' },
    { value: 'ombros', label: 'Ombros' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'quadriceps', label: 'Quadríceps' },
    { value: 'posterior', label: 'Posterior de Coxa' },
    { value: 'gluteos', label: 'Glúteos' },
    { value: 'panturrilha', label: 'Panturrilha' },
    { value: 'abdomen', label: 'Abdômen' },
    { value: 'funcional', label: 'Funcional' }
  ];

  const getFilteredExercises = () => {
    let filtered = exerciseDatabase;
    
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    }
    
    if (exerciseSearch) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleWorkoutChange = (field, value) => {
    setWorkoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleExerciseChange = (field, value) => {
    setNewExercise(prev => ({ ...prev, [field]: value }));
  };

  const selectExerciseFromDatabase = (exercise) => {
    setNewExercise(prev => ({
      ...prev,
      exercise_name: exercise.name
    }));
  };

  const addExercise = () => {
    if (!newExercise.exercise_name.trim()) return;
    
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...newExercise }]
    }));
    
    setNewExercise({
      exercise_name: '',
      sets: '',
      reps: '',
      weight: '',
      rest: '',
      notes: '',
      video_url: ''
    });
  };

  const removeExercise = (index) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const loadTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setWorkoutData(prev => ({
        ...prev,
        name: `${template.name} - ${student.full_name}`,
        objective: template.objective,
        exercises: [...template.exercises]
      }));
      setSelectedTemplate('');
    }
  };

  const handleSaveWorkout = () => {
    if (!workoutData.name.trim()) {
      alert('Por favor, insira um nome para o treino.');
      return;
    }
    
    if (workoutData.exercises.length === 0) {
      alert('Adicione pelo menos um exercício ao treino.');
      return;
    }
    
    onWorkoutCreated(workoutData);
  };

  useEffect(() => {
    if (student && !workoutData.name) {
      const suggestedName = `Treino ${workoutData.objective} - ${student.full_name}`;
      setWorkoutData(prev => ({ ...prev, name: suggestedName }));
    }
  }, [student, workoutData.objective, workoutData.name]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações do Treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Treino *</Label>
              <Input
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={workoutData.name}
                onChange={(e) => handleWorkoutChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Objetivo *</Label>
              <Select value={workoutData.objective} onValueChange={(value) => handleWorkoutChange('objective', value)}>
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

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Carregar de Template</Label>
              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolher template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.exercises?.length || 0} exercícios)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadTemplate} variant="outline" className="border-orange-200">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Banco de Exercícios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buscar Exercício</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome do exercício..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Grupo Muscular</Label>
              <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map(group => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Carregando exercícios...
              </div>
            ) : getFilteredExercises().length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhum exercício encontrado.
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {getFilteredExercises().map((exercise) => (
                  <div 
                    key={exercise.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-orange-200"
                    onClick={() => selectExerciseFromDatabase(exercise)}
                  >
                    <div className="flex items-center gap-3">
                      <Dumbbell className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">{exercise.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {muscleGroups.find(g => g.value === exercise.muscle_group)?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.equipment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-orange-600 hover:bg-orange-50">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurar Exercício</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Exercício *</Label>
              <Input
                placeholder="Ex: Supino Reto ou selecione do banco acima"
                value={newExercise.exercise_name}
                onChange={(e) => handleExerciseChange('exercise_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Vídeo (opcional)</Label>
              <Input
                placeholder="https://youtube.com/..."
                value={newExercise.video_url}
                onChange={(e) => handleExerciseChange('video_url', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Séries</Label>
              <Input
                placeholder="3"
                value={newExercise.sets}
                onChange={(e) => handleExerciseChange('sets', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Repetições</Label>
              <Input
                placeholder="12-15"
                value={newExercise.reps}
                onChange={(e) => handleExerciseChange('reps', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Carga</Label>
              <Input
                placeholder="20kg"
                value={newExercise.weight}
                onChange={(e) => handleExerciseChange('weight', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Descanso</Label>
              <Input
                placeholder="60s"
                value={newExercise.rest}
                onChange={(e) => handleExerciseChange('rest', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Dicas de execução, cuidados especiais..."
              value={newExercise.notes}
              onChange={(e) => handleExerciseChange('notes', e.target.value)}
              className="h-20"
            />
          </div>

          <Button onClick={addExercise} className="w-full bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Exercício ao Treino
          </Button>
        </CardContent>
      </Card>

      {workoutData.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Exercícios do Treino ({workoutData.exercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workoutData.exercises.map((exercise, index) => (
                <div key={index} className="p-4 border border-orange-200 rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Dumbbell className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-gray-800">{exercise.exercise_name}</h4>
                        {exercise.video_url && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                        {exercise.sets && <span><strong>Séries:</strong> {exercise.sets}</span>}
                        {exercise.reps && <span><strong>Reps:</strong> {exercise.reps}</span>}
                        {exercise.weight && <span><strong>Carga:</strong> {exercise.weight}</span>}
                        {exercise.rest && <span><strong>Descanso:</strong> {exercise.rest}</span>}
                      </div>
                      
                      {exercise.notes && (
                        <p className="text-sm text-gray-600 italic">{exercise.notes}</p>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeExercise(index)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveWorkout}
          disabled={!workoutData.name.trim() || workoutData.exercises.length === 0}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Finalizar Treino
        </Button>
      </div>
    </div>
  );
}