
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calculator, Search, ArrowLeft, Plus, Users, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { DetailedAssessment } from "@/api/entities";
import { Condominium } from "@/api/entities";
import DetailedAssessmentForm from "../components/assessment/DetailedAssessmentForm";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";

export default function InstructorAssessments() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [selectedCondoId, setSelectedCondoId] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const currentUser = await User.me();
      setInstructor(currentUser);

      // Carregar condomínios com tratamento de rate limiting
      let condos = [];
      try {
        condos = await Condominium.list();
        setCondominiums(condos);
      } catch (condoError) {
        console.warn('Erro ao carregar condomínios (rate limit?), usando cache local:', condoError);
        // Se der rate limit, usar dados em cache ou continuar sem condomínios
        if (condoError.response?.status === 429) {
          // Rate limit - usar cache do localStorage se disponível
          const cachedCondos = localStorage.getItem('fusion_cached_condominiums');
          if (cachedCondos) {
            condos = JSON.parse(cachedCondos);
            setCondominiums(condos);
          } else {
            setLoadError('Limite de requisições atingido para condomínios. Aguarde um momento e tente novamente.');
            setIsLoading(false); // Stop loading if critical data can't be fetched
            return;
          }
        } else {
          // If it's another type of error, rethrow it to be caught by the main catch block
          throw condoError;
        }
      }

      // Cache condomínios no localStorage para usar em caso de rate limit
      if (condos.length > 0) {
        localStorage.setItem('fusion_cached_condominiums', JSON.stringify(condos));
      }

      // Busca todos os usuários e filtra para estudantes.
      const allUsers = await User.list();
      let studentsQuery = allUsers.filter(u => 
        u.user_type === "student" || 
        (!u.user_type && u.email)
      );

      console.log('Alunos encontrados:', studentsQuery.length);

      const allAssessments = await DetailedAssessment.list('-assessment_date');

      // Enriquecer dados dos alunos com última avaliação
      const studentsWithAssessments = studentsQuery.map(student => {
        const studentAssessments = allAssessments.filter(a => a.student_id === student.id);
        return {
          ...student,
          lastAssessment: studentAssessments[0] || null,
          assessmentCount: studentAssessments.length
        };
      });

      setAllStudents(studentsWithAssessments);
      
      // Se o instrutor tem condomínio associado, filtrar por padrão
      if (currentUser.condominium_id) {
        const filteredStudents = studentsWithAssessments.filter(s => s.condominium_id === currentUser.condominium_id);
        setStudents(filteredStudents);
        setSelectedCondoId(currentUser.condominium_id);
      } else {
        // Se não, mostrar todos
        setStudents(studentsWithAssessments);
        setSelectedCondoId("all");
      }
      
      setAssessments(allAssessments);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.response?.status === 429) {
        setLoadError('Muitas requisições simultâneas. Aguarde alguns segundos e recarregue a página.');
      } else {
        setLoadError('Erro ao carregar dados. Verifique sua conexão e tente novamente.');
      }
    }
    setIsLoading(false);
  };

  const handleNewAssessment = (student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleSaveAssessment = async () => {
    // Pequeno delay antes de recarregar para evitar rate limiting
    setTimeout(async () => {
      await loadData();
      setIsFormOpen(false);
      setSelectedStudent(null);
    }, 1000); // 1 second delay
  };

  const handleCondoFilter = (condoId) => {
    setSelectedCondoId(condoId);
    
    if (condoId === "all") {
      setStudents(allStudents);
    } else if (condoId === "no_condo") {
      setStudents(allStudents.filter(s => !s.condominium_id));
    }
    else {
      setStudents(allStudents.filter(s => s.condominium_id === condoId));
    }
  };

  const handleCpfSearch = (value) => {
    const cpfValue = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    const formattedCpf = cpfValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 14 caracteres
    setCpfSearch(formattedCpf);
  };

  const getCondominiumName = (condoId) => {
    const condo = condominiums.find(c => c.id === condoId);
    return condo ? condo.name : "Não associado";
  };

  // Filtros combinados
  const filteredStudents = students.filter(student => {
    // Filtro por nome/email
    const nameMatch = 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por CPF
    const cleanCpfSearch = cpfSearch.replace(/\D/g, '');
    const cpfMatch = cleanCpfSearch === "" || 
      (student.cpf && student.cpf.replace(/\D/g, '').includes(cleanCpfSearch));
    
    return nameMatch && cpfMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-2xl font-bold">Avaliações Físicas</h1>
          </div>
          <Link to={createPageUrl("Index")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {loadError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-semibold">Erro:</span>
              <span>{loadError}</span>
            </div>
            <button 
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Debug - remover depois */}
        <div className="mb-4 text-sm text-gray-500">
          Total alunos carregados: {allStudents.length} | Filtrados: {students.length} | Após busca: {filteredStudents.length}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-xl md:text-2xl font-bold text-orange-700">{students.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total de Alunos</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Calculator className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold text-green-700">{assessments.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Avaliações Realizadas</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-xl md:text-2xl font-bold text-blue-700">
                {students.filter(s => s.assessmentCount > 0).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Alunos Avaliados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros de Busca */}
        <Card className="mb-6 border-orange-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca por Nome/Email */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200"
                />
              </div>

              {/* Busca por CPF */}
              <div className="relative">
                <Input
                  placeholder="Buscar por CPF..."
                  value={cpfSearch}
                  onChange={(e) => handleCpfSearch(e.target.value)}
                  className="border-orange-200"
                  maxLength={14}
                />
              </div>

              {/* Filtro por Condomínio */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedCondoId} onValueChange={handleCondoFilter}>
                  <SelectTrigger className="w-full border-orange-200">
                    <SelectValue placeholder="Filtrar por local..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Todos os Locais ({allStudents.length})
                    </SelectItem>
                    {condominiums
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(condo => {
                        const count = allStudents.filter(s => s.condominium_id === condo.id).length;
                        return (
                          <SelectItem key={condo.id} value={condo.id}>
                            {condo.name} ({count})
                          </SelectItem>
                        );
                      })}
                    <SelectItem value="no_condo">
                      Sem Condomínio ({allStudents.filter(s => !s.condominium_id).length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão para limpar filtros */}
            <div className="mt-3 flex justify-end">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCpfSearch("");
                  setSelectedCondoId("all");
                  setStudents(allStudents);
                }}
                className="border-orange-200"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alunos */}
        {isLoading && !loadError ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando alunos...</p>
          </div>
        ) : allStudents.length === 0 && !loadError ? ( // Only show if no error and truly no students
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-gray-500 mb-4">
              Não foram encontrados alunos no sistema.
            </p>
          </div>
        ) : filteredStudents.length === 0 && !loadError ? ( // Only show if no error and truly no filtered students
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || cpfSearch ? 
                "Tente buscar com outros termos ou limpar os filtros." : 
                "Não há alunos no filtro selecionado."}
            </p>
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCpfSearch("");
                }}
              >
                Limpar Busca
              </Button>
              <Button 
                onClick={() => handleCondoFilter('all')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Ver Todos
              </Button>
            </div>
          </div>
        ) : ( // Render students only if not loading and no critical error
          <div className="grid gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.profile_photo_url} alt={student.full_name || 'Student Avatar'} />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {student.full_name?.charAt(0) || student.email?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {student.full_name || student.email || "Nome não informado"}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 mb-2">
                          <p>{student.email}</p>
                          {student.cpf && (
                            <p className="font-mono bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                              CPF: {student.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </p>
                          )}
                          {!student.user_type && (
                            <Badge variant="outline" className="text-xs">
                              Tipo não definido
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="border-orange-200">
                            {student.assessmentCount} avaliação(ões)
                          </Badge>
                          {student.lastAssessment && (
                            <Badge className="bg-green-100 text-green-800">
                              Última: {new Date(student.lastAssessment.assessment_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mt-2">
                          <p><strong>Local:</strong> {getCondominiumName(student.condominium_id)}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleNewAssessment(student)}
                      className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Avaliação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Avaliação */}
        <DetailedAssessmentForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          studentId={selectedStudent?.id}
          instructorId={instructor?.id}
          studentName={selectedStudent?.full_name}
          onSave={handleSaveAssessment}
        />
      </div>
      
      <InstructorBottomNavBar activePage="InstructorAssessments" />
    </div>
  );
}
