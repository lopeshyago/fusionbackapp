import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PhysicalAssessment } from "@/api/entities";

export default function AssessmentForm({ isOpen, onOpenChange, studentId, instructorId, onSave }) {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    body_fat: '',
    muscle_mass: '',
    measurements: {
      chest: '',
      waist: '',
      hip: '',
      arm: '',
      thigh: ''
    },
    notes: ''
  });
  const [assessmentDate, setAssessmentDate] = useState(new Date());
  const [nextAssessmentDate, setNextAssessmentDate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        weight: '',
        height: '',
        body_fat: '',
        muscle_mass: '',
        measurements: {
          chest: '',
          waist: '',
          hip: '',
          arm: '',
          thigh: ''
        },
        notes: ''
      });
      setAssessmentDate(new Date());
      setNextAssessmentDate(null);
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value }
    }));
  };

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      student_id: studentId,
      instructor_id: instructorId,
      assessment_date: format(assessmentDate, "yyyy-MM-dd"),
      next_assessment: nextAssessmentDate ? format(nextAssessmentDate, "yyyy-MM-dd") : null,
      weight: parseFloat(formData.weight) || null,
      height: parseFloat(formData.height) || null,
      body_fat: parseFloat(formData.body_fat) || null,
      muscle_mass: parseFloat(formData.muscle_mass) || null,
      measurements: {
        chest: parseFloat(formData.measurements.chest) || null,
        waist: parseFloat(formData.measurements.waist) || null,
        hip: parseFloat(formData.measurements.hip) || null,
        arm: parseFloat(formData.measurements.arm) || null,
        thigh: parseFloat(formData.measurements.thigh) || null
      }
    };
    
    await PhysicalAssessment.create(dataToSave);
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação Física</DialogTitle>
          <DialogDescription>
            Registre as medidas e dados físicos do aluno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Avaliação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn("w-full justify-start text-left", !assessmentDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {assessmentDate ? format(assessmentDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={assessmentDate} 
                    onSelect={setAssessmentDate}
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Próxima Avaliação (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn("w-full justify-start text-left", !nextAssessmentDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextAssessmentDate ? format(nextAssessmentDate, "PPP", { locale: ptBR }) : "Agendar próxima"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={nextAssessmentDate} 
                    onSelect={setNextAssessmentDate}
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Dados Corporais</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Altura (cm)</Label>
                <Input 
                  type="number"
                  placeholder="175"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gordura Corporal (%)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="15.5"
                  value={formData.body_fat}
                  onChange={(e) => handleChange('body_fat', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Massa Muscular (kg)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="45.2"
                  value={formData.muscle_mass}
                  onChange={(e) => handleChange('muscle_mass', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Medidas Corporais (cm)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Peito</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="95.5"
                  value={formData.measurements.chest}
                  onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cintura</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="82.0"
                  value={formData.measurements.waist}
                  onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quadril</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="98.5"
                  value={formData.measurements.hip}
                  onChange={(e) => handleMeasurementChange('hip', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Braço</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="35.2"
                  value={formData.measurements.arm}
                  onChange={(e) => handleMeasurementChange('arm', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Coxa</Label>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="58.7"
                  value={formData.measurements.thigh}
                  onChange={(e) => handleMeasurementChange('thigh', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              placeholder="Observações sobre a avaliação, objetivos, recomendações..."
              className="min-h-[100px]"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}