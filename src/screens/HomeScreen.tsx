import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Surface } from 'react-native-paper';
import Swiper from 'react-native-swiper';

// --- PAGE_SIZE dùng cho tất cả các content ---
const PAGE_SIZE = 10;

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
const ServicesContent = ({ resetSignal }: { resetSignal: number }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigation = useNavigation();

    const fetchServices = async (cat: string, pageNum = 1) => {
        setLoading(true);
        try {
            const res = await apiClient.get('/Service', { params: { category: cat, page: pageNum, limit: PAGE_SIZE } });
            const list = res.data.data || res.data.services || res.data || [];
            setServices(list);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) {
            setServices([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSelectedCategory(null);
        setPage(1);
    }, [resetSignal]);

    useEffect(() => {
        if (selectedCategory) {
            fetchServices(selectedCategory, page);
        }
    }, [selectedCategory, page]);

    const handleSelectCategory = (cat: string) => {
        setSelectedCategory(cat);
        setPage(1);
    };

    if (!selectedCategory) {
        return (
            <View style={{ padding: 16 }}>
                <PaperText variant="titleMedium" style={{ marginBottom: 12 }}>Danh mục dịch vụ</PaperText>
                {serviceCategories.map(item => (
                    <Card key={item.key} style={{ marginBottom: 12 }} onPress={() => setSelectedCategory(item.key)}>
                        <Card.Title title={item.key} left={props => <Ionicons name={item.icon as any} size={30} color="#007bff" />} />
                        <Card.Content>
                            <PaperText>{item.description}</PaperText>
                        </Card.Content>
                    </Card>
                ))}
            </View>
        );
    }

    // Đang ở màn hình danh sách dịch vụ của 1 loại
    return (
        <View style={{ padding: 16 }}>
            <Button mode="outlined" onPress={() => setSelectedCategory(null)} style={{ marginBottom: 10 }}>
                {"< Quay lại danh mục dịch vụ"}
            </Button>
            <PaperText variant="titleMedium" style={{ marginBottom: 10 }}>Dịch vụ: {selectedCategory}</PaperText>
            {loading && (
                <View style={{ alignItems: 'center', marginVertical: 30 }}>
                    <PaperActivityIndicator animating size="large" color="#007bff" />
                    <PaperText style={{ marginTop: 10, color: '#007bff' }}>Đang tải dữ liệu...</PaperText>
                </View>
            )}
            {!loading && services.length === 0 && <PaperText>Không có dịch vụ nào.</PaperText>}
            {services.map(s => {
                const mediaLinks = extractMediaLinks(s.description || '');
                const firstMedia = mediaLinks[0];
                return (
                    <Card key={s.serviceId} style={{ marginBottom: 12 }} onPress={() => (navigation as any).navigate('ServiceDetail', { service: s })}>
                        {firstMedia && isImage(firstMedia) && (
                            <Card.Cover source={{ uri: firstMedia }} style={{ height: 140 }} />
                        )}
                        <Card.Content>
                            <PaperText variant="titleMedium">{s.name}</PaperText>
                            <PaperText style={{ color: '#666', marginTop: 2 }} numberOfLines={2}>{s.description}</PaperText>
                            <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                <PaperText style={{ color: '#007bff', fontWeight: '600', marginRight: 15 }}>Giá: {s.priceText || 'Liên hệ'}</PaperText>
                                <PaperText style={{ color: '#28a745', fontWeight: '600' }}>Thời lượng: {s.durationText || 'Liên hệ'}</PaperText>
                            </View>
                        </Card.Content>
                    </Card>
                );
            })}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ marginHorizontal: 10 }}>
                    Trang trước
                </Button>
                <PaperText style={{ alignSelf: 'center', fontWeight: 'bold', marginHorizontal: 10 }}>{page} / {totalPages}</PaperText>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ marginHorizontal: 10 }}>
                    Trang sau
                </Button>
            </View>
        </View>
    );
};


const NewsContent = ({ resetSignal }: { resetSignal: number }) => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigation = useNavigation();

    const fetchNews = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await apiClient.get('/News/by-tag', { params: { tag: 'Tintuc-sukien', page: pageNum, limit: PAGE_SIZE } });
            setNews(res.data.news || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch {
            setNews([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [resetSignal]);

    useEffect(() => {
        fetchNews(page);
    }, [page]);

    return (
        <View style={{ padding: 16 }}>
            {loading && <PaperText>Đang tải...</PaperText>}
            {!loading && news.length === 0 && <PaperText>Không có tin tức sự kiện.</PaperText>}
            {news.map(item => (
                <Card key={item.newsId} style={{ marginBottom: 12 }} onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}>
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <Card.Content>
                        <PaperText variant="titleMedium">{item.title}</PaperText>
                        <PaperText style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</PaperText>
                    </Card.Content>
                </Card>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ marginHorizontal: 10 }}>
                    Trang trước
                </Button>
                <PaperText style={{ alignSelf: 'center', fontWeight: 'bold', marginHorizontal: 10 }}>{page} / {totalPages}</PaperText>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ marginHorizontal: 10 }}>
                    Trang sau
                </Button>
            </View>
        </View>
    );
};

const KnowledgeContent = ({ resetSignal }: { resetSignal: number }) => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigation = useNavigation();

    const fetchNews = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await apiClient.get('/News/by-tag', { params: { tag: 'Kienthuc', page: pageNum, limit: PAGE_SIZE } });
            setNews(res.data.news || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch {
            setNews([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [resetSignal]);

    useEffect(() => {
        fetchNews(page);
    }, [page]);

    return (
        <View style={{ padding: 16 }}>
            {loading && <PaperText>Đang tải...</PaperText>}
            {!loading && news.length === 0 && <PaperText>Không có bài kiến thức.</PaperText>}
            {news.map(item => (
                <Card key={item.newsId} style={{ marginBottom: 12 }} onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}>
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <Card.Content>
                        <PaperText variant="titleMedium">{item.title}</PaperText>
                        <PaperText style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</PaperText>
                    </Card.Content>
                </Card>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ marginHorizontal: 10 }}>
                    Trang trước
                </Button>
                <PaperText style={{ alignSelf: 'center', fontWeight: 'bold', marginHorizontal: 10 }}>{page} / {totalPages}</PaperText>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ marginHorizontal: 10 }}>
                    Trang sau
                </Button>
            </View>
        </View>
    );
};

const VideoContent = ({ resetSignal }: { resetSignal: number }) => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigation = useNavigation();

    const fetchNews = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await apiClient.get('/News/by-tag', { params: { tag: 'Video', page: pageNum, limit: PAGE_SIZE } });
            setNews(res.data.news || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch {
            setNews([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [resetSignal]);

    useEffect(() => {
        fetchNews(page);
    }, [page]);

    return (
        <View style={{ padding: 16 }}>
            {loading && <PaperText>Đang tải...</PaperText>}
            {!loading && news.length === 0 && <PaperText>Không có video.</PaperText>}
            {news.map(item => (
                <Card key={item.newsId} style={{ marginBottom: 12 }} onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}>
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}
                    <Card.Content>
                        <PaperText variant="titleMedium">{item.title}</PaperText>
                        <PaperText style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</PaperText>
                    </Card.Content>
                </Card>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ marginHorizontal: 10 }}>
                    Trang trước
                </Button>
                <PaperText style={{ alignSelf: 'center', fontWeight: 'bold', marginHorizontal: 10 }}>{page} / {totalPages}</PaperText>
                <Button mode="contained-tonal" onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ marginHorizontal: 10 }}>
                    Trang sau
                </Button>
            </View>
        </View>
    );
};

const TABS = ['Dịch vụ', 'Tin tức-sự kiện', 'Kiến Thức', 'Video'];

// Mock banner images
const BANNER_IMAGES = [
    require('../../assets/images/Banner1.png'),
    require('../../assets/images/Banner2.png'),
    require('../../assets/images/Banner3.png'),
    require('../../assets/images/Banner4.png'),
    require('../../assets/images/Banner5.png'),
  ];

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState(0);
    const [resetSignal, setResetSignal] = useState(0);

    const renderContent = () => {
        switch (activeTab) {
            case 0:
                return <ServicesContent resetSignal={resetSignal} />;
            case 1:
                return <NewsContent resetSignal={resetSignal} />;
            case 2:
                return <KnowledgeContent resetSignal={resetSignal} />;
            case 3:
                return <VideoContent resetSignal={resetSignal} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <Surface style={{ flex: 1 }}>
                {/* Banner Swiper */}
                <View style={{ height: 180 }}>
                    <Swiper autoplay showsPagination dotColor="#eee" activeDotColor="#007bff">
                        {BANNER_IMAGES.map((img, idx) => (
                            <Image
                                key={idx}
                                source={img}
                                style={{ width: '100%', height: 180, resizeMode: 'cover', borderRadius: 0 }}
                            />
                        ))}
                    </Swiper>
                </View>
                <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 4 }}>
                    {TABS.map((tab, idx) => (
                        <Button
                            key={tab}
                            mode={activeTab === idx ? 'contained' : 'text'}
                            onPress={() => {
                                setActiveTab(idx);
                                setResetSignal(s => s + 1);
                            }}
                            style={{ flex: 1, marginHorizontal: 4, borderRadius: 20 }}
                            labelStyle={{ color: activeTab === idx ? 'white' : '#007bff', fontWeight: 'bold' }}
                            contentStyle={{ height: 40 }}
                        >
                            {tab}
                        </Button>
                    ))}
                </View>
                <Divider />
                <ScrollView style={{ flex: 1 }}>
                    {renderContent()}
                </ScrollView>
            </Surface>
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