import express from 'express';
import {
  createConversation,
  sendMessage,
  getUserConversations,
  getConversation,
  getAllConversations,
  updateConversationStatus
} from '../controllers/support/supportController.js';
import authSession from '../middleware/authSession.js';
import { getIO } from '../socket.js';

const router = express.Router();

// User routes
router.post('/conversations', authSession, async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Emit socket event after conversation is created
    if (res.statusCode === 201 && data.conversation) {
      const io = getIO();
      io.to('admin_support').emit('new_support_message', {
        conversationId: data.conversation._id,
        conversation: data.conversation
      });
      console.log('Emitted new conversation event to admins');
    }
    return originalJson(data);
  };
  await createConversation(req, res, next);
});
router.get('/conversations', authSession, getUserConversations);
router.get('/conversations/:conversationId', authSession, getConversation);
router.post('/conversations/:conversationId/messages', authSession, async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async function(data) {
    // Emit socket event after message is sent
    if (res.statusCode === 200 && data.conversation) {
      const io = getIO();
      const lastMessage = data.conversation.messages[data.conversation.messages.length - 1];
      
      // Emit to all users in the conversation room (client and admin)
      io.to(`support_${data.conversation._id}`).emit("support_message", {
        conversationId: data.conversation._id,
        message: lastMessage
      });
      
      // Also notify admins about new messages
      io.to("admin_support").emit("new_support_message", {
        conversationId: data.conversation._id,
        message: lastMessage
      });
      
      console.log('Emitted message event for conversation:', data.conversation._id);
      console.log('Message details - SenderType:', lastMessage.senderType, 'SenderName:', lastMessage.senderName, 'Message:', lastMessage.message?.substring(0, 50));
    }
    return originalJson(data);
  };
  await sendMessage(req, res, next);
});

// Admin/Agent routes
router.get('/admin/conversations', authSession, getAllConversations);
router.patch('/admin/conversations/:conversationId', authSession, updateConversationStatus);
// Note: Agents can also use the same sendMessage endpoint to reply

export default router;

