
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Save, Plus, Trash2, Copy, Target, User as UserIcon, 
  Dumbbell, Timer, FileText, Edit, Check, X, Calendar,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle2
} from "lucide-react";
import ExerciseSelector from './ExerciseSelector';
import { Workout } from "@/api/entities";

export default function WorkoutBuilderForm({ 
  isOpen, onOpenChange, workout, selectedStudent, instructorId, 
  students, templates, onSave 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workoutType, setWorkoutType] = useState('single');
  const [formData, setFormData] = useState({
    name: '',
    objective: 'hipertrofia',
    student_id: '',
    is_template: false,
    workout_type: 'single',
    exercises: [],
    sessions: []
  });

  const [activeSession, setActiveSession] = useState('A');
  const [newExercise, setNewExercise] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
    rest: '',
    notes: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);

  const handleStepNavigation = (step) => {
    setCurrentStep(step);
    // Adiciona um pequeno delay para garantir que o card esteja visível antes de rolar
    setTimeout(() => {
      const element = document.getElementById(`workout-step-${step}`);
      if (element) {
        // Usa 'block: "start"' para alinhar o card ao topo da tela, ideal para mobile
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Inicializar sessões padrão para treinos múltiplos
  const initializeSessions = (type) => {
    const sessionConfigs = {
      'A': [{ session_name: 'Treino A', session_letter: 'A', exercises: [] }],
      'AB': [
        { session_name: 'Treino A', session_letter: 'A', exercises: [] },
        { session_name: 'Treino B', session_letter: 'B', exercises: [] }
      ],
      'ABC': [
        { session_name: 'Treino A', session_letter: 'A', exercises: [] },
        { session_name: 'Treino B', session_letter: 'B', exercises: [] },
        { session_name: 'Treino C', session_letter: 'C', exercises: [] }
      ],
      'ABCD': [
        { session_name: 'Treino A', session_letter: 'A', exercises: [] },
        { session_name: 'Treino B', session_letter: 'B', exercises: [] },
        { session_name: 'Treino C', session_letter: 'C', exercises: [] },
        { session_name: 'Treino D', session_letter: 'D', exercises: [] }
      ]
    };
    return sessionConfigs[type] || [];
  };

  useEffect(() => {
    if (workout) {
      setFormData({
        name: workout.name || '',
        objective: workout.objective || 'hipertrofia',
        student_id: workout.student_id || '',
        is_template: workout.is_template || false,
        workout_type: workout.workout_type || 'single',
        exercises: workout.exercises || [],
        sessions: workout.sessions || []
      });
      setWorkoutType(workout.workout_type || 'single');
    } else if (selectedStudent) {
      setFormData({
        name: '',
        objective: 'hipertrofia',
        student_id: selectedStudent.id,
        is_template: false,
        workout_type: 'single',
        exercises: [],
        sessions: []
      });
      setWorkoutType('single');
    } else {
      setFormData({
        name: '',
        objective: 'hipertrofia',
        student_id: '',
        is_template: true,
        workout_type: 'single',
        exercises: [],
        sessions: []
      });
      setWorkoutType('single');
    }
    setEditingExerciseIndex(null);
    setNewExercise({ exercise_name: '', sets: '', reps: '', weight: '', rest: '', notes: '' });
    setSelectedMuscleGroups([]);
    setCurrentStep(1);
  }, [workout, selectedStudent, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkoutTypeChange = (type) => {
    setWorkoutType(type);
    handleChange('workout_type', type);
    
    if (type === 'multiple') {
      const sessions = initializeSessions('A');
      handleChange('sessions', sessions);
      setActiveSession('A');
    } else {
      handleChange('sessions', []);
    }
  };

  const handleSessionCountChange = (count) => {
    const sessions = initializeSessions(count);
    handleChange('sessions', sessions);
    setActiveSession('A'); // Ativa a primeira sessão por padrão
    handleStepNavigation(3); // <<-- Adicionado para rolar para o passo 3
  };

  const getCurrentSessionExercises = () => {
    if (workoutType === 'single') return formData.exercises;
    
    const session = formData.sessions.find(s => s.session_letter === activeSession);
    return session ? session.exercises : [];
  };

  const handleExerciseChange = (field, value) => {
    setNewExercise(prev => ({ ...prev, [field]: value }));
  };

  const addExercise = () => {
    if (!newExercise.exercise_name.trim()) return;
    
    if (workoutType === 'single') {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, { ...newExercise }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.map(session => 
          session.session_letter === activeSession 
            ? { ...session, exercises: [...session.exercises, { ...newExercise }] }
            : session
        )
      }));
    }
    
    setNewExercise({
      exercise_name: '',
      sets: '',
      reps: '',
      weight: '',
      rest: '',
      notes: ''
    });
  };

  const removeExercise = (index) => {
    if (workoutType === 'single') {
      setFormData(prev => ({
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.session_letter === activeSession
            ? { ...session, exercises: session.exercises.filter((_, i) => i !== index) }
            : session
        )
      }));
    }
    
    if (editingExerciseIndex === index) {
      setEditingExerciseIndex(null);
    }
  };

  const updateExerciseField = (index, field, value) => {
    if (workoutType === 'single') {
      setFormData(prev => ({
        ...prev,
        exercises: prev.exercises.map((ex, i) => 
          i === index ? { ...ex, [field]: value } : ex
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.session_letter === activeSession
            ? {
                ...session,
                exercises: session.exercises.map((ex, i) => 
                  i === index ? { ...ex, [field]: value } : ex
                )
              }
            : session
        )
      }));
    }
  };

  const loadTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: `${template.name} - ${selectedStudent?.full_name || 'Personalizado'}`,
        objective: template.objective,
        workout_type: template.workout_type || 'single',
        exercises: template.exercises || [],
        sessions: template.sessions || []
      }));
      setWorkoutType(template.workout_type || 'single');
      setSelectedTemplate('');
      setEditingExerciseIndex(null);
    }
  };

  const handleSave = async () => {
    try {
      const workoutData = {
        ...formData,
        instructor_id: instructorId
      };

      if (workout && workout.id) {
        await Workout.update(workout.id, workoutData);
      } else {
        await Workout.create(workoutData);
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      alert('Erro ao salvar treino. Tente novamente.');
    }
  };

  const muscleGroupTemplates = {
    "Peito": [
      { exercise_name: "Supino Reto", sets: "4", reps: "8-12", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Supino Inclinado", sets: "3", reps: "10-12", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Crucifixo com Halteres", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Flexão de Braços", sets: "3", reps: "máx", weight: "", rest: "60s", notes: "" }
    ],
    "Costas": [
      { exercise_name: "Puxada Alta", sets: "4", reps: "8-12", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Remada Baixa", sets: "3", reps: "10-12", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Remada com Halteres", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Pullover no Cabo", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" }
    ],
    "Ombros": [
      { exercise_name: "Desenvolvimento com Halteres", sets: "4", reps: "8-12", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Elevação Lateral", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Elevação Posterior", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Elevação Frontal", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" }
    ],
    "Bíceps": [
      { exercise_name: "Rosca Direta", sets: "3", reps: "10-12", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Rosca Martelo", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Rosca Concentrada", sets: "3", reps: "12-15", weight: "", rest: "45s", notes: "" }
    ],
    "Tríceps": [
      { exercise_name: "Tríceps na Polia", sets: "3", reps: "10-12", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Tríceps Francês", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Tríceps Coice", sets: "3", reps: "12-15", weight: "", rest: "45s", notes: "" }
    ],
    "Pernas - Quadríceps": [
      { exercise_name: "Agachamento", sets: "4", reps: "8-12", weight: "", rest: "2min", notes: "" },
      { exercise_name: "Leg Press", sets: "3", reps: "12-15", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Extensão de Pernas", sets: "3", reps: "15-20", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Afundo", sets: "3", reps: "12 cada", weight: "", rest: "60s", notes: "" }
    ],
    "Pernas - Posteriores": [
      { exercise_name: "Levantamento Terra", sets: "4", reps: "6-10", weight: "", rest: "2min", notes: "" },
      { exercise_name: "Cadeira Flexora", sets: "3", reps: "12-15", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Stiff", sets: "3", reps: "10-12", weight: "", rest: "90s", notes: "" }
    ],
    "Glúteos": [
      { exercise_name: "Hip Thrust", sets: "4", reps: "10-15", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Agachamento Sumo", sets: "3", reps: "12-15", weight: "", rest: "90s", notes: "" },
      { exercise_name: "Elevação Pélvica", sets: "3", reps: "15-20", weight: "", rest: "60s", notes: "" }
    ],
    "Panturrilha": [
      { exercise_name: "Panturrilha em Pé", sets: "4", reps: "15-20", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Panturrilha Sentado", sets: "3", reps: "15-20", weight: "", rest: "60s", notes: "" }
    ],
    "Abdômen": [
      { exercise_name: "Abdominal Supra", sets: "3", reps: "15-20", weight: "", rest: "45s", notes: "" },
      { exercise_name: "Prancha", sets: "3", reps: "30-60s", weight: "", rest: "60s", notes: "" },
      { exercise_name: "Abdominal Oblíquo", sets: "3", reps: "15 cada", weight: "", rest: "45s", notes: "" }
    ]
  };

  const addMuscleGroupExercises = () => {
    if (selectedMuscleGroups.length === 0) return;

    let newExercises = [];
    selectedMuscleGroups.forEach(group => {
      if (muscleGroupTemplates[group]) {
        newExercises = [...newExercises, ...muscleGroupTemplates[group]];
      }
    });

    if (workoutType === 'single') {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, ...newExercises]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.session_letter === activeSession
            ? { ...session, exercises: [...session.exercises, ...newExercises] }
            : session
        )
      }));
    }

    setSelectedMuscleGroups([]);
  };

  const toggleMuscleGroup = (group) => {
    setSelectedMuscleGroups(prev => {
      if (prev.includes(group)) {
        return prev.filter(g => g !== group);
      } else {
        return [...prev, group];
      }
    });
  };

  // Validações para cada etapa
  const isStep1Valid = formData.name.trim() && formData.objective;
  const isStep2Valid = workoutType === 'single' || formData.sessions.length > 0;
  const hasExercises = workoutType === 'single' 
    ? formData.exercises.length > 0 
    : formData.sessions.some(session => session.exercises.length > 0);

  const currentExercises = getCurrentSessionExercises();
  const totalExercises = workoutType === 'single' 
    ? formData.exercises.length 
    : formData.sessions.reduce((total, session) => total + session.exercises.length, 0);

  // Calcular progresso
  const getProgress = () => {
    let progress = 0;
    if (isStep1Valid) progress += 33;
    if (isStep2Valid) progress += 33;
    if (hasExercises) progress += 34;
    return progress;
  };

  // Passos da criação
  const steps = [
    {
      id: 1,
      title: "Configurações Básicas",
      description: "Nome, objetivo e tipo do treino",
      isValid: isStep1Valid,
      isRequired: true
    },
    {
      id: 2,
      title: "Estrutura do Treino",
      description: workoutType === 'multiple' ? "Definir sessões (A, B, C, D)" : "Configurar treino único",
      isValid: isStep2Valid,
      isRequired: true
    },
    {
      id: 3,
      title: "Adicionar Exercícios",
      description: `${totalExercises} exercícios adicionados`,
      isValid: hasExercises,
      isRequired: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] md:w-full max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-orange-600" />
                <DialogTitle className="text-lg md:text-xl">
                  {workout ? "Editar Treino" : "Criar Novo Treino"}
                </DialogTitle>
              </div>
              {selectedStudent && (
                <Badge className="bg-blue-100 text-blue-800">
                  Para: {selectedStudent.full_name}
                </Badge>
              )}
            </div>

            {/* Progresso */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Progresso da criação</span>
                <span className="text-gray-600">{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>

            {/* Lista de Passos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  onClick={() => handleStepNavigation(step.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    step.isValid 
                      ? 'bg-green-50 border-green-200' 
                      : currentStep === step.id
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step.isValid 
                        ? 'bg-green-500 text-white' 
                        : currentStep === step.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.isValid ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{step.title}</h4>
                      <p className="text-xs text-gray-600 truncate">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-6">
          {/* Etapa 1: Configurações Básicas */}
          <Card id="workout-step-1" className={`border-2 ${currentStep === 1 ? 'border-orange-300 bg-orange-50' : isStep1Valid ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader>
              <button
                onClick={() => handleStepNavigation(1)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isStep1Valid ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {isStep1Valid ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                  </span>
                  Passo 1: Configurações Básicas
                  {!isStep1Valid && <AlertCircle className="h-4 w-4 text-orange-600" />}
                </CardTitle>
                {currentStep === 1 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </CardHeader>
            {currentStep === 1 && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Nome do Treino *</Label>
                    <Input
                      placeholder="Ex: Treino Completo ABC"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Objetivo *</Label>
                    <Select value={formData.objective} onValueChange={(value) => handleChange('objective', value)}>
                      <SelectTrigger className="h-12 text-base">
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

                {/* Tipo de Treino */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Como será organizado o treino? *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={`cursor-pointer border-2 transition-all ${workoutType === 'single' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`} 
                          onClick={() => handleWorkoutTypeChange('single')}>
                      <CardContent className="p-6 text-center">
                        <Dumbbell className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                        <h3 className="font-bold text-lg mb-2">Treino Único</h3>
                        <p className="text-sm text-gray-600">Um só treino com todos os exercícios</p>
                        <p className="text-xs text-gray-500 mt-2">✅ Mais simples de gerenciar</p>
                      </CardContent>
                    </Card>
                    
                    <Card className={`cursor-pointer border-2 transition-all ${workoutType === 'multiple' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`} 
                          onClick={() => handleWorkoutTypeChange('multiple')}>
                      <CardContent className="p-6 text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                        <h3 className="font-bold text-lg mb-2">Treino Múltiplo</h3>
                        <p className="text-sm text-gray-600">Diferentes sessões (A, B, C, D)</p>
                        <p className="text-xs text-gray-500 mt-2">✅ Mais profissional e variado</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleStepNavigation(2)} 
                    disabled={!isStep1Valid}
                    className="h-12 px-8 text-base bg-orange-500 hover:bg-orange-600"
                  >
                    Continuar para o Passo 2 <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Etapa 2: Estrutura do Treino */}
          {workoutType === 'multiple' && (
            <Card id="workout-step-2" className={`border-2 ${currentStep === 2 ? 'border-orange-300 bg-orange-50' : isStep2Valid ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <button
                  onClick={() => handleStepNavigation(2)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isStep2Valid ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {isStep2Valid ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                    </span>
                    Passo 2: Definir Sessões de Treino
                    {!isStep2Valid && <AlertCircle className="h-4 w-4 text-orange-600" />}
                  </CardTitle>
                  {currentStep === 2 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </CardHeader>
              {currentStep === 2 && (
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 text-base">💡 Como funciona?</h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Você pode criar até 4 sessões diferentes (A, B, C, D). O aluno poderá escolher qual sessão fazer a cada dia!
                    </p>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-lg font-bold text-gray-800">Quantas sessões de treino diferentes?</Label>
                    
                    <div className="space-y-4">
                      {[
                        { 
                          key: 'A', 
                          label: 'Treino A', 
                          desc: '1 sessão por semana', 
                          sessions: 1,
                          details: 'Ideal para iniciantes ou manutenção',
                          emoji: '💪'
                        },
                        { 
                          key: 'AB', 
                          label: 'Treino A + B', 
                          desc: '2 sessões alternadas', 
                          sessions: 2,
                          details: 'Divisão superior/inferior ou push/pull',
                          emoji: '🔥'
                        },
                        { 
                          key: 'ABC', 
                          label: 'Treino A + B + C', 
                          desc: '3 sessões diferentes', 
                          sessions: 3,
                          details: 'Treino completo com boa variação',
                          emoji: '⚡'
                        },
                        { 
                          key: 'ABCD', 
                          label: 'Treino A + B + C + D', 
                          desc: '4 sessões avançadas', 
                          sessions: 4,
                          details: 'Máxima variação e especialização',
                          emoji: '🚀'
                        }
                      ].map(option => (
                        <Card
                          key={option.key}
                          className={`cursor-pointer border-2 transition-all transform ${
                            formData.sessions.length === option.sessions 
                              ? 'border-orange-500 bg-orange-50 shadow-lg scale-105' 
                              : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                          }`}
                          onClick={() => handleSessionCountChange(option.key)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">{option.emoji}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg text-gray-800">{option.label}</h3>
                                  {formData.sessions.length === option.sessions && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                                <p className="text-orange-600 font-semibold text-base mb-1">{option.desc}</p>
                                <p className="text-gray-600 text-sm">{option.details}</p>
                              </div>
                              <div className="text-right">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                                  formData.sessions.length === option.sessions
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {option.sessions}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {formData.sessions.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <h4 className="font-bold text-green-800 text-lg">Perfeito! Sessões Configuradas</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {formData.sessions.map((session, index) => (
                              <div 
                                key={session.session_letter} 
                                className="bg-white rounded-lg p-4 border-2 border-green-200 text-center"
                              >
                                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-2">
                                  {session.session_letter}
                                </div>
                                <p className="font-semibold text-green-800 text-sm">{session.session_name}</p>
                                <p className="text-green-600 text-xs">0 exercícios</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <p className="text-green-800 font-semibold text-base">
                              🎯 Agora você pode adicionar exercícios específicos para cada sessão!
                            </p>
                            <p className="text-green-600 text-sm mt-1">
                              O aluno escolherá qual treino fazer a cada dia (A, B, C ou D)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleStepNavigation(1)}
                      className="h-14 px-6 text-base w-full sm:w-auto"
                    >
                      ← Voltar ao Passo 1
                    </Button>
                    <Button 
                      onClick={() => handleStepNavigation(3)} 
                      disabled={!isStep2Valid}
                      className="h-14 px-8 text-base bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                    >
                      Continuar para o Passo 3 →
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Etapa 3: Adicionar Exercícios */}
          <Card id="workout-step-3" className={`border-2 ${currentStep === 3 ? 'border-orange-300 bg-orange-50' : hasExercises ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader>
              <button
                onClick={() => handleStepNavigation(3)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    hasExercises ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {hasExercises ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                  </span>
                  Passo 3: Adicionar Exercícios
                  {!hasExercises && <AlertCircle className="h-4 w-4 text-orange-600" />}
                </CardTitle>
                {currentStep === 3 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </CardHeader>
            {currentStep === 3 && (
              <CardContent className="space-y-6">
                {/* Seletor de Sessão para Treinos Múltiplos */}
                {workoutType === 'multiple' && formData.sessions.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Qual sessão você quer editar?</Label>
                    <Tabs value={activeSession} onValueChange={setActiveSession}>
                      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-orange-100 p-2 h-auto">
                        {formData.sessions.map((session) => (
                          <TabsTrigger 
                            key={session.session_letter} 
                            value={session.session_letter}
                            className="flex flex-col gap-1 py-4 h-auto data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                          >
                            <span className="font-bold text-xl">{session.session_letter}</span>
                            <span className="text-xs">{session.exercises.length} exercícios</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 font-medium">
                        🎯 Editando: <strong>{formData.sessions.find(s => s.session_letter === activeSession)?.session_name}</strong> 
                        ({currentExercises.length} exercícios)
                      </p>
                    </div>
                  </div>
                )}

                {/* Adicionar por Grupamento */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">MÉTODO 1</Badge>
                    <Label className="text-base font-semibold">Adicionar por Grupamento Muscular (Rápido)</Label>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Selecione os grupamentos e adicione exercícios automaticamente:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.keys(muscleGroupTemplates).map((group) => (
                          <label key={group} className="flex items-center space-x-2 p-3 bg-white rounded border cursor-pointer hover:bg-orange-50">
                            <Checkbox
                              checked={selectedMuscleGroups.includes(group)}
                              onCheckedChange={() => toggleMuscleGroup(group)}
                            />
                            <span className="text-sm font-medium">{group}</span>
                          </label>
                        ))}
                      </div>
                      {selectedMuscleGroups.length > 0 && (
                        <div className="pt-3">
                          <Button 
                            onClick={addMuscleGroupExercises}
                            className="w-full h-12 bg-blue-500 hover:bg-blue-600"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Adicionar {selectedMuscleGroups.length} Grupamentos ({selectedMuscleGroups.reduce((total, group) => total + muscleGroupTemplates[group].length, 0)} exercícios)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adicionar Individual */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">MÉTODO 2</Badge>
                    <Label className="text-base font-semibold">Adicionar Exercício Individual</Label>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="space-y-3">
                      <Label>Nome do Exercício *</Label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          placeholder="Ex: Supino Reto"
                          value={newExercise.exercise_name}
                          onChange={(e) => handleExerciseChange('exercise_name', e.target.value)}
                          className="flex-1 h-12 text-base"
                        />
                        <ExerciseSelector 
                          onSelect={(exercise) => handleExerciseChange('exercise_name', exercise)}
                          placeholder="Ou escolha da lista"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Séries (ex: 3)"
                        value={newExercise.sets}
                        onChange={(e) => handleExerciseChange('sets', e.target.value)}
                        className="h-12 text-base"
                      />
                      <Input
                        placeholder="Reps (ex: 12-15)"
                        value={newExercise.reps}
                        onChange={(e) => handleExerciseChange('reps', e.target.value)}
                        className="h-12 text-base"
                      />
                      <Input
                        placeholder="Carga (ex: 20kg)"
                        value={newExercise.weight}
                        onChange={(e) => handleExerciseChange('weight', e.target.value)}
                        className="h-12 text-base"
                      />
                      <Input
                        placeholder="Descanso (ex: 60s)"
                        value={newExercise.rest}
                        onChange={(e) => handleExerciseChange('rest', e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>

                    <Textarea
                      placeholder="Observações (opcional)"
                      value={newExercise.notes}
                      onChange={(e) => handleExerciseChange('notes', e.target.value)}
                      className="h-20 text-base"
                    />

                    <Button 
                      onClick={addExercise} 
                      disabled={!newExercise.exercise_name.trim()}
                      className="w-full h-12 bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Adicionar Exercício{workoutType === 'multiple' ? ` ao Treino ${activeSession}` : ''}
                    </Button>
                  </div>
                </div>

                {/* Lista de Exercícios */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Exercícios {workoutType === 'multiple' ? `do Treino ${activeSession}` : 'do Treino'} ({currentExercises.length})
                    </Label>
                    {workoutType === 'multiple' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Total: {totalExercises} exercícios em {formData.sessions.length} sessões
                      </Badge>
                    )}
                  </div>

                  {currentExercises.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <Dumbbell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">
                        Nenhum exercício adicionado{workoutType === 'multiple' ? ` ao Treino ${activeSession}` : ''}
                      </h4>
                      <p className="text-gray-500">Use os métodos acima para adicionar exercícios</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentExercises.map((exercise, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-white border-orange-200">
                          {editingExerciseIndex === index ? (
                            // Modo de Edição
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Dumbbell className="h-5 w-5 text-orange-600" />
                                <Input
                                  value={exercise.exercise_name}
                                  onChange={(e) => updateExerciseField(index, 'exercise_name', e.target.value)}
                                  className="font-semibold flex-1 h-12"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-sm text-gray-500">Séries</Label>
                                  <Input
                                    value={exercise.sets || ''}
                                    onChange={(e) => updateExerciseField(index, 'sets', e.target.value)}
                                    placeholder="3"
                                    className="h-10"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-500">Repetições</Label>
                                  <Input
                                    value={exercise.reps || ''}
                                    onChange={(e) => updateExerciseField(index, 'reps', e.target.value)}
                                    placeholder="12-15"
                                    className="h-10"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-500">Carga</Label>
                                  <Input
                                    value={exercise.weight || ''}
                                    onChange={(e) => updateExerciseField(index, 'weight', e.target.value)}
                                    placeholder="20kg"
                                    className="h-10"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-500">Descanso</Label>
                                  <Input
                                    value={exercise.rest || ''}
                                    onChange={(e) => updateExerciseField(index, 'rest', e.target.value)}
                                    placeholder="60s"
                                    className="h-10"
                                  />
                                </div>
                              </div>
                              
                              <Textarea
                                value={exercise.notes || ''}
                                onChange={(e) => updateExerciseField(index, 'notes', e.target.value)}
                                placeholder="Observações..."
                                className="h-16"
                              />
                              
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditingExerciseIndex(null)}
                                  className="bg-green-500 hover:bg-green-600 h-10"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Salvar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingExerciseIndex(null)}
                                  className="h-10"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Modo de Visualização
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-semibold text-sm">
                                    {index + 1}
                                  </div>
                                  <Dumbbell className="h-5 w-5 text-orange-600" />
                                  <h4 className="font-semibold text-gray-800 text-lg">{exercise.exercise_name}</h4>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 text-sm mb-3">
                                  {exercise.sets && (
                                    <Badge variant="outline" className="bg-gray-50">
                                      <strong>Séries:</strong> {exercise.sets}
                                    </Badge>
                                  )}
                                  {exercise.reps && (
                                    <Badge variant="outline" className="bg-gray-50">
                                      <strong>Reps:</strong> {exercise.reps}
                                    </Badge>
                                  )}
                                  {exercise.weight && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                      <strong>Carga:</strong> {exercise.weight}
                                    </Badge>
                                  )}
                                  {exercise.rest && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      <strong>Descanso:</strong> {exercise.rest}
                                    </Badge>
                                  )}
                                </div>
                                
                                {exercise.notes && (
                                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                                    <strong>Obs:</strong> {exercise.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setEditingExerciseIndex(index)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => removeExercise(index)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => handleStepNavigation(workoutType === 'multiple' ? 2 : 1)}
                    className="h-12 px-6"
                  >
                    Voltar ao Passo {workoutType === 'multiple' ? '2' : '1'}
                  </Button>
                  {hasExercises && (
                    <Button 
                      onClick={handleSave}
                      className="h-12 px-8 text-base bg-green-500 hover:bg-green-600"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {workout ? 'Atualizar Treino' : 'Criar Treino'}
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Resumo para Treinos Múltiplos */}
          {workoutType === 'multiple' && formData.sessions.length > 0 && totalExercises > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6" />
                  Resumo do Programa Completo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {formData.sessions.map((session) => (
                    <div key={session.session_letter} className="text-center p-4 bg-white rounded-lg border shadow-sm">
                      <h3 className="font-bold text-2xl text-orange-600 mb-1">Treino {session.session_letter}</h3>
                      <p className="text-3xl font-bold text-gray-800">{session.exercises.length}</p>
                      <p className="text-sm text-gray-600">exercícios</p>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Badge className="bg-blue-600 text-white text-xl px-6 py-3">
                    📊 Total: {totalExercises} exercícios em {formData.sessions.length} sessões
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação Final */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-6">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isStep1Valid || !hasExercises}
              className="h-12 px-8 text-base bg-orange-500 hover:bg-orange-600"
            >
              <Save className="h-5 w-5 mr-2" />
              {workout ? 'Atualizar Treino' : 'Criar Treino'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
