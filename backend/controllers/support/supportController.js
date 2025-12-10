import SupportConversation from '../../models/mutual/SupportConversation.js';
import User from '../../models/auth/User.js';

// Create a new support conversation
export const createConversation = async (req, res) => {
  try {
    const { id: userId, email } = req.user;
    const { subject, initialMessage } = req.body;

    // Get user from database to ensure correct userType
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userType = user.userType;
    
    // Validate userType - only handyman, customer, or client can create conversations
    if (userType === 'admin') {
      return res.status(403).json({ error: 'Admins cannot create support conversations. Use the admin support chat interface instead.' });
    }
    
    // Normalize userType to match schema enum
    let normalizedUserType = userType;
    if (userType === 'client') {
      normalizedUserType = 'customer';
    } else if (userType !== 'handyman' && userType !== 'customer') {
      return res.status(400).json({ error: `Invalid user type: ${userType}. Only handyman, customer, or client can create support conversations.` });
    }

    // Get user profile info
    let userName = user.username || email.split('@')[0];
    if (normalizedUserType === 'handyman') {
      const HandyProfile = (await import('../../models/handyman/HandyDashboard.js')).default;
      const profile = await HandyProfile.findOne({ userId });
      if (profile) userName = profile.name || userName;
    } else if (normalizedUserType === 'customer') {
      const ClientProfile = (await import('../../models/client/ClientDashboard.js')).default;
      const profile = await ClientProfile.findOne({ userId });
      if (profile) userName = profile.name || profile.firstName || userName;
    }

    console.log(`Creating conversation - User ID: ${userId}, UserType from DB: ${userType}, Normalized: ${normalizedUserType}`);

    // Check if user has an ACTIVE conversation (exclude resolved/closed)
    const existingConversation = await SupportConversation.findOne({
      userId,
      status: { $in: ['open', 'assigned', 'in_progress'] }
    }).sort({ createdAt: -1 });

    if (existingConversation) {
      // Don't reopen closed conversations - create new one instead
      if (existingConversation.status === 'closed') {
        // Create new conversation for closed chats
        const conversation = await SupportConversation.create({
          userId,
          userName,
          userEmail: email,
          userType: normalizedUserType,
          subject: subject || 'General Inquiry',
          messages: initialMessage ? [{
            senderId: userId,
            senderName: userName,
            senderType: normalizedUserType === 'handyman' ? 'handyman' : 'customer',
            message: initialMessage
          }] : []
        });

        console.log('New conversation created (previous was closed):', conversation._id);

        return res.status(201).json({
          message: 'Support conversation created',
          conversation
        });
      }
      
      // Add message to existing active conversation
      existingConversation.messages.push({
        senderId: userId,
        senderName: userName,
        senderType: normalizedUserType === 'handyman' ? 'handyman' : 'customer',
        message: initialMessage || 'User reopened conversation'
      });
      
      // Reopen resolved conversations, but not closed ones
      if (existingConversation.status === 'resolved') {
        existingConversation.status = 'open';
      }
      
      existingConversation.lastMessageAt = new Date();
      await existingConversation.save();

      return res.status(200).json({
        message: 'Message added to existing conversation',
        conversation: existingConversation
      });
    }

    // Create new conversation
    const conversation = await SupportConversation.create({
      userId,
      userName,
      userEmail: email,
      userType: normalizedUserType,
      subject: subject || 'General Inquiry',
      messages: initialMessage ? [{
        senderId: userId,
        senderName: userName,
        senderType: normalizedUserType === 'handyman' ? 'handyman' : 'customer',
        message: initialMessage
      }] : []
    });

    console.log('New conversation created:', conversation._id, 'by user:', userId);

    // Store conversation in res.locals for route handler to emit socket event
    res.locals.conversation = conversation;
    
    res.status(201).json({
      message: 'Support conversation created',
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {})
        .map((err) => err?.message || String(err))
        .join(', ');
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationErrors || error.message || 'Invalid data provided'
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: 'Failed to create conversation',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Send a message in a conversation
export const sendMessage = async (req, res) => {
  try {
    const { id: userId, email } = req.user;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fetch user from database to verify userType for admin check and get accurate user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[DEBUG] sendMessage - User ID: ${userId}, Email: ${email}, DB UserType: ${user.userType}, DB Username: ${user.username}`);

    // Check if conversation is closed or resolved
    if (conversation.status === 'closed') {
      return res.status(400).json({ error: 'Cannot send messages to a closed conversation. Please create a new conversation.' });
    }

    // Verify user owns this conversation or is an agent
    if (conversation.userId.toString() !== userId.toString() && user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let senderName = user.username || email.split('@')[0];
    let senderType;

    // Determine senderType based on actual user.userType from database
    // IMPORTANT: Check userType explicitly, don't default to admin
    if (user.userType === 'admin') {
      // Use displayName if available, otherwise fallback to username or 'Support Agent'
      senderName = user.displayName || user.username || 'Support Agent';
      senderType = 'agent';
      
      console.log(`[DEBUG] Admin detected - setting senderType to 'agent', senderName: ${senderName}`);
      
      // Don't auto-assign - admin must explicitly click "Assign to me" button
      // Update conversation status if admin is already assigned
      if (conversation.assignedTo && conversation.assignedTo.toString() === userId.toString()) {
        // Admin is already assigned - update assignedAgentName in case displayName changed
        conversation.assignedAgentName = senderName;
        if (conversation.status === 'open') {
          conversation.status = 'assigned';
        }
      }
    } else if (user.userType === 'handyman') {
      senderType = 'handyman';
      console.log(`[DEBUG] Handyman detected - setting senderType to 'handyman'`);
      
      // Get handyman name if available
      try {
        const HandyProfile = (await import('../../models/handyman/HandyDashboard.js')).default;
        const profile = await HandyProfile.findOne({ userId });
        if (profile?.name) senderName = profile.name;
      } catch (err) {
        console.error('Error fetching handyman profile:', err);
      }
      // Update conversation status when user replies
      if (conversation.status === 'resolved') {
        conversation.status = 'open';
      } else if (conversation.status === 'assigned' || conversation.status === 'in_progress') {
        conversation.status = 'in_progress';
      }
    } else if (user.userType === 'customer' || user.userType === 'client') {
      // customer or client
      senderType = 'customer';
      console.log(`[DEBUG] Customer/Client detected - setting senderType to 'customer'`);
      
      // Get customer name if available
      try {
        const ClientProfile = (await import('../../models/client/ClientDashboard.js')).default;
        const profile = await ClientProfile.findOne({ userId });
        if (profile?.name || profile?.firstName) senderName = profile.name || profile.firstName;
      } catch (err) {
        console.error('Error fetching client profile:', err);
      }
      // Update conversation status when user replies
      if (conversation.status === 'resolved') {
        conversation.status = 'open';
      } else if (conversation.status === 'assigned' || conversation.status === 'in_progress') {
        conversation.status = 'in_progress';
      }
    } else {
      // Fallback - should not happen, but log it
      console.error(`[ERROR] Unknown userType: ${user.userType}, defaulting to customer`);
      senderType = 'customer';
    }

    console.log(`[DEBUG] Final - User ID: ${userId}, UserType: ${user.userType}, SenderType: ${senderType}, SenderName: ${senderName}`);

    // Add message with explicit senderType
    const newMessage = {
      senderId: userId,
      senderName,
      senderType, // Ensure this is set correctly
      message: message.trim(),
      read: user.userType === 'admin' // Auto-read if sent by admin
    };
    
    console.log(`[DEBUG] Adding message to conversation - senderType: ${newMessage.senderType}, senderName: ${newMessage.senderName}`);

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();
    
    // Update assignedAgentName with current displayName from User model if assigned
    if (conversation.assignedTo) {
      const assignedUser = await User.findById(conversation.assignedTo);
      if (assignedUser) {
        conversation.assignedAgentName = assignedUser.displayName || assignedUser.username || 'Support Agent';
      }
    }
    
    await conversation.save();

    // Verify the saved message
    const savedMessage = conversation.messages[conversation.messages.length - 1];
    console.log(`[DEBUG] Saved message - senderType: ${savedMessage.senderType}, senderName: ${savedMessage.senderName}, senderId: ${savedMessage.senderId}`);

    res.status(200).json({
      message: 'Message sent successfully',
      conversation
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get user's conversations
export const getUserConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const conversations = await SupportConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    // Update assignedAgentName with current displayName from User model
    for (const conv of conversations) {
      if (conv.assignedTo) {
        const assignedUser = await User.findById(conv.assignedTo);
        if (assignedUser) {
          conv.assignedAgentName = assignedUser.displayName || assignedUser.username || 'Support Agent';
          // Optionally save the updated name to the conversation
          await conv.save();
        }
      }
    }

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get a specific conversation
export const getConversation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fetch user from database to check userType for admin verification
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify access
    if (conversation.userId.toString() !== userId.toString() && user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update assignedAgentName with current displayName from User model if assigned
    if (conversation.assignedTo) {
      const assignedUser = await User.findById(conversation.assignedTo);
      if (assignedUser) {
        conversation.assignedAgentName = assignedUser.displayName || assignedUser.username || 'Support Agent';
      }
    }

    // Mark messages as read for this user
    conversation.messages.forEach(msg => {
      if (msg.senderId.toString() !== userId.toString()) {
        msg.read = true;
      }
    });
    await conversation.save();

    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// Get all conversations for admin/agents
export const getAllConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Fetch user from database to check userType
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, assignedTo } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const conversations = await SupportConversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(100);

    // Update assignedAgentName with current displayName from User model for all conversations
    for (const conv of conversations) {
      if (conv.assignedTo) {
        const assignedUser = await User.findById(conv.assignedTo);
        if (assignedUser) {
          conv.assignedAgentName = assignedUser.displayName || assignedUser.username || 'Support Agent';
          // Optionally save the updated name to the conversation
          await conv.save();
        }
      }
    }

    console.log(`Admin fetched ${conversations.length} conversations`);

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update conversation status (for agents)
export const updateConversationStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { conversationId } = req.params;
    const { status, assignedTo } = req.body;

    // Fetch user from database to check userType
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (status) {
      conversation.status = status;
      if (status === 'resolved' || status === 'closed') {
        conversation.resolvedAt = new Date();
      }
    }

    if (assignedTo) {
      const agent = await User.findById(assignedTo);
      conversation.assignedTo = assignedTo;
      // Use displayName if available, otherwise fallback to username or 'Support Agent'
      conversation.assignedAgentName = agent?.displayName || agent?.username || 'Support Agent';
      if (conversation.status === 'open') {
        conversation.status = 'assigned';
      }
    }

    await conversation.save();

    res.status(200).json({
      message: 'Conversation updated',
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
};

