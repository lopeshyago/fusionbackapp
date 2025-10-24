
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User as UserIcon, Phone, MapPin } from "lucide-react";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";

export default function InstructorProfile() {
  const [user, setUser] = useState(null);
  const [condominiums, setCondominiums] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    address: "",
    condominium_id: "",
    sex: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, condos] = await Promise.all([
        User.me(),
        Condominium.list()
      ]);
      setUser(currentUser);
      setCondominiums(condos);
      setFormData({
        full_name: currentUser.full_name || "",
        phone: currentUser.phone || "",
        cpf: currentUser.cpf ? currentUser.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
        address: currentUser.address || "",
        condominium_id: currentUser.condominium_id || "",
        sex: currentUser.sex || ""
      });
    } catch (err) {
      setError("Não foi possível carregar seus dados.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'cpf') {
        const cpfValue = value.replace(/\D/g, '');
        const formattedCpf = cpfValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
        setFormData(prev => ({ ...prev, [id]: formattedCpf }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    const { full_name, phone, address, cpf, condominium_id, sex } = formData;
    if (!full_name || !phone || !address || !cpf || !condominium_id || !sex) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    const cpfNumbers = cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      return;
    }

    try {
      await User.updateMyUserData({
        ...formData,
        cpf: cpfNumbers,
        plan_status: 'active',   // Definir como ativo por padrão
        user_type: 'instructor'  // Garantir que seja instrutor
      });
      setSuccess("Perfil salvo! Redirecionando para seu painel...");
      setTimeout(() => {
        window.location.href = createPageUrl('Index');
      }, 1500);
    } catch (err) {
      setError("Não foi possível salvar os dados. Tente novamente.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <UserIcon className="h-6 w-6" />
            Complete seu Perfil de Instrutor
          </CardTitle>
          <CardDescription>
            Preencha suas informações para ter acesso completo à plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}
          
          <div className="flex items-center justify-center">
            <Avatar className="h-24 w-24"><AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">{formData.full_name?.charAt(0) || 'I'}</AvatarFallback></Avatar>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="full_name">Nome Completo *</Label><Input id="full_name" value={formData.full_name} onChange={handleInputChange} /></div>
            <div><Label htmlFor="cpf">CPF *</Label><Input id="cpf" value={formData.cpf} onChange={handleInputChange} maxLength={14} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="sex">Gênero *</Label>
                <Select value={formData.sex} onValueChange={(value) => handleSelectChange('sex', value)}>
                    <SelectTrigger id="sex" className="w-full mt-1">
                        <SelectValue placeholder="Selecione..."/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="condominium_id">Selecione seu Condomínio *</Label>
              <Select value={formData.condominium_id} onValueChange={(value) => handleSelectChange('condominium_id', value)}>
                <SelectTrigger id="condominium_id" className="w-full mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {condominiums.map(condo => (
                    <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="phone">Telefone/WhatsApp *</Label><Input id="phone" value={formData.phone} onChange={handleInputChange} /></div>
          <div><Label htmlFor="address">Endereço Completo *</Label><Input id="address" value={formData.address} onChange={handleInputChange} /></div>
          
          <Button onClick={handleSaveProfile} className="w-full fusion-gradient">
            <Save className="h-4 w-4 mr-2" />
            Salvar Perfil e Acessar Painel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
