import React from 'react';
import { Users, Activity, Calendar, Camera, Home } from 'lucide-react';
import { useOptimizedNavigation } from '../common/NavigationHelper';

const NavItem = ({ page, icon: Icon, label, isActive, onClick }) => {
  const { navigateTo } = useOptimizedNavigation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigateTo(page);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-200 ${
        isActive ? 'text-white bg-gradient-to-t from-orange-500 to-orange-400' : 'text-gray-600 hover:text-orange-500'
      }`}
    >
      <Icon className="h-5 w-5 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default function InstructorBottomNavBar({ activePage }) {
  const { navigateTo } = useOptimizedNavigation();

  const handleHomeClick = () => {
    navigateTo('Index');
  };

  const navItems = [
    { icon: Home, label: 'Início', page: 'Index', onClick: handleHomeClick },
    { page: 'InstructorStudents', icon: Users, label: 'Alunos', page: 'InstructorStudents' },
    { page: 'InstructorWorkouts', icon: Activity, label: 'Treinos', page: 'InstructorWorkouts' },
    { page: 'Schedule', icon: Calendar, label: 'Horários', page: 'Schedule' },
    { page: 'Timeline', icon: Camera, label: 'Timeline', page: 'Timeline' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-orange-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:hidden z-50">
      <div className="flex justify-around items-stretch h-full">
        {navItems.map((item, index) => (
          <NavItem 
            key={item.label}
            page={item.page}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.page}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
}