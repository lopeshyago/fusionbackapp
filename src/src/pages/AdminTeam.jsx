
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, ArrowLeft, Plus, Edit, UserCheck, KeyRound, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import { InstructorInvite } from "@/api/entities";
import InstructorForm from "../components/admin/InstructorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminTeam() {
  const [instructors, setInstructors] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState("");
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const currentUser = await User.me();
      setAdminUser(currentUser);
      loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [instructorsList, condosList] = await Promise.all([
        User.filter({ user_type: 'instructor' }),
        Condominium.list()
      ]);
      
      setInstructors(instructorsList);
      setCondominiums(condosList);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    await loadData();
    setIsFormOpen(false);
    setEditingInstructor(null);
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingInstructor(null);
    setIsFormOpen(true);
  };

  const handleGenerateInvite = async () => {
    if (!adminUser) {
      alert("Erro: Usuário administrador não identificado.");
      return;
    }
    const code = 'FUSION-INST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); 

    try {
      await InstructorInvite.create({
        code: code,
        created_by_admin: adminUser.email,
        expires_at: expires_at,
      });
      setGeneratedCode(code);
    } catch (error) {
      console.error('Erro ao gerar convite:', error);
      alert('Não foi possível gerar o código de convite. Tente novamente.');
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("Código copiado!");
  };

  const getCondominiumName = (condoId) => {
    const condo = condominiums.find(c => c.id === condoId);
    return condo ? condo.name : "Não associado";
  };

  const filteredInstructors = instructors.filter(instructor => {
    const searchMatch = 
      instructor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Convert selectedCondoId to appropriate type for comparison
    const targetCondoId = selectedCondoId === 'all' ? 'all' : (selectedCondoId === null ? null : selectedCondoId);
    
    const condoMatch = targetCondoId === 'all' || instructor.condominium_id === targetCondoId;
    
    return searchMatch && condoMatch;
  });

  const getStatusBadge = (instructor) => {
    if (!instructor.condominium_id) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>;
    }
    if (instructor.plan_status === 'active') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 text-xs">Inativo</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 md:h-8 md:w-8" />
              <h1 className="text-lg md:text-2xl font-bold">Equipe</h1>
            </div>
            <Link to={createPageUrl("Index")}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Controles Mobile Responsivos */}
        <div className="mb-6 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar instrutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200"
              />
            </div>
            
            <div className="flex gap-2">
               <Select value={selectedCondoId} onValueChange={setSelectedCondoId}>
                  <SelectTrigger className="flex-1 border-orange-200">
                    <SelectValue placeholder="Filtrar por local..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Locais</SelectItem>
                    <SelectItem value={null}>Não Associados</SelectItem>
                    {condominiums
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(condo => (
                        <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog onOpenChange={(open) => {
                if (!open) setGeneratedCode("");
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Gerar Convite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gerar Convite</DialogTitle>
                    <DialogDescription>
                      Código único para novo instrutor (válido por 7 dias).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    {generatedCode ? (
                      <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-800 tracking-widest">{generatedCode}</span>
                        <Button onClick={copyToClipboard} size="sm">
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">Clique no botão para gerar um código.</p>
                    )}
                     <Button onClick={handleGenerateInvite} className="w-full">
                      {generatedCode ? 'Gerar Novo' : 'Gerar Código'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-initial"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Instrutor
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-xl md:text-2xl font-bold text-orange-700">{instructors.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <UserCheck className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold text-green-700">
                {instructors.filter(i => i.condominium_id).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Associados</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-xl md:text-2xl font-bold text-yellow-700">
                {instructors.filter(i => !i.condominium_id).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Instrutores - Mobile Otimizado */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">Nenhum instrutor encontrado</h3>
            <p className="text-sm text-gray-500 mb-4 px-4">
              {instructors.length === 0 
                ? "Adicione o primeiro instrutor à equipe." 
                : "Tente buscar com outros termos ou ajustar os filtros."}
            </p>
            {instructors.length === 0 && (
              <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Instrutor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                        {instructor.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                          {instructor.full_name || "Nome não informado"}
                        </h3>
                        <div className="flex gap-1 flex-wrap">
                          {getStatusBadge(instructor)}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs md:text-sm text-gray-600">
                        <p className="truncate">{instructor.email}</p>
                        <p><strong>Local:</strong> {getCondominiumName(instructor.condominium_id)}</p>
                        
                        {instructor.objectives && (
                          <p><strong>Especialidades:</strong> 
                            <span className="truncate ml-1">{instructor.objectives}</span>
                          </p>
                        )}
                        {instructor.phone && (
                          <p><strong>Telefone:</strong> {instructor.phone}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(instructor)}
                      className="border-orange-200 flex-shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <InstructorForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          instructor={editingInstructor}
          condominiums={condominiums}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
