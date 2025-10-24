
import { useState, useEffect } from "react";
import { User } from "@/api/entities_new";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";
import PersonalDataStep from "../components/onboarding/PersonalDataStep";
import CondominiumStep from "../components/onboarding/CondominiumStep";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const logoUrl = "/fusionlogo.png";

const SetupStepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 'personal_data', label: 'Dados Pessoais' },
    { id: 'parq', label: 'Questionário' },
    { id: 'condominium', label: 'Local de Treino' }
  ];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="mb-6">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => (
          <li key={step.id} className={`flex w-full items-center ${index < steps.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-300 after:inline-block" : ""} ${index <= currentStepIndex ? 'text-orange-600 after:border-orange-500' : ''}`}>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${index <= currentStepIndex ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {index + 1}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default function StudentSetup() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateTo } = useOptimizedNavigation();
  const urlParams = new URLSearchParams(window.location.search);
  const cameFromParq = urlParams.get('from') === 'parq';

  const loadUser = async (isRetry = false) => {
    // Mantém o loading na primeira chamada, mas não nos retries
    if (!isRetry) setIsLoading(true);

    try {
      const currentUser = await User.me();
      
      // Lógica de Retry: Se viemos do PAR-Q e o dado ainda não atualizou, tenta de novo.
      // O retry só acontece uma vez, para evitar loops infinitos ou muitos retries.
      if (cameFromParq && !currentUser.par_q_completed && !isRetry) {
        console.log("PAR-Q data seems stale, retrying in 1.5s...");
        setTimeout(() => loadUser(true), 1500);
        return; // Sai da execução atual para esperar o retry
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao carregar usuário no setup:", error);
      navigateTo('Index');
    } finally {
      // Só desliga o loading se não estivermos no meio de um retry
      // Ou se não viemos do PAR-Q (nesse caso o retry não será acionado)
      // Ou se já é um retry (já tentou e agora vai mostrar o resultado)
      if (!cameFromParq || isRetry || (cameFromParq && user?.par_q_completed)) {
         setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []); // Removido navigateTo para evitar re-execução desnecessária

  const handleDataComplete = () => {
    // Apenas recarrega os dados do usuário. O componente vai re-renderizar e mostrar a próxima etapa.
    loadUser();
  };

  const handleCondominiumComplete = () => {
    // O fluxo está completo, redireciona para o login do aluno.
    navigateTo('StudentLogin', {}, true);
  };
  
  // Se estiver carregando, mostra o spinner. Simples.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 flex flex-col items-center justify-center">
        <img src={logoUrl} alt="Fusion Logo" className="h-20 w-20 mx-auto mb-6 drop-shadow-xl" />
        <div className="w-full max-w-lg">
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-8 rounded-2xl shadow-xl">
            <LoadingSpinner text="Analisando seu cadastro..." />
          </div>
        </div>
      </div>
    );
  }

  // Com os dados carregados, determina qual etapa renderizar.
  let currentStepComponent;
  let currentStepName;

  if (user) {
    if (!user.cpf || !user.phone || !user.address) {
      currentStepName = 'personal_data';
      currentStepComponent = <PersonalDataStep user={user} onComplete={handleDataComplete} />;
    } else if (!user.par_q_completed) {
      currentStepName = 'parq';
      currentStepComponent = (
        <div className="text-center p-6 bg-white rounded-lg shadow-lg border border-orange-200">
          <FileText className="h-16 w-16 mx-auto text-orange-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Próximo Passo: Saúde</h2>
          <p className="text-gray-600 mb-6">Para sua segurança, responda o Questionário de Prontidão para Atividade Física (PAR-Q).</p>
          <Button className="w-full fusion-gradient text-white" onClick={() => navigateTo('Parq', { next: 'StudentSetup' })}>
            Ir para o Questionário
          </Button>
        </div>
      );
    } else if (!user.condominium_id) {
      currentStepName = 'condominium';
      currentStepComponent = <CondominiumStep user={user} onComplete={handleCondominiumComplete} />;
    } else {
      // Se tudo estiver completo, o usuário não deveria estar aqui. Redireciona.
      navigateTo('Index', {}, true);
      return null; // Evita renderização desnecessária durante o redirecionamento
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 flex flex-col items-center justify-center">
      <img src={logoUrl} alt="Fusion Logo" className="h-20 w-20 mx-auto mb-6 drop-shadow-xl" />
      <div className="w-full max-w-lg">
        <SetupStepIndicator currentStep={currentStepName} />
        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-8 rounded-2xl shadow-xl">
          {currentStepComponent}
        </div>
      </div>
    </div>
  );
}
