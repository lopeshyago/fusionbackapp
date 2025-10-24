
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from "@/components/ui/checkbox";
import { X, Play, Pause, RotateCcw, Dumbbell, Repeat, Clock, StickyNote, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkoutTimer({ workout, onComplete, onCancel }) {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false); // Começa pausado
  const [completedExercises, setCompletedExercises] = useState([]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isActive && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const { exerciseList, sessionName } = useMemo(() => {
    if (workout.workout_type === 'multiple' && workout.selectedSession) {
      const session = workout.sessions.find(s => s.session_letter === workout.selectedSession);
      return {
        exerciseList: session?.exercises || [],
        sessionName: session?.session_name || `Treino ${workout.selectedSession}`
      };
    }
    return { 
      exerciseList: workout.exercises || [],
      sessionName: workout.name
    };
  }, [workout]);

  const toggleExerciseComplete = (index) => {
    setCompletedExercises(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCompleteWorkout = () => {
    if (completedExercises.length === 0) {
      alert('Marque pelo menos um exercício como concluído antes de finalizar o treino.');
      return;
    }
    
    if (confirm('Deseja finalizar este treino?')) {
      const completedData = exerciseList
        .filter((_, index) => completedExercises.includes(index))
        .map(ex => ({ exercise_name: ex.exercise_name, completed_at: new Date().toISOString() }));
      
      const duration = Math.floor(time / 60);
      onComplete(workout.id, completedData, duration);
    }
  };

  const progress = exerciseList.length > 0 ? (completedExercises.length / exerciseList.length) * 100 : 0;

  const formatTime = (seconds) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = `${Math.floor(seconds / 60)}`;
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours} : ${getMinutes} : ${getSeconds}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black text-white z-[100] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-orange-400">{sessionName}</h2>
            <p className="text-xs text-gray-400">{workout.objective}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Timer */}
        <div className="p-4 text-center border-b border-gray-700 flex-shrink-0">
          <h1 className="text-4xl font-mono tracking-wider text-orange-400 mb-3">{formatTime(time)}</h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" 
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-gray-500 hover:bg-gray-500 hover:text-white" 
              onClick={() => setTime(0)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-4">
            <Progress value={progress} className="bg-gray-700 [&>*]:bg-orange-500" />
            <p className="text-xs text-gray-400 mt-1">{completedExercises.length} de {exerciseList.length} exercícios completos</p>
          </div>
        </div>

        {/* Lista de Exercícios - Área Scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {exerciseList.map((exercise, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                completedExercises.includes(index) 
                ? 'bg-green-900/50 border-green-600' 
                : 'bg-gray-800/70 border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  id={`exercise-${index}`}
                  checked={completedExercises.includes(index)}
                  onCheckedChange={() => toggleExerciseComplete(index)}
                  className="mt-1 border-gray-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-400"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={`exercise-${index}`}
                    className={`font-semibold text-lg cursor-pointer ${completedExercises.includes(index) ? 'line-through text-gray-400' : 'text-white'}`}
                  >
                    {exercise.exercise_name}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300">
                    {exercise.sets && <span className="flex items-center gap-2"><Repeat className="h-4 w-4 text-orange-400" />{exercise.sets} séries</span>}
                    {exercise.reps && <span className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-orange-400" />{exercise.reps} reps</span>}
                    {exercise.rest && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-400" />{exercise.rest}</span>}
                    {exercise.weight && <span className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-orange-400" />{exercise.weight}</span>}
                  </div>
                  {exercise.notes && (
                    <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-700/50 rounded-md flex items-start gap-2">
                      <StickyNote className="h-4 w-4 mt-0.5 text-orange-400 shrink-0" />
                      {exercise.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Botão no final da lista - mais compatível com mobile */}
          {completedExercises.length > 0 && (
            <div className="pt-4 pb-8">
              <Button 
                onClick={handleCompleteWorkout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-xl shadow-2xl border-2 border-green-400"
                size="lg"
              >
                <Check className="h-6 w-6 mr-3" />
                Concluir Treino ({completedExercises.length}/{exerciseList.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
