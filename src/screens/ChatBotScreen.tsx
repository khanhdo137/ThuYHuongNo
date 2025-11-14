import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import geminiService, { fetchClinicDataForPrompt, fetchUserServiceHistory } from '../services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    isTyping?: boolean;
}

interface QuickReply {
    id: string;
    text: string;
    icon: string;
}

const initialMessages: Message[] = [
    { id: '1', text: 'Xin chào! 👋 Tôi là Dr. AI - Trợ lý ảo của phòng khám Thú Y Hương Nở!', sender: 'bot' },
    { id: '2', text: 'Tôi có thể giúp bạn:\n\n🏥 Tư vấn chăm sóc thú cưng\n💊 Giới thiệu dịch vụ phù hợp\n📅 Hướng dẫn đặt lịch hẹn\n❓ Trả lời câu hỏi y tế\n👨‍⚕️ Thông tin bác sĩ', sender: 'bot' },
    { id: '3', text: 'Hãy chọn câu hỏi bên dưới hoặc nhập câu hỏi của bạn! 💬', sender: 'bot' },
];

const quickReplies: QuickReply[] = [
    { id: '1', text: 'Dịch vụ của phòng khám', icon: 'medical' },
    { id: '2', text: 'Đặt lịch khám', icon: 'calendar' },
    { id: '3', text: 'Giá dịch vụ', icon: 'cash' },
    { id: '4', text: 'Thông tin bác sĩ', icon: 'person' },
    { id: '5', text: 'Chăm sóc thú cưng', icon: 'heart' },
    { id: '6', text: 'Liên hệ', icon: 'call' },
];

export default function ChatBotScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [userContext, setUserContext] = useState({
        hasPets: false,
        recentAppointments: [] as any[],
        preferredServices: [] as string[]
    });
    const [clinicData, setClinicData] = useState('');

    useEffect(() => {
        if (messages.length > 0) {
            // Delay scroll để đảm bảo layout hoàn thành
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
        
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [messages]);

    useEffect(() => {
        setApiKeyConfigured(geminiService.isReady());
        if (!geminiService.isReady()) {
            const warningMessage: Message = {
                id: 'api-warning',
                text: '⚠️ Chưa cấu hình API key cho Gemini AI. Vui lòng cập nhật API key trong file config.ts để sử dụng tính năng chatbot.',
                sender: 'bot'
            };
            setMessages(prev => [...prev, warningMessage]);
        }

        // Load conversation history
        loadConversationHistory();
        
        // Load user context and clinic data
        loadUserContext();
        loadClinicData();
    }, []);

    // Xử lý keyboard events với scroll tốt hơn
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            // Scroll to bottom when keyboard shows
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
        });
        
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    // Load conversation history từ AsyncStorage
    const loadConversationHistory = async () => {
        try {
            const saved = await AsyncStorage.getItem('chatbot_history');
            if (saved) {
                const history = JSON.parse(saved);
                setMessages(prev => [...initialMessages, ...history]);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    };

    // Load user context (pets, appointments)
    const loadUserContext = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const [petsRes, appointmentsRes] = await Promise.all([
                apiClient.get('/Pet'),
                apiClient.get('/Appointment?limit=5')
            ]);

            const pets = petsRes.data || [];
            const appointments = appointmentsRes.data.appointments || appointmentsRes.data || [];

            // Phân tích dịch vụ đã sử dụng
            const serviceHistory = appointments
                .filter((a: any) => a.status === 2) // Chỉ lấy những đã hoàn thành
                .map((a: any) => a.serviceName as string)
                .filter((name: string) => Boolean(name));
            
            const preferredServices: string[] = Array.from(new Set(serviceHistory)); // Loại bỏ trùng lặp

            setUserContext({
                hasPets: pets.length > 0,
                recentAppointments: appointments,
                preferredServices
            });
        } catch (error) {
            console.error('Error loading user context:', error);
        }
    };

    // Load clinic data
    const loadClinicData = async () => {
        try {
            const data = await fetchClinicDataForPrompt();
            setClinicData(data);
        } catch (error) {
            console.error('Error loading clinic data:', error);
        }
    };

    // Save conversation history
    const saveConversation = async (messages: Message[]) => {
        try {
            // Chỉ lưu 10 tin nhắn gần nhất (trừ initial messages)
            const recentMessages = messages.slice(initialMessages.length).slice(-10);
            await AsyncStorage.setItem('chatbot_history', JSON.stringify(recentMessages));
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    const handleQuickReply = (text: string) => {
        setInputText(text);
        setShowQuickReplies(false);
        // Auto focus input after selecting quick reply
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleSend = async () => {
        if (inputText.trim().length === 0) return;
        if (isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setShowQuickReplies(false);

        // Scroll to bottom after adding user message
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);

        const typingMessage: Message = {
            id: 'typing-' + Date.now(),
            text: 'Đang nhập...',
            sender: 'bot',
            isTyping: true
        };
        setMessages(prev => [...prev, typingMessage]);

        try {
            if (!geminiService.isReady()) {
                setTimeout(() => {
                    const fallbackResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: 'Xin lỗi, tính năng AI chatbot chưa được cấu hình. Để sử dụng tính năng này, vui lòng:\n\n1. Lấy API key từ Google AI Studio\n2. Cập nhật API key trong file src/constants/config.ts\n3. Khởi động lại ứng dụng\n\nHiện tại bạn có thể liên hệ trực tiếp với phòng khám để được tư vấn.',
                        sender: 'bot',
                    };
                    setMessages(prev => {
                        const newMessages = [...prev.filter(m => !m.isTyping), fallbackResponse];
                        saveConversation(newMessages);
                        
                        // Scroll to bottom after fallback response
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                        
                        return newMessages;
                    });
                    setIsLoading(false);
                }, 1000);
                return;
            }

            // Lấy user history
            const userHistory = await fetchUserServiceHistory();

            // Gọi Gemini AI với context đầy đủ
            const response = await geminiService.sendMessage({
                message: userMessage.text,
                userContext,
                clinicData,
                userHistory
            });

            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'bot',
            };
            
            setMessages(prev => {
                const newMessages = [...prev.filter(m => !m.isTyping), botResponse];
                saveConversation(newMessages);
                
                // Scroll to bottom after bot response
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                return newMessages;
            });
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API:', error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với phòng khám.',
                sender: 'bot',
            };
            
            setMessages(prev => {
                const newMessages = [...prev.filter(m => !m.isTyping), errorResponse];
                saveConversation(newMessages);
                
                // Scroll to bottom after error response
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigureApiKey = () => {
        Alert.alert(
            'Cấu hình API Key',
            'Để sử dụng tính năng chatbot AI, bạn cần:\n\n1. Lấy API key miễn phí từ Google AI Studio (makersuite.google.com)\n2. Mở file src/constants/config.ts\n3. Thay thế "YOUR_GEMINI_API_KEY_HERE" bằng API key của bạn\n4. Khởi động lại ứng dụng\n\nLưu ý: Không chia sẻ API key của bạn cho người khác.',
            [{ text: 'Đã hiểu', style: 'default' }]
        );
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    // Quick action helpers (không hiển thị UI)
    const showServices = async () => {
        try {
            const response = await apiClient.get('/Service');
            const services = response.data.data || response.data;
            const serviceList = services.map((s: any) => s.name).join('\n• ');
            setInputText(`Cho tôi biết chi tiết về các dịch vụ: ${serviceList}`);
        } catch (error) {
            setInputText("Bạn có những dịch vụ nào?");
        }
    };

    // Smart suggestions dựa trên input
    const getSmartSuggestions = (input: string): string[] => {
        const suggestions: string[] = [];
        
        if (input.includes('chó') || input.includes('mèo')) {
            suggestions.push('Tư vấn chăm sóc hàng ngày', 'Dịch vụ tắm cắt lông', 'Khám sức khỏe định kỳ');
        }
        
        if (input.includes('bệnh') || input.includes('ốm')) {
            suggestions.push('Đặt lịch khám ngay', 'Liên hệ bác sĩ khẩn cấp', 'Hướng dẫn sơ cứu');
        }
        
        if (input.includes('giá') || input.includes('phí')) {
            suggestions.push('Xem bảng giá dịch vụ', 'Tư vấn gói khám tiết kiệm');
        }
        
        return suggestions;
    };

    // Function to render formatted text with proper line breaks and styling
    const renderFormattedText = (text: string) => {
        // Split by double line breaks for paragraphs
        const paragraphs = text.split('\n\n');
        
        return paragraphs.map((paragraph, pIndex) => {
            // Split each paragraph by single line breaks
            const lines = paragraph.split('\n');
            
            return (
                <View key={pIndex} style={pIndex > 0 ? styles.paragraph : null}>
                    {lines.map((line, lIndex) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return null;
                        
                        // Check if line is a list item (starts with number, bullet, or emoji)
                        const isListItem = /^[\d]+\./.test(trimmedLine) || 
                                         /^[•·⦿○●]/.test(trimmedLine) ||
                                         /^[▪▫◾◽]/.test(trimmedLine);
                        
                        // Check if line contains emoji at start (for special formatting)
                        const startsWithEmoji = /^[\u{1F300}-\u{1F9FF}]/u.test(trimmedLine);
                        
                        return (
                            <Text 
                                key={`${pIndex}-${lIndex}`} 
                                style={[
                                    styles.botMessageText,
                                    isListItem && styles.listItemText,
                                    startsWithEmoji && styles.emojiLineText
                                ]}
                            >
                                {trimmedLine}
                            </Text>
                        );
                    })}
                </View>
            );
        });
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isUser = item.sender === 'user';
        const isFirstMessage = index === 0 || messages[index - 1]?.sender !== item.sender;
        
        return (
            <Animated.View 
                style={[
                    styles.messageRow, 
                    isUser ? styles.userMessageRow : styles.botMessageRow,
                    { opacity: fadeAnim }
                ]}
            >
                {/* Bot Avatar */}
                {!isUser && isFirstMessage && (
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.avatar}
                        >
                            <Ionicons name="medical" size={20} color="white" />
                        </LinearGradient>
                    </View>
                )}
                {!isUser && !isFirstMessage && <View style={styles.avatarPlaceholder} />}
                
                {/* Message Bubble */}
                {isUser ? (
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.messageBubble, styles.userMessageBubble]}
                    >
                    {item.isTyping ? (
                        <View style={styles.typingContainer}>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={[styles.typingText, { color: 'white' }]}>{item.text}</Text>
                        </View>
                    ) : (
                            <Text style={styles.userMessageText}>
                            {item.text}
                        </Text>
                    )}
                    </LinearGradient>
                ) : (
                    <View style={[styles.messageBubble, styles.botMessageBubble]}>
                        {item.isTyping ? (
                            <View style={styles.typingContainer}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.dot, styles.dot1]} />
                                    <View style={[styles.dot, styles.dot2]} />
                                    <View style={[styles.dot, styles.dot3]} />
                </View>
            </View>
                        ) : (
                            <View>
                                {renderFormattedText(item.text)}
                            </View>
                        )}
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.header}
                >
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={handleGoBack}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <View style={styles.headerAvatarContainer}>
                            <View style={styles.headerAvatar}>
                                <Ionicons name="medical" size={24} color="#667eea" />
                            </View>
                            <View style={[styles.statusDot, apiKeyConfigured && styles.statusDotActive]} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Dr. AI Assistant</Text>
                            <Text style={styles.headerSubtitle}>
                                {apiKeyConfigured ? '🟢 Trực tuyến' : '🔴 Chưa cấu hình'}
                            </Text>
                    </View>
                </View>
                    
                    <TouchableOpacity 
                        style={styles.headerMenuButton}
                        onPress={handleConfigureApiKey}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color="white" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Main Content with KeyboardAvoidingView */}
                <KeyboardAvoidingView 
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                >
                    {/* Messages Container */}
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.messageList}
                            style={styles.flatList}
                            showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                            onContentSizeChange={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                            }}
                            onLayout={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                            }}
                        />

                    {/* Input Container - Fixed at bottom */}
                    <View style={styles.inputContainer}>
                        {/* Quick Replies */}
                        {showQuickReplies && messages.length <= 3 && (
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={styles.quickRepliesContainer}
                                contentContainerStyle={styles.quickRepliesContent}
                            >
                                {quickReplies.map((reply) => (
                                    <TouchableOpacity
                                        key={reply.id}
                                        style={styles.quickReplyButton}
                                        onPress={() => handleQuickReply(reply.text)}
                                    >
                                        <Ionicons name={reply.icon as any} size={16} color="#667eea" />
                                        <Text style={styles.quickReplyText}>{reply.text}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Context Banner */}
                        {userContext.hasPets && (
                            <View style={styles.contextBanner}>
                                <Ionicons name="paw" size={16} color="#667eea" />
                                <Text style={styles.contextText}>
                                    Tôi thấy bạn đã có thú cưng. Tôi có thể tư vấn cụ thể hơn!
                                </Text>
                            </View>
                        )}
                        
                        {/* Input Row */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputWrapper}>
                            <TextInput
                                    ref={inputRef}
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                    placeholder="💬 Nhập câu hỏi của bạn..."
                                    placeholderTextColor="#aaa"
                                multiline
                                maxLength={500}
                                editable={!isLoading}
                                returnKeyType="send"
                                    blurOnSubmit={false}
                                onSubmitEditing={handleSend}
                                    onFocus={() => {
                                        setShowQuickReplies(false);
                                        // Scroll when input is focused
                                        setTimeout(() => {
                                            flatListRef.current?.scrollToEnd({ animated: true });
                                        }, 300);
                                    }}
                                />
                                {inputText.length > 0 && (
                                    <TouchableOpacity 
                                        style={styles.clearButton}
                                        onPress={() => setInputText('')}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#aaa" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.sendButton, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]} 
                                onPress={handleSend}
                                disabled={isLoading || !inputText.trim()}
                            >
                                <LinearGradient
                                    colors={isLoading || !inputText.trim() ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                                    style={styles.sendButtonGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                        <Ionicons name="send" size={20} color="white" />
                                )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Character count */}
                        {inputText.length > 400 && (
                            <Text style={styles.charCount}>
                                {inputText.length}/500
                            </Text>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1 
    },
    
    keyboardAvoidingView: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    
    container: { 
        flex: 1,
    },
    
    // Header styles
    header: {
        paddingTop: Platform.OS === 'ios' ? 12 : 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    
    headerAvatarContainer: {
        position: 'relative',
    },
    
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ff4444',
        borderWidth: 2,
        borderColor: 'white',
    },
    
    statusDotActive: {
        backgroundColor: '#4CAF50',
    },
    
    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    
    headerTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: 'white',
        marginBottom: 2,
    },
    
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    
    headerMenuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    flatList: {
        flex: 1,
    },
    
    messageList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        flexGrow: 1,
    },
    
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-end',
    },
    
    userMessageRow: { 
        justifyContent: 'flex-end',
        marginLeft: 50,
    },
    
    botMessageRow: { 
        justifyContent: 'flex-start',
        marginRight: 50,
    },
    
    avatarContainer: {
        marginRight: 8,
        marginBottom: 2,
    },
    
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    
    avatarPlaceholder: {
        width: 36,
        marginRight: 8,
    },
    
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        maxWidth: '100%',
    },
    
    userMessageBubble: {
        borderBottomRightRadius: 4,
        elevation: 3,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    
    botMessageBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    
    userMessageText: { 
        color: 'white', 
        fontSize: 15, 
        lineHeight: 22,
        fontWeight: '400',
    },
    
    botMessageText: { 
        color: '#2d3748', 
        fontSize: 15, 
        lineHeight: 22,
        fontWeight: '400',
        marginBottom: 4,
    },
    
    paragraph: {
        marginTop: 12,
    },
    
    listItemText: {
        marginLeft: 8,
        marginBottom: 6,
    },
    
    emojiLineText: {
        marginBottom: 8,
        fontWeight: '500',
    },
    
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    
    typingText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
    
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
    },
    
    dot1: {
        opacity: 0.4,
    },
    
    dot2: {
        opacity: 0.6,
    },
    
    dot3: {
        opacity: 0.8,
    },
    
    // Input Container - Fixed to bottom
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    
    quickRepliesContainer: {
        marginBottom: 12,
    },
    
    quickRepliesContent: {
        paddingRight: 16,
    },
    
    quickReplyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#667eea',
    },
    
    quickReplyText: {
        fontSize: 13,
        color: '#667eea',
        marginLeft: 6,
        fontWeight: '600',
    },
    
    contextBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#667eea',
    },
    
    contextText: {
        fontSize: 13,
        color: '#667eea',
        marginLeft: 10,
        flex: 1,
        fontWeight: '500',
    },
    
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    
    input: {
        minHeight: 48,
        maxHeight: 120,
        backgroundColor: '#f5f7fa',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingRight: 40,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2d3748',
        textAlignVertical: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    
    clearButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    sendButtonDisabled: {
        opacity: 0.6,
    },
    
    charCount: {
        fontSize: 11,
        color: '#aaa',
        textAlign: 'right',
        marginTop: 4,
    },
}); 