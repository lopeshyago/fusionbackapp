
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Calculator, Activity, User, Ruler, Target, UserCheck } from "lucide-react";
import { DetailedAssessment } from "@/api/entities";

const circumferenceFields = [
  { id: 'neck', label: 'Pescoço (cm)' },
  { id: 'shoulders', label: 'Ombros (cm)' },
  { id: 'chest', label: 'Tórax (cm)' },
  { id: 'abdomen', label: 'Abdômen (cm)' },
  { id: 'waist', label: 'Cintura (cm)' },
  { id: 'hip', label: 'Quadril (cm)' },
  { id: 'right_thigh', label: 'Coxa Direita (cm)' },
  { id: 'left_thigh', label: 'Coxa Esquerda (cm)' },
  { id: 'right_calf', label: 'Panturrilha Direita (cm)' },
  { id: 'left_calf', label: 'Panturrilha Esquerda (cm)' },
  { id: 'right_arm_relaxed', label: 'Braço Direito Relaxado (cm)' },
  { id: 'left_arm_relaxed', label: 'Braço Esquerdo Relaxado (cm)' },
  { id: 'right_forearm', label: 'Antebraço Direito (cm)' },
  { id: 'left_forearm', label: 'Antebraço Esquerdo (cm)' },
];

const skinfoldFields = [
  { id: 'chest', label: 'Peitoral (mm)' },
  { id: 'midaxillary', label: 'Axilar Média (mm)' },
  { id: 'triceps', label: 'Tríceps (mm)' },
  { id: 'subscapular', label: 'Subescapular (mm)' },
  { id: 'abdominal', label: 'Abdominal (mm)' },
  { id: 'suprailiac', label: 'Supra-ilíaca (mm)' },
  { id: 'thigh', label: 'Coxa (mm)' },
  { id: 'biceps', label: 'Bíceps (mm)' },
  { id: 'calf', label: 'Panturrilha (mm)' },
];

const calculatedMetricsFields = [
  { id: 'body_fat_percentage', label: 'Percentual de Gordura (%)' },
  { id: 'fat_mass', label: 'Massa Gorda (kg)' },
  { id: 'lean_mass', label: 'Massa Magra (kg)' },
  { id: 'whr', label: 'Relação Cintura-Quadril (RCQ)' },
];

const initialFormData = {
  assessment_date: new Date().toISOString().split('T')[0],
  weight: "",
  height: "",
  age: "",
  sex: "male",
  skinfolds: {
    chest: "", midaxillary: "", triceps: "", subscapular: "",
    abdominal: "", suprailiac: "", thigh: "", biceps: "", calf: ""
  },
  circumferences: {
    neck: "", shoulders: "", chest: "", abdomen: "", waist: "", hip: "",
    right_thigh: "", left_thigh: "", right_calf: "", left_calf: "",
    right_arm_relaxed: "", left_arm_relaxed: "",
    right_forearm: "", left_forearm: ""
  }
};

export default function DetailedAssessmentForm({ isOpen, onOpenChange, studentId, instructorId, studentName, onSave, assessmentToEdit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assessmentToEdit) {
        // Preencher formulário com dados da avaliação para edição
        setFormData({
          assessment_date: assessmentToEdit.assessment_date ? new Date(assessmentToEdit.assessment_date + 'T00:00:00').toISOString().split('T')[0] : '',
          weight: assessmentToEdit.weight ? String(assessmentToEdit.weight) : "",
          height: assessmentToEdit.height ? String(assessmentToEdit.height) : "",
          age: assessmentToEdit.age ? String(assessmentToEdit.age) : "",
          sex: assessmentToEdit.sex || "male",
          skinfolds: {
            ...initialFormData.skinfolds,
            ...Object.fromEntries(
              Object.entries(assessmentToEdit.skinfolds || {}).map(([key, value]) => [key, value !== null ? String(value) : ""])
            )
          },
          circumferences: {
            ...initialFormData.circumferences,
            ...Object.fromEntries(
              Object.entries(assessmentToEdit.circumferences || {}).map(([key, value]) => [key, value !== null ? String(value) : ""])
            )
          },
        });
      } else {
        // Resetar para um novo formulário
        setFormData(initialFormData);
      }
    }
  }, [isOpen, assessmentToEdit]);

  // Validação em tempo real do formulário
  useEffect(() => {
    const validate = () => {
      const { assessment_date, weight, height, age, sex, skinfolds, circumferences } = formData;

      const basicInfoValid = assessment_date &&
        (weight !== "" && Number(weight) > 0) &&
        (height !== "" && Number(height) > 0) &&
        (age !== "" && Number(age) > 0) &&
        sex;

      if (!basicInfoValid) return false;

      // Verifica se todos os campos de dobras estão preenchidos e são números válidos
      const skinfoldsValid = Object.values(skinfolds).every(val => val !== "" && val !== null && !isNaN(Number(val)) && Number(val) >= 0);
      if (!skinfoldsValid) return false;

      // Verifica se todos os campos de circunferências estão preenchidos e são números válidos
      const circumferencesValid = Object.values(circumferences).every(val => val !== "" && val !== null && !isNaN(Number(val)) && Number(val) >= 0);
      if (!circumferencesValid) return false;

      return true;
    };
    setIsFormValid(validate());
  }, [formData]);


  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkinfoldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      skinfolds: { ...prev.skinfolds, [field]: value }
    }));
  };

  const handleCircumferenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      circumferences: { ...prev.circumferences, [field]: value }
    }));
  };

  // Cálculos automáticos
  const calculateMetrics = () => {
    const { weight, height, age, sex, skinfolds, circumferences } = formData;

    // Soma das dobras (includes new ones)
    const sum7 = Object.values(skinfolds)
      .filter(val => val !== "" && !isNaN(Number(val))) // Ensure value is a valid number string
      .reduce((sum, val) => sum + Number(val), 0);

    // Densidade corporal (Jackson & Pollock - assumes 7 sites or adapts if more are summed)
    let bodyDensity = 0;
    if (sum7 > 0 && age && Number(age) > 0) { // Also check age is a valid number > 0
      // For a robust solution, you'd need to explicitly filter to the 7 sites used by the formula.
      // For now, it uses the sum of ALL provided skinfolds.
      if (sex === "male") {
        bodyDensity = 1.112 - 0.00043499 * sum7 + 0.00000055 * Math.pow(sum7, 2) - 0.00028826 * Number(age);
      } else {
        bodyDensity = 1.097 - 0.00046971 * sum7 + 0.00000056 * Math.pow(sum7, 2) - 0.00012828 * Number(age);
      }
    }

    // Percentual de gordura
    const bodyFatPercentage = bodyDensity > 0 ? (495 / bodyDensity - 450) : 0;

    // Massa gorda e magra
    const parsedWeight = Number(weight);
    const fatMass = parsedWeight && bodyFatPercentage ? (parsedWeight * bodyFatPercentage / 100) : 0;
    const leanMass = parsedWeight && fatMass ? (parsedWeight - fatMass) : 0;

    // Relação cintura/quadril
    const parsedWaist = Number(circumferences.waist);
    const parsedHip = Number(circumferences.hip);
    const whr = parsedWaist && parsedHip && parsedHip !== 0 ?
      (parsedWaist / parsedHip) : 0;

    return {
      sum7: sum7 > 0 ? sum7 : null,
      body_fat_percentage: bodyFatPercentage > 0 ? Number(bodyFatPercentage.toFixed(2)) : null,
      fat_mass: fatMass > 0 ? Number(fatMass.toFixed(2)) : null,
      lean_mass: leanMass > 0 ? Number(leanMass.toFixed(2)) : null,
      whr: whr > 0 ? Number(whr.toFixed(2)) : null
    };
  };

  const metrics = calculateMetrics();

  const handleSave = async () => {
    if (!studentId || !instructorId) {
      alert("Erro: ID do aluno ou instrutor não encontrado.");
      return;
    }
    if (!isFormValid) {
        alert("Por favor, preencha todos os campos obrigatórios antes de salvar.");
        return;
    }
    try {
      const assessmentData = {
        student_id: studentId,
        instructor_id: instructorId,
        assessment_date: formData.assessment_date,
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        age: formData.age ? Number(formData.age) : null,
        sex: formData.sex,
        skinfolds: {
          sum7: metrics.sum7,
          chest: formData.skinfolds.chest ? Number(formData.skinfolds.chest) : null,
          midaxillary: formData.skinfolds.midaxillary ? Number(formData.skinfolds.midaxillary) : null,
          triceps: formData.skinfolds.triceps ? Number(formData.skinfolds.triceps) : null,
          subscapular: formData.skinfolds.subscapular ? Number(formData.skinfolds.subscapular) : null,
          abdominal: formData.skinfolds.abdominal ? Number(formData.skinfolds.abdominal) : null,
          suprailiac: formData.skinfolds.suprailiac ? Number(formData.skinfolds.suprailiac) : null,
          thigh: formData.skinfolds.thigh ? Number(formData.skinfolds.thigh) : null,
          biceps: formData.skinfolds.biceps ? Number(formData.skinfolds.biceps) : null,
          calf: formData.skinfolds.calf ? Number(formData.skinfolds.calf) : null,
        },
        circumferences: {
          neck: formData.circumferences.neck ? Number(formData.circumferences.neck) : null,
          shoulders: formData.circumferences.shoulders ? Number(formData.circumferences.shoulders) : null,
          chest: formData.circumferences.chest ? Number(formData.circumferences.chest) : null,
          abdomen: formData.circumferences.abdomen ? Number(formData.circumferences.abdomen) : null,
          waist: formData.circumferences.waist ? Number(formData.circumferences.waist) : null,
          hip: formData.circumferences.hip ? Number(formData.circumferences.hip) : null,
          right_thigh: formData.circumferences.right_thigh ? Number(formData.circumferences.right_thigh) : null,
          left_thigh: formData.circumferences.left_thigh ? Number(formData.circumferences.left_thigh) : null,
          right_calf: formData.circumferences.right_calf ? Number(formData.circumferences.right_calf) : null,
          left_calf: formData.circumferences.left_calf ? Number(formData.circumferences.left_calf) : null,
          right_arm_relaxed: formData.circumferences.right_arm_relaxed ? Number(formData.circumferences.right_arm_relaxed) : null,
          left_arm_relaxed: formData.circumferences.left_arm_relaxed ? Number(formData.circumferences.left_arm_relaxed) : null,
          right_forearm: formData.circumferences.right_forearm ? Number(formData.circumferences.right_forearm) : null,
          left_forearm: formData.circumferences.left_forearm ? Number(formData.circumferences.left_forearm) : null,
        },
        calculated_metrics: metrics
      };

      if (assessmentToEdit) {
        // Atualizar avaliação existente
        await DetailedAssessment.update(assessmentToEdit.id, assessmentData);
      } else {
        // Criar nova avaliação
        await DetailedAssessment.create(assessmentData);
      }
      onSave(); // Sinaliza que a operação foi concluída
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação. Tente novamente.');
    }
  };

  // Nomes em português para as dobras cutâneas
  // const skinfoldLabels = {
  //   chest: "Peitoral", midaxillary: "Axilar Média", triceps: "Tríceps",
  //   subscapular: "Subescapular", abdominal: "Abdominal", suprailiac: "Suprailíaca",
  //   thigh: "Coxa", biceps: "Bíceps", calf: "Panturrilha"
  // };

  // Nomes em português para as circunferências
  // const circumferenceLabels = {
  //   tronco: {
  //     neck: "Pescoço", shoulders: "Ombros", chest: "Tórax",
  //     abdomen: "Abdômen", waist: "Cintura", hip: "Quadril",
  //   },
  //   membros: {
  //     right_arm_relaxed: "Braço Relaxado (D)", left_arm_relaxed: "Braço Relaxado (E)",
  //     right_forearm: "Antebraço (D)", left_forearm: "Antebraço (E)",
  //     right_thigh: "Coxa (D)", left_thigh: "Coxa (E)",
  //     right_calf: "Panturrilha (D)", left_calf: "Panturrilha (E)"
  //   }
  // };

  const troncoCircumferenceFields = circumferenceFields.filter(f =>
    ['neck', 'shoulders', 'chest', 'abdomen', 'waist', 'hip'].includes(f.id)
  );
  const membrosCircumferenceFields = circumferenceFields.filter(f =>
    !['neck', 'shoulders', 'chest', 'abdomen', 'waist', 'hip'].includes(f.id)
  );


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            {assessmentToEdit ? "Editar Avaliação Física" : "Nova Avaliação Física"}
          </DialogTitle>
          {studentName && (
            <DialogDescription className="flex items-center gap-2 pt-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              Realizando avaliação para: <span className="font-semibold text-blue-700">{studentName}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Tabs defaultValue="basic" className="w-full">
            {/* Mobile-friendly TabsList */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-orange-100 rounded-xl">
              <TabsTrigger
                value="basic"
                className="flex flex-col items-center p-3 text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
              >
                <User className="h-4 w-4 mb-1" />
                <span className="hidden sm:inline">Dados Básicos</span>
                <span className="sm:hidden">Básicos</span>
              </TabsTrigger>
              <TabsTrigger
                value="skinfolds"
                className="flex flex-col items-center p-3 text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
              >
                <Ruler className="h-4 w-4 mb-1" />
                <span className="hidden sm:inline">Dobras</span>
                <span className="sm:hidden">Dobras</span>
              </TabsTrigger>
              <TabsTrigger
                value="circumferences"
                className="flex flex-col items-center p-3 text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
              >
                <Activity className="h-4 w-4 mb-1" />
                <span className="hidden sm:inline">Circunferências</span>
                <span className="sm:hidden">Circunf.</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex flex-col items-center p-3 text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
              >
                <Target className="h-4 w-4 mb-1" />
                <span className="hidden sm:inline">Resultados</span>
                <span className="sm:hidden">Resultados</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Avaliação</Label>
                    <Input
                      type="date"
                      value={formData.assessment_date}
                      onChange={(e) => handleChange('assessment_date', e.target.value)}
                      className="border-orange-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={formData.sex} onValueChange={(value) => handleChange('sex', value)}>
                      <SelectTrigger className="border-orange-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      placeholder="75.5"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      className="border-orange-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      placeholder="175"
                      value={formData.height}
                      onChange={(e) => handleChange('height', e.target.value)}
                      className="border-orange-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      className="border-orange-200"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skinfolds" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">Dobras Cutâneas (mm)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skinfoldFields.map(({ id, label }) => (
                    <div key={id} className="space-y-2">
                      <Label className="text-sm font-medium">{label}</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={formData.skinfolds[id]}
                        onChange={(e) => handleSkinfoldChange(id, e.target.value)}
                        className="border-orange-200"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {metrics.sum7 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Calculator className="h-4 w-4" />
                      <span className="font-semibold">Soma das dobras: {metrics.sum7.toFixed(1)} mm</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="circumferences" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-orange-700">Circunferências (cm)</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {/* Tronco */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Tronco</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {troncoCircumferenceFields.map(({ id, label }) => (
                        <div key={id} className="space-y-2">
                          <Label className="text-sm font-medium">{label}</Label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={formData.circumferences[id]}
                            onChange={(e) => handleCircumferenceChange(id, e.target.value)}
                            className="border-orange-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Membros */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Membros</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {membrosCircumferenceFields.map(({ id, label }) => (
                        <div key={id} className="space-y-2">
                          <Label className="text-sm font-medium">{label}</Label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={formData.circumferences[id]}
                            onChange={(e) => handleCircumferenceChange(id, e.target.value)}
                            className="border-orange-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {metrics.whr && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <Activity className="h-4 w-4" />
                      <span className="font-semibold">Relação Cintura/Quadril: {metrics.whr}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">Resultados Calculados</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Composição Corporal
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>% Gordura:</span>
                          <span className="font-bold text-orange-600">
                            {metrics.body_fat_percentage ? `${metrics.body_fat_percentage}%` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>Massa Gorda:</span>
                          <span className="font-bold text-red-600">
                            {metrics.fat_mass ? `${metrics.fat_mass} kg` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>Massa Magra:</span>
                          <span className="font-bold text-green-600">
                            {metrics.lean_mass ? `${metrics.lean_mass} kg` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Indicadores
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>RCQ:</span>
                          <span className="font-bold text-blue-600">
                            {metrics.whr || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>IMC:</span>
                          <span className="font-bold text-purple-600">
                            {formData.weight && formData.height && Number(formData.height) > 0 ?
                              (Number(formData.weight) / Math.pow(Number(formData.height)/100, 2)).toFixed(1) :
                              "N/A"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isFormValid ? "Salvar Avaliação" : "Preencha todos os campos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
