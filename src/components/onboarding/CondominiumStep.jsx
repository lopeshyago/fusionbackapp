import { useState } from "react";
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CondominiumStep({ user, onComplete }) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAssociate = async (e) => {
    e.preventDefault();
    setError("");
    if (!inviteCode.trim()) {
      setError("Por favor, insira o código de convite.");
      return;
    }

    setIsSaving(true);
    try {
      const condoList = await Condominium.filter({ invite_code: inviteCode.trim().toUpperCase() });
      if (condoList.length === 0) {
        setError("Código de convite inválido ou não encontrado.");
        setIsSaving(false);
        return;
      }
      
      const targetCondo = condoList[0];
      await User.updateMyUserData({ condominium_id: targetCondo.id });
      onComplete();

    } catch (err) {
      console.error("Erro ao associar condomínio:", err);
      setError("Ocorreu um erro. Tente novamente.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleAssociate} className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      <p className="text-gray-600">Insira o código de convite fornecido pelo seu condomínio para vincular sua conta ao local de treino.</p>
      
      <div className="space-y-2">
        <Label htmlFor="invite_code">Código de Convite</Label>
        <Input 
          id="invite_code"
          placeholder="EX: FUSION-XYZ"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="text-center tracking-widest font-mono"
        />
      </div>

      <Button type="submit" className="w-full fusion-gradient text-lg py-3" disabled={isSaving}>
        {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Building className="h-5 w-5 mr-2" />}
        {isSaving ? 'Associando...' : 'Associar e Finalizar'}
      </Button>
    </form>
  );
}