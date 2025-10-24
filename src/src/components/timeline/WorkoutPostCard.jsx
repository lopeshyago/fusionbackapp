import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, Trophy, Bookmark } from 'lucide-react';

export default function WorkoutPostCard({ workout, onSaveWorkout }) {
  if (!workout || !workout.exercises) return null;

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 mt-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Treino do Dia
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSaveWorkout?.(workout)}
            className="border-orange-300 text-orange-700 hover:bg-orange-200"
          >
            <Bookmark className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-orange-700">
            <Target className="h-4 w-4" />
            <span>{workout.objective}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-700">
            <Clock className="h-4 w-4" />
            <span>{workout.duration_minutes || 45}min</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-orange-800">Exercícios realizados:</h4>
          <div className="grid gap-2">
            {workout.exercises.slice(0, 3).map((exercise, index) => (
              <div key={index} className="bg-white/60 rounded-lg p-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{exercise.exercise_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {exercise.sets}x{exercise.reps}
                  </Badge>
                </div>
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <p className="text-xs text-orange-600 text-center">
                +{workout.exercises.length - 3} exercícios
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}