import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Hook personalizado para navegação otimizada
export const useOptimizedNavigation = () => {
  const navigate = useNavigate();

  const navigateTo = (page, params = {}, replace = false) => {
    // Adiciona loading state visual
    document.body.style.cursor = 'wait';
    
    const url = params && Object.keys(params).length > 0 
      ? `${page}?${new URLSearchParams(params).toString()}`
      : page;
    
    if (replace) {
      navigate(createPageUrl(url), { replace: true });
    } else {
      navigate(createPageUrl(url));
    }
    
    // Remove loading cursor após navegação
    setTimeout(() => {
      document.body.style.cursor = 'default';
    }, 300);
  };

  // A função goBack foi removida daqui para simplificar e evitar o erro.
  // A lógica agora está diretamente no botão do Layout.

  return { navigateTo };
};

// Componente de Loading para transições
export const NavigationLoader = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-orange-200">
        <div className="h-full bg-orange-500 animate-pulse"></div>
      </div>
    </div>
  );
};