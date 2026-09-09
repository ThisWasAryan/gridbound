const listeners = {};

export const EventBus = {
    /**
     * Subscribe to an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
    },

    /**
     * Unsubscribe from an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Emit an event.
     * @param {string} event 
     * @param {any} payload 
     */
    emit(event, payload) {
        if (!listeners[event]) return;
        listeners[event].forEach(callback => {
            try {
                callback(payload);
            } catch (e) {
                console.error(`Error in event listener for ${event}:`, e);
            }
        });
    }
};
