import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ErrorMessage({ 
  title = "Erro", 
  message, 
  onRetry, 
  showRetry = true,
  type = "error" 
}) {
  const getErrorInfo = (message) => {
    if (message.includes('429') || message.includes('Rate limit')) {
      return {
        title: "Servidor Sobrecarregado",
        message: "Muitas requisições foram feitas. Aguarde alguns segundos e tente novamente.",
        color: "orange"
      };
    }
    if (message.includes('Network') || message.includes('fetch')) {
      return {
        title: "Erro de Conexão",
        message: "Verifique sua conexão com a internet e tente novamente.",
        color: "blue"
      };
    }
    return {
      title,
      message,
      color: "red"
    };
  };

  const errorInfo = getErrorInfo(message);
  const colorClasses = {
    red: "border-red-200 bg-red-50 text-red-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800", 
    blue: "border-blue-200 bg-blue-50 text-blue-800"
  };

  return (
    <Card className={`${colorClasses[errorInfo.color]} border-2`}>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
        <h3 className="text-lg font-semibold mb-2">{errorInfo.title}</h3>
        <p className="mb-4 opacity-80">{errorInfo.message}</p>
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-current text-current hover:bg-current hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}