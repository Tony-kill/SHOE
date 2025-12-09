// import Context from './Context';
// import CryptoJS from 'crypto-js';
// // ❌ bỏ js-cookie vì không dùng nữa
// // import cookies from 'js-cookie';
// import { io } from 'socket.io-client';

// import { useEffect, useState, useRef } from 'react';
// import { requestAuth } from '../config/UserRequest';
// import { ToastContainer } from 'react-toastify';
// import { requestGetCart } from '../config/CartRequest';
// import { requestGetConversationByUserId } from '../config/MessageRequest';

// export function Provider({ children }) {
//     const [dataUser, setDataUser] = useState({});
//     const [cartData, setCartData] = useState([]);
//     const [couponData, setCouponData] = useState([]);

//     const [dataConversation, setDataConversation] = useState();
//     const [newMessage, setNewMessage] = useState();

//     const socketRef = useRef(null);

//     const fetchConversation = async () => {
//         const res = await requestGetConversationByUserId();
//         setDataConversation(res.metadata._id);
//     };

//     useEffect(() => {
//         if (dataUser?.isAdmin === false) {
//             fetchConversation();
//         }
//     }, [dataUser]);

//     useEffect(() => {
//         if (!dataUser._id) return;

//         const socket = io(import.meta.env.VITE_API_URL, {
//             withCredentials: true,
//         });

//         socketRef.current = socket;

//         socket.on('new_message', (data) => {
//             setNewMessage(data);
//         });

//         return () => {
//             socket.disconnect();
//         };
//     }, [dataUser._id]);

//     const fetchAuth = async () => {
//         try {
//             const res = await requestAuth();
//             const bytes = CryptoJS.AES.decrypt(res.metadata, import.meta.env.VITE_SECRET_CRYPTO);
//             const originalText = bytes.toString(CryptoJS.enc.Utf8);
//             if (!originalText) {
//                 console.error('Failed to decrypt data');
//                 return;
//             }
//             const user = JSON.parse(originalText);
//             setDataUser(user);
//         } catch (error) {
//             console.error('Auth error:', error);
//         }
//     };

//     const fetchCart = async () => {
//         try {
//             const res = await requestGetCart();
//             setCartData(res.metadata.items);
//             setCouponData(res.metadata.coupon);
//         } catch (error) {
//             console.error('Error fetching cart:', error);
//         }
//     };

//     useEffect(() => {
//         // Dùng localStorage để kiểm tra trạng thái login phía FE
//         const logged = localStorage.getItem('logged');

//         if (logged !== '1') {
//             return;
//         }

//         fetchAuth();
//         fetchCart();
//     }, []);

//     return (
//         <Context.Provider
//             value={{
//                 dataUser,
//                 fetchAuth,
//                 cartData,
//                 fetchCart,
//                 couponData,
//                 dataConversation,
//                 newMessage,
//             }}
//         >
//             {children}
//             <ToastContainer />
//         </Context.Provider>
//     );
// }
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { ToastContainer } from 'react-toastify';

import Context from './Context';
import { requestAuth } from '../config/UserRequest';
import { requestGetCart } from '../config/CartRequest';
import { requestGetConversationByUserId } from '../config/MessageRequest';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [cartData, setCartData] = useState([]);
    const [couponData, setCouponData] = useState([]);

    const [dataConversation, setDataConversation] = useState(null);
    const [newMessage, setNewMessage] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({}); // userId -> true/false

    const socketRef = useRef(null);

    // Lấy hội thoại 1-1 của user thường
    const fetchConversation = async () => {
        try {
            const res = await requestGetConversationByUserId();
            setDataConversation(res.metadata._id);
        } catch (err) {
            console.error('Fetch conversation error:', err);
        }
    };

    // Lấy thông tin user từ /auth
    const fetchAuth = async () => {
        try {
            const res = await requestAuth();
            const bytes = CryptoJS.AES.decrypt(
                res.metadata,
                import.meta.env.VITE_SECRET_CRYPTO,
            );
            const originalText = bytes.toString(CryptoJS.enc.Utf8);

            if (!originalText) {
                console.error('Failed to decrypt data');
                return;
            }

            const user = JSON.parse(originalText);
            setDataUser(user);
        } catch (error) {
            console.error('Auth error:', error);
        }
    };

    // Lấy giỏ hàng
    const fetchCart = async () => {
        try {
            const res = await requestGetCart();
            setCartData(res.metadata.items || []);
            setCouponData(res.metadata.coupon || null);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    // Khi reload trang: nếu FE đang đánh dấu logged = '1' thì gọi auth + cart
    useEffect(() => {
        const logged = localStorage.getItem('logged');
        if (logged === '1') {
            fetchAuth();
            fetchCart();
        }
    }, []);

    // Nếu là user thường (isAdmin === false) thì lấy conversation 1-1
    useEffect(() => {
        if (dataUser && dataUser.isAdmin === false) {
            fetchConversation();
        }
    }, [dataUser]);

    // Kết nối socket sau khi đã biết user hiện tại
    useEffect(() => {
        if (!dataUser?._id) return;

        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
        });

        socketRef.current = socket;

        // (tuỳ chọn) báo cho server biết user đã connect
        socket.emit('userConnected', dataUser._id);

        // Nhận tin nhắn mới
        socket.on('new_message', (data) => {
            setNewMessage(data);
        });

        // Nhận thay đổi trạng thái online/offline
        socket.on('user_status_change', ({ userId, isOnline }) => {
            setOnlineUsers((prev) => ({
                ...prev,
                [userId]: isOnline,
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [dataUser?._id]);

    return (
        <Context.Provider
            value={{
                dataUser,
                fetchAuth,
                cartData,
                fetchCart,
                couponData,
                dataConversation,
                newMessage,
                onlineUsers, // dùng để hiển thị trạng thái hoạt động
                socketRef,   // nếu component khác cần dùng trực tiếp socket
            }}
        >
            {children}
            <ToastContainer />
        </Context.Provider>
    );
}
