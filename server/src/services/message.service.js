// const Message = require('../models/message.model');
// const Conversation = require('../models/conversation.model');

// const socketService = require('../utils/socket.service');

// class MessageService {
//     async createMessage(conversationId, senderId, content) {
//         const message = new Message({
//             conversation: conversationId,
//             sender: senderId,
//             content,
//         });
//         await message.save();
//         await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

//         const conversation = await Conversation.findById(conversationId);
//         let userId;
//         if (conversation.user._id.toString() === senderId.toString()) {
//             userId = conversation.admin._id;
//         } else {
//             userId = conversation.user._id;
//         }
//         socketService.emitMessage(userId, 'new_message', message);

//         return message;
//     }

//     async updateMessageIsRead(conversationId, sender) {
//         const messages = await Message.find({
//             conversation: conversationId,
//             isRead: false,
//             sender: sender,
//         });

//         for (const message of messages) {
//             await Message.findByIdAndUpdate(message._id, { isRead: true });
//         }
//         return messages;
//     }
// }

// module.exports = new MessageService();
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');

const socketService = require('../utils/socket.service');

class MessageService {
    async createMessage(conversationId, senderId, content) {
        // 1. Tạo message mới
        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            content,
        });

        // 2. Cập nhật conversation:
        //    - lastMessage: tin nhắn cuối
        //    - updatedAt: để sort mới nhất lên đầu
        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                lastMessage: message._id,
                updatedAt: Date.now(), // ⭐ rất quan trọng cho .sort({ updatedAt: -1 })
            },
        );

        // 3. Lấy lại conversation để xác định người nhận
        //    Ở đây user và admin là ObjectId (không có ._id)
        const conversation = await Conversation.findById(conversationId).select('user admin');

        if (!conversation) {
            console.warn('Conversation not found for id:', conversationId);
            return message;
        }

        const userIdInConv = conversation.user.toString();
        const adminIdInConv = conversation.admin.toString();
        const senderStr = senderId.toString();

        // Nếu người gửi là user thì người nhận là admin, và ngược lại
        let receiverId;
        if (userIdInConv === senderStr) {
            receiverId = adminIdInConv;
        } else {
            receiverId = userIdInConv;
        }

        // 4. Emit socket cho phía nhận
        //    FE sẽ nhận event 'new_message' với payload là message (có cả conversation)
        socketService.emitMessage(receiverId, 'new_message', message);

        // 5. Trả về cho controller
        return message;
    }

    async updateMessageIsRead(conversationId, sender) {
        const messages = await Message.find({
            conversation: conversationId,
            isRead: false,
            sender: sender,
        });

        for (const message of messages) {
            await Message.findByIdAndUpdate(message._id, { isRead: true });
        }
        return messages;
    }
}

module.exports = new MessageService();
