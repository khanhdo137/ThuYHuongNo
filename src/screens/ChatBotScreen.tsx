import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import geminiService, { fetchAllServicesForPrompt } from '../services/geminiService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    isTyping?: boolean;
}

const initialMessages: Message[] = [
    { id: '1', text: 'Xin chào! Tôi là chatbot tư vấn thú y của phòng khám Thu Y Hương No. Tôi có thể giúp gì cho bạn hôm nay?', sender: 'bot' },
    { id: '2', text: 'Bạn có thể hỏi tôi về các dịch vụ, lịch làm việc, cách chăm sóc thú cưng, hoặc các vấn đề sức khỏe của thú cưng.', sender: 'bot' },
];

export default function ChatBotScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
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
    }, []);

    // Xử lý keyboard events
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

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
                    setMessages(prev => [...prev.filter(m => !m.isTyping), fallbackResponse]);
                    setIsLoading(false);
                }, 1000);
                return;
            }

            // Lấy danh sách dịch vụ để đưa vào prompt
            const servicesText = await fetchAllServicesForPrompt();
            let prompt = userMessage.text;
            if (servicesText) {
                prompt = `Danh sách dịch vụ của phòng khám:
${servicesText}

Câu hỏi của khách hàng: ${userMessage.text}`;
            }

            // Gọi Gemini AI với prompt có dịch vụ
            const response = await geminiService.sendMessage({
                message: prompt
            });

            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'bot',
            };
            setMessages(prev => [...prev.filter(m => !m.isTyping), botResponse]);
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API:', error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với phòng khám.',
                sender: 'bot',
            };
            setMessages(prev => [...prev.filter(m => !m.isTyping), errorResponse]);
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
        <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.container}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[
                        styles.messageList,
                        { paddingBottom: keyboardHeight > 0 ? 20 : 10 }
                    ]}
                    style={styles.flatList}
                />
                <View style={[
                    styles.inputContainer,
                    { marginBottom: keyboardHeight > 0 ? 0 : 0 }
                ]}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        editable={!isLoading}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { 
        flex: 1,
        position: 'relative'
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
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // Để cân bằng với back button
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
        paddingHorizontal: 10,
        paddingTop: 10,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    userMessageRow: { justifyContent: 'flex-end' },
    botMessageRow: { justifyContent: 'flex-start' },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: '80%',
    },
    userMessageBubble: {
        backgroundColor: '#007bff',
        borderBottomRightRadius: 5,
    },
    botMessageBubble: {
        backgroundColor: '#e5e5ea',
        borderBottomLeftRadius: 5,
    },
    userMessageText: { color: 'white', fontSize: 16 },
    botMessageText: { color: 'black', fontSize: 16 },
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f1f1f1',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
        textAlignVertical: 'top',
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