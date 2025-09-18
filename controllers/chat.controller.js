const ChatModel = require("../models/Chat.model");
const MessageModel = require("../models/Message.model");
const SwapRequestModel = require("../models/SwapRequest.model");

// POST /api/chats - Create a new chat for an accepted swap request
exports.createChat = async (req, res) => {
    try {
        const { swapRequestId } = req.body;
        const userId = req.user.id;

        // Find the swap request
        const swapRequest = await SwapRequestModel.findById(swapRequestId);
        if (!swapRequest) {
            return res.status(404).json({ error: "Swap request not found" });
        }

        // Check if user is part of this swap request
        if (swapRequest.requester.toString() !== userId && swapRequest.recipient.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to create chat for this request" });
        }

        // Check if swap request is accepted
        if (swapRequest.status !== 1) {
            return res.status(400).json({ error: "Can only create chat for accepted swap requests" });
        }

        // Check if chat already exists
        const existingChat = await ChatModel.findOne({ swapRequest: swapRequestId });
        if (existingChat) {
            return res.status(400).json({ error: "Chat already exists for this swap request" });
        }

        // Create new chat
        const chat = new ChatModel({
            swapRequest: swapRequestId,
            participants: [swapRequest.requester, swapRequest.recipient]
        });

        await chat.save();

        // Populate the chat with user details
        await chat.populate([
            { path: 'participants', select: 'username' },
            { path: 'swapRequest', populate: [
                { path: 'requester', select: 'username' },
                { path: 'recipient', select: 'username' }
            ]}
        ]);

        res.status(201).json({
            message: "Chat created successfully",
            chat
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/chats - Get all chats for the current user
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await ChatModel.find({
            participants: userId,
            isActive: true
        })
        .populate([
            { path: 'participants', select: 'username' },
            { path: 'swapRequest', populate: [
                { path: 'requester', select: 'username' },
                { path: 'recipient', select: 'username' }
            ]}
        ])
        .sort({ lastMessageAt: -1 });

        res.json({ chats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/chats/:chatId - Get a specific chat
exports.getChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        })
        .populate([
            { path: 'participants', select: 'username' },
            { path: 'swapRequest', populate: [
                { path: 'requester', select: 'username' },
                { path: 'recipient', select: 'username' }
            ]}
        ]);

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/chats/:chatId/messages - Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, type = 'text' } = req.body;
        const userId = req.user.id;

        // Check if user is part of this chat
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Create new message
        const message = new MessageModel({
            chat: chatId,
            sender: userId,
            content,
            type
        });

        await message.save();

        // Update chat's last message timestamp
        chat.lastMessageAt = new Date();
        await chat.save();

        // Populate the message with sender details
        await message.populate('sender', 'username');

        res.status(201).json({
            message: "Message sent successfully",
            messageData: message
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/chats/:chatId/messages - Get messages for a chat
exports.getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        // Check if user is part of this chat
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Get messages with pagination
        const messages = await MessageModel.find({ chat: chatId })
            .populate('sender', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({ 
            messages: messages.reverse(), // Reverse to get chronological order
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: await MessageModel.countDocuments({ chat: chatId })
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/chats/:chatId/messages/:messageId/read - Mark message as read
exports.markMessageAsRead = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user.id;

        // Check if user is part of this chat
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Find the message
        const message = await MessageModel.findOne({
            _id: messageId,
            chat: chatId
        });

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Only mark as read if the user is not the sender
        if (message.sender.toString() !== userId) {
            message.isRead = true;
            message.readAt = new Date();
            await message.save();
        }

        res.json({ message: "Message marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/chats/:chatId/archive - Archive a chat
exports.archiveChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        chat.isActive = false;
        await chat.save();

        res.json({ message: "Chat archived successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
