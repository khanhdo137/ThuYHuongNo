import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

// --- Mock Data ---
const servicesData = [
    { id: '1', title: 'Khám và điều trị', description: 'Chẩn đoán và điều trị các bệnh lý phổ biến ở thú cưng.', icon: 'pulse-outline' },
    { id: '2', title: 'Tiêm phòng Vaccine', description: 'Bảo vệ thú cưng của bạn khỏi các bệnh truyền nhiễm nguy hiểm.', icon: 'shield-checkmark-outline' },
    { id: '3', title: 'Phẫu thuật', description: 'Thực hiện các ca phẫu thuật từ đơn giản đến phức tạp.', icon: 'cut-outline' },
    { id: '4', title: 'Spa & Grooming', description: 'Dịch vụ tắm, cắt tỉa lông, làm đẹp cho thú cưng.', icon: 'sparkles-outline' },
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

const serviceCategories = [
    { key: 'Khám và điều trị', icon: 'pulse-outline', description: 'Chẩn đoán và điều trị các bệnh lý phổ biến ở thú cưng.' },
    { key: 'Tiêm phòng Vaccine', icon: 'shield-checkmark-outline', description: 'Bảo vệ thú cưng của bạn khỏi các bệnh truyền nhiễm nguy hiểm.' },
    { key: 'Phẫu thuật', icon: 'cut-outline', description: 'Thực hiện các ca phẫu thuật từ đơn giản đến phức tạp.' },
    { key: 'Spa & Grooming', icon: 'sparkles-outline', description: 'Dịch vụ tắm, cắt tỉa lông, làm đẹp cho thú cưng.' },
];

// --- Content Components ---
const ServicesContent = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleSelectCategory = async (cat: string) => {
        setSelectedCategory(cat);
        setLoading(true);
        try {
            const res = await apiClient.get('/Service', { params: { category: cat } });
            const list = res.data.data || res.data;
            setServices(list);
        } catch (err) {
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedCategory) {
        return (
    <View style={styles.contentContainer}>
                {serviceCategories.map(item => (
                    <TouchableOpacity key={item.key} style={[styles.card, styles.serviceCard]} onPress={() => handleSelectCategory(item.key)}>
                <Ionicons name={item.icon as any} size={30} color="#007bff" style={styles.serviceIcon} />
                <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>{item.key}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    // Đang ở màn hình danh sách dịch vụ của 1 loại
    return (
        <View style={styles.contentContainer}>
            <TouchableOpacity onPress={() => setSelectedCategory(null)} style={{ marginBottom: 15 }}>
                <Text style={{ color: '#007bff', fontWeight: 'bold' }}>{'< Quay lại danh mục dịch vụ'}</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Dịch vụ: {selectedCategory}</Text>
            {loading ? <Text>Đang tải...</Text> : (
                services.length === 0 ? <Text>Không có dịch vụ nào.</Text> :
                services.map(s => {
                    const mediaLinks = extractMediaLinks(s.description || '');
                    const firstMedia = mediaLinks[0];
                    return (
                        <TouchableOpacity
                            key={s.serviceId}
                            style={[styles.card, { flexDirection: 'column', alignItems: 'flex-start', padding: 15, marginBottom: 10 }]}
                            onPress={() => (navigation as any).navigate('ServiceDetail', { service: s })}
                        >
                            {firstMedia && isImage(firstMedia) && (
                                <Image source={{ uri: firstMedia }} style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                            )}
                            {firstMedia && isMp4(firstMedia) && (
                                <Video source={{ uri: firstMedia }} style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 8 }} useNativeControls resizeMode={ResizeMode.CONTAIN} />
                            )}
                            {firstMedia && isYouTube(firstMedia) && (
                                <WebView
                                    source={{ uri: getYouTubeEmbedUrl(firstMedia) }}
                                    style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 8 }}
                                />
                            )}
                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{s.name}</Text>
                            <Text style={{ color: '#666', marginTop: 2 }} numberOfLines={2} ellipsizeMode="tail">{s.description}</Text>
                            <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                <Text style={{ color: '#007bff', fontWeight: '600', marginRight: 15 }}>Giá: {s.priceText || 'Liên hệ'}</Text>
                                <Text style={{ color: '#28a745', fontWeight: '600' }}>Thời lượng: {s.durationText || 'Liên hệ'}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}
    </View>
);
};

const NewsContent = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        setLoading(true);
        apiClient.get('/News?limit=20&page=1')
            .then(res => {
                const allNews = res.data.news || res.data.data || [];
                const filtered = allNews.filter((n: any) =>
                    ((n.tags || n.Tags || '').toLowerCase().includes('tintuc-sukien'))
                );
                setNews(filtered);
            })
            .catch(() => setNews([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Text>Đang tải...</Text>;
    if (news.length === 0) return <Text>Không có tin tức sự kiện.</Text>;

    return (
        <View style={styles.contentContainer}>
            {news.map(item => (
                <TouchableOpacity
                    key={item.newsId}
                    style={[styles.card, styles.newsCard]}
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                >
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <View style={styles.newsTextContainer}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const KnowledgeContent = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        setLoading(true);
        apiClient.get('/News?limit=20&page=1')
            .then(res => {
                const allNews = res.data.news || res.data.data || [];
                const filtered = allNews.filter((n: any) =>
                    ((n.tags || n.Tags || '').toLowerCase().includes('kienthuc'))
                );
                setNews(filtered);
            })
            .catch(() => setNews([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Text>Đang tải...</Text>;
    if (news.length === 0) return <Text>Không có bài kiến thức.</Text>;

    return (
        <View style={styles.contentContainer}>
            {news.map(item => (
                <TouchableOpacity
                    key={item.newsId}
                    style={[styles.card, styles.newsCard]}
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                >
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <View style={styles.newsTextContainer}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const VideoContent = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        setLoading(true);
        apiClient.get('/News?limit=20&page=1')
            .then(res => {
                const allNews = res.data.news || res.data.data || [];
                const filtered = allNews.filter((n: any) =>
                    ((n.tags || n.Tags || '').toLowerCase().includes('video'))
                );
                setNews(filtered);
            })
            .catch(() => setNews([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Text>Đang tải...</Text>;
    if (news.length === 0) return <Text>Không có video.</Text>;

    return (
        <View style={styles.contentContainer}>
            {news.map(item => (
                <TouchableOpacity
                    key={item.newsId}
                    style={[styles.card, styles.newsCard]}
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                >
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <View style={styles.newsTextContainer}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

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

export function ServiceDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    // @ts-ignore
    const { service } = route.params || {};
    if (!service) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Không tìm thấy thông tin dịch vụ.</Text></View>;
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <View style={{ padding: 20, paddingTop: 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                    <Ionicons name="arrow-back" size={28} color="#007bff" />
                </TouchableOpacity>
                <View style={{ minHeight: 40 }} />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{service.name}</Text>
                <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Giá: {service.priceText || 'Liên hệ'}</Text>
                <Text style={{ color: '#28a745', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Thời lượng: {service.durationText || 'Liên hệ'}</Text>
                {service.category && <Text style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Loại: {service.category}</Text>}
                <Text style={{ fontSize: 16, color: '#333', marginTop: 10 }}>{service.description}</Text>
            </View>
        </SafeAreaView>
    );
} 

function extractMediaLinks(text: string) {
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
    const matches = [...text.matchAll(urlRegex)];
    return matches.map(m => m[0]);
}

function isImage(url: string) {
    return url.match(/\.(jpg|jpeg|png|gif)$/i);
}

function isMp4(url: string) {
    return url.match(/\.mp4$/i);
}

function isYouTube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeEmbedUrl(url: string) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
    const videoId = ytMatch ? ytMatch[1] : '';
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
} 