import { useState } from "react";
import { useForm } from "react-hook-form";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Cake, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const validateCpf = (cpf) => {
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpfClean.substring(i-1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpfClean.substring(i-1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(10, 11))) return false;
    return true;
};

const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate + 'T00:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export default function PersonalDataStep({ user, onComplete }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      cpf: user?.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
      date_of_birth: user?.date_of_birth || "",
      sex: user?.sex || ""
    }
  });

  const handleCpfChange = (e) => {
    const formatted = e.target.value.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
    setValue('cpf', formatted, { shouldValidate: true });
  };

  const handleSave = async (data) => {
    setError("");
    setIsSaving(true);
    try {
      const age = calculateAge(data.date_of_birth);
      await User.updateMyUserData({
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        cpf: data.cpf.replace(/\D/g, ''),
        date_of_birth: data.date_of_birth,
        sex: data.sex,
        age: age,
      });
      onComplete();
    } catch (err) {
      console.error("Erro ao salvar dados:", err);
      setError("Não foi possível salvar os dados. Verifique as informações e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input id="full_name" {...register("full_name", { required: "Nome é obrigatório" })} />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" {...register("cpf", { required: "CPF é obrigatório", validate: v => validateCpf(v) || "CPF inválido" })} onChange={handleCpfChange} maxLength="14" />
                {errors.cpf && <p className="text-red-500 text-xs">{errors.cpf.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="sex">Gênero</Label>
                <Select onValueChange={(v) => setValue('sex', v, { shouldValidate: true })} defaultValue={watch('sex')}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                </Select>
                <input type="hidden" {...register("sex", { required: "Gênero é obrigatório" })} />
                {errors.sex && <p className="text-red-500 text-xs">{errors.sex.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                <div className="relative">
                  <Cake className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="date_of_birth" type="date" className="pl-10" {...register("date_of_birth", { required: "Data é obrigatória" })} />
                </div>
                {errors.date_of_birth && <p className="text-red-500 text-xs">{errors.date_of_birth.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <Input id="phone" {...register("phone", { required: "Telefone é obrigatório" })} />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input id="address" {...register("address", { required: "Endereço é obrigatório" })} />
            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
        </div>

        <Button type="submit" className="w-full fusion-gradient text-lg py-3" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
        </Button>
    </form>
  );
}