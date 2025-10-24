import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Save, Clock, Palette } from "lucide-react";
import { WeeklySchedule } from "@/api/entities";

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

export default function ScheduleSlotForm({ isOpen, onOpenChange, slot, existingSchedule, onSave }) {
  const [formData, setFormData] = useState({});
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingSchedule) {
        setFormData(existingSchedule);
        setCustomTime(existingSchedule.time || '');
      } else {
        setFormData({
          day_of_week: slot.day,
          time: slot.time,
          condominium_id: slot.condominiumId,
          activity_name: '',
          duration: 60,
          capacity: 15,
          color: 'bg-orange-500'
        });
        setCustomTime(slot.time || '');
      }
    }
  }, [isOpen, slot, existingSchedule]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (time) => {
    setCustomTime(time);
    setFormData(prev => ({ ...prev, time }));
  };

  const handleSave = async () => {
    if (!formData.activity_name) {
      alert("Por favor, preencha o nome da atividade.");
      return;
    }
    
    if (!customTime) {
      alert("Por favor, defina o horário da aula.");
      return;
    }
    
    try {
      const dataToSave = { ...formData, time: customTime };
      
      if (formData.id) {
        await WeeklySchedule.update(formData.id, dataToSave);
      } else {
        await WeeklySchedule.create(dataToSave);
      }
      onSave();
    } catch (error) {
        console.error("Falha ao salvar horário:", error);
        alert(`Não foi possível salvar o horário. Erro: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Clock className="h-5 w-5" />
            {formData.id ? "Editar Horário" : "Novo Horário"}
          </DialogTitle>
          <DialogDescription>
            {slot.day} às {customTime || slot.time}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity_name">Nome da Atividade</Label>
            <Input 
              id="activity_name"
              placeholder="Ex: Funcional, Pilates..." 
              value={formData.activity_name || ''} 
              onChange={(e) => handleChange('activity_name', e.target.value)}
              className="border-orange-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_time">Horário Personalizado</Label>
            <Input 
              id="custom_time"
              type="time"
              value={customTime} 
              onChange={(e) => handleTimeChange(e.target.value)}
              className="border-orange-300"
            />
            <p className="text-xs text-gray-500">
              💡 Você pode usar horários quebrados como 06:15, 07:30, etc.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input 
                id="duration"
                type="number" 
                value={formData.duration || ''} 
                onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                className="border-orange-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade</Label>
              <Input 
                id="capacity"
                type="number" 
                value={formData.capacity || ''} 
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
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
            {formData.id ? "Atualizar" : "Criar"} Horário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}