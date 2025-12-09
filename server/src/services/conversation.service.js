// const { BadRequestError } = require('../core/error.response');
// const Conversation = require('../models/conversation.model');
// const User = require('../models/users.model');
// const Message = require('../models/message.model');

// const socketService = require('../utils/socket.service');

// class ConversationService {
//     async createConversation(userId) {
//         const findAdmin = await User.findOne({ isAdmin: true });
//         const conversation = await Conversation.findOne({ user: userId, admin: findAdmin._id });
//         if (!conversation) {
//             conversation = await Conversation.create({ user: userId, admin: findAdmin._id });
//         }
//         socketService.emitNewUserMessage(findAdmin._id, 'new_conversation', conversation);

//         return conversation;
//     }

//     async getAllConversation() {
//         const conversations = await Conversation.find().populate('user').populate('lastMessage', 'content');

//         for (const conversation of conversations) {
//             const lengthIsRead = await Message.find({
//                 conversation: conversation._id,
//                 isRead: false,
//                 sender: conversation.user,
//             }).countDocuments();
//             conversation.lengthIsRead = lengthIsRead;
//         }

//         return conversations;
//     }

//     async getConversationByUserId(userId) {
//         // Tìm conversation có sẵn
//         let conversation = await Conversation.findOne({ user: userId }).populate('admin user', 'name email role');

//         // Nếu chưa có, tạo mới
//         if (!conversation) {
//             const findAdmin = await User.findOne({ isAdmin: true });

//             if (!findAdmin) {
//                 throw new BadRequestError('Không tìm thấy admin trong hệ thống');
//             }

//             // Nếu chính user là admin thì không tạo conversation
//             if (findAdmin._id.toString() === userId.toString()) {
//                 return null;
//             }

//             conversation = await Conversation.create({
//                 user: userId,
//                 admin: findAdmin._id,
//             });
//         }

//         return conversation;
//     }

//     async getMessageByConversationId(conversationId) {
//         const conversation = await Conversation.findById(conversationId)
//             .populate('user', 'name email role')
//             .populate('admin', 'name email role');

//         const messages = await Message.find({ conversation: conversationId })
//             .populate('sender', 'name role')
//             .sort({ createdAt: 1 });

//         return {
//             conversation,
//             messages,
//         };
//     }
// }

// module.exports = new ConversationService();
const { BadRequestError } = require('../core/error.response');
const Conversation = require('../models/conversation.model');
const User = require('../models/users.model');
const Message = require('../models/message.model');

const socketService = require('../utils/socket.service');

class ConversationService {
    async createConversation(userId) {
        // Tìm admin bất kỳ
        const findAdmin = await User.findOne({ isAdmin: true });

        if (!findAdmin) {
            throw new BadRequestError('Không tìm thấy admin trong hệ thống');
        }

        // Nếu chính user là admin thì không tạo conversation
        if (findAdmin._id.toString() === userId.toString()) {
            return null;
        }

        // Tìm cuộc trò chuyện giữa user này và admin
        let conversation = await Conversation.findOne({
            user: userId,
            admin: findAdmin._id,
        });

        // Nếu chưa có thì tạo mới
        if (!conversation) {
            conversation = await Conversation.create({
                user: userId,
                admin: findAdmin._id,
            });
        }

        // Thông báo cho admin có conversation mới
        socketService.emitNewUserMessage(findAdmin._id, 'new_conversation', conversation);

        return conversation;
    }

    async getAllConversation() {
        // Lấy tất cả conversation, sort theo updatedAt mới nhất trước
        const conversations = await Conversation.find()
            .sort({ updatedAt: -1 }) // ⭐ cuộc nào có tin mới sẽ đứng lên đầu
            .populate('user')
            .populate('lastMessage', 'content');

        // Tính số tin nhắn chưa đọc của mỗi conversation
        for (const conversation of conversations) {
            const lengthIsRead = await Message.find({
                conversation: conversation._id,
                isRead: false,
                sender: conversation.user._id || conversation.user, // user sau populate hoặc ObjectId
            }).countDocuments();

            // Gán thêm field vào object trả về (không ghi DB)
            conversation.lengthIsRead = lengthIsRead;
        }

        return conversations;
    }

    async getConversationByUserId(userId) {
        // Tìm conversation có sẵn
        let conversation = await Conversation.findOne({ user: userId }).populate(
            'admin user',
            'name email role',
        );

        // Nếu chưa có, tạo mới
        if (!conversation) {
            const findAdmin = await User.findOne({ isAdmin: true });

            if (!findAdmin) {
                throw new BadRequestError('Không tìm thấy admin trong hệ thống');
            }

            // Nếu chính user là admin thì không tạo conversation
            if (findAdmin._id.toString() === userId.toString()) {
                return null;
            }

            conversation = await Conversation.create({
                user: userId,
                admin: findAdmin._id,
            });
        }

        return conversation;
    }

    async getMessageByConversationId(conversationId) {
        const conversation = await Conversation.findById(conversationId)
            .populate('user', 'name email role')
            .populate('admin', 'name email role');

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });

        return {
            conversation,
            messages,
        };
    }
}

module.exports = new ConversationService();
