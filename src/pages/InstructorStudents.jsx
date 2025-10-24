
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Plus, FileText, Activity, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import { Workout } from "@/api/entities";
import { PhysicalAssessment } from "@/api/entities";
import { Condominium } from "@/api/entities";
import InstructorBottomNavBar from "@/components/instructor/InstructorBottomNavBar";

export default function InstructorStudents() {
  const [students, setStudents] = useState([]); // Students currently displayed (filtered by condo, searched by text/cpf)
  const [allStudents, setAllStudents] = useState([]); // All students (minimal data) for condominium filter counts
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondoId, setSelectedCondoId] = useState('all');

  // Initial data load (instructor, condominiums, and all students for filter counts)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true); // Set loading for initial data fetch
      try {
        const currentUser = await User.me();
        setInstructor(currentUser);

        const condos = await Condominium.list();
        setCondominiums(condos);

        // CORREÇÃO AQUI: Busca todos os usuários e filtra para pegar estudantes,
        // garantindo que todos sejam considerados para a contagem.
        let users = await User.list();
        let studentUsers = users.filter(u => u.user_type === "student" || (!u.user_type && u.email));
        setAllStudents(studentUsers);

        // Set initial condominium filter based on instructor's condo or 'all'
        if (currentUser.condominium_id) {
          setSelectedCondoId(currentUser.condominium_id);
        } else {
          setSelectedCondoId('all');
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        // isLoading is handled by loadStudents after instructor is set
      }
    };

    loadInitialData();
  }, []);

  // Effect to load students based on selectedCondoId and instructor
  useEffect(() => {
    const loadStudents = async () => {
      // Only load students once instructor and initial selectedCondoId are set
      if (!instructor) return;

      setIsLoading(true);
      try {
        let studentsQuery;
        
        if (selectedCondoId === 'all') {
          studentsQuery = await User.filter({ user_type: "student" });
        } else {
          studentsQuery = await User.filter({
            user_type: "student",
            condominium_id: selectedCondoId
          });
        }

        // Process data for the fetched students to include workout counts and last assessment
        const studentsWithData = await Promise.all(
          studentsQuery.map(async (student) => {
            try {
              const [workouts, assessments] = await Promise.all([
                Workout.filter({ student_id: student.id }),
                PhysicalAssessment.filter({ student_id: student.id })
              ]);

              return {
                ...student,
                workoutCount: workouts.length,
                lastAssessment: assessments.length > 0 ?
                  assessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0] : null
              };
            } catch (error) {
              console.error('Erro ao carregar dados do aluno:', student.id, error);
              return {
                ...student,
                workoutCount: 0,
                lastAssessment: null
              };
            }
          })
        );
        setStudents(studentsWithData); // Set the displayed students
      } catch (error) {
        console.error('Erro ao carregar alunos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedCondoId, instructor]); // Re-run when selected condo changes or instructor is set

  // Handles changing the selected condominium filter
  const handleCondoFilter = (condoId) => {
    setSelectedCondoId(condoId);
    // Student list will be updated by the useEffect for loadStudents
  };

  // Filters the currently displayed students based on search term and CPF
  const filteredStudents = students.filter(student => {
    const searchMatch = 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Clean both search CPF and student CPF for robust comparison
    const cleanCpfSearch = cpfSearch.replace(/\D/g, '');
    const cpfMatch = cleanCpfSearch === "" || 
      (student.cpf && student.cpf.replace(/\D/g, '').includes(cleanCpfSearch));
    
    return searchMatch && cpfMatch;
  });

  // Handles CPF input and formatting
  const handleCpfSearch = (value) => {
    const cpfValue = value.replace(/\D/g, ''); // Remove all non-digits
    const formattedCpf = cpfValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 14 characters (11 digits + 3 separators)
    setCpfSearch(formattedCpf);
  };

  const getCondominiumName = (condoId) => {
    const condo = condominiums.find(c => c.id === condoId);
    return condo ? condo.name : "Não associado";
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-2xl font-bold">Meus Alunos</h1>
          </div>
          <Link to={createPageUrl("Index")}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200"
              />
            </div>
            
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                placeholder="Buscar por CPF..."
                value={cpfSearch}
                onChange={(e) => handleCpfSearch(e.target.value)}
                className="border-orange-200"
                maxLength={14}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="condo-select" className="text-sm font-medium text-gray-700 shrink-0">Filtrar por:</label>
            <Select value={selectedCondoId} onValueChange={handleCondoFilter}>
              <SelectTrigger className="w-full sm:w-auto border-orange-200" id="condo-select">
                <SelectValue placeholder="Filtrar por local..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Alunos ({allStudents.length})</SelectItem>
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
              </SelectContent>
            </Select>
          </div>
        </div>

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
              <Activity className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold text-green-700">
                {students.filter(s => s.workoutCount > 0).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Com Treinos</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Calendar className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-xl md:text-2xl font-bold text-blue-700">
                {students.filter(s => s.lastAssessment).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Avaliados</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando alunos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || cpfSearch ? "Nenhum aluno encontrado" : "Nenhum aluno disponível"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || cpfSearch ? "Tente buscar com outros termos." : 
               allStudents.length === 0 ? "Não há alunos cadastrados no sistema." :
               "Não há alunos no filtro selecionado."}
            </p>
            {allStudents.length > 0 && !searchTerm && !cpfSearch && selectedCondoId !== 'all' && (
              <Button 
                onClick={() => handleCondoFilter('all')} 
                className="mt-4 bg-orange-500 hover:bg-orange-600"
              >
                Ver Todos os Alunos
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {student.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {student.full_name || "Nome não informado"}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 mb-2">
                          <p>{student.email}</p>
                          {student.cpf && (
                            <p className="font-mono bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                              CPF: {student.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="border-orange-200">
                            {student.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {student.workoutCount > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              {student.workoutCount} treino(s)
                            </Badge>
                          )}
                          {student.lastAssessment && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Última avaliação: {new Date(student.lastAssessment.assessment_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          <p><strong>Objetivos:</strong> {student.objectives || "Não definido"}</p>
                          <p><strong>Condomínio:</strong> {getCondominiumName(student.condominium_id)}</p>
                          {student.physical_restrictions && (
                            <p><strong>Restrições:</strong> {student.physical_restrictions}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch md:self-center">
                      <Link to={createPageUrl(`StudentDetail?student_id=${student.id}`)} className="w-full">
                        <Button className="bg-orange-500 hover:bg-orange-600 w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Ficha
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <InstructorBottomNavBar activePage="InstructorStudents" />
    </div>
  );
}
