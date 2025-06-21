import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Mock Data ---
const servicesData = [
    { id: '1', title: 'Khám và điều trị', description: 'Chẩn đoán và điều trị các bệnh lý phổ biến ở thú cưng.', icon: 'pulse-outline' },
    { id: '2', title: 'Tiêm phòng Vaccine', description: 'Bảo vệ thú cưng của bạn khỏi các bệnh truyền nhiễm nguy hiểm.', icon: 'shield-checkmark-outline' },
    { id: '3', title: 'Phẫu thuật', description: 'Thực hiện các ca phẫu thuật từ đơn giản đến phức tạp.', icon: 'cut-outline' },
    { id: '4', title: 'Spa & Grooming', description: 'Dịch vụ tắm, cắt tỉa lông, làm đẹp cho thú cưng.', icon: 'sparkles-outline' },
];

const newsData = [
    { id: '1', title: 'Ngày hội thú cưng 2025', date: '25/07/2025', image: 'https://via.placeholder.com/400x200.png?text=Pet+Day+2025' },
    { id: '2', title: 'Lưu ý khi dắt chó đi dạo mùa hè', date: '18/06/2025', image: 'https://via.placeholder.com/400x200.png?text=Summer+Walk' },
];

const knowledgeData = [
    { id: '1', title: 'Dấu hiệu nhận biết chó bị sốt', category: 'Chăm sóc sức khỏe' },
    { id: '2', title: 'Nên cho mèo ăn loại hạt nào?', category: 'Dinh dưỡng' },
    { id: '3', title: 'Cách huấn luyện chó đi vệ sinh đúng chỗ', category: 'Huấn luyện' },
];

const videoData = [
    { id: '1', title: 'Hướng dẫn cấp cứu khi thú cưng bị hóc', duration: '10:32', thumbnail: 'https://via.placeholder.com/400x200.png?text=First+Aid+Video' },
    { id: '2', title: '5 trò chơi vui nhộn cùng mèo cưng', duration: '08:15', thumbnail: 'https://via.placeholder.com/400x200.png?text=Cat+Games' },
];


// --- Content Components ---
const ServicesContent = () => (
    <View style={styles.contentContainer}>
        {servicesData.map(item => (
            <View key={item.id} style={[styles.card, styles.serviceCard]}>
                <Ionicons name={item.icon as any} size={30} color="#007bff" style={styles.serviceIcon} />
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
            </View>
        ))}
    </View>
);

const NewsContent = () => (
    <View style={styles.contentContainer}>
        {newsData.map(item => (
            <View key={item.id} style={[styles.card, styles.newsCard]}>
                <Image source={{ uri: item.image }} style={styles.newsImage} />
                <View style={styles.newsTextContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.newsDate}>{item.date}</Text>
                </View>
            </View>
        ))}
    </View>
);

const KnowledgeContent = () => (
    <View style={styles.contentContainer}>
        {knowledgeData.map(item => (
            <View key={item.id} style={[styles.card, styles.knowledgeCard]}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.knowledgeCategory}>{item.category}</Text>
            </View>
        ))}
    </View>
);

const VideoContent = () => (
     <View style={styles.contentContainer}>
        {videoData.map(item => (
            <View key={item.id} style={[styles.card, styles.videoCard]}>
                <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
                <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle-outline" size={60} color="white" />
                </View>
                <View style={styles.videoTextContainer}>
                    <Text style={styles.videoTitle}>{item.title}</Text>
                    <Text style={styles.videoDuration}>{item.duration}</Text>
                </View>
            </View>
        ))}
    </View>
);

const TABS = ['Dịch vụ', 'Tin tức-sự kiện', 'Kiến Thức', 'Video'];

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState(TABS[0]);

    const renderContent = () => {
        switch (activeTab) {
            case 'Dịch vụ':
                return <ServicesContent />;
            case 'Tin tức-sự kiện':
                return <NewsContent />;
            case 'Kiến Thức':
                return <KnowledgeContent />;
            case 'Video':
                return <VideoContent />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Trang chủ</Text>
                </View>
                <View style={styles.tabBar}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <ScrollView>
                    {renderContent()}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tabItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    activeTabItem: {
        backgroundColor: '#007bff',
    },
    tabText: {
        color: '#333',
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    contentContainer: {
        padding: 15,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        overflow: 'hidden',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    // Service Styles
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    serviceIcon: {
        marginRight: 15,
    },
    // News Styles
    newsCard: {
        
    },
    newsImage: {
        width: '100%',
        height: 150,
    },
    newsTextContainer: {
        padding: 15,
    },
    newsDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
    // Knowledge Styles
    knowledgeCard: {
        padding: 20,
    },
    knowledgeCategory: {
        fontSize: 13,
        color: '#007bff',
        marginTop: 8,
        fontWeight: '500',
    },
    // Video Styles
    videoCard: {
        position: 'relative',
    },
    videoThumbnail: {
        width: '100%',
        height: 180,
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoTextContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    videoTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    videoDuration: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    }
}); 