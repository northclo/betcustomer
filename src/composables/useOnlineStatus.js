import { onMounted, onBeforeUnmount, watch } from 'vue';
import { socket } from '@/plugins/socket.js';
import { useRoute } from 'vue-router';

export function useOnlineStatus() {
    let intervalId = null;
    let visibilityHandler = null;
    let beforeUnloadHandler = null;
    let routeWatcher = null;
    let tokenChangeHandler = null;
    const route = useRoute();

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const sendOnlineStatus = () => {
        const token = getToken();
        if (!token) return;

        if (socket.connected) {
            socket.emit('user_online', token);
        } else {
            socket.once('connect', () => {
                socket.emit('user_online', token);
            });
        }
    };

    const sendOfflineStatus = () => {
        const token = getToken();
        if (!token) return;

        if (socket.connected) {
            socket.emit('user_offline', token);
        }
    };

    const startHeartbeat = () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            const token = getToken();
            if (token && socket.connected) {
                socket.emit('user_online', token);
            }
        }, 30000);
    };

    const stopHeartbeat = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const checkAndActivate = () => {
        const token = getToken();
        const isAuthPage = route.path.startsWith('/auth');
        
        if (!token || isAuthPage) {
            stopHeartbeat();
            return;
        }

        // Activate if socket is connected, or wait for connection
        if (socket.connected) {
            sendOnlineStatus();
            startHeartbeat();
        } else {
            socket.once('connect', () => {
                sendOnlineStatus();
                startHeartbeat();
            });
        }
    };

    onMounted(() => {

        // Set up visibility handler
        visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                checkAndActivate();
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);

        // Set up beforeunload handler
        beforeUnloadHandler = () => {
            sendOfflineStatus();
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);

        // Watch route changes
        routeWatcher = watch(
            () => route.path,
            () => {
                checkAndActivate();
            },
            { immediate: true }
        );

        // Listen for token changes (custom event from login/logout)
        tokenChangeHandler = () => {
            checkAndActivate();
        };
        window.addEventListener('token-changed', tokenChangeHandler);

        // Initial check
        checkAndActivate();
    });

    onBeforeUnmount(() => {
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
        }
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }
        if (routeWatcher) {
            routeWatcher();
        }
        if (tokenChangeHandler) {
            window.removeEventListener('token-changed', tokenChangeHandler);
        }
        stopHeartbeat();
        sendOfflineStatus();
    });

    return {
        sendOnlineStatus,
        sendOfflineStatus,
    };
}
