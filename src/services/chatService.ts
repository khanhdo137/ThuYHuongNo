import apiClient from '../api/client';

export interface ChatMessage {
    messageId: number;
    roomId: number;
    senderId: number;
    senderType: number; // 0: Customer, 1: Admin
    messageContent: string;
    messageType: number;
    fileUrl?: string;
    isRead: boolean;
    createdAt: string;
    senderName: string;
}

export interface ChatRoom {
    roomId: number;
    roomName: string;
    status: number;
    unreadCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
}

export interface SendMessageDto {
    roomId: number;
    messageContent: string;
    messageType?: number;
    fileUrl?: string;
}

class ChatService {
    /**
     * Tạo hoặc lấy phòng chat hiện có
     */
    async createOrGetChatRoom(): Promise<ChatRoom> {
        try {
            const response = await apiClient.post('/Chat/room');
            return response.data;
        } catch (error: any) {
            console.error('Error creating/getting chat room:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo phòng chat');
        }
    }

    /**
     * Gửi tin nhắn
     */
    async sendMessage(messageData: SendMessageDto): Promise<ChatMessage> {
        try {
            const response = await apiClient.post('/Chat/message', messageData);
            return response.data;
        } catch (error: any) {
            console.error('Error sending message:', error);
            throw new Error(error.response?.data?.message || 'Không thể gửi tin nhắn');
        }
    }

    /**
     * Lấy danh sách tin nhắn trong phòng chat
     */
    async getChatMessages(roomId: number, page: number = 1, limit: number = 50): Promise<{
        messages: ChatMessage[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }> {
        try {
            const response = await apiClient.get(`/Chat/room/${roomId}/messages`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error getting chat messages:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy tin nhắn');
        }
    }

    /**
     * Lấy danh sách phòng chat (dành cho admin)
     */
    async getAdminChatRooms(page: number = 1, limit: number = 20): Promise<{
        rooms: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        try {
            const response = await apiClient.get('/Chat/admin/rooms', {
                params: { page, limit }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error getting admin chat rooms:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách phòng chat');
        }
    }

    /**
     * Admin nhận phòng chat
     */
    async assignChatRoom(roomId: number): Promise<void> {
        try {
            await apiClient.post(`/Chat/admin/room/${roomId}/assign`);
        } catch (error: any) {
            console.error('Error assigning chat room:', error);
            throw new Error(error.response?.data?.message || 'Không thể nhận phòng chat');
        }
    }

    /**
     * Admin gửi tin nhắn
     */
    async sendAdminMessage(messageData: SendMessageDto): Promise<ChatMessage> {
        try {
            const response = await apiClient.post('/Chat/admin/message', messageData);
            return response.data;
        } catch (error: any) {
            console.error('Error sending admin message:', error);
            throw new Error(error.response?.data?.message || 'Không thể gửi tin nhắn');
        }
    }
}

export const chatService = new ChatService();
export default chatService;

