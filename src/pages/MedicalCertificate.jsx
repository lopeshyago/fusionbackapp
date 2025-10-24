import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, FileText, Calendar, CheckCircle, X } from "lucide-react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function MedicalCertificate() {
  const [user, setUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [daysLeft, setDaysLeft] = useState(30);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        if (currentUser.medical_certificate_required_date) {
          const requiredDate = new Date(currentUser.medical_certificate_required_date);
          const today = new Date();
          const daysDiff = Math.ceil((requiredDate.getTime() + (30 * 24 * 60 * 60 * 1000) - today.getTime()) / (24 * 60 * 60 * 1000));
          setDaysLeft(Math.max(0, daysDiff));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    loadUser();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Apenas arquivos JPG, PNG ou PDF são permitidos.");
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const result = await UploadFile({ file });
      
      await User.updateMyUserData({
        medical_certificate_url: result.file_url,
        account_blocked: false
      });

      setUploadSuccess(true);
      
      setTimeout(() => {
        window.location.href = createPageUrl('Index');
      }, 2000);
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadError("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipForNow = () => {
    window.location.href = createPageUrl('Index');
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Atestado Enviado!</h2>
            <p className="text-green-700">Seu atestado médico foi anexado com sucesso.</p>
            <p className="text-gray-600 mt-4">Redirecionando para o painel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-700 flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              Atestado Médico Necessário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Atenção Médica Recomendada</h3>
                  <p className="text-yellow-700 mt-1">
                    Com base nas suas respostas do PAR-Q, recomendamos que você apresente um atestado médico 
                    liberando você para atividades físicas.
                  </p>
                </div>
              </div>
            </div>

            {user?.medical_certificate_url ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Atestado já enviado</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={user.medical_certificate_url} target="_blank" rel="noopener noreferrer">
                      Ver Arquivo
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Período de Acesso Temporário</span>
                  </div>
                  <p className="text-blue-700">
                    Você pode usar o sistema por mais <strong>{daysLeft} dias</strong> sem o atestado médico.
                    {daysLeft <= 7 && " ⚠️ Prazo próximo do vencimento!"}
                    {daysLeft === 0 && " ❌ Sua conta será bloqueada até o envio do atestado."}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Anexar Atestado Médico</h3>
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                    <p className="text-gray-600 mb-4">
                      Selecione uma foto ou arquivo PDF do seu atestado médico
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="medical-certificate"
                      disabled={isUploading}
                    />
                    <Button 
                      asChild 
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={isUploading}
                    >
                      <label htmlFor="medical-certificate" className="cursor-pointer">
                        {isUploading ? "Enviando..." : "Selecionar Arquivo"}
                      </label>
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos aceitos: PDF, JPG, PNG (máximo 10MB)
                    </p>
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{uploadError}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleSkipForNow} 
                className="flex-1"
                disabled={daysLeft === 0}
              >
                {user?.medical_certificate_url ? "Voltar ao Painel" : "Pular por Agora"}
              </Button>
              {!user?.medical_certificate_url && (
                <Link to={createPageUrl("Index")} className="flex-1">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Ir para o Painel
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}