import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ContactInfo {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    details: string[];
    type: 'map' | 'email' | 'tel';
}

const contactData: ContactInfo[] = [
    {
        icon: 'location-outline',
        title: 'Địa chỉ',
        details: ['235 Đ. Phú Lợi, Khu 4, Thủ Dầu Một, Bình Dương'],
        type: 'map'
    },
    {
        icon: 'mail-outline',
        title: 'Email',
        details: ['info@thuybinhduong.com', 'huongno@thuybinhduong.com'],
        type: 'email'
    },
    {
        icon: 'call-outline',
        title: 'Số điện thoại',
        details: ['02742480616', '0973560989'],
        type: 'tel'
    }
];

const handlePress = async (type: 'map' | 'email' | 'tel', value: string) => {
    let url = '';
    if (type === 'map') {
        const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
        url = scheme + encodeURIComponent(value);
    } else if (type === 'email') {
        url = `mailto:${value}`;
    } else if (type === 'tel') {
        url = `tel:${value}`;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
        await Linking.openURL(url);
    } else {
        Alert.alert(`Không thể mở`, `Không tìm thấy ứng dụng phù hợp để xử lý yêu cầu này.`);
    }
};

const ContactInfoRow = ({ item }: { item: ContactInfo }) => (
    <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
            <Ionicons name={item.icon} size={28} color="#007bff" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            {item.details.map((detail, index) => (
                <TouchableOpacity key={index} onPress={() => handlePress(item.type, detail)}>
                    <Text style={styles.detailText}>{detail}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

export default function ContactScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Thông tin liên hệ</Text>
                </View>
                <View style={styles.content}>
                    {contactData.map((item, index) => (
                        <ContactInfoRow key={index} item={item} />
                    ))}
                     {/* New Chat Links Section */}
                    <View style={styles.chatSection}>
                        <Text style={styles.chatSectionTitle}>Hỗ trợ trực tuyến</Text>
                        <TouchableOpacity
                            style={[styles.chatButton, styles.messengerButton]}
                            onPress={() => Linking.openURL('https://m.me/thuybinhduonghuongno')}
                        >
                            <Ionicons name="chatbubbles-outline" size={24} color="white" />
                            <Text style={styles.chatButtonText}>Liên hệ qua Messenger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.chatButton, styles.zaloButton]}
                            onPress={() => Linking.openURL('https://zalo.me/0973560989')}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                            <Text style={styles.chatButtonText}>Liên hệ qua Zalo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.chatButton, styles.chatbotButton]}
                            onPress={() => navigation.navigate('ChatBot' as never)}
                        >
                            <Ionicons name="sparkles-outline" size={24} color="white" />
                            <Text style={styles.chatButtonText}>Chatbot Tư vấn</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 20,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#e7f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 15,
        color: '#007bff',
        lineHeight: 22,
    },
    chatSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    chatSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
        textAlign: 'center',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    chatButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    messengerButton: {
        backgroundColor: '#0084ff',
    },
    zaloButton: {
        backgroundColor: '#0068ff',
    },
    chatbotButton: {
        backgroundColor: '#343a40',
    },
}); 