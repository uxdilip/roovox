'use client';

import { useEffect } from 'react';

/**
 * Component to register the Firebase service worker globally
 * This ensures the service worker is loaded and ready to receive background messages
 */
export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🔧 [SW Registration] Registering Firebase service worker...');
          
          // Check if service worker is already registered
          const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          
          if (existingRegistration) {
            console.log('✅ [SW Registration] Service worker already registered:', existingRegistration.scope);
            
            // Force update to get latest version
            await existingRegistration.update();
            console.log('🔄 [SW Registration] Forced update for existing service worker');
            
            // Ensure it's active
            if (existingRegistration.active) {
              console.log('✅ [SW Registration] Service worker is active');
              
              // Test communication after a short delay
              setTimeout(() => {
                console.log('🧪 [SW Registration] Testing communication with service worker...');
                existingRegistration.active?.postMessage({
                  type: 'TEST_MESSAGE',
                  source: 'ServiceWorkerRegistration'
                });
              }, 2000);
              
            } else if (existingRegistration.installing) {
              console.log('⏳ [SW Registration] Service worker is installing...');
            } else if (existingRegistration.waiting) {
              console.log('⏳ [SW Registration] Service worker is waiting...');
              // Activate waiting service worker
              existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            return existingRegistration;
          }

          // Register new service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Don't cache the service worker
          });

          console.log('✅ [SW Registration] Service worker registered successfully:', registration.scope);

          // Force update check
          await registration.update();
          console.log('🔄 [SW Registration] Forced service worker update check');

          // Force refresh of any waiting service worker
          if (registration.waiting) {
            const waitingSW = registration.waiting;
            waitingSW.postMessage({ type: 'SKIP_WAITING' });
            await new Promise(resolve => {
              const handleStateChange = () => {
                if (waitingSW.state === 'activated') {
                  waitingSW.removeEventListener('statechange', handleStateChange);
                  resolve(true);
                }
              };
              waitingSW.addEventListener('statechange', handleStateChange);
            });
          }

          // Listen for service worker state changes
          if (registration.installing) {
            console.log('⏳ [SW Registration] Service worker installing...');
            registration.installing.addEventListener('statechange', (e) => {
              const sw = e.target as ServiceWorker;
              console.log('🔄 [SW Registration] State changed to:', sw.state);
            });
          }

          if (registration.waiting) {
            console.log('⏳ [SW Registration] Service worker waiting...');
          }

          if (registration.active) {
            console.log('✅ [SW Registration] Service worker active, state:', registration.active.state);
            
            // Test communication with the service worker
            setTimeout(() => {
              console.log('🧪 [SW Registration] Testing communication with service worker...');
              registration.active?.postMessage({
                type: 'TEST_MESSAGE',
                source: 'ServiceWorkerRegistration'
              });
            }, 2000);
          }

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('✅ [SW Registration] Service worker is ready');

          return registration;
        } catch (error) {
          console.error('❌ [SW Registration] Failed to register service worker:', error);
        }
      } else {
        console.warn('⚠️ [SW Registration] Service workers are not supported in this browser');
      }
    };

    // Register immediately when component mounts
    registerServiceWorker();

    // Add a periodic check to ensure SW is still active
    const swCheckInterval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (registration && registration.active) {
          console.log('🔄 [SW Registration] Periodic check: SW still active');
        } else {
          console.warn('⚠️ [SW Registration] Periodic check: SW not active, re-registering...');
          await registerServiceWorker();
        }
      } catch (error) {
        console.error('❌ [SW Registration] Periodic check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    // Also listen for service worker updates
    if ('serviceWorker' in navigator) {
      // Also listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 [SW Registration] Service worker controller changed');
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 [SW Registration] Received message from service worker:', event.data);
      });
      
      // Check for service worker errors
      navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('❌ [SW Registration] Service worker error:', event);
      });
    }
    return () => {
      if (swCheckInterval) {
        clearInterval(swCheckInterval);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
};
