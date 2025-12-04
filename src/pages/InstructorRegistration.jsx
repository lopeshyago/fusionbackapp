import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { createPageUrl } from '@/utils';
import { localApi } from "@/api/localApi";

const logoUrl = "/fusionlogo.png";

export default function InstructorRegistration() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBackToMenu = () => {
    window.location.href = createPageUrl('Index');
  };

  const handleRegister = async () => {
    if (!inviteCode.trim() || !email || !password || !fullName) {
      setError("Preencha todos os campos.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await localApi.request("/register/instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, invite_code: inviteCode.trim() })
      });
      if (res?.token) {
        localApi.setToken(res.token);
      }
      window.location.href = createPageUrl("InstructorProfile");
    } catch (err) {
      console.error("Erro ao cadastrar instrutor:", err);
      setError(err.message || "Falha ao cadastrar. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
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

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md shadow-2xl border-orange-200">
          <CardHeader className="text-center">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <CardTitle className="text-2xl font-bold">Cadastro de Instrutor</CardTitle>
            <CardDescription>Informe seus dados e o código de convite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-md p-3 text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-orange-200" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-orange-200" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-orange-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de Convite</Label>
              <Input id="inviteCode" placeholder="FUSION-INST-XXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="border-orange-200 text-center tracking-widest" />
            </div>
            <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600">
              {isLoading ? "Cadastrando..." : "Cadastrar"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
