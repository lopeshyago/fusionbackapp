
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Save, User as UserIcon, Phone, Mail, Cake, Calendar, Building2, FileText, Shield, Camera, LogOut } from "lucide-react";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import BottomNavBar from "../components/student/BottomNavBar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOptimizedNavigation } from '../components/common/NavigationHelper'; // NEW IMPORT

const validateCpf = (cpf) => {
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) return false;

    let sum = 0;
    let remainder;

    // Validate first digit
    for (let i = 1; i <= 9; i++) sum += parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(9, 10))) return false;

    sum = 0;
    // Validate second digit
    for (let i = 1; i <= 10; i++) sum += parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(10, 11))) return false;

    return true;
};

export default function StudentProfile() {
    const [user, setUser] = useState(null);
    const [condominium, setCondominium] = useState(null);
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState("");
    const { navigateTo } = useOptimizedNavigation(); // REPLACED useNavigate

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm();
    const formData = watch();

    // Função para calcular idade precisa
    const calculateAge = (birthDate) => {
        if (!birthDate) return "";
        
        const today = new Date();
        const birth = new Date(birthDate + 'T00:00:00'); 
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    };

    // Detectar se é primeiro acesso (cadastro incompleto)
    const isFirstAccess = (userData) => {
        return !userData.phone || !userData.address || !userData.cpf || !userData.date_of_birth || !userData.sex;
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                
                // Verificar se é primeiro acesso - se sim, ativar modo de edição automaticamente
                const firstAccess = isFirstAccess(currentUser);
                setIsEditing(firstAccess);
                
                // Calcular idade se tiver data de nascimento
                let calculatedAge = currentUser.age || "";
                if (currentUser.date_of_birth) {
                    calculatedAge = calculateAge(currentUser.date_of_birth);
                }
                
                // Reset form with user data
                reset({
                    full_name: currentUser.full_name || "",
                    phone: currentUser.phone || "",
                    age: calculatedAge,
                    date_of_birth: currentUser.date_of_birth || "",
                    address: currentUser.address || "",
                    cpf: currentUser.cpf ? currentUser.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
                    profile_photo_url: currentUser.profile_photo_url || "",
                    sex: currentUser.sex || ""
                });

                if (currentUser.condominium_id) {
                    const condoList = await Condominium.filter({ id: currentUser.condominium_id });
                    if (condoList.length > 0) setCondominium(condoList[0]);
                }
            } catch (err) {
                console.error("Erro ao carregar dados do perfil:", err);
                setError("Não foi possível carregar seus dados. Tente novamente.");
            }
            setIsLoading(false);
        };

        loadData();
    }, [reset]);
    
    const handleCpfChange = (e) => {
        const cpfValue = e.target.value.replace(/\D/g, '');
        const formattedCpf = cpfValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
        setValue('cpf', formattedCpf, { shouldValidate: true });
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setPhotoUploadError("Apenas imagens JPG ou PNG são permitidas.");
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setPhotoUploadError("A imagem deve ter no máximo 5MB.");
            return;
        }

        setIsUploadingPhoto(true);
        setPhotoUploadError("");
        setSuccess("");

        try {
            const result = await UploadFile({ file });
            setValue('profile_photo_url', result.file_url);
            
            if (!isEditing) {
                await User.updateMyUserData({ profile_photo_url: result.file_url });
                const updatedUser = await User.me();
                setUser(updatedUser);
                setSuccess("Foto de perfil atualizada com sucesso!");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setSuccess("Foto carregada. Clique em 'Salvar' para aplicar as mudanças.");
                setTimeout(() => setSuccess(""), 5000);
            }
            
        } catch (error) {
            console.error('Erro no upload da foto:', error);
            setPhotoUploadError("Erro ao fazer upload da foto. Tente novamente.");
        } finally {
            setIsUploadingPhoto(false);
            event.target.value = null;
        }
    };

    const handleSaveProfile = async (data) => {
        setError("");
        setSuccess("");
        setIsSaving(true);
        
        const wasFirstAccess = isFirstAccess(user || {});

        try {
            const age = calculateAge(data.date_of_birth);
            
            const updateData = {
                full_name: data.full_name,
                phone: data.phone,
                address: data.address,
                cpf: data.cpf.replace(/\D/g, ''),
                date_of_birth: data.date_of_birth,
                sex: data.sex,
                age: age,
                profile_photo_url: data.profile_photo_url,
                plan_status: user?.plan_status || 'active',
                user_type: user?.user_type || 'student'
            };
            
            await User.updateMyUserData(updateData);
            
            if (wasFirstAccess) {
                setSuccess("Cadastro completo! Redirecionando para o seu painel...");
                setTimeout(() => {
                    navigateTo(createPageUrl("Index"), { replace: true }); // UPDATED navigateTo
                }, 2000);
            } else {
                const updatedUser = await User.me();
                setUser(updatedUser);
                
                const calculatedAge = calculateAge(updatedUser.date_of_birth);
                reset({
                    full_name: updatedUser.full_name || "",
                    phone: updatedUser.phone || "",
                    age: calculatedAge,
                    date_of_birth: updatedUser.date_of_birth || "",
                    address: updatedUser.address || "",
                    cpf: updatedUser.cpf ? updatedUser.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
                    profile_photo_url: updatedUser.profile_photo_url || "",
                    sex: updatedUser.sex || ""
                });
                
                setIsEditing(false);
                setSuccess("Dados salvos com sucesso!");
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch(err) {
            console.error("Erro ao salvar perfil:", err);
            setError("Não foi possível salvar os dados. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAssociateCondo = async () => {
        setError("");
        setSuccess("");
        if (!inviteCode.trim()) {
            setError("Por favor, insira um código de convite.");
            return;
        }

        try {
            const condoList = await Condominium.filter({ invite_code: inviteCode.trim().toUpperCase() });
            if (condoList.length === 0) {
                setError("Código de convite inválido ou não encontrado.");
                return;
            }
            const targetCondo = condoList[0];
            await User.updateMyUserData({ condominium_id: targetCondo.id });
            
            const updatedUser = await User.me();
            setUser(updatedUser);
            setCondominium(targetCondo);
            setInviteCode("");
            setSuccess(`Você foi associado ao condomínio ${targetCondo.name}!`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Erro ao associar condomínio:", err);
            setError("Ocorreu um erro ao tentar associar o condomínio. Tente novamente.");
        }
    };

    const handleLogout = async () => {
        try {
            await User.logout(); 
            navigateTo(createPageUrl("Index")); // UPDATED navigateTo
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            setError("Não foi possível sair da conta. Tente novamente.");
        }
    };
    
    const handleDeleteAccount = async () => {
        if (!user) return;

        if (window.confirm("ATENÇÃO: Esta ação é IRREVERSÍVEL. Você tem certeza que deseja excluir PERMANENTEMENTE sua conta e todos os seus dados (fichas, treinos, progresso)?")) {
            const confirmationText = 'EXCLUIR';
            const userInput = window.prompt(`Para confirmar, digite "${confirmationText}" em maiúsculas:`);
            
            if (userInput === confirmationText) {
                setIsSaving(true); // Reutilizar o estado de 'salvando' para desativar a UI
                setError("");
                try {
                    await User.delete(user.id);
                    await User.logout(); // Fazer logout após a exclusão bem- sucedida
                    alert("Sua conta foi excluída com sucesso.");
                    navigateTo(createPageUrl("Index"), { replace: true }); // UPDATED navigateTo
                } catch (error) {
                    console.error("Erro ao excluir a conta:", error);
                    setError("Não foi possível excluir sua conta. Se o problema persistir, entre em contato com o suporte.");
                    setIsSaving(false);
                }
            } else if(userInput !== null) { // Apenas mostrar alerta se o usuário digitou algo errado (e não se apenas cancelou)
                alert("Exclusão cancelada. A digitação não correspondeu.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 text-lg">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="container mx-auto p-4 md:p-6 pb-24"> {/* pb-24 moved here */}
                {/* NEW HEADER SECTION */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                        <UserIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Meu Perfil</h1>
                        <p className="text-gray-600 mt-1">Gerencie suas informações e preferências</p>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50 mb-6">
                        <CardContent className="p-4">
                            <p className="text-red-700">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {success && (
                    <Card className="border-green-200 bg-green-50 mb-6">
                        <CardContent className="p-4">
                            <p className="text-green-700">{success}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Header section (integrated into new Card layout) */}
                <Card className="shadow-lg border-orange-200 mb-6"> {/* Added mb-6 for spacing */}
                    <CardContent className="p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"> {/* Added items-center for vertical alignment */}
                            {/* Left column: Avatar and Photo Upload */}
                            <div className="md:col-span-1 flex flex-col items-center">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 md:h-32 md:w-32">
                                        {formData.profile_photo_url ? (
                                            <AvatarImage src={formData.profile_photo_url} alt="Foto de perfil" className="object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl md:text-4xl">
                                                {formData.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    
                                    {/* Botão de upload de foto */}
                                    <div className="absolute -bottom-2 -right-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            id="photo-upload"
                                            disabled={isUploadingPhoto}
                                        />
                                        <Button 
                                            asChild 
                                            size="sm"
                                            className="rounded-full h-10 w-10 p-0 bg-orange-500 hover:bg-orange-600 shadow-lg"
                                            disabled={isUploadingPhoto}
                                        >
                                            <label htmlFor="photo-upload" className="cursor-pointer flex items-center justify-center">
                                                {isUploadingPhoto ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                ) : (
                                                    <Camera className="h-4 w-4" />
                                                )}
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Erro de upload de foto */}
                                {photoUploadError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg w-full text-center">
                                        <p className="text-red-700 text-sm">{photoUploadError}</p>
                                    </div>
                                )}
                                
                                {/* Dica sobre foto */}
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full text-center">
                                    <p className="text-blue-700 text-sm flex items-center justify-center gap-2">
                                        <Camera className="h-4 w-4 flex-shrink-0" />
                                        Clique no ícone da câmera para adicionar ou alterar sua foto de perfil (JPG/PNG, máx. 5MB)
                                    </p>
                                </div>
                            </div>
                            
                            {/* Right columns: Name, Email, Badges, and Edit/Save buttons */}
                            <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{formData.full_name || user?.email}</h2>
                                <p className="text-gray-600">{user?.email}</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                    <Badge className="bg-orange-100 text-orange-800">Aluno</Badge>
                                    <Badge className={user?.plan_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {user?.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    {!isEditing && !isFirstAccess(user || {}) ? (
                                        <Button onClick={() => setIsEditing(true)} className="bg-orange-500 hover:bg-orange-600">
                                            Editar Perfil
                                        </Button>
                                    ) : ( 
                                        <>
                                            {!isFirstAccess(user || {}) && (
                                                <Button variant="outline" onClick={() => {
                                                    setIsEditing(false);
                                                    reset({
                                                        full_name: user.full_name || "",
                                                        phone: user.phone || "",
                                                        age: calculateAge(user.date_of_birth),
                                                        date_of_birth: user.date_of_birth || "",
                                                        address: user.address || "",
                                                        cpf: user.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
                                                        profile_photo_url: user.profile_photo_url || "",
                                                        sex: user.sex || ""
                                                    });
                                                }}>
                                                    Cancelar
                                                </Button>
                                            )}
                                            {isFirstAccess(user || {}) ? null : ( 
                                                <Button 
                                                    onClick={handleSubmit(handleSaveProfile)} 
                                                    disabled={isSaving}
                                                    className="bg-orange-500 hover:bg-orange-600"
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {isSaving ? 'Salvando...' : 'Salvar'}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados Pessoais */}
                <form onSubmit={handleSubmit(handleSaveProfile)}>
                    <Card className="border-orange-200 shadow-xl mb-6"> {/* Added mb-6 for spacing */}
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                <UserIcon className="h-5 w-5" />
                                Dados Pessoais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nome Completo</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="full_name"
                                                {...register("full_name", { required: "Nome completo é obrigatório" })}
                                                className="border-orange-200"
                                            />
                                            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                                        </>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded border">{formData.full_name || "Não informado"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF</Label>
                                    {isEditing ? (
                                         <>
                                            <Input
                                                id="cpf"
                                                {...register("cpf", { 
                                                    required: "CPF é obrigatório",
                                                    validate: value => validateCpf(value) || "CPF inválido"
                                                })}
                                                onChange={handleCpfChange}
                                                className="border-orange-200"
                                                maxLength={14}
                                            />
                                            {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
                                        </>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded border font-mono">{formData.cpf || "Não informado"}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="sex">Gênero</Label>
                                    {isEditing ? (
                                        <>
                                            <Select
                                                onValueChange={(value) => setValue('sex', value, { shouldValidate: true })}
                                                defaultValue={formData.sex}
                                            >
                                                <SelectTrigger id="sex" className="border-orange-200">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Masculino</SelectItem>
                                                    <SelectItem value="female">Feminino</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex.message}</p>}
                                        </>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded border">{formData.sex === 'male' ? 'Masculino' : formData.sex === 'female' ? 'Feminino' : "Não informado"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <Cake className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                {...register("date_of_birth", { 
                                                    required: "Data de nascimento é obrigatória",
                                                    validate: (value) => {
                                                        const birthDate = new Date(value + 'T00:00:00'); 
                                                        const today = new Date();
                                                        if (isNaN(birthDate.getTime())) return "Data de nascimento inválida.";
                                                        if (birthDate >= today) return "Data de nascimento deve ser anterior à data atual.";
                                                        return true;
                                                    }
                                                })}
                                                onChange={(e) => {
                                                    const newDate = e.target.value;
                                                    setValue('date_of_birth', newDate, { shouldValidate: true });
                                                    const calculatedAge = calculateAge(newDate);
                                                    setValue('age', calculatedAge);
                                                }}
                                                className="border-orange-200 pl-10"
                                            />
                                            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                                        </div>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded border">
                                            {formData.date_of_birth ? format(new Date(formData.date_of_birth + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : "Não informado"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="age">Idade</Label>
                                    <p className="p-2 bg-gray-100 rounded border text-gray-600">
                                        {formData.age ? `${formData.age} anos` : "Não calculado"}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone/WhatsApp</Label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="phone"
                                                {...register("phone", { required: "Telefone é obrigatório" })}
                                                className="border-orange-200 pl-10"
                                            />
                                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                        </div>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded border">{formData.phone || "Não informado"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço Completo</Label>
                                {isEditing ? (
                                     <>
                                        <Input
                                            id="address"
                                            {...register("address", { required: "Endereço é obrigatório" })}
                                            className="border-orange-200"
                                        />
                                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                                    </>
                                ) : (
                                    <p className="p-2 bg-gray-50 rounded border">{formData.address || "Não informado"}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {isEditing && isFirstAccess(user || {}) && ( // Only show this specific button for first access editing
                        <div className="mt-6">
                            <Button 
                                type="submit" 
                                className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6"
                                disabled={isSaving}
                            >
                                <Save className="h-5 w-5 mr-2" />
                                {isSaving ? 'Salvando...' : 'Salvar Cadastro e Acessar'}
                            </Button>
                        </div>
                    )}
                </form>

                {/* Status da Conta */}
                <Card className="border-orange-200 shadow-xl mb-6"> {/* Added mb-6 for spacing */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Shield className="h-5 w-5" />
                            Status da Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-gray-600">PAR-Q Completo</span>
                                <Badge className={user?.par_q_completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {user?.par_q_completed ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-gray-600">Status do Plano</span>
                                <Badge className={user?.plan_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                    {user?.plan_status === 'active' ? 'Ativo' : user?.plan_status || 'Indefinido'}
                                </Badge>
                            </div>
                        </div>
                        
                        {user?.medical_certificate_url && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Atestado Médico</span>
                                </div>
                                <p className="text-blue-700 text-sm mb-3">Documento anexado com sucesso</p>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={user.medical_certificate_url} target="_blank" rel="noopener noreferrer">
                                        Ver Documento
                                    </a>
                                </Button>
                            </div>
                        )}
                         {!user?.par_q_completed && (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                 <div className="flex items-center gap-2 mb-2">
                                     <FileText className="h-4 w-4 text-yellow-600" />
                                     <span className="font-medium text-yellow-800">PAR-Q Pendente</span>
                                 </div>
                                 <p className="text-yellow-700 text-sm mb-3">Responda o questionário para ter acesso completo.</p>
                                 <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100" onClick={() => navigateTo(createPageUrl("Parq"))}> {/* Updated to use navigateTo */}
                                         Preencher PAR-Q
                                 </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Associar Condomínio */}
                <Card className="border-orange-200 shadow-xl mb-6"> {/* Added mb-6 for spacing */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Building2 className="h-5 w-5" />
                            Local de Treino
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {condominium ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <MapPin className="h-5 w-5 text-green-600" />
                                    <h3 className="font-semibold text-green-800">{condominium.name}</h3>
                                </div>
                                <p className="text-sm text-green-700 mb-2">{condominium.address}</p>
                                {condominium.areas && condominium.areas.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {condominium.areas.map((area, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-600">Você ainda não está associado a um local de treino.</p>
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Código de convite"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        className="border-orange-200"
                                    />
                                    <Button onClick={handleAssociateCondo} className="bg-orange-500 hover:bg-orange-600">
                                        Associar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {!isFirstAccess(user || {}) && ( // Only show logout/delete if not first access
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                        <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da Conta
                        </Button>
                        <Button variant="link" className="text-red-600 hover:text-red-800" onClick={handleDeleteAccount} disabled={isSaving}>
                            Excluir minha conta permanentemente
                        </Button>
                    </div>
                )}
            </div>
            <BottomNavBar activePage="StudentProfile" />
        </div>
    );
}
