// const { Server } = require('socket.io');
// const { verifyToken } = require('./utils/jwt');
// const modelUser = require('./models/users.model');
// const Conversation = require('./models/conversation.model');
// require('dotenv').config();

// let io;
// const connectedUsers = new Map();

// async function initSocket(server) {
//     io = new Server(server, {
//         cors: {
//             origin: process.env.URL_CLIENT,
//             credentials: true,
//         },
//     });

//     const emitToUser = (userId, event, data) => {
//         const socketId = connectedUsers.get(userId.toString());
//         if (socketId) {
//             io.to(socketId).emit(event, data);
//         }
//     };

//     io.on('connection', async (socket) => {
//         console.log('A user connected:', socket.id);

//         try {
//             const cookieHeader = socket.handshake.headers.cookie;
//             if (!cookieHeader) {
//                 socket.disconnect();
//                 return;
//             }

//             const tokenCookie = cookieHeader
//                 .split(';')
//                 .map((c) => c.trim())
//                 .find((c) => c.startsWith('token='));

//             if (!tokenCookie) {
//                 socket.disconnect();
//                 return;
//             }

//             const token = tokenCookie.split('=')[1];
//             const { id } = await verifyToken(token); // <-- có thể throw error
//             socket.userId = id;

//             connectedUsers.set(socket.userId, socket.id);

//             if (socket.userId) {
//                 await modelUser.findByIdAndUpdate(socket.userId, { isOnline: true });
//             }

//             socket.on('userConnected', async (userId) => {
//                 console.log(`User ${userId} connected with socket ID: ${socket.id}`);
//             });

//             socket.on('disconnect', async () => {
//                 if (socket.userId) {
//                     connectedUsers.delete(socket.userId);
//                     await modelUser.findByIdAndUpdate(socket.userId, { isOnline: false });
//                 }
//                 console.log('User disconnected:', socket.id);
//             });
//         } catch (error) {
//             console.error('❌ Lỗi xác thực token:', error.message);
//             socket.disconnect();
//         }
//     });

//     return io;
// }

// function getIO() {
//     if (!io) throw new Error('Socket.io chưa được khởi tạo!');
//     return io;
// }

// module.exports = { initSocket, getIO, connectedUsers };
const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');
const modelUser = require('./models/users.model');
require('dotenv').config();

let io;
const connectedUsers = new Map();

async function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.URL_CLIENT,
            credentials: true,
        },
    });

    // Hàm emit cho 1 user cụ thể (có thể dùng trong socketService)
    const emitToUser = (userId, event, data) => {
        const socketId = connectedUsers.get(userId.toString());
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    };

    io.on('connection', async (socket) => {
        console.log('A user connected:', socket.id);

        try {
            const cookieHeader = socket.handshake.headers.cookie;
            if (!cookieHeader) {
                console.log('❌ No cookie in socket handshake');
                socket.disconnect();
                return;
            }

            const tokenCookie = cookieHeader
                .split(';')
                .map((c) => c.trim())
                .find((c) => c.startsWith('token='));

            if (!tokenCookie) {
                console.log('❌ No token cookie');
                socket.disconnect();
                return;
            }

            // Giải mã token (tránh trường hợp bị encode)
            const rawToken = tokenCookie.split('=')[1];
            const token = decodeURIComponent(rawToken);

            const { id } = await verifyToken(token);
            if (!id) {
                console.log('❌ Invalid token payload');
                socket.disconnect();
                return;
            }

            const userId = id.toString();
            socket.userId = userId;

            // Lưu map userId -> socketId
            connectedUsers.set(userId, socket.id);

            // 👉 CẬP NHẬT ONLINE + BROADCAST
            await modelUser.findByIdAndUpdate(userId, { isOnline: true });

            // 🔴 THÊM DÒNG NÀY: báo cho tất cả client biết user online
            io.emit('user_status_change', {
                userId,
                isOnline: true,
            });

            socket.on('userConnected', async (uid) => {
                console.log(`User ${uid} connected with socket ID: ${socket.id}`);
            });

            socket.on('disconnect', async () => {
                console.log('User disconnected:', socket.id);

                if (socket.userId) {
                    const uid = socket.userId.toString();
                    connectedUsers.delete(uid);

                    await modelUser.findByIdAndUpdate(uid, { isOnline: false });

                    // 🔴 THÊM DÒNG NÀY: báo cho tất cả client biết user offline
                    io.emit('user_status_change', {
                        userId: uid,
                        isOnline: false,
                    });
                }
            });
        } catch (error) {
            console.error('❌ Lỗi xác thực token socket:', error.message);
            socket.disconnect();
        }
    });

    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io chưa được khởi tạo!');
    return io;
}

module.exports = { initSocket, getIO, connectedUsers };
