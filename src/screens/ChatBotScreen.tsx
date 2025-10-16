import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const initialMessages: Message[] = [
    { id: '1', text: '🐾 Xin chào! Tôi là Dr. AI - Chatbot tư vấn thú y thông minh của phòng khám Thu Y Hương Nở!', sender: 'bot' },
    { id: '2', text: 'Tôi có thể giúp bạn:\n• Tư vấn chăm sóc thú cưng\n• Giới thiệu dịch vụ phù hợp\n• Hướng dẫn đặt lịch hẹn\n• Trả lời câu hỏi y tế\n• Cung cấp thông tin bác sĩ', sender: 'bot' },
    { id: '3', text: 'Hãy cho tôi biết bạn cần hỗ trợ gì nhé! 💬', sender: 'bot' },
];

export default function ChatBotScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const flatListRef = useRef<FlatList>(null);
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

    // Xử lý keyboard events
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            // Scroll to bottom when keyboard shows
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
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

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.botMessageRow]}>
                <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.botMessageBubble]}>
                    {item.isTyping ? (
                        <View style={styles.typingContainer}>
                            <ActivityIndicator size="small" color="#666" />
                            <Text style={styles.typingText}>{item.text}</Text>
                        </View>
                    ) : (
                        <Text style={isUser ? styles.userMessageText : styles.botMessageText}>
                            {item.text}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={handleGoBack}
                    >
                        <Ionicons name="arrow-back" size={24} color="#007bff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chatbot Tư vấn AI</Text>
                    <View style={styles.headerControls}>
                        {!apiKeyConfigured && (
                            <TouchableOpacity 
                                style={styles.configButton}
                                onPress={handleConfigureApiKey}
                            >
                                <Ionicons name="settings-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Main Content with KeyboardAvoidingView */}
                <KeyboardAvoidingView 
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Messages Container */}
                    <View style={styles.messagesContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.messageList}
                            style={styles.flatList}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }}
                            onLayout={() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }}
                        />
                    </View>

                    {/* Input Container - Fixed at bottom */}
                    <View style={styles.inputContainer}>
                        {/* Context Banner */}
                        {userContext.hasPets && (
                            <View style={styles.contextBanner}>
                                <Ionicons name="information-circle" size={16} color="#007bff" />
                                <Text style={styles.contextText}>
                                    Tôi thấy bạn đã có thú cưng. Tôi có thể tư vấn cụ thể hơn!
                                </Text>
                            </View>
                        )}

                        {/* Info Display */}
                        <View style={styles.infoDisplay}>
                            <View style={styles.infoItem}>
                                <Ionicons name="information-circle-outline" size={16} color="#007bff" />
                                <Text style={styles.infoText}>
                                    Chatbot AI có thể tư vấn về dịch vụ, lịch làm việc và chăm sóc thú cưng
                                </Text>
                            </View>
                            {!apiKeyConfigured && (
                                <View style={styles.warningItem}>
                                    <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
                                    <Text style={styles.warningText}>
                                        Cần cấu hình API key để sử dụng đầy đủ tính năng
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Input Row */}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Nhập tin nhắn..."
                                placeholderTextColor="#999"
                                multiline
                                maxLength={500}
                                editable={!isLoading}
                                returnKeyType="send"
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity 
                                style={[styles.sendButton, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]} 
                                onPress={handleSend}
                                disabled={isLoading || !inputText.trim()}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="send" size={24} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
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
    
    // Thêm KeyboardAvoidingView style
    keyboardAvoidingView: {
        flex: 1,
    },
    
    // Thêm Messages Container
    messagesContainer: {
        flex: 1,
    },
    
    container: { 
        flex: 1,
        // Bỏ position: 'relative'
    },
    
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    
    backButton: {
        padding: 10,
        marginRight: 12,
        borderRadius: 22,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    
    headerTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
        color: '#2c3e50',
    },
    
    headerControls: {
        flexDirection: 'row',
        gap: 10,
    },
    
    configButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FFE8E8',
    },
    
    flatList: {
        flex: 1,
    },
    
    messageList: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 20,
        flexGrow: 1,
    },
    
    messageRow: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    
    userMessageRow: { 
        justifyContent: 'flex-end' 
    },
    
    botMessageRow: { 
        justifyContent: 'flex-start' 
    },
    
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        maxWidth: '85%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    
    userMessageBubble: {
        backgroundColor: '#007bff',
        borderBottomRightRadius: 6,
    },
    
    botMessageBubble: {
        backgroundColor: '#f8f9fa',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    
    userMessageText: { 
        color: 'white', 
        fontSize: 16, 
        lineHeight: 22 
    },
    
    botMessageText: { 
        color: '#2c3e50', 
        fontSize: 16, 
        lineHeight: 22 
    },
    
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    
    typingText: {
        color: '#666',
        fontSize: 16,
        fontStyle: 'italic',
    },
    
    // Cập nhật Input Container - Bỏ position absolute
    inputContainer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
        // Bỏ position: 'absolute', bottom: 0, left: 0, right: 0
        // Bỏ zIndex: 5, elevation: 8
    },
    
    infoDisplay: {
        marginBottom: 15,
    },
    
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
    },
    
    infoText: {
        fontSize: 12,
        color: '#007bff',
        marginLeft: 6,
        flex: 1,
    },
    
    warningItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFE8E8',
        borderRadius: 8,
    },
    
    warningText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginLeft: 6,
        flex: 1,
    },
    
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: '#f8f9fa',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    
    // Context Banner
    contextBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#007bff',
    },
    
    contextText: {
        fontSize: 13,
        color: '#007bff',
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
}); 