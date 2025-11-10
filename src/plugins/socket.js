import { io } from "socket.io-client";
// import { config } from '@/config/index.js';

// const socket = io(config.socketServerURL);
const socket = io('https://api.superball-race.com/', {
    transports: ["websocket", "polling"]
})

// const socket = io('http://localhost:5000/', {
//     transports: ["websocket", "polling"]
// })

export default {
    install: (app) => {
        app.config.globalProperties.$socket = socket; // make it globally available
    },
};

export { socket };
