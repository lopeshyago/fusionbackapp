
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Toast } from '@/components/ui/toast';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

class CacheManager {
  static CACHE_KEYS = {
    USER_PROFILE: 'user_profile',
    SCHEDULE: 'schedule_data', 
    ACTIVITIES: 'activities',
    CONDOMINIUMS: 'condominiums',
    WORKOUTS: 'user_workouts',
    NOTICES: 'notices',
    LAST_SYNC: 'last_sync'
  };

  static CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes  
    LONG: 24 * 60 * 60 * 1000, // 24 hours
  };

  static set(key, data, duration = this.CACHE_DURATION.MEDIUM) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + duration
      };
      localStorage.setItem(`fusion_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  static get(key) {
    try {
      const cached = localStorage.getItem(`fusion_cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() > cacheData.expires) {
        this.delete(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  static delete(key) {
    try {
      localStorage.removeItem(`fusion_cache_${key}`);
    } catch (error) {
      console.warn('Failed to delete cached data:', error);
    }
  }

  static clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fusion_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static getSize() {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fusion_cache_')) {
          size += localStorage.getItem(key).length;
        }
      });
      return (size / 1024).toFixed(2) + ' KB';
    } catch {
      return '0 KB';
    }
  }
}

class SyncQueue {
  static QUEUE_KEY = 'fusion_sync_queue';

  static add(action) {
    try {
      const queue = this.getQueue();
      queue.push({
        id: Date.now() + Math.random(),
        action,
        timestamp: Date.now(),
        retries: 0
      });
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to add to sync queue:', error);
    }
  }

  static getQueue() {
    try {
      const queue = localStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  static async processQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const processedItems = [];
    
    for (const item of queue) {
      try {
        await this.executeAction(item.action);
        processedItems.push(item.id);
      } catch (error) {
        console.warn('Failed to sync item:', error);
        // Increment retry count
        item.retries = (item.retries || 0) + 1;
        // Remove item if too many retries
        if (item.retries > 3) {
          processedItems.push(item.id);
        }
      }
    }

    // Remove processed items
    const remainingQueue = queue.filter(item => !processedItems.includes(item.id));
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
    
    return processedItems.length;
  }

  static async executeAction(action) {
    const { type, data } = action;
    
    switch (type) {
      case 'CHECKIN':
        const { Booking } = await import('@/api/entities');
        return await Booking.create(data);
      case 'UPDATE_PROFILE':
        const { User } = await import('@/api/entities');
        return await User.updateMyUserData(data);
      case 'CREATE_MESSAGE':
        const { Message } = await import('@/api/entities');
        return await Message.create(data);
      default:
        throw new Error('Unknown action type');
    }
  }

  static clear() {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  static getCount() {
    return this.getQueue().length;
  }
}

const OfflineStatus = ({ isOnline, pendingSync, onSync }) => {
  if (isOnline && pendingSync === 0) return null;

  return (
    <div className={`fixed top-16 left-0 right-0 z-50 p-3 text-center text-white ${
      isOnline ? 'bg-orange-500' : 'bg-red-500'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isOnline 
            ? `Online - ${pendingSync} ações pendentes`
            : 'Modo Offline - Dados limitados disponíveis'
          }
        </span>
        {isOnline && pendingSync > 0 && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onSync}
            className="text-white hover:bg-white/20 ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Sincronizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default function OfflineManager({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  const processOfflineQueue = useCallback(async () => {
    if (!isOnline) return;

    try {
      const processedCount = await SyncQueue.processQueue();
      if (processedCount > 0) {
        setPendingSync(SyncQueue.getCount());
        CacheManager.set(CacheManager.CACHE_KEYS.LAST_SYNC, Date.now(), CacheManager.CACHE_DURATION.LONG);
        setLastSync(Date.now());
      }
    } catch (error) {
      console.warn('Sync failed:', error);
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(processOfflineQueue, 1000); // Delay to ensure connection is stable
    };

    const handleOffline = () => setIsOnline(false);

    const updateSyncCount = () => {
      setPendingSync(SyncQueue.getCount());
    };

    const loadLastSync = () => {
      const lastSyncTime = CacheManager.get(CacheManager.CACHE_KEYS.LAST_SYNC);
      setLastSync(lastSyncTime);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    updateSyncCount();
    loadLastSync();

    // Update sync count periodically
    const interval = setInterval(updateSyncCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [processOfflineQueue]);

  const contextValue = {
    isOnline,
    pendingSync,
    cache: CacheManager,
    syncQueue: SyncQueue,
    lastSync,
    sync: processOfflineQueue
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      <OfflineStatus 
        isOnline={isOnline} 
        pendingSync={pendingSync} 
        onSync={processOfflineQueue}
      />
      {children}
    </OfflineContext.Provider>
  );
}

export { CacheManager, SyncQueue };
