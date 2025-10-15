import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Dimensions, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card } from 'react-native-paper';

interface ContactInfo {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    details: string[];
    type: 'map' | 'email' | 'tel';
}

// Tọa độ phòng khám thú y Hương Nở - Thủ Dầu Một, Bình Dương
const CLINIC_COORDINATES = {
    latitude: 10982545, // Tọa độ chính xác cho Thủ Dầu Một, Bình Dương
    longitude: 106.674601,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
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

const MapSection = () => (
    <Card style={styles.mapCard} elevation={3}>
        <View style={styles.mapHeader}>
            <Ionicons name="map-outline" size={24} color="#007bff" />
            <Text style={styles.mapTitle}>Vị trí phòng khám</Text>
        </View>
        <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={CLINIC_COORDINATES}
            showsUserLocation={true}
            showsMyLocationButton={true}
        >
            <Marker
                coordinate={CLINIC_COORDINATES}
                title="Phòng khám thú y Hương Nở"
                description="235 Đ. Phú Lợi, Khu 4, Thủ Dầu Một, Bình Dương"
                pinColor="#07f"
            />
        </MapView>
        <TouchableOpacity 
            style={styles.directionsButton}
            onPress={() => handlePress('map', '235 Đ. Phú Lợi, Khu 4, Thủ Dầu Một, Bình Dương')}
        >
            <Ionicons name="navigate-outline" size={20} color="white" />
            <Text style={styles.directionsButtonText}>Chỉ đường</Text>
        </TouchableOpacity>
    </Card>
);

export default function ContactScreen() {
    const navigation = useNavigation();

    const handleDirectConsultation = () => {
        navigation.navigate('DirectConsultation' as never);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.headerNew}>
                    <Text style={styles.headerTitleNew}>Thông tin liên hệ</Text>
                    <Text style={styles.headerSubtitleNew}>Liên hệ với chúng tôi để được hỗ trợ nhanh chóng!</Text>
                </View>
                <View style={styles.contentNew}>
                    {/* Bản đồ */}
                    <MapSection />
                    
                    {/* Thông tin liên hệ */}
                    {contactData.map((item, index) => (
                        <ContactInfoRow key={index} item={item} />
                    ))}
                    
                    <View style={styles.chatSectionNew}>
                        <Text style={styles.chatSectionTitleNew}>Hỗ trợ trực tuyến</Text>
                        
                        {/* Nút tư vấn trực tiếp - nổi bật nhất */}
                        <TouchableOpacity
                            style={[styles.chatButtonNew, styles.directConsultationButtonNew]}
                            onPress={handleDirectConsultation}
                        >
                            <Ionicons name="call-outline" size={28} color="white" />
                            <Text style={styles.directConsultationTextNew}>Tư vấn trực tiếp với bác sĩ</Text>
                        </TouchableOpacity>
                        
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
    // Map
    mapCard: {
        borderRadius: 18,
        marginBottom: 18,
        backgroundColor: 'white',
        shadowColor: '#007bff',
        shadowOpacity: 0.8,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        overflow: 'hidden',
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007bff',
        marginLeft: 8,
    },
    map: {
        height: 250,
        width: Dimensions.get('window').width,
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        margin: 16,
        borderRadius: 8,
    },
    directionsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
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
    directConsultationButtonNew: {
        backgroundColor: '#28a745', // Màu xanh lá cây nổi bật
        borderWidth: 2,
        borderColor: '#20c997',
        shadowColor: '#28a745',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    directConsultationTextNew: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
}); 