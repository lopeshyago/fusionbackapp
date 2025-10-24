
import { useEffect } from 'react';
import { useOffline } from './OfflineManager';
import { 
  User, 
  LessonPlan, 
  Activity, 
  Condominium 
} from "@/api/entities";
import { Notice } from '@/api/entities';
import { Workout } from '@/api/entities';

// Hook para gerenciar dados offline de forma inteligente
export const useOfflineData = (entityName, fetchFunction, dependencies = [], cacheKey = null) => {
  const { isOnline, cache } = useOffline();
  const key = cacheKey || entityName.toLowerCase();

  const fetchData = async (forceRefresh = false) => {
    try {
      // Se estiver offline, retorna dados do cache
      if (!isOnline) {
        const cachedData = cache.get(key);
        return cachedData || [];
      }

      // Se estiver online, verifica se precisa atualizar o cache
      const cachedData = cache.get(key);
      if (cachedData && !forceRefresh) {
        // Tentar atualizar em background
        fetchFunction().then(freshData => {
          cache.set(key, freshData, cache.CACHE_DURATION.MEDIUM);
        }).catch(error => {
          console.warn('Background refresh failed:', error);
        });
        return cachedData;
      }

      // Buscar dados frescos
      const freshData = await fetchFunction();
      cache.set(key, freshData, cache.CACHE_DURATION.MEDIUM);
      return freshData;
    } catch (error) {
      console.warn('Data fetch failed, trying cache:', error);
      const cachedData = cache.get(key);
      if (cachedData) return cachedData;
      throw error;
    }
  };

  return { fetchData, isOffline: !isOnline };
};

// Hook especializado para dados do usuário
export const useOfflineUser = () => {
  const { isOnline, cache, syncQueue } = useOffline(); // Modified: syncQueue is now destructured here

  const getUser = async () => {
    if (!isOnline) {
      return cache.get(cache.CACHE_KEYS.USER_PROFILE);
    }

    try {
      const user = await User.me();
      cache.set(cache.CACHE_KEYS.USER_PROFILE, user, cache.CACHE_DURATION.LONG);
      return user;
    } catch (error) {
      const cachedUser = cache.get(cache.CACHE_KEYS.USER_PROFILE);
      if (cachedUser) return cachedUser;
      throw error;
    }
  };

  const updateUser = async (data) => {
    if (!isOnline) {
      // Adicionar à fila de sincronização
      // Removed: const { syncQueue } = useOffline(); - now uses the syncQueue from the hook's scope
      syncQueue.add({
        type: 'UPDATE_PROFILE',
        data
      });
      
      // Atualizar cache local
      const cachedUser = cache.get(cache.CACHE_KEYS.USER_PROFILE);
      if (cachedUser) {
        const updatedUser = { ...cachedUser, ...data };
        cache.set(cache.CACHE_KEYS.USER_PROFILE, updatedUser, cache.CACHE_DURATION.LONG);
        return updatedUser;
      }
      return data;
    }

    const updatedUser = await User.updateMyUserData(data);
    cache.set(cache.CACHE_KEYS.USER_PROFILE, updatedUser, cache.CACHE_DURATION.LONG);
    return updatedUser;
  };

  return { getUser, updateUser, isOffline: !isOnline };
};

// Hook para dados de horários (crítico para funcionar offline)
export const useOfflineSchedule = (condominiumId) => {
  const { isOnline, cache } = useOffline();
  const cacheKey = `${cache.CACHE_KEYS.SCHEDULE}_${condominiumId}`;

  const getSchedule = async () => {
    if (!isOnline) {
      return cache.get(cacheKey) || [];
    }

    try {
      const lessonPlans = await LessonPlan.filter({ condominium_id: condominiumId });
      cache.set(cacheKey, lessonPlans, cache.CACHE_DURATION.MEDIUM);
      return lessonPlans;
    } catch (error) {
      const cachedSchedule = cache.get(cacheKey);
      if (cachedSchedule) return cachedSchedule;
      throw error;
    }
  };

  return { getSchedule, isOffline: !isOnline };
};

// Hook para check-ins offline
export const useOfflineCheckin = () => {
  const { isOnline, syncQueue } = useOffline();

  const doCheckin = async (lessonPlanId, userId) => {
    const checkinData = {
      user_id: userId,
      lesson_plan_id: lessonPlanId,
      status: "presente"
    };

    if (!isOnline) {
      // Adicionar à fila de sincronização
      syncQueue.add({
        type: 'CHECKIN',
        data: checkinData
      });
      return { success: true, offline: true };
    }

    try {
      const { Booking } = await import('@/api/entities');
      const result = await Booking.create(checkinData);
      return { success: true, offline: false, data: result };
    } catch (error) {
      // Se falhou online, adicionar à fila
      syncQueue.add({
        type: 'CHECKIN',
        data: checkinData
      });
      return { success: true, offline: true, error: error.message };
    }
  };

  return { doCheckin, isOffline: !isOnline };
};

// Componente para pré-carregar dados críticos
export const OfflineDataPreloader = ({ children }) => {
  const { isOnline, cache } = useOffline();

  useEffect(() => {
    if (!isOnline) return;

    const preloadCriticalData = async () => {
      try {
        // Precarregar dados do usuário
        const user = await User.me();
        cache.set(cache.CACHE_KEYS.USER_PROFILE, user, cache.CACHE_DURATION.LONG);

        // Precarregar atividades
        const activities = await Activity.list();
        cache.set(cache.CACHE_KEYS.ACTIVITIES, activities, cache.CACHE_DURATION.LONG);

        // Precarregar condomínios
        const condominiums = await Condominium.list();
        cache.set(cache.CACHE_KEYS.CONDOMINIUMS, condominiums, cache.CACHE_DURATION.LONG);

        // Precarregar horários se usuário tem condomínio
        if (user.condominium_id) {
          const schedule = await LessonPlan.filter({ condominium_id: user.condominium_id });
          cache.set(`${cache.CACHE_KEYS.SCHEDULE}_${user.condominium_id}`, schedule, cache.CACHE_DURATION.MEDIUM);
        }

        // Precarregar avisos ativos
        const notices = await Notice.filter({ is_active: true });
        cache.set(cache.CACHE_KEYS.NOTICES, notices, cache.CACHE_DURATION.SHORT);

        // Precarregar treinos do usuário se for aluno
        if (user.user_type === 'student') {
          const workouts = await Workout.filter({ student_id: user.id });
          cache.set(`${cache.CACHE_KEYS.WORKOUTS}_${user.id}`, workouts, cache.CACHE_DURATION.MEDIUM);
        }

      } catch (error) {
        console.warn('Failed to preload critical data:', error);
      }
    };

    // Precarregar dados quando ficar online
    preloadCriticalData();
  }, [isOnline, cache]);

  return children;
};
