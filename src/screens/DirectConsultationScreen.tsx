import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { formatVietnamChatTime } from '../utils/timeUtils';
import GradientBackground from '../components/GradientBackground';
import { pickImage, takePhoto, uploadImageToCloudinary } from '../services/cloudinaryService';

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
    const [uploadingImage, setUploadingImage] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const isUserAtBottomRef = useRef(true); // Track xem user có đang ở dưới cùng không
    const isLoadingMoreRef = useRef(false); // Track xem có đang request load more không
    const lastLoadMoreTimeRef = useRef(0); // Track thời gian load more cuối cùng
    const loadingAnimation = useRef(new Animated.Value(0)).current; // Animation cho loading indicator
    const [showLoadMoreButton, setShowLoadMoreButton] = useState(false); // Hiển thị nút load more

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
        // Chỉ auto scroll khi có tin nhắn mới và đã load xong lần đầu VÀ người dùng đang ở dưới cùng
        if (messages.length > 0 && initialLoadComplete && isUserAtBottomRef.current) {
            // Delay scroll to ensure layout is complete
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [messages, initialLoadComplete]);

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
            
            // Load existing messages (initial load)
            await loadMessages(roomData.roomId, true);
            
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

    const loadMessages = async (roomId: number, isInitialLoad = false, beforeMessageId: number | null = null) => {
        // Không load nếu component đã unmount hoặc đã có lỗi unauthorized
        if (isUnmountedRef.current || hasUnauthorizedRef.current) {
            console.log('⏭️ Skipping loadMessages - component unmounted or unauthorized');
            // Reset loading flags nếu bị skip
            if (!isInitialLoad && beforeMessageId) {
                setLoadingMore(false);
                isLoadingMoreRef.current = false;
            }
            return;
        }
        
        try {
            if (isInitialLoad) {
                setIsLoading(true);
            } else if (beforeMessageId) {
                // Loading more old messages
                setLoadingMore(true);
            }
            
            const params: any = { limit: isInitialLoad ? 20 : 10 };
            if (beforeMessageId) {
                params.beforeMessageId = beforeMessageId;
            }
            
            const response = await apiClient.get(`/Chat/room/${roomId}/messages`, { params });
            const newMessages = response.data.messages || [];
            const pagination = response.data.pagination || {};
            
            if (isInitialLoad) {
                // Lần load đầu tiên - replace toàn bộ messages
                setMessages(newMessages);
                setOldestMessageId(pagination.oldestMessageId || null);
                setHasMoreMessages(pagination.hasMore || false);
                setInitialLoadComplete(true);
                
                // Đánh dấu user ở dưới cùng và scroll xuống sau initial load
                isUserAtBottomRef.current = true;
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }, 200);
            } else if (beforeMessageId) {
                // Loading more old messages - prepend to beginning
                setMessages(prevMessages => {
                    // Merge và loại bỏ duplicate
                    const existingIds = new Set(prevMessages.map(m => m.messageId));
                    const uniqueNewMessages = newMessages.filter((m: ChatMessage) => !existingIds.has(m.messageId));
                    
                    // Prepend new messages (oldest first)
                    const merged = [...uniqueNewMessages, ...prevMessages];
                    return merged;
                });
                setOldestMessageId(pagination.oldestMessageId || null);
                setHasMoreMessages(pagination.hasMore || false);
            } else {
                // Auto-refresh: chỉ load tin nhắn mới (chỉ khi user đang ở dưới cùng)
                // Không load tin nhắn mới nếu user đang xem tin nhắn cũ để tránh load quá nhiều
                if (!isUserAtBottomRef.current) {
                    console.log('⏭️ Skipping auto-refresh - user is viewing old messages');
                    return;
                }
                
                setMessages(prevMessages => {
                    const existingIds = new Set(prevMessages.map(m => m.messageId));
                    const newMessageIds = new Set(newMessages.map((m: ChatMessage) => m.messageId));
                    
                    // Tìm tin nhắn mới (chưa có trong danh sách hiện tại)
                    const actuallyNewMessages = newMessages.filter((m: ChatMessage) => !existingIds.has(m.messageId));
                    
                    if (actuallyNewMessages.length > 0) {
                        setHasNewMessages(true);
                        // Append new messages to end
                        return [...prevMessages, ...actuallyNewMessages];
                    }
                    
                    return prevMessages;
                });
            }
            
            console.log(`📨 Loaded ${newMessages.length} messages for room ${roomId}, isInitialLoad: ${isInitialLoad}, beforeMessageId: ${beforeMessageId}`);
        } catch (error: any) {
            console.error('Error loading messages:', error);
            
            // Nếu lỗi 401 (Unauthorized), đánh dấu và dừng auto-refresh
            if (error.response?.status === 401) {
                console.log('🔒 Unauthorized - marking and stopping auto-refresh');
                hasUnauthorizedRef.current = true;
                stopAutoRefresh();
            }
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            } else if (beforeMessageId) {
                setLoadingMore(false);
            }
        }
    };

    const loadMoreMessages = async () => {
        // Kiểm tra nhiều điều kiện để tránh load quá nhiều lần
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadMoreTimeRef.current;
        
        // Kiểm tra component còn mount và authorized không
        if (isUnmountedRef.current || hasUnauthorizedRef.current) {
            console.log('⏭️ Skipping loadMoreMessages - component unmounted or unauthorized');
            isLoadingMoreRef.current = false; // Reset flag nếu component đã unmount
            return;
        }
        
        if (!roomId || 
            loadingMore || 
            isLoadingMoreRef.current || 
            !hasMoreMessages || 
            !oldestMessageId ||
            timeSinceLastLoad < 1000) { // Minimum 1000ms (1 giây) giữa các lần load để tránh quá nhanh
            return;
        }
        
        // Đánh dấu đang load
        isLoadingMoreRef.current = true;
        lastLoadMoreTimeRef.current = now;
        
        console.log('📜 Loading more messages...', { oldestMessageId, hasMoreMessages });
        
        // Hiệu ứng fade in cho loading indicator
        Animated.timing(loadingAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
        
        try {
            await loadMessages(roomId, false, oldestMessageId);
        } catch (error) {
            console.error('Error in loadMoreMessages:', error);
        } finally {
            // Hiệu ứng fade out cho loading indicator
            Animated.timing(loadingAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            
            // Reset flag sau khi load xong (kể cả khi bị skip)
            isLoadingMoreRef.current = false;
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
                // Chỉ load tin nhắn mới (không truyền beforeMessageId)
                await loadMessages(roomId, false, null);
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

    const handleSelectImage = async () => {
        Alert.alert(
            'Chọn ảnh',
            'Bạn muốn chọn ảnh từ đâu?',
            [
                {
                    text: 'Thư viện',
                    onPress: async () => {
                        const imageUri = await pickImage();
                        if (imageUri) {
                            await handleSendImage(imageUri);
                        }
                    },
                },
                {
                    text: 'Camera',
                    onPress: async () => {
                        const imageUri = await takePhoto();
                        if (imageUri) {
                            await handleSendImage(imageUri);
                        }
                    },
                },
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleSendImage = async (imageUri: string) => {
        if (!roomId || uploadingImage) return;

        setUploadingImage(true);
        try {
            // Upload ảnh lên Cloudinary
            const imageUrl = await uploadImageToCloudinary(imageUri);
            
            // Gửi tin nhắn ảnh
            const response = await apiClient.post('/Chat/message', {
                roomId: roomId,
                messageContent: '[Hình ảnh]',
                messageType: 1, // Image message
                fileUrl: imageUrl
            });

            const newMessage = response.data;
            setMessages(prev => {
                const exists = prev.some(msg => msg.messageId === newMessage.messageId);
                if (exists) {
                    return prev;
                }
                return [...prev, newMessage];
            });
            
            // Đánh dấu user đang ở dưới cùng và scroll xuống sau khi gửi ảnh
            isUserAtBottomRef.current = true;
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error: any) {
            console.error('Error sending image:', error);
            Alert.alert('Lỗi', 'Không thể gửi ảnh. Vui lòng thử lại.');
        } finally {
            setUploadingImage(false);
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
            
            // Đánh dấu user đang ở dưới cùng và scroll xuống sau khi gửi tin nhắn
            isUserAtBottomRef.current = true;
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
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
        const isImageMessage = item.messageType === 1;
        
        return (
            <View style={[styles.messageRow, isCustomer ? styles.customerMessageRow : styles.adminMessageRow]}>
                <View style={[styles.messageBubble, isCustomer ? styles.customerMessageBubble : styles.adminMessageBubble]}>
                    {isImageMessage && item.fileUrl ? (
                        <View style={styles.imageMessageContainer}>
                            <Image 
                                source={{ uri: item.fileUrl }} 
                                style={styles.messageImage}
                                resizeMode="cover"
                            />
                            <Text style={[styles.messageText, isCustomer ? styles.customerMessageText : styles.adminMessageText]}>
                                {item.messageContent}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.messageText, isCustomer ? styles.customerMessageText : styles.adminMessageText]}>
                            {item.messageContent}
                        </Text>
                    )}
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
                        <View style={styles.chatContainer}>
                            {/* Nút "Xem tin nhắn cũ" ở trên cùng - chỉ hiển thị khi có tin nhắn cũ và user scroll lên */}
                            {showLoadMoreButton && hasMoreMessages && oldestMessageId && (
                                <Animated.View 
                                    style={styles.loadMoreButtonContainer}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.loadMoreButton,
                                            (loadingMore || isLoadingMoreRef.current) && styles.loadMoreButtonDisabled
                                        ]}
                                        onPress={loadMoreMessages}
                                        disabled={loadingMore || isLoadingMoreRef.current}
                                        activeOpacity={0.7}
                                    >
                                        {loadingMore || isLoadingMoreRef.current ? (
                                            <>
                                                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                                                <Text style={styles.loadMoreButtonText}>Đang tải...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="chevron-up" size={18} color="white" style={{ marginRight: 6 }} />
                                                <Text style={styles.loadMoreButtonText}>Xem tin nhắn cũ</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={(item, index) => `${item.messageId}-${item.createdAt}-${index}`}
                                contentContainerStyle={styles.messageList}
                                style={styles.flatList}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                inverted={false}
                            onScroll={(event) => {
                                // Không xử lý scroll nếu component đã unmount hoặc unauthorized
                                if (isUnmountedRef.current || hasUnauthorizedRef.current) {
                                    return;
                                }
                                
                                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                                const scrollY = contentOffset.y;
                                const contentHeight = contentSize.height;
                                const viewportHeight = layoutMeasurement.height;
                                
                                // Xác định xem user có đang ở dưới cùng không (ngưỡng 100px để có độ lệch)
                                const distanceFromBottom = contentHeight - (scrollY + viewportHeight);
                                const isAtBottom = distanceFromBottom <= 100;
                                isUserAtBottomRef.current = isAtBottom;
                                
                                // Logic hiển thị nút "Xem tin nhắn cũ":
                                // 1. Có tin nhắn cũ để load (hasMoreMessages && oldestMessageId)
                                // 2. Không đang loading
                                // 3. User đã scroll lên (KHÔNG ở dưới cùng) - cách dưới cùng > 200px để đảm bảo đã scroll lên đủ
                                // 4. Có scroll đủ xa (scrollY > 100) để đảm bảo đã scroll lên
                                // 5. QUAN TRỌNG: Phải ẩn nút khi ở dưới cùng (isAtBottom = true)
                                const hasScrolledUp = !isAtBottom && distanceFromBottom > 200;
                                const hasEnoughScroll = scrollY > 100;
                                const shouldShowButton = 
                                    !isAtBottom && // QUAN TRỌNG: Phải ẩn khi ở dưới cùng
                                    hasMoreMessages && 
                                    !!oldestMessageId && 
                                    !loadingMore && 
                                    !isLoadingMoreRef.current &&
                                    hasScrolledUp && 
                                    hasEnoughScroll;
                                
                                setShowLoadMoreButton(shouldShowButton);
                            }}
                            scrollEventThrottle={400}
                            ListHeaderComponent={
                                loadingMore ? (
                                    <Animated.View 
                                        style={[
                                            styles.loadingMoreContainer,
                                            {
                                                opacity: loadingAnimation,
                                                transform: [{
                                                    translateY: loadingAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [-20, 0],
                                                    }),
                                                }],
                                            }
                                        ]}
                                    >
                                        <ActivityIndicator size="small" color="#007bff" />
                                        <Text style={styles.loadingMoreText}>Đang tải thêm tin nhắn cũ...</Text>
                                    </Animated.View>
                                ) : null
                            }
                            />
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <TouchableOpacity 
                                style={styles.imageButton}
                                onPress={handleSelectImage}
                                disabled={uploadingImage || !isConnected}
                            >
                                {uploadingImage ? (
                                    <ActivityIndicator size="small" color="#007bff" />
                                ) : (
                                    <Ionicons name="camera" size={20} color="#007bff" />
                                )}
                            </TouchableOpacity>
                            
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
    imageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
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
    imageMessageContainer: {
        alignItems: 'center',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 8,
    },
    loadingMoreContainer: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginHorizontal: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingMoreText: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '500',
        marginLeft: 4,
    },
    chatContainer: {
        flex: 1,
        position: 'relative',
    },
    loadMoreButtonContainer: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
        paddingHorizontal: 20,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 160,
    },
    loadMoreButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    loadMoreButtonDisabled: {
        opacity: 0.7,
    },
});


