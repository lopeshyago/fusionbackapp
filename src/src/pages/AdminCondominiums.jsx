
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Users, ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { Condominium } from "@/api/entities";
import CondominiumForm from "../components/admin/CondominiumForm";

export default function AdminCondominiums() {
  const [condominiums, setCondominiums] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCondominium, setEditingCondominium] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  const loadCondominiums = async (retries = 3) => { // Added retry mechanism
    setIsLoading(true);
    setError(null); // Clear previous errors

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const fetchedCondominiums = await Condominium.list('-created_date');
        setCondominiums(fetchedCondominiums);
        setError(null); // Ensure error is cleared on success
        break; // Exit loop on successful fetch
      } catch (error) {
        console.error(`Erro ao carregar condomínios (tentativa ${attempt + 1}):`, error);

        if (attempt === retries - 1) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCondominiums();
  }, []);

  const handleSave = async () => {
    await loadCondominiums();
    setIsFormOpen(false);
    setEditingCondominium(null);
  };

  const handleEdit = (condominium) => {
    setEditingCondominium(condominium);
    setIsFormOpen(true);
  };

  const handleDelete = async (condominiumId) => {
    if (confirm('Tem certeza que deseja excluir este condomínio?')) {
      await Condominium.delete(condominiumId);
      await loadCondominiums();
    }
  };

  const filteredCondominiums = condominiums.filter(condo =>
    condo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 md:h-8 md:w-8" />
              <h1 className="text-lg md:text-2xl font-bold">Condomínios</h1>
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
        {/* Header Mobile Responsivo */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar condomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200"
              />
            </div>

            {/* Botão Adicionar */}
            <Button
              onClick={() => { setEditingCondominium(null); setIsFormOpen(true); }}
              className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Condomínio
            </Button>
          </div>
        </div>

        {/* Cards de Resumo - Mobile Otimizado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-xl md:text-2xl font-bold text-orange-700">{condominiums.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold text-green-700">
                {condominiums.filter(c => c.is_active).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 md:p-4 text-center">
              {/* Note: Badge is a component, not an icon. Replaced with generic icon or placeholder if intended to be an icon. */}
              <div className="mx-auto mb-2 flex items-center justify-center">
                <Badge className="w-fit">
                  <span className="text-blue-600 h-6 w-6 md:h-8 md:w-8"></span>
                </Badge>
              </div>
              <p className="text-xl md:text-2xl font-bold text-blue-700">
                {condominiums.reduce((total, c) => total + (c.areas?.length || 0), 0)}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Áreas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Condomínios - Mobile Otimizado */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : error ? ( // Display error message if an error occurred
          <div className="text-center py-8 md:py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">Erro de Conexão</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <Button
                onClick={() => loadCondominiums()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : filteredCondominiums.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <MapPin className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">
              {searchTerm ? "Nenhum condomínio encontrado" : "Nenhum condomínio cadastrado"}
            </h3>
            <p className="text-sm text-gray-500 mb-4 px-4">
              {searchTerm ? "Tente buscar com outros termos." : "Cadastre o primeiro condomínio."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredCondominiums.map((condominium) => (
              <Card key={condominium.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                            {condominium.name}
                          </h3>
                          <Badge
                            variant={condominium.is_active ? 'default' : 'secondary'}
                            className="w-fit"
                          >
                            {condominium.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>

                      {/* Botões de Ação - Mobile Otimizado */}
                      <div className="flex gap-2 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(condominium)}
                          className="border-orange-200 p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 p-2"
                          onClick={() => handleDelete(condominium.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informações do Condomínio */}
                    <div className="space-y-2">
                      <p className="text-sm md:text-base text-gray-600 line-clamp-2">
                        {condominium.address}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        CEP: {condominium.cep}
                      </p>

                      {/* Áreas - Mobile Otimizado */}
                      {condominium.areas && condominium.areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {condominium.areas.slice(0, 3).map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-orange-200">
                              {area}
                            </Badge>
                          ))}
                          {condominium.areas.length > 3 && (
                            <Badge variant="outline" className="text-xs border-orange-200">
                              +{condominium.areas.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Código de Convite */}
                      {condominium.invite_code && (
                        <div className="bg-orange-50 p-2 rounded-lg">
                          <p className="text-xs md:text-sm text-orange-600 font-mono">
                            Código: {condominium.invite_code}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CondominiumForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          condominium={editingCondominium}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
