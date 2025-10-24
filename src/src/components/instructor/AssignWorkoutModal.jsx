import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Dumbbell, User } from "lucide-react";

export default function AssignWorkoutModal({ isOpen, onOpenChange, workout, students, onAssign }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const handleAssign = () => {
    if (selectedStudentId) {
      onAssign(selectedStudentId);
    }
  };
  
  // Reset state when closing
  const handleOpenChange = (open) => {
    if (!open) {
      setSelectedStudentId('');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-orange-600" />
            Atribuir Treino
          </DialogTitle>
          <DialogDescription>
            Selecione um aluno para atribuir o template de treino "{workout?.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="student" className="text-right">
              Aluno
            </Label>
            <div className="col-span-3">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Selecione um aluno..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {student.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={!selectedStudentId}>
            Confirmar Atribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}