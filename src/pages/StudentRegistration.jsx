import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from 'lucide-react';
import { localApi } from '@/api/localApi';
import { useOptimizedNavigation } from "../components/common/NavigationHelper";

const logoUrl = "/fusionlogo.png";

export default function StudentRegistration() {
  const { navigateTo } = useOptimizedNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [condoCode, setCondoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName || !condoCode) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await localApi.request('/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, condo_code: condoCode })
      });
      if (res?.token) {
        localApi.setToken(res.token);
      }
      navigateTo('StudentSetup', { replace: true });
    } catch (e) {
      setError(e.message || 'Falha no cadastro. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Cadastro de Aluno</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateTo('Index')} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Menu
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md shadow-2xl border-orange-200">
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
            <CardDescription>Vincule-se ao condomínio com seu código.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-md p-3 text-center mb-3">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="border-orange-200" />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border-orange-200" />
              </div>
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="border-orange-200" />
              </div>
              <div className="space-y-1">
                <Label>Código do Condomínio</Label>
                <Input value={condoCode} onChange={e => setCondoCode(e.target.value.toUpperCase())} className="border-orange-200 tracking-widest" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
