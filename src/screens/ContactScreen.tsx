import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from 'react-native-paper';

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
    <Card style={styles.card} elevation={3}>
        <View style={styles.infoRowNew}>
            <View style={styles.iconContainerNew}>
                <Ionicons name={item.icon} size={32} color="#007bff" />
            </View>
            <View style={styles.textContainerNew}>
                <Text style={styles.titleNew}>{item.title}</Text>
                {item.details.map((detail, index) => (
                    <TouchableOpacity key={index} onPress={() => handlePress(item.type, detail)}>
                        <Text style={styles.detailTextNew}>{detail}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    </Card>
);

export default function ContactScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.headerNew}>
                    <Ionicons name="call" size={44} color="#007bff" style={{ marginBottom: 8 }} />
                    <Text style={styles.headerTitleNew}>Thông tin liên hệ</Text>
                    <Text style={styles.headerSubtitleNew}>Liên hệ với chúng tôi để được hỗ trợ nhanh chóng!</Text>
                </View>
                <View style={styles.contentNew}>
                    {contactData.map((item, index) => (
                        <ContactInfoRow key={index} item={item} />
                    ))}
                    <View style={styles.chatSectionNew}>
                        <Text style={styles.chatSectionTitleNew}>Hỗ trợ trực tuyến</Text>
                        <TouchableOpacity
                            style={[styles.chatButtonNew, styles.messengerButtonNew]}
                            onPress={() => Linking.openURL('https://m.me/thuybinhduonghuongno')}
                        >
                            <Ionicons name="chatbubbles-outline" size={26} color="white" />
                            <Text style={styles.chatButtonTextNew}>Liên hệ qua Messenger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.chatButtonNew, styles.zaloButtonNew]}
                            onPress={() => Linking.openURL('https://zalo.me/0973560989')}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={26} color="white" />
                            <Text style={styles.chatButtonTextNew}>Liên hệ qua Zalo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.chatButtonNew, styles.chatbotButtonNew]}
                            onPress={() => navigation.navigate('ChatBot' as never)}
                        >
                            <Ionicons name="sparkles-outline" size={26} color="white" />
                            <Text style={styles.chatButtonTextNew}>Chatbot Tư vấn</Text>
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
    // Header
    headerNew: {
        paddingVertical: 32,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        marginBottom: 0,
    },
    headerTitleNew: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 4,
    },
    headerSubtitleNew: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 2,
    },
    // Card
    card: {
        borderRadius: 18,
        marginBottom: 18,
        backgroundColor: 'white',
        shadowColor: '#007bff',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    infoRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    iconContainerNew: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#e7f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    textContainerNew: {
        flex: 1,
    },
    titleNew: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007bff',
        marginBottom: 6,
    },
    detailTextNew: {
        fontSize: 16,
        color: '#343a40',
        lineHeight: 22,
        marginBottom: 2,
        textDecorationLine: 'underline',
    },
    // Content
    contentNew: {
        padding: 20,
        paddingTop: 10,
    },
    // Chat Section
    chatSectionNew: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    chatSectionTitleNew: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 18,
        textAlign: 'center',
    },
    chatButtonNew: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 4,
        elevation: 4,
    },
    chatButtonTextNew: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    messengerButtonNew: {
        backgroundColor: '#8e44ad', // Messenger tím
    },
    zaloButtonNew: {
        backgroundColor: '#0068ff', // Zalo đặc trưng
    },
    chatbotButtonNew: {
        backgroundColor: '#4f8cff', // Màu giống Gemini (xanh tím)
    },
}); 