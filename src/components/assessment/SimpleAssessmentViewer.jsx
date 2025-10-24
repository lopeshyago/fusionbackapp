
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Activity, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SimpleAssessmentViewer({ isOpen, onOpenChange, assessment }) {
  if (!assessment) return null;

  const {
    assessment_date, weight, height, age, sex,
    skinfolds = {},
    circumferences = {},
    calculated_metrics = {}
  } = assessment;

  const InfoItem = ({ label, value, unit = "", highlight = false }) => (
    <div className={`flex justify-between items-center py-2 px-3 rounded-md ${highlight ? 'bg-orange-100 border border-orange-200' : 'bg-gray-50'}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`font-bold ${highlight ? 'text-orange-700' : value ? 'text-gray-900' : 'text-gray-400'}`}>
        {value ? `${value} ${unit}` : "N/A"}
      </span>
    </div>
  );

  // Todas as dobras cutâneas possíveis
  const allSkinfolds = [
    { key: 'chest', label: 'Peitoral' },
    { key: 'midaxillary', label: 'Axilar Média' },
    { key: 'triceps', label: 'Tríceps' },
    { key: 'subscapular', label: 'Subescapular' },
    { key: 'abdominal', label: 'Abdominal' },
    { key: 'suprailiac', label: 'Suprailíaca' },
    { key: 'thigh', label: 'Coxa' },
    { key: 'biceps', label: 'Bíceps' },
    { key: 'calf', label: 'Panturrilha' },
  ];

  // Todas as circunferências possíveis
  const allCircumferences = [
    { key: 'neck', label: 'Pescoço' },
    { key: 'shoulders', label: 'Ombros' },
    { key: 'chest', label: 'Tórax' },
    { key: 'abdomen', label: 'Abdômen' },
    { key: 'waist', label: 'Cintura', highlight: true },
    { key: 'hip', label: 'Quadril' },
    { key: 'right_thigh', label: 'Coxa (D)' },
    { key: 'left_thigh', label: 'Coxa (E)' },
    { key: 'right_calf', label: 'Panturrilha (D)' },
    { key: 'left_calf', label: 'Panturrilha (E)' },
    { key: 'right_arm_relaxed', label: 'Braço Relaxado (D)' },
    { key: 'left_arm_relaxed', label: 'Braço Relaxado (E)' },
    { key: 'right_forearm', label: 'Antebraço (D)' },
    { key: 'left_forearm', label: 'Antebraço (E)' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Calendar className="h-5 w-5" />
            Avaliação Física
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {assessment_date ? format(new Date(assessment_date), "dd/MM/yyyy", { locale: ptBR, timeZone: 'UTC' }) : 'N/A'}
            <Badge variant="outline" className="ml-2">
              {sex === 'male' ? 'Masculino' : 'Feminino'} • {age} anos
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Resultados Principais */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2">
              <Target className="h-4 w-4 text-orange-600" />
              Resultados Principais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoItem label="Peso" value={weight} unit="kg" highlight />
              <InfoItem label="Altura" value={height} unit="cm" />
              <InfoItem label="% Gordura" value={calculated_metrics.body_fat_percentage?.toFixed(1)} unit="%" highlight />
              <InfoItem label="Massa Gorda" value={calculated_metrics.fat_mass?.toFixed(1)} unit="kg" />
              <InfoItem label="Massa Magra" value={calculated_metrics.lean_mass?.toFixed(1)} unit="kg" highlight />
              {calculated_metrics.whr && (
                <InfoItem label="Relação C/Q" value={calculated_metrics.whr?.toFixed(2)} />
              )}
            </div>
          </div>

          {/* Dobras Cutâneas */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2">
              <Activity className="h-4 w-4 text-orange-600" />
              Dobras Cutâneas (mm)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allSkinfolds.map(({ key, label }) => (
                <InfoItem 
                  key={key}
                  label={label} 
                  value={skinfolds[key]} 
                  unit="mm" 
                />
              ))}
            </div>
            {skinfolds.sum7 && (
              <InfoItem label="Soma das 7 dobras" value={skinfolds.sum7} unit="mm" highlight />
            )}
          </div>

          {/* Circunferências */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2">
              <User className="h-4 w-4 text-orange-600" />
              Circunferências (cm)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allCircumferences.map(({ key, label, highlight }) => (
                  <InfoItem 
                    key={key}
                    label={label} 
                    value={circumferences[key]} 
                    unit="cm" 
                    highlight={highlight}
                  />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
