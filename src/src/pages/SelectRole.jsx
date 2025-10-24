import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRole.css';

export default function SelectRole(){
  const navigate = useNavigate();
  return (
    <div className="select-role">
      <h1>Fusion Fitness</h1>
      <p>Escolha seu tipo de acesso:</p>
      <div className="role-buttons">
        <button onClick={()=>navigate('/AdminLogin')}>Administrador</button>
        <button onClick={()=>navigate('/InstructorLogin')}>Instrutor</button>
        <button onClick={()=>navigate('/StudentLogin')}>Aluno</button>
      </div>
    </div>
  )
}
