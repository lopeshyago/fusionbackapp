import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Save, CalendarPlus, Palette } from "lucide-react";
import { WeeklySchedule } from "@/api/entities";

const timeSlots = [
  "06:00", "06:15", "06:30", "06:45",
  "07:00", "07:15", "07:30", "07:45", 
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45"
];
const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const colors = [
  { name: "Laranja", value: "bg-orange-500" },
  { name: "Azul", value: "bg-blue-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Vermelho", value: "bg-red-500" },
  { name: "Roxo", value: "bg-purple-500" },
  { name: "Amarelo", value: "bg-yellow-500" },
  { name: "Ciano", value: "bg-cyan-500" },
  { name: "Rosa", value: "bg-pink-500" },
];

export default function BatchScheduleForm({ isOpen, onOpenChange, condominiumId, onSave }) {
  const [formData, setFormData] = useState({
    day_of_week: 'Segunda',
    start_time: '08:00',
    end_time: '17:00',
    activity_name: '',
    duration: 60,
    capacity: 15,
    color: 'bg-orange-500'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { day_of_week, start_time, end_time, ...commonData } = formData;

    if (!commonData.activity_name) {
      alert("Por favor, preencha o nome da atividade.");
      return;
    }

    const startIndex = timeSlots.indexOf(start_time);
    const endIndex = timeSlots.indexOf(end_time);

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
      alert("Seleção de horários inválida.");
      return;
    }

    const slotsToCreate = [];
    for (let i = startIndex; i <= endIndex; i++) {
      slotsToCreate.push({
        ...commonData,
        day_of_week,
        time: timeSlots[i],
        condominium_id: condominiumId,
      });
    }

    try {
      await WeeklySchedule.bulkCreate(slotsToCreate);
      onSave();
    } catch (error) {
      console.error("Falha ao criar horários em lote:", error);
      alert(`Não foi possível criar os horários. Erro: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <CalendarPlus className="h-5 w-5" />
            Adicionar Aulas em Lote
          </DialogTitle>
          <DialogDescription>
            Preencha os horários de um dia inteiro de uma só vez.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Dia da Semana</Label>
            <Select value={formData.day_of_week} onValueChange={(value) => handleChange('day_of_week', value)}>
              <SelectTrigger className="border-orange-300"><SelectValue /></SelectTrigger>
              <SelectContent>{weekDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>De</Label>
              <Select value={formData.start_time} onValueChange={(value) => handleChange('start_time', value)}>
                <SelectTrigger className="border-orange-300"><SelectValue /></SelectTrigger>
                <SelectContent>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Até</Label>
              <Select value={formData.end_time} onValueChange={(value) => handleChange('end_time', value)}>
                <SelectTrigger className="border-orange-300"><SelectValue /></SelectTrigger>
                <SelectContent>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome da Atividade (para todos os horários)</Label>
            <Input 
              placeholder="Ex: Treinamento Funcional" 
              value={formData.activity_name || ''} 
              onChange={(e) => handleChange('activity_name', e.target.value)}
              className="border-orange-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração Padrão</Label>
              <Input 
                type="number" 
                value={formData.duration} 
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className="border-orange-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade Padrão</Label>
              <Input 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                className="border-orange-300"
              />
            </div>
          </div>
          
           <div className="space-y-2">
            <Label>Cor do Evento</Label>
             <Select value={formData.color || 'bg-orange-500'} onValueChange={(value) => handleChange('color', value)}>
                <SelectTrigger className="border-orange-300">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.value}`} />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            Adicionar Horários
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}