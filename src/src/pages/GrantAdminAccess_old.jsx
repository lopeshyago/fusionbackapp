
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCog, Send } from "lucide-react";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from '@/api/base44Client';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function GrantAdminAccess() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const { navigateTo } = useOptimizedNavigation();
  const { toast } = useToast();

  const handlePromote = useCallback(async () => {
    if (!email) {
      setFeedback({ message: 'Por favor, insira um e-mail.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: '', type: '' });

    try {
      // Chama a função de backend segura para promover o usuário
      const { data } = await base44.functions.invoke('promoteUserToAdmin', { email });

      // **CORREÇÃO**: Verifica se a resposta da função contém um erro lógico
      if (data.error) {
        throw new Error(data.error);
      }

      // If the backend function explicitly sends a message indicating the user is already an admin
      if (data.message === 'Este usuário já é um administrador.') {
        setFeedback({ message: data.message, type: 'info' });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Sucesso!",
        description: data.message, // Usa a mensagem de sucesso do backend
        variant: 'success',
        duration: 5000,
      });

      setEmail(''); // Limpa o campo após o sucesso

    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      // Set feedback based on the error message
      setFeedback({ message: error.message, type: 'error' });
      toast({
        title: "Erro ao promover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <header className="mb-8">
        <Button onClick={() => navigateTo('Index')} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel
        </Button>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-orange-200 glass-effect">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                  <UserCog className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Conceder Acesso de Administrador</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Promova um usuário existente para o cargo de administrador. Esta ação concede acesso total ao sistema.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold text-gray-700">
                E-mail do Usuário a ser Promovido
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-lg p-6 border-orange-300 focus:ring-orange-500"
                disabled={isLoading}
              />
            </div>

            {feedback.message && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback.message}
              </div>
            )}

            <Button 
              onClick={handlePromote} 
              className="w-full text-lg py-7 fusion-gradient text-white shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner text="Promovendo..." />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-3" />
                  Promover a Administrador
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-500 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <strong>Atenção:</strong> Ao promover um usuário, você concede a ele as mesmas permissões que você possui. Use esta ferramenta com responsabilidade.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
