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

    // Get user profile info
    let userName = email.split('@')[0];
    if (userType === 'handyman') {
      const HandyProfile = (await import('../../models/handyman/HandyDashboard.js')).default;
      const profile = await HandyProfile.findOne({ userId });
      if (profile) userName = profile.name || userName;
    } else if (userType === 'customer') {
      const ClientProfile = (await import('../../models/client/ClientDashboard.js')).default;
      const profile = await ClientProfile.findOne({ userId });
      if (profile) userName = profile.name || profile.firstName || userName;
    }

    console.log(`Creating conversation - User ID: ${userId}, UserType from DB: ${userType}`);

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
          userType: userType === 'handyman' ? 'handyman' : 'customer',
          subject: subject || 'General Inquiry',
          messages: initialMessage ? [{
            senderId: userId,
            senderName: userName,
            senderType: userType === 'handyman' ? 'handyman' : 'customer',
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
        senderType: userType === 'handyman' ? 'handyman' : 'customer',
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
      userType: userType === 'handyman' ? 'handyman' : 'customer',
      subject: subject || 'General Inquiry',
      messages: initialMessage ? [{
        senderId: userId,
        senderName: userName,
        senderType: userType === 'handyman' ? 'handyman' : 'customer',
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
    const { id: userId, email, userType } = req.user;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user owns this conversation or is an agent
    if (conversation.userId.toString() !== userId.toString() && userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get sender name and type - check userType from database to be sure
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let senderName = email.split('@')[0];
    let senderType;

    // Determine senderType based on actual user.userType from database
    if (user.userType === 'admin') {
      senderName = user?.username || 'Support Agent';
      senderType = 'agent';
      
      // Auto-assign if not assigned
      if (!conversation.assignedTo) {
        conversation.assignedTo = userId;
        conversation.assignedAgentName = senderName;
        conversation.status = conversation.status === 'open' ? 'assigned' : conversation.status;
      }
    } else if (user.userType === 'handyman') {
      senderType = 'handyman';
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
    } else {
      // customer
      senderType = 'customer';
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
    }

    console.log(`Sending message - User ID: ${userId}, UserType from DB: ${user.userType}, SenderType: ${senderType}, SenderName: ${senderName}`);

    // Add message
    conversation.messages.push({
      senderId: userId,
      senderName,
      senderType,
      message: message.trim(),
      read: userType === 'admin' // Auto-read if sent by admin
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(200).json({
      message: 'Message sent successfully',
      conversation
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get user's conversations
export const getUserConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const conversations = await SupportConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .limit(50);

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
      conversation.assignedAgentName = agent?.username || 'Support Agent';
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

