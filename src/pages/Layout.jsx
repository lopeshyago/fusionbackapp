

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importando useNavigate
import { Home, Bell, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import BottomNavBar from "@/components/student/BottomNavBar";
import InstructorBottomNavBar from "@/components/instructor/InstructorBottomNavBar";
// Removed AdminBottomNavBar import as it will no longer be used
import OfflineManager from "@/components/common/OfflineManager";
import { OfflineDataPreloader } from "@/components/common/OfflineDataManager";
import { User } from '@/api/entities_new';
import { useOptimizedNavigation, NavigationLoader } from '@/components/common/NavigationHelper';

const logoUrl = "/fusionlogo.png";

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const { navigateTo } = useOptimizedNavigation();
  const navigate = useNavigate(); // Usando o hook do react-router-dom diretamente

  useEffect(() => {
    // Limpeza de manifestos antigos
    const existingManifests = document.querySelectorAll('link[rel="manifest"]');
    existingManifests.forEach(link => link.remove());
    
    // ADICIONAR O MANIFEST CORRIGIDO
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/components/pwa/manifest.webmanifest'; // Corrected manifest path
    document.head.appendChild(manifestLink);

    // Registra o Service Worker para PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/components/pwa/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }

    // Detectar quando a navegação está acontecendo
    const handleNavigationStart = () => setIsNavigating(true);
    const handleNavigationEnd = () => setIsNavigating(false);

    window.addEventListener('beforeunload', handleNavigationStart);
    
    // Detectar mudanças de rota usando PerformanceObserver
    // This observer will only fire for full page navigations, not typical SPA route changes.
    // For SPA route changes initiated by `navigateTo`, the `NavigationLoader` might be managed internally by `useOptimizedNavigation`
    // or by custom logic around `navigateTo` calls if specific loading states are desired for SPA routes.
    // As per the outline, we set `isNavigating` in Layout based on these general navigation events.
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          // A small delay to allow the next page to start rendering before hiding the loader
          setTimeout(handleNavigationEnd, 200); 
        }
      }
    });
    observer.observe({ entryTypes: ['navigation'] });

    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();

    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('beforeunload', handleNavigationStart);
      if (observer) {
        observer.disconnect();
      }
      // Limpar o link do manifest se o layout for desmontado
      // Check if manifestLink is still a child of document.head before trying to remove it
      if (document.head.contains(manifestLink)) {
        document.head.removeChild(manifestLink);
      }
    }
  }, [currentPageName]);

  const isIndexPage = currentPageName === 'Index';
  const isStudent = currentUser?.user_type === 'student';
  const isInstructor = currentUser?.user_type === 'instructor';
  const isAdmin = currentUser?.user_type === 'admin';

  // Páginas que devem ter cabeçalho
  const pagesWithHeader = [
    "StudentSchedule", "StudentWorkouts", "StudentCheckin", "ChatList", "Notices",
    "Planning", "Schedule", "InstructorStudents", "InstructorWorkouts", "InstructorAttendance",
    "AdminCondominiums", "AdminTeam", "AdminSchedule", "AdminReports", "AdminUsers",
    "StudentDetail", "StudentProfile", "Parq", "MedicalCertificate",
    "StudentEvolution", "InstructorAssessments", "ChatRoom", "InstructorAssignWorkout",
    "InstructorMaintenance", "AdminMaintenance", "Timeline"
  ];

  // Páginas que NÃO devem ter a barra de navegação inferior
  const pagesWithoutBottomNav = [
    "Index", 
    "InstructorRegistration", 
    "StudentSetup",
    "StudentCheckin",
    "Planning",
    "InstructorAttendance",
    "AdminCondominiums",
    "AdminSchedule",
    "StudentDetail",
    "Parq",
    "MedicalCertificate",
    "InstructorAssessments",
    "ChatRoom",
    "InstructorAssignWorkout",
    "InstructorMaintenance",
  ];
  
  const showHeader = pagesWithHeader.includes(currentPageName);
  const showBottomNav = !pagesWithoutBottomNav.includes(currentPageName) && !isLoadingUser && currentUser;

  return (
    <OfflineManager>
      <OfflineDataPreloader>
        <NavigationLoader isLoading={isNavigating} />
        <div className={`min-h-screen bg-white font-sans antialiased ${showBottomNav ? 'pb-24' : ''}`}>
          <style>
            {`
              :root {
                --primary: 22 100% 60%;
                --primary-foreground: 0 0% 100%;
                --secondary: 22 50% 95%;
                --secondary-foreground: 22 100% 40%;
                --muted: 0 0% 96%;
                --muted-foreground: 0 0% 45%;
                --accent: 22 80% 55%;
                --accent-foreground: 0 0% 100%;
                --destructive: 0 84% 60%;
                --destructive-foreground: 0 0% 100%;
                --border: 0 0% 90%;
                --input: 0 0% 90%;
                --ring: 22 100% 60%;
                --background: 0 0% 100%;
                --foreground: 0 0% 10%;
                --card: 0 0% 100%;
                --card-foreground: 0 0% 10%;
                --popover: 0 0% 100%;
                --popover-foreground: 0 0% 10%;
                --radius: 0.75rem;
              }
              
              .fusion-gradient {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
              }
              
              .fusion-text-gradient {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
              
              .fusion-orange { 
                background-color: #FF6B35; 
              }
              
              .fusion-orange-light { 
                background-color: #FFF5F2; 
              }
              
              .fusion-shadow {
                box-shadow: 0 10px 40px rgba(255, 107, 53, 0.1);
              }
              
              .glass-effect {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 107, 53, 0.1);
              }

              /* Melhorias de acessibilidade */
              .focus-visible {
                outline: 2px solid #FF6B35;
                outline-offset: 2px;
              }

              /* Animações suaves */
              * {
                transition: color 0.2s, background-color 0.2s, border-color 0.2s;
              }

              /* Otimizações para Mobile Touch */
              * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }

              /* Permitir seleção de texto onde necessário */
              input, textarea, [contenteditable] {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
              }

              /* Melhorar scroll em dispositivos móveis */
              html, body {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
              }
              
              /* FIX: Forçar scroll por toque em dropdowns (Select) no mobile */
              [data-radix-select-viewport] {
                -webkit-overflow-scrolling: touch;
              }

              /* Melhorar scroll em containers específicos */
              .scroll-container {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                transform: translateZ(0);
                will-change: scroll-position;
              }

              /* Otimizar área de toque para botões pequenos */
              button, .btn, [role="button"] {
                min-height: 44px;
                min-width: 44px;
                touch-action: manipulation;
              }

              /* Otimizar listas longas */
              .exercise-list, .workout-list, .student-list {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                transform: translateZ(0);
                will-change: scroll-position;
              }

              /* Melhorar performance de scroll em modais */
              .modal-content {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                max-height: 90vh;
                overflow-y: auto;
              }

              /* Otimizar elementos interativos */
              .interactive-element {
                touch-action: manipulation;
                -webkit-tap-highlight-color: rgba(255, 107, 53, 0.2);
              }
            `}
          </style>
          
          {showHeader && (
            <header className="sticky top-0 z-40 w-full bg-black shadow-xl">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <button
                  onClick={() => navigateTo('Index')}
                  className="flex items-center gap-3 focus-visible hover:opacity-80 transition-opacity"
                >
                  <img src="/fusionlogo.png" alt="Fusion Logo" className="h-8 w-auto" />
                </button>
                
                {/* Botão de Voltar para a página ANTERIOR. Simples. */}
                <button 
                  onClick={() => window.history.back()} 
                  className="text-gray-300 hover:text-white hover:bg-white/10 transition-all focus-visible font-medium text-sm flex items-center px-3 py-1.5 rounded-md"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </button>
              </div>
            </header>
          )}
          
          <main className="bg-white min-h-screen">{children}</main>
          
          {/* Bottom Navigation - só aparece quando apropriado */}
          {showBottomNav && (
            <>
              {isStudent && <BottomNavBar activePage={currentPageName} />}
              {(isInstructor || isAdmin) && <InstructorBottomNavBar activePage={currentPageName} />}
            </>
          )}
        </div>
      </OfflineDataPreloader>
    </OfflineManager>
  );
}

