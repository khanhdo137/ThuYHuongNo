import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { formatVietnamChatTime } from '../utils/timeUtils';
import GradientBackground from '../components/GradientBackground';

interface ChatMessage {
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

interface ChatRoom {
    roomId: number;
    roomName: string;
    status: number;
    unreadCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
}

export default function DirectConsultationScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [roomStatus, setRoomStatus] = useState<number>(0);
    const [isConnected, setIsConnected] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isUnmountedRef = useRef(false);
    const hasUnauthorizedRef = useRef(false);

    useEffect(() => {
        initializeChat();
        
        // Keyboard listeners
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setIsKeyboardVisible(true);
            // Scroll to bottom when keyboard shows
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
        });

        return () => {
            console.log('🧹 Cleaning up DirectConsultationScreen...');
            isUnmountedRef.current = true;
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
            // Clear auto-refresh interval when component unmounts
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                console.log('⏹️ Auto-refresh stopped on unmount');
            }
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            // Delay scroll to ensure layout is complete
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            console.log('🔍 Initializing chat...');
            console.log('API Base URL:', apiClient.defaults.baseURL);
            
            // Kiểm tra token trước
            const token = await AsyncStorage.getItem('token');
            console.log('Token exists:', !!token);
            
            const response = await apiClient.post('/Chat/room');
            console.log('✅ Chat room created:', response.data);
            
            const roomData = response.data;
            setRoomId(roomData.roomId);
            setRoomStatus(roomData.status);
            setIsConnected(true);
            
            // Load existing messages
            await loadMessages(roomData.roomId);
            
            // Start auto-refresh for new messages
            startAutoRefresh(roomData.roomId);
        } catch (error: any) {
            console.error('❌ Error initializing chat:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            
            let errorMessage = 'Không thể kết nối với hệ thống chat. Vui lòng thử lại sau.';
            
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 404) {
                errorMessage = 'API endpoint không tồn tại. Vui lòng liên hệ admin.';
            } else if (!error.response) {
                errorMessage = 'Không thể kết nối đến server. Kiểm tra kết nối mạng.';
            }
            
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (roomId: number, showLoading = false) => {
        // Không load nếu component đã unmount hoặc đã có lỗi unauthorized
        if (isUnmountedRef.current || hasUnauthorizedRef.current) {
            console.log('⏭️ Skipping loadMessages - component unmounted or unauthorized');
            return;
        }
        
        try {
            if (showLoading) {
                setIsLoading(true);
            }
            
            // Tăng limit để load nhiều tin nhắn hơn
            const response = await apiClient.get(`/Chat/room/${roomId}/messages`, {
                params: { limit: 200 } // Tăng từ 50 (default) lên 200
            });
            const newMessages = response.data.messages || [];
            
            // Remove duplicates based on messageId
            const uniqueMessages = newMessages.filter((message: ChatMessage, index: number, self: ChatMessage[]) => 
                index === self.findIndex(m => m.messageId === message.messageId)
            );
            
            // So sánh với số lượng tin nhắn hiện tại
            setMessages(prevMessages => {
                const previousCount = prevMessages.length;
                
                // Check if there are new messages
                if (uniqueMessages.length > previousCount) {
                    setHasNewMessages(true);
                    // Auto scroll to bottom for new messages
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
                
                return uniqueMessages;
            });
            
            console.log(`📨 Loaded ${uniqueMessages.length} messages for room ${roomId}`);
        } catch (error: any) {
            console.error('Error loading messages:', error);
            
            // Nếu lỗi 401 (Unauthorized), đánh dấu và dừng auto-refresh
            if (error.response?.status === 401) {
                console.log('🔒 Unauthorized - marking and stopping auto-refresh');
                hasUnauthorizedRef.current = true;
                stopAutoRefresh();
            }
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    };

    const startAutoRefresh = (roomId: number) => {
        console.log('🔄 Starting auto-refresh for room:', roomId);
        
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        
        // Reset unauthorized flag khi bắt đầu auto-refresh mới
        hasUnauthorizedRef.current = false;
        
        // Set up new interval - check for new messages every 3 seconds
        const interval = setInterval(async () => {
            // Kiểm tra trước khi gọi API
            if (isUnmountedRef.current || hasUnauthorizedRef.current) {
                console.log('⏹️ Stopping auto-refresh - component unmounted or unauthorized');
                stopAutoRefresh();
                return;
            }
            
            try {
                setIsAutoRefreshing(true);
                await loadMessages(roomId, false);
            } catch (error: any) {
                console.error('Auto-refresh error:', error);
                // Nếu lỗi 401, đánh dấu và dừng auto-refresh
                if (error.response?.status === 401) {
                    console.log('🔒 Unauthorized in auto-refresh - marking and stopping');
                    hasUnauthorizedRef.current = true;
                    stopAutoRefresh();
                }
            } finally {
                setIsAutoRefreshing(false);
            }
        }, 3000); // Check every 3 seconds
        
        intervalRef.current = interval as unknown as NodeJS.Timeout;
        setAutoRefreshInterval(interval as any);
    };

    const stopAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setAutoRefreshInterval(null);
            console.log('⏹️ Stopped auto-refresh');
        }
    };

    const handleSend = async () => {
        if (inputText.trim().length === 0 || !roomId || isSending) return;

        const messageText = inputText.trim();
        setInputText('');
        setIsSending(true);

        try {
            const response = await apiClient.post('/Chat/message', {
                roomId: roomId,
                messageContent: messageText,
                messageType: 0 // Text message
            });

            const newMessage = response.data;
            setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const exists = prev.some(msg => msg.messageId === newMessage.messageId);
                if (exists) {
                    return prev;
                }
                return [...prev, newMessage];
            });
            
            // Scroll to bottom sau khi gửi tin nhắn thành công
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
            // Reload messages để đảm bảo đồng bộ
            if (roomId) {
                await loadMessages(roomId, false);
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            
            let errorMessage = 'Không thể gửi tin nhắn. Vui lòng thử lại.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = `Lỗi: ${error.response.data.error}`;
            }
            
            Alert.alert('Lỗi gửi tin nhắn', errorMessage);
            setInputText(messageText); // Restore message
        } finally {
            setIsSending(false);
        }
    };

    const handleGoBack = () => {
        stopAutoRefresh();
        navigation.goBack();
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return 'Chờ admin phản hồi';
            case 1: return 'Đang trả lời';
            case 2: return 'Hoàn thành';
            default: return 'Không xác định';
        }
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return '#ff9500';
            case 1: return '#007bff';
            case 2: return '#28a745';
            default: return '#6c757d';
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isCustomer = item.senderType === 0;
        return (
            <View style={[styles.messageRow, isCustomer ? styles.customerMessageRow : styles.adminMessageRow]}>
                <View style={[styles.messageBubble, isCustomer ? styles.customerMessageBubble : styles.adminMessageBubble]}>
                    <Text style={[styles.messageText, isCustomer ? styles.customerMessageText : styles.adminMessageText]}>
                        {item.messageContent}
                    </Text>
                    <Text style={[styles.messageTime, isCustomer ? styles.customerMessageTime : styles.adminMessageTime]}>
                        {formatVietnamChatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <GradientBackground>
                <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Đang kết nối với hệ thống tư vấn...</Text>
                </View>
            </SafeAreaView>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleGoBack}
                >
                    <Ionicons name="arrow-back" size={24} color="#007bff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Tư vấn trực tiếp</Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(roomStatus) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(roomStatus) }]}>
                            {getStatusText(roomStatus)}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerControls}>
                    {isAutoRefreshing && (
                        <View style={styles.autoRefreshIndicator}>
                            <ActivityIndicator size="small" color="#007bff" />
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={() => {
                            if (roomId) {
                                stopAutoRefresh();
                                loadMessages(roomId, true);
                                startAutoRefresh(roomId);
                            }
                        }}
                    >
                        <Ionicons name="refresh" size={20} color="#007bff" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {!isConnected ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="wifi" size={48} color="#dc3545" />
                        <Text style={styles.errorText}>Không thể kết nối với hệ thống</Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={initializeChat}
                        >
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item, index) => `${item.messageId}-${item.createdAt}-${index}`}
                            contentContainerStyle={styles.messageList}
                            style={styles.flatList}
                            showsVerticalScrollIndicator={true}
                            onContentSizeChange={() => {
                                if (messages.length > 0) {
                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 50);
                                }
                            }}
                            onLayout={() => {
                                if (messages.length > 0) {
                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 50);
                                }
                            }}
                            keyboardShouldPersistTaps="handled"
                            maintainVisibleContentPosition={{
                                minIndexForVisible: 0,
                                autoscrollToTopThreshold: 10,
                            }}
                        />
                        
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Nhập tin nhắn..."
                                placeholderTextColor="#999"
                                multiline
                                maxLength={500}
                                editable={!isSending && isConnected}
                                returnKeyType="send"
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity 
                                style={[styles.sendButton, (isSending || !inputText.trim() || !isConnected) && styles.sendButtonDisabled]} 
                                onPress={handleSend}
                                disabled={isSending || !inputText.trim() || !isConnected}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="send" size={20} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    container: { 
        flex: 1,
        flexDirection: 'column'
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    headerControls: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    autoRefreshIndicator: {
        padding: 4,
    },
    refreshButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    flatList: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    messageList: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 10,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
    },
    customerMessageRow: { justifyContent: 'flex-end' },
    adminMessageRow: { justifyContent: 'flex-start' },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: '80%',
    },
    customerMessageBubble: {
        backgroundColor: '#007bff',
        borderBottomRightRadius: 5,
    },
    adminMessageBubble: {
        backgroundColor: '#e5e5ea',
        borderBottomLeftRadius: 5,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    customerMessageText: { 
        color: 'white',
    },
    adminMessageText: { 
        color: 'black',
    },
    messageTime: {
        fontSize: 12,
        marginTop: 4,
        opacity: 0.7,
    },
    customerMessageTime: {
        color: 'white',
    },
    adminMessageTime: {
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: 'white',
        minHeight: 60,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
});

