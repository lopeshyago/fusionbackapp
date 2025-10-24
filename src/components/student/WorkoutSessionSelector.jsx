import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Dumbbell, Target } from 'lucide-react';

export default function WorkoutSessionSelector({ workout, onSessionSelect }) {

  if (!workout || !workout.sessions || workout.sessions.length === 0) {
    return (
      <div className="w-full">
        <Button 
          onClick={() => onSessionSelect(null)}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Play className="h-5 w-5 mr-3" />
          Iniciar Treino
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Escolha sua sessão</h3>
        <p className="text-sm text-gray-600">Selecione qual treino você quer fazer hoje</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {workout.sessions.map((session) => (
          <Card 
            key={session.session_letter}
            className="overflow-hidden border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:-translate-y-1"
            onClick={() => onSessionSelect(session.session_letter)}
          >
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                {/* Letra da Sessão - Grande e Destacada */}
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">{session.session_letter}</span>
                </div>
                
                {/* Nome da Sessão */}
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{session.session_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {session.exercises ? session.exercises.length : 0} exercícios
                  </p>
                </div>
                
                {/* Botão de Iniciar */}
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionSelect(session.session_letter);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Sessão {session.session_letter}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Informação adicional */}
      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
        <div className="flex items-center justify-center gap-2 text-orange-700">
          <Target className="h-4 w-4" />
          <span className="text-sm font-medium">Objetivo: {workout.objective}</span>
        </div>
      </div>
    </div>
  );
}