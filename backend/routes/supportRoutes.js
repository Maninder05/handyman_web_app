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
      
      // Debug: Verify the message being emitted
      console.log('[SOCKET DEBUG] Emitting message - SenderType:', lastMessage?.senderType, 'SenderName:', lastMessage?.senderName, 'SenderId:', lastMessage?.senderId);
      
      // Ensure we have a valid message object
      if (lastMessage && lastMessage.senderType) {
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
        
        console.log('[SOCKET] Emitted message event for conversation:', data.conversation._id);
      } else {
        console.error('[SOCKET ERROR] Last message is invalid or missing senderType:', lastMessage);
      }
    }
    return originalJson(data);
  };
  await sendMessage(req, res, next);
});

// Admin/Agent routes
router.get('/admin/conversations', authSession, getAllConversations);
router.patch('/admin/conversations/:conversationId', authSession, async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Emit socket event when conversation is updated (e.g., when agent assigns themselves)
    if (res.statusCode === 200 && data.conversation) {
      const io = getIO();
      // Notify both the client and admins about the conversation update
      io.to(`support_${data.conversation._id}`).emit("conversation_updated", {
        conversationId: data.conversation._id,
        conversation: data.conversation
      });
      io.to("admin_support").emit("conversation_updated", {
        conversationId: data.conversation._id,
        conversation: data.conversation
      });
      console.log('Emitted conversation_updated event for conversation:', data.conversation._id);
    }
    return originalJson(data);
  };
  await updateConversationStatus(req, res, next);
});
// Note: Agents can also use the same sendMessage endpoint to reply

export default router;

