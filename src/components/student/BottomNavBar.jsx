import React from 'react';
import { Home, Calendar, Activity, User as UserIcon, Camera } from 'lucide-react';
import { User } from '@/api/entities_new';
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

export default function BottomNavBar({ activePage }) {
  const { navigateTo } = useOptimizedNavigation();

  const handleHomeClick = () => {
    if (
      activePage === 'Index' ||
      window.location.pathname === '/' ||
      window.location.pathname === '/Index'
    ) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigateTo('Index');
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      navigateTo('Index', {}, true);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const navItems = [
    { icon: Home, label: 'Início', page: 'Index', onClick: handleHomeClick },
    { icon: Camera, label: 'Timeline', page: 'Timeline' },
    { icon: Activity, label: 'Meu Treino', page: 'StudentWorkouts' },
    { icon: Calendar, label: 'Horários', page: 'StudentSchedule' },
    { icon: UserIcon, label: 'Perfil', page: 'StudentProfile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-orange-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:hidden z-50">
      <div className="flex justify-around items-stretch h-full">
        {navItems.map((item) => (
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

