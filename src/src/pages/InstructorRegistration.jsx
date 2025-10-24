
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { InstructorInvite } from "@/api/entities";

const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68afb6f88b147cdfe2384437/ed2388368_icon-512.png";

export default function InstructorRegistration() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleValidateCode = async () => {
    if (!inviteCode.trim()) {
      setError("Por favor, insira o código de convite.");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const invites = await InstructorInvite.filter({
        code: inviteCode.trim(),
        status: 'pending'
      });

      if (invites.length === 0) {
        setError("Código inválido, expirado ou já utilizado. Peça um novo código a um administrador.");
        setIsLoading(false);
        return;
      }
      
      const invite = invites[0];
      if (new Date(invite.expires_at) < new Date()) {
        setError("Este código de convite expirou.");
        setIsLoading(false);
        return;
      }

      const currentUser = await User.me();

      // Update user type and mark invite as used
      await Promise.all([
        User.updateMyUserData({ user_type: 'instructor' }),
        InstructorInvite.update(invite.id, { 
          status: 'used',
          used_by_instructor: currentUser.email
        })
      ]);

      // Redirect to instructor login
      alert("Validação bem-sucedida! Faça login para acessar sua conta.");
      window.location.href = createPageUrl('InstructorLogin');
      
    } catch (err) {
      console.error("Erro ao validar código:", err);
      setError("Ocorreu um erro ao validar o código. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleBackToMenu = () => {
    window.location.href = createPageUrl('Index');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Barra Superior */}
      <header className="bg-black text-white p-4 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Fusion Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Cadastro de Instrutor</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Menu
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md shadow-2xl border-orange-200">
          <CardHeader className="text-center">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <CardTitle className="text-2xl font-bold">Quase lá!</CardTitle>
            <CardDescription>
              Insira o código de convite que você recebeu de um administrador para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-md p-3 text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de Convite</Label>
              <Input
                id="inviteCode"
                placeholder="FUSION-INST-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="border-orange-200 text-center tracking-widest"
              />
            </div>
            <Button onClick={handleValidateCode} disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600">
              {isLoading ? "Validando..." : "Validar e Continuar"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
