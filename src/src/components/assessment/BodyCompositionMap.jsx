import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Info } from "lucide-react";

export default function BodyCompositionMap({ assessment }) {
  if (!assessment?.skinfolds) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-8 text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Dados de dobras cutâneas não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const skinfolds = assessment.skinfolds;
  
  // Valores das dobras cutâneas
  const measurements = {
    chest: skinfolds.chest || 0,
    midaxillary: skinfolds.midaxillary || 0,
    triceps: skinfolds.triceps || 0,
    subscapular: skinfolds.subscapular || 0,
    abdominal: skinfolds.abdominal || 0,
    suprailiac: skinfolds.suprailiac || 0,
    thigh: skinfolds.thigh || 0
  };

  // Encontrar valor máximo para normalização das cores
  const maxValue = Math.max(...Object.values(measurements).filter(v => v > 0));
  const minValue = Math.min(...Object.values(measurements).filter(v => v > 0));

  // Função para gerar cor baseada no valor (verde = baixo, amarelo = médio, vermelho = alto)
  const getColor = (value) => {
    if (!value || value === 0) return '#E5E7EB'; // Cinza para sem dados
    
    const normalized = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0.5;
    
    if (normalized <= 0.33) return '#10B981'; // Verde
    if (normalized <= 0.66) return '#F59E0B'; // Amarelo/Laranja
    return '#EF4444'; // Vermelho
  };

  // Função para obter intensidade da cor
  const getIntensity = (value) => {
    if (!value || value === 0) return 0.3;
    const normalized = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0.5;
    return 0.4 + (normalized * 0.6); // Entre 0.4 e 1.0
  };

  const MeasurementDot = ({ x, y, value, label, position = "right" }) => {
    const color = getColor(value);
    const intensity = getIntensity(value);
    
    return (
      <g>
        {/* Círculo indicador */}
        <circle
          cx={x}
          cy={y}
          r="8"
          fill={color}
          fillOpacity={intensity}
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Número no centro */}
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          className="text-xs font-bold fill-white"
          style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
        >
          {value || 0}
        </text>
        
        {/* Label */}
        <text
          x={position === "right" ? x + 15 : x - 15}
          y={y - 10}
          textAnchor={position === "right" ? "start" : "end"}
          className="text-xs font-medium fill-gray-700"
        >
          {label}
        </text>
        
        {/* Linha conectora */}
        <line
          x1={x + (position === "right" ? 8 : -8)}
          y1={y}
          x2={position === "right" ? x + 12 : x - 12}
          y2={y - 8}
          stroke="#9CA3AF"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </g>
    );
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-orange-600" />
          Mapa de Composição Corporal
        </CardTitle>
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Como interpretar:</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Baixo (0-33%)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                Médio (34-66%)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Alto (67-100%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* SVG do boneco humano */}
          <svg
            width="320"
            height="480"
            viewBox="0 0 320 480"
            className="border border-gray-200 rounded-lg bg-gray-50"
          >
            {/* Corpo do boneco */}
            <g>
              {/* Cabeça */}
              <circle cx="160" cy="60" r="35" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Pescoço */}
              <rect x="150" y="95" width="20" height="20" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Tronco */}
              <ellipse cx="160" cy="200" rx="70" ry="85" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Braços */}
              <ellipse cx="100" cy="160" rx="20" ry="60" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              <ellipse cx="220" cy="160" rx="20" ry="60" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Antebraços */}
              <ellipse cx="90" cy="240" rx="15" ry="45" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              <ellipse cx="230" cy="240" rx="15" ry="45" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Quadris */}
              <ellipse cx="160" cy="300" rx="50" ry="30" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Coxas */}
              <ellipse cx="140" cy="370" rx="22" ry="55" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              <ellipse cx="180" cy="370" rx="22" ry="55" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              
              {/* Panturrilhas */}
              <ellipse cx="140" cy="440" rx="18" ry="35" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
              <ellipse cx="180" cy="440" rx="18" ry="35" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
            </g>

            {/* Pontos de medição das dobras cutâneas */}
            <MeasurementDot 
              x="140" 
              y="140" 
              value={measurements.chest} 
              label="Peitoral" 
              position="left" 
            />
            
            <MeasurementDot 
              x="130" 
              y="180" 
              value={measurements.midaxillary} 
              label="Axilar" 
              position="left" 
            />
            
            <MeasurementDot 
              x="220" 
              y="140" 
              value={measurements.triceps} 
              label="Tríceps" 
              position="right" 
            />
            
            <MeasurementDot 
              x="200" 
              y="160" 
              value={measurements.subscapular} 
              label="Subescapular" 
              position="right" 
            />
            
            <MeasurementDot 
              x="140" 
              y="220" 
              value={measurements.abdominal} 
              label="Abdominal" 
              position="left" 
            />
            
            <MeasurementDot 
              x="190" 
              y="240" 
              value={measurements.suprailiac} 
              label="Suprailíaca" 
              position="right" 
            />
            
            <MeasurementDot 
              x="160" 
              y="350" 
              value={measurements.thigh} 
              label="Coxa" 
              position="right" 
            />
          </svg>

          {/* Resumo dos valores */}
          <div className="mt-6 w-full">
            <h4 className="font-semibold mb-3 text-center text-gray-800">Valores das Dobras Cutâneas (mm)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(measurements).map(([key, value]) => {
                const labels = {
                  chest: 'Peitoral',
                  midaxillary: 'Axilar Média',
                  triceps: 'Tríceps',
                  subscapular: 'Subescapular',
                  abdominal: 'Abdominal',
                  suprailiac: 'Suprailíaca',
                  thigh: 'Coxa'
                };
                
                return (
                  <Badge 
                    key={key}
                    variant="outline" 
                    className={`flex justify-between items-center py-2 px-3`}
                    style={{ 
                      borderColor: getColor(value),
                      backgroundColor: `${getColor(value)}20`
                    }}
                  >
                    <span className="text-xs font-medium">{labels[key]}</span>
                    <span className="font-bold ml-2">{value || 0}</span>
                  </Badge>
                );
              })}
            </div>
            
            {/* Total das 7 dobras */}
            {assessment.skinfolds.sum7 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <span className="text-sm text-orange-700 font-medium">Soma das 7 Dobras: </span>
                <span className="text-lg font-bold text-orange-800">{assessment.skinfolds.sum7} mm</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}