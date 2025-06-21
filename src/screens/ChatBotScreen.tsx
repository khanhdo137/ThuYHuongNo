import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

const initialMessages: Message[] = [
    { id: '1', text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?', sender: 'bot' },
    { id: '2', text: 'Bạn có thể hỏi tôi về các dịch vụ, lịch làm việc, hoặc các vấn đề sức khỏe của thú cưng.', sender: 'bot' },
];

export default function ChatBotScreen() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim().length === 0) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        // Simulate bot response
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Cảm ơn bạn đã hỏi. Hiện tại tôi vẫn đang trong quá trình học hỏi. Tôi sẽ chuyển câu hỏi này đến nhân viên tư vấn.',
                sender: 'bot',
            };
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.botMessageRow]}>
                <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.botMessageBubble]}>
                    <Text style={isUser ? styles.userMessageText : styles.botMessageText}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chatbot Tư vấn</Text>
            </View>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { flex: 1 },
    header: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    messageList: {
        paddingHorizontal: 10,
        paddingTop: 10,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: '#f1f1f1',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 