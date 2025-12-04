import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCheck, Eye, EyeOff } from "lucide-react";
import { useOptimizedNavigation } from "../components/common/NavigationHelper";
import { useToast } from "@/components/ui/use-toast";
import { localApi } from '@/api/localApi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const logoUrl = "/fusionlogo.png";

export default function InstructorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { navigateTo } = useOptimizedNavigation();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await localApi.login(email, password);

      // Verificar se o usuÃ¡rio Ã© instrutor
      const utype = (result?.user?.user_type || '').toLowerCase();
      if (utype !== 'instructor') {
        setError('Acesso negado. Esta área é restrita para instrutores.');
        await localApi.logout();
        return;
      }



      // Redirecionar para o painel de instrutor
      navigateTo('InstructorDashboard');

    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMenu = () => {
    navigateTo('Index');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Barra Superior */}
      <header className="bg-black text-white p-4 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Login Instrutor</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Menu
          </Button>
        </div>
      </header>

      {/* ConteÃºdo Principal */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md shadow-2xl border-orange-200">
          <CardHeader className="text-center">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <CardTitle className="text-2xl font-bold">Acesso Instrutor</CardTitle>
            <CardDescription>
              Entre com suas credenciais de instrutor para acessar o painel de controle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-md p-3 text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="instrutor@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-orange-200"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-orange-200 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? <LoadingSpinner text="Entrando..." /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
