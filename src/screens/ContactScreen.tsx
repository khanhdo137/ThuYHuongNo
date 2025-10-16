import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import GradientBackground from '../components/GradientBackground';

interface ContactInfo {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    details: string[];
    type: 'map' | 'email' | 'tel';
}

// Thông tin phòng khám
const CLINIC_INFO = {
    name: 'Phòng khám thú y Hương Nở',
    address: '235 Đ. Phú Lợi, Khu 4, Thủ Dầu Một, Bình Dương',
    workingHours: 'Thứ 2 - Chủ nhật: 7:00 - 21:00',
};

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
        details: ['2742486163560989'],
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
    <View style={styles.infoRowNew}>
        <View style={styles.iconContainerNew}>
            <Ionicons name={item.icon} size={28} color="#007bff" />
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
);

const LocationCard = () => (
    <Card style={styles.locationCard} elevation={4}>
        <Card.Content style={styles.locationCardContent}>
            <View style={styles.locationHeader}>
                <View style={styles.locationIconContainer}>
                    <Ionicons name="business" size={32} color="#007bff" />
                </View>
                <View style={styles.locationTextContainer}>
                    <Text style={styles.clinicName}>{CLINIC_INFO.name}</Text>
                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={16} color="#666" />
                        <Text style={styles.clinicAddress}>{CLINIC_INFO.address}</Text>
                    </View>
                    <View style={styles.addressRow}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.workingHours}>{CLINIC_INFO.workingHours}</Text>
                    </View>
                </View>
            </View>
            
            <TouchableOpacity 
                style={styles.directionsButton}
                onPress={() => handlePress('map', CLINIC_INFO.address)}
            >
                <Ionicons name="navigate" size={22} color="white" />
                <Text style={styles.directionsButtonText}>Chỉ đường đến phòng khám</Text>
            </TouchableOpacity>
        </Card.Content>
    </Card>
);

export default function ContactScreen() {
    const navigation = useNavigation();

    const handleDirectConsultation = () => {
        navigation.navigate('DirectConsultation' as never);
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.headerNew}>
                    <Text style={styles.headerTitleNew}>📞 Liên hệ với chúng tôi</Text>
                    <Text style={styles.headerSubtitleNew}>Chúng tôi luôn sẵn sàng hỗ trợ bạn!</Text>
                </View>
                
                <View style={styles.contentNew}>
                    {/* Thông tin vị trí */}
                    <LocationCard />
                    
                    {/* Thông tin liên hệ */}
                    <Card style={styles.contactCard} elevation={4}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>📋 Thông tin liên hệ</Text>
                            <Divider style={styles.divider} />
                            {contactData.map((item, index) => (
                                <View key={index}>
                                    <ContactInfoRow item={item} />
                                    {index < contactData.length - 1 && (
                                        <Divider style={styles.rowDivider} />
                                    )}
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                    
                    {/* Hỗ trợ trực tuyến */}
                    <Card style={styles.onlineCard} elevation={4}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>💬 Hỗ trợ trực tuyến</Text>
                            <Divider style={styles.divider} />
                            
                            {/* Nút tư vấn trực tiếp - nổi bật nhất */}
                            <TouchableOpacity
                                style={[styles.chatButtonNew, styles.directConsultationButtonNew]}
                                onPress={handleDirectConsultation}
                            >
                                <Ionicons name="videocam" size={26} color="white" />
                                <Text style={styles.directConsultationTextNew}>Tư vấn trực tiếp với bác sĩ</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.chatButtonNew, styles.messengerButtonNew]}
                                onPress={() => Linking.openURL('https://m.me/thuybinhduonghuongno')}
                            >
                                <Ionicons name="logo-facebook" size={24} color="white" />
                                <Text style={styles.chatButtonTextNew}>Chat qua Messenger</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.chatButtonNew, styles.zaloButtonNew]}
                                onPress={() => Linking.openURL('https://zalo.me/0973560989')}
                            >
                                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                                <Text style={styles.chatButtonTextNew}>Chat qua Zalo</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.chatButtonNew, styles.chatbotButtonNew]}
                                onPress={() => navigation.navigate('ChatBot' as never)}
                            >
                                <Ionicons name="sparkles" size={24} color="white" />
                                <Text style={styles.chatButtonTextNew}>Chatbot AI Tư vấn</Text>
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    // Header
    headerNew: {
        paddingVertical: 28,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 2,
        borderBottomColor: '#007bff',
        marginBottom: 0,
    },
    headerTitleNew: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
        marginTop: 8,
        marginBottom: 6,
    },
    headerSubtitleNew: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    // Content
    contentNew: {
        padding: 16,
        paddingTop: 16,
    },
    // Location Card
    locationCard: {
        borderRadius: 20,
        marginBottom: 16,
        backgroundColor: 'white',
        shadowColor: '#007bff',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    locationCardContent: {
        padding: 4,
    },
    locationHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    locationIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e7f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    clinicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4,
    },
    clinicAddress: {
        fontSize: 14,
        color: '#555',
        marginLeft: 6,
        flex: 1,
        lineHeight: 20,
    },
    workingHours: {
        fontSize: 14,
        color: '#28a745',
        marginLeft: 6,
        fontWeight: '600',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    directionsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Contact Card
    contactCard: {
        borderRadius: 20,
        marginBottom: 16,
        backgroundColor: 'white',
        shadowColor: '#007bff',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    // Online Card
    onlineCard: {
        borderRadius: 20,
        marginBottom: 16,
        backgroundColor: 'white',
        shadowColor: '#007bff',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 12,
    },
    divider: {
        marginBottom: 16,
        backgroundColor: '#007bff',
        height: 2,
    },
    rowDivider: {
        marginVertical: 12,
        backgroundColor: '#e9ecef',
    },
    infoRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainerNew: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e7f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainerNew: {
        flex: 1,
    },
    titleNew: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    detailTextNew: {
        fontSize: 15,
        color: '#007bff',
        lineHeight: 22,
        marginBottom: 2,
        textDecorationLine: 'underline',
    },
    // Chat Buttons
    chatButtonNew: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    chatButtonTextNew: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    messengerButtonNew: {
        backgroundColor: '#0084ff',
    },
    zaloButtonNew: {
        backgroundColor: '#0068ff',
    },
    chatbotButtonNew: {
        backgroundColor: '#4285f4',
    },
    directConsultationButtonNew: {
        backgroundColor: '#28a745',
        borderWidth: 2,
        borderColor: '#20c997',
        shadowColor: '#28a745',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 7,
        paddingVertical: 16,
    },
    directConsultationTextNew: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
    },
}); 