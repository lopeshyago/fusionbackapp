import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, X } from 'lucide-react';

const exercisesByMuscleGroup = {
  "Peito": [
    "Crucifixo com Halteres", "Crucifixo Inclinado", "Crucifixo na Máquina", "Flexão de Braços",
    "Flexão Diamante", "Flexão Inclinada", "Fly Peck Deck", "Peck Deck", "Pullover com Halter",
    "Pullover no Cabo", "Supino com Barra", "Supino com Halteres", "Supino Declinado Barra",
    "Supino Declinado Halteres", "Supino Inclinado Barra", "Supino Inclinado Halteres",
    "Supino na Máquina", "Supino Reto"
  ],
  "Costas": [
    "Barra Fixa", "Barra Fixa Pegada Neutra", "Levantamento Terra", "Levantamento Terra Romeno",
    "Levantamento Terra Sumo", "Pulley Alto", "Pulley Baixo", "Pulley Frente", "Pulley Triângulo",
    "Puxada Alta", "Puxada Fechada", "Puxada Neutra", "Remada Articulada", "Remada Baixa",
    "Remada Cavalinho", "Remada com Barra", "Remada com Halteres", "Remada Curvada",
    "Remada na Máquina", "Remada Serrote", "Remada T-Bar", "Remada Unilateral"
  ],
  "Ombros": [
    "Crucifixo Inverso", "Desenvolvimento Arnold", "Desenvolvimento com Barra", "Desenvolvimento com Halteres",
    "Desenvolvimento na Máquina", "Desenvolvimento por Trás", "Elevação Frontal", "Elevação Lateral",
    "Elevação Lateral na Polia", "Elevação Posterior", "Face Pull", "Remada Alta", "Upright Row"
  ],
  "Bíceps": [
    "Bíceps 21", "Bíceps Alternado", "Bíceps Concentrado", "Bíceps Martelo", "Bíceps na Polia",
    "Bíceps Scott", "Rosca Direta", "Rosca Inversa", "Rosca Martelo", "Rosca Punho", "Rosca Scott",
    "Rosca Simultânea", "Rosca Spider"
  ],
  "Tríceps": [
    "Flexão Fechada", "Mergulho no Banco", "Mergulho Paralelas", "Paralelas", "Supino Fechado",
    "Tríceps Coice", "Tríceps Francês", "Tríceps na Polia", "Tríceps no Banco", "Tríceps Pulley",
    "Tríceps Testa"
  ],
  "Pernas - Quadríceps": [
    "Afundo", "Afundo Búlgaro", "Afundo Caminhando", "Agachamento", "Agachamento Búlgaro",
    "Agachamento Frontal", "Agachamento Hack", "Agachamento Livre", "Agachamento Smith",
    "Agachamento Sumo", "Cadeira Extensora", "Extensão de Pernas", "Hack Machine", "Leg Press",
    "Leg Press 45°", "Passada", "Sissy Squat"
  ],
  "Pernas - Posteriores": [
    "Cadeira Flexora", "Flexão de Pernas", "Levantamento Terra Romeno", "Mesa Flexora", "Stiff"
  ],
  "Glúteos": [
    "Abdução de Quadril", "Agachamento Búlgaro", "Agachamento Sumo", "Cadeira Abdutora",
    "Elevação Pélvica", "Hip Thrust", "Ponte"
  ],
  "Panturrilha": [
    "Elevação de Panturrilha", "Elevação na Máquina", "Elevação Sentado", "Panturrilha Burro",
    "Panturrilha em Pé", "Panturrilha no Leg Press", "Panturrilha Sentado"
  ],
  "Abdômen": [
    "Abdominal", "Abdominal Bicicleta", "Abdominal na Máquina", "Abdominal Oblíquo",
    "Abdominal Prancha", "Abdominal Supra", "Elevação de Pernas", "Mountain Climber",
    "Prancha", "Prancha Lateral", "Russian Twist"
  ],
  "Cardio/Funcional": [
    "Burpees", "Corrida Estacionária", "High Knees", "Jumping Jacks", "Polichinelos", "Step Up"
  ]
};

export default function ExerciseSelector({ onSelect, placeholder = "Ou escolha da lista" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar exercícios com base na busca
  const filteredExercises = Object.entries(exercisesByMuscleGroup).reduce((acc, [group, exercises]) => {
    const filtered = exercises.filter(exercise => 
      exercise.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {});

  const handleSelect = (exercise) => {
    onSelect(exercise);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <>
      <Button 
        type="button"
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="flex-1 sm:w-48 justify-start text-left"
      >
        {placeholder}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-none p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Escolher Exercício</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {Object.entries(filteredExercises).map(([muscleGroup, exercises]) => (
              <div key={muscleGroup} className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-2">
                  {muscleGroup}
                </h3>
                <div className="space-y-1">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => handleSelect(exercise)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(filteredExercises).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum exercício encontrado para "{searchTerm}"
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}