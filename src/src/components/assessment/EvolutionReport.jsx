
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Droplets, Ruler, Bone, Percent, Target, Activity } from 'lucide-react';

const circumferenceLabels = {
  neck: 'Pescoço (cm)',
  shoulders: 'Ombros (cm)',
  chest: 'Tórax (cm)',
  abdomen: 'Abdômen (cm)',
  waist: 'Cintura (cm)',
  hip: 'Quadril (cm)',
  right_thigh: 'Coxa Direita (cm)',
  left_thigh: 'Coxa Esquerda (cm)',
  right_calf: 'Panturrilha Direita (cm)',
  left_calf: 'Panturrilha Esquerda (cm)',
  right_arm_relaxed: 'Braço Direito Relaxado (cm)',
  left_arm_relaxed: 'Braço Esquerdo Relaxado (cm)',
  right_forearm: 'Antebraço Direito (cm)',
  left_forearm: 'Antebraço Esquerdo (cm)',
};

const skinfoldLabels = {
  chest: 'Peitoral (mm)',
  midaxillary: 'Axilar Média (mm)',
  triceps: 'Tríceps (mm)',
  subscapular: 'Subescapular (mm)',
  abdominal: 'Abdominal (mm)',
  suprailiac: 'Supra-ilíaca (mm)',
  thigh: 'Coxa (mm)',
  biceps: 'Bíceps (mm)',
  calf: 'Panturrilha (mm)',
};

const InfoRow = ({ label, value, unit, highlight, classification }) => (
  <div className={`p-4 rounded-lg border transition-all duration-200 ${
    highlight 
      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm' 
      : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
  }`}>
    <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className={`text-2xl font-bold ${highlight ? 'text-orange-700' : 'text-gray-800'}`}>
        {value || '--'}
      </span>
      {unit && <span className="text-sm text-gray-500 font-medium">{unit}</span>}
    </div>
    {classification && (
      <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
        classification.includes('Normal') || classification.includes('Ótimo') ? 
          'bg-green-100 text-green-700' :
        classification.includes('Elevado') || classification.includes('Alto') ?
          'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
      }`}>
        {classification}
      </div>
    )}
  </div>
);

const EvolutionReport = ({ assessments, selectedAssessment }) => {
  console.log('EvolutionReport recebeu assessments:', assessments);
  
  if (!assessments || assessments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-xl p-8 text-center border border-orange-100">
        <Activity className="h-16 w-16 mx-auto mb-4 text-orange-300" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma avaliação encontrada</h3>
        <p className="text-gray-500">Aguarde sua primeira avaliação física com o instrutor.</p>
      </div>
    );
  }

  const assessmentToDisplay = selectedAssessment || assessments[0];
  const { weight, height } = assessmentToDisplay;
  const calculated_metrics = assessmentToDisplay.calculated_metrics || {};
  
  // Calcular IMC
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;
  
  // Calcular massa magra
  const leanMass = calculated_metrics?.fat_mass && weight ? 
    weight - calculated_metrics.fat_mass : 
    calculated_metrics?.lean_mass;

  const bodyFatPercentage = calculated_metrics?.body_fat_percentage;
  let bodyFatClass = '';
  if (bodyFatPercentage) {
    const sex = assessmentToDisplay.sex;
    if (sex === 'male') {
      if (bodyFatPercentage < 6) bodyFatClass = 'Muito Baixo';
      else if (bodyFatPercentage <= 13) bodyFatClass = 'Ótimo';
      else if (bodyFatPercentage <= 17) bodyFatClass = 'Bom';
      else if (bodyFatPercentage <= 25) bodyFatClass = 'Médio';
      else bodyFatClass = 'Elevado';
    } else {
      if (bodyFatPercentage < 16) bodyFatClass = 'Muito Baixo';
      else if (bodyFatPercentage <= 20) bodyFatClass = 'Ótimo';
      else if (bodyFatPercentage <= 24) bodyFatClass = 'Bom';
      else if (bodyFatPercentage <= 32) bodyFatClass = 'Médio';
      else bodyFatClass = 'Elevado';
    }
  }

  // Preparar dados para gráficos
  const chartData = [...assessments].reverse().map((assessment) => ({
    // Use the actual assessment date for the x-axis label
    assessment: new Date(assessment.assessment_date).toLocaleDateString('pt-BR'),
    peso: assessment.weight,
    gordura: assessment.calculated_metrics?.body_fat_percentage,
    massaMagra: assessment.calculated_metrics?.lean_mass || (assessment.weight - (assessment.calculated_metrics?.fat_mass || 0)),
  }));

  return (
    <div className="space-y-8">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Relatório de Evolução</h1>
        </div>
        <p className="text-orange-100">Acompanhe sua jornada de transformação física</p>
        <div className="mt-4 text-sm bg-white/20 rounded-lg p-3">
          <strong>Avaliação Selecionada:</strong> {new Date(assessmentToDisplay.assessment_date).toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      {/* Seção de Composição Corporal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Bone className="h-6 w-6 text-blue-600" />
              Composição Corporal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Peso Corporal" value={weight} unit="kg" highlight />
              <InfoRow label="Altura" value={height} unit="cm" />
              <InfoRow label="IMC" value={bmi} unit="kg/m²" />
              <InfoRow label="% Gordura Corporal" value={calculated_metrics?.body_fat_percentage?.toFixed(1)} unit="%" highlight classification={bodyFatClass} />
              <InfoRow label="Massa Gorda" value={calculated_metrics?.fat_mass?.toFixed(2)} unit="kg" />
              <InfoRow label="Massa Magra" value={leanMass?.toFixed(2)} unit="kg" highlight />
            </div>
          </div>

          {/* Gráfico de Evolução */}
          {assessments.length > 1 && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-purple-700">
                  <TrendingUp className="h-6 w-6" />
                  Evolução ao Longo do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="assessment" tick={{fontSize: 12}} stroke="#64748b" />
                      <YAxis tick={{fontSize: 12}} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={3} name="Peso (kg)" dot={{ fill: '#f97316', r: 6 }} />
                      <Line type="monotone" dataKey="gordura" stroke="#ef4444" strokeWidth={3} name="% Gordura" dot={{ fill: '#ef4444', r: 6 }} />
                      <Line type="monotone" dataKey="massaMagra" stroke="#22c55e" strokeWidth={3} name="Massa Magra (kg)" dot={{ fill: '#22c55e', r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo Rápido */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <BarChart3 className="h-5 w-5" />
                Resumo Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-3xl font-bold text-green-700 mb-1">{assessments.length}</div>
                <div className="text-sm text-green-600">Avaliações Realizadas</div>
              </div>
              
              {calculated_metrics?.whr && (
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    {calculated_metrics.whr.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Relação Cintura-Quadril</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medidas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-amber-700">
              <Ruler className="h-6 w-6" />
              Circunferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(assessmentToDisplay.circumferences || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-amber-100">
                  <span className="text-gray-700 font-medium">{circumferenceLabels[key] || key}</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">{value} cm</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-cyan-700">
              <Droplets className="h-6 w-6" />
              Dobras Cutâneas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(assessmentToDisplay.skinfolds || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-cyan-100">
                  <span className="text-gray-700 font-medium">{skinfoldLabels[key] || key}</span>
                  <span className="font-bold text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full">{value} mm</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvolutionReport;
