
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ParqQuestion } from "@/api/entities";
import { ParqResponse } from "@/api/entities";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Added Alert import

const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68afb6f88b147cdfe2384437/ed2388368_icon-512.png";

// Helper hook to encapsulate navigation logic
// (Assuming useOptimizedNavigation is a custom hook in the project)
// If not, it would need to be defined here or replaced with direct useNavigate calls
const useOptimizedNavigation = () => {
  const navigate = useNavigate();
  const navigateTo = (path, state = {}, replace = false) => {
    navigate(createPageUrl(path), { state, replace });
  };
  return { navigateTo };
};

export default function Parq() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added isSubmitting state
  const [user, setUser] = useState(null); // Added user state
  const [error, setError] = useState("");
  const { navigateTo } = useOptimizedNavigation(); // Using the new optimized navigation hook
  const urlParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [parqQuestions, currentUser] = await Promise.all([
          ParqQuestion.list('order'),
          User.me()
        ]);
        setQuestions(parqQuestions);
        setUser(currentUser);
        // Initialize answers state
        const initialAnswers = {};
        parqQuestions.forEach(q => {
          initialAnswers[q.id] = null; // null indicates unanswered
        });
        setAnswers(initialAnswers);
      } catch (e) {
        setError("Erro ao carregar as perguntas do questionário.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    // Keep the logic to store booleans (true for 'yes', false for 'no')
    setAnswers(prev => ({ ...prev, [questionId]: answer === 'yes' }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.values(answers).some(a => a === null)) {
      setError("Por favor, responda todas as perguntas antes de continuar.");
      return;
    }
    setError(""); // Clear previous errors
    setIsSubmitting(true); // Set submitting state

    const hasRisk = Object.values(answers).some(a => a === true); // Check for any 'yes' answers
    const answersToSave = questions.map(q => ({
      question_text: q.question_text,
      answer: answers[q.id]
    }));

    try {
      // Create PAR-Q response record
      await ParqResponse.create({
        student_id: user.id,
        completed_at: new Date().toISOString(),
        // expires_at should be correctly formatted as YYYY-MM-DD
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        answers: answersToSave,
        has_risk_factors: hasRisk
      });

      // Update user's status
      const userUpdateData = {
        par_q_completed: true,
        par_q_has_risk: hasRisk,
      };
      if (hasRisk) {
        // medical_certificate_required_date should be correctly formatted as YYYY-MM-DD
        userUpdateData.medical_certificate_required_date = new Date().toISOString().split('T')[0];
      } else {
        userUpdateData.medical_certificate_required_date = null; // Clear if no risk
      }

      await User.updateMyUserData(userUpdateData);

      // Navigate based on risk
      if (hasRisk) {
        // If there's risk, navigate to MedicalCertificate directly
        navigateTo('MedicalCertificate', { from: 'parq' }, true);
      } else {
        // If no risk, navigate to the 'next' URL parameter, or 'Index' by default
        const nextUrl = urlParams.get('next') || 'Index';
        // Add 'from=parq' parameter to signal the origin
        navigateTo(`${nextUrl}?from=parq`, {}, true);
      }

    } catch (err) {
      console.error("Erro ao submeter PAR-Q:", err);
      setError("Ocorreu um erro ao salvar suas respostas. Tente novamente.");
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando questionário...</div>;
  }

  // Removed the `hasSubmitted` block as navigation is now direct after submission

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-700">Questionário de Prontidão para Atividade Física (PAR-Q)</CardTitle>
          <CardDescription>
            Este questionário visa identificar a necessidade de avaliação médica antes do início da atividade física. Por favor, responda com sinceridade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 border rounded-lg bg-white">
              <p className="font-semibold mb-3 text-gray-800">
                {index + 1}. {q.question_text}
              </p>
              {/* Ensure RadioGroup's value matches the boolean state (true/false) by comparing to 'yes'/'no' strings */}
              <RadioGroup
                onValueChange={(value) => handleAnswerChange(q.id, value)}
                value={answers[q.id] === true ? 'yes' : (answers[q.id] === false ? 'no' : undefined)} // Set value based on state
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`yes-${q.id}`} />
                  <Label htmlFor={`yes-${q.id}`}>Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`no-${q.id}`} />
                  <Label htmlFor={`no-${q.id}`}>Não</Label>
                </div>
              </RadioGroup>
            </div>
          ))}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-center">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Questionário"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
