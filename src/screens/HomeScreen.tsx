import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Button, Card, Divider, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-swiper';
import GradientBackground from '../components/GradientBackground';
import VirtualAssistant from '../components/VirtualAssistant';
import AssistantButton from '../components/AssistantButton';

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
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.sectionTitle}>🏥 Danh mục dịch vụ</Text>
                    <Text style={styles.sectionSubtitle}>Chọn loại dịch vụ bạn quan tâm</Text>
                </View>
                {serviceCategories.map((item, index) => (
                    <TouchableOpacity key={item.key} onPress={() => setSelectedCategory(item.key)} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryCard}
                        >
                            <View style={styles.categoryIconContainer}>
                                <Ionicons name={item.icon as any} size={32} color="white" />
                            </View>
                            <View style={styles.categoryContent}>
                                <Text style={styles.categoryTitle}>{item.key}</Text>
                                <Text style={styles.categoryDescription}>{item.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    // Đang ở màn hình danh sách dịch vụ của 1 loại
    return (
        <View style={{ padding: 16 }}>
            <TouchableOpacity 
                onPress={() => setSelectedCategory(null)} 
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={styles.backButtonText}>Quay lại danh mục</Text>
            </TouchableOpacity>
            
            <View style={{ marginBottom: 16, marginTop: 12 }}>
                <Text style={styles.sectionTitle}>📋 {selectedCategory}</Text>
                <Text style={styles.sectionSubtitle}>Danh sách dịch vụ hiện có</Text>
            </View>
            
            {loading && (
                <View style={styles.loadingContainer}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.loadingGradient}
                    >
                        <PaperActivityIndicator animating size="large" color="white" />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </LinearGradient>
                </View>
            )}
            {!loading && services.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Không có dịch vụ nào</Text>
                </View>
            )}
            {services.map((s, index) => {
                const mediaLinks = extractMediaLinks(s.description || '');
                const firstMedia = mediaLinks[0];
                return (
                    <TouchableOpacity 
                        key={s.serviceId} 
                        onPress={() => (navigation as any).navigate('ServiceDetail', { service: s })}
                        activeOpacity={0.9}
                    >
                        <View style={styles.serviceItemCard}>
                            {firstMedia && isImage(firstMedia) ? (
                                <View style={styles.serviceImageContainer}>
                                    <Image source={{ uri: firstMedia }} style={styles.serviceImage} />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                                        style={styles.serviceImageOverlay}
                                    />
                                </View>
                            ) : (
                                <View style={styles.serviceNoImage}>
                                    <Ionicons name="medical" size={40} color="#667eea" />
                                </View>
                            )}
                            
                            <View style={styles.serviceItemContent}>
                                <Text style={styles.serviceItemTitle}>{s.name}</Text>
                                <Text style={styles.serviceItemDescription} numberOfLines={2}>
                                    {s.description}
                                </Text>
                                
                                <View style={styles.serviceItemMeta}>
                                    <View style={styles.serviceMetaItem}>
                                        <Ionicons name="pricetag" size={16} color="#667eea" />
                                        <Text style={styles.serviceMetaText}>{s.priceText || 'Liên hệ'}</Text>
                                    </View>
                                    <View style={styles.serviceMetaItem}>
                                        <Ionicons name="time" size={16} color="#764ba2" />
                                        <Text style={styles.serviceMetaText}>{s.durationText || 'Liên hệ'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
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

    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            >
                <Ionicons name="chevron-back" size={20} color={page === 1 ? '#ccc' : '#667eea'} />
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>Trước</Text>
            </TouchableOpacity>
            <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>{page}</Text>
                <Text style={styles.paginationSeparator}>/</Text>
                <Text style={styles.paginationTotal}>{totalPages}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            >
                <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>Sau</Text>
                <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#ccc' : '#667eea'} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ padding: 16 }}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.loadingGradient}>
                        <PaperActivityIndicator animating size="large" color="white" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </LinearGradient>
                </View>
            )}
            {!loading && news.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="newspaper-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Không có tin tức sự kiện</Text>
                </View>
            )}
            {news.map(item => (
                <TouchableOpacity 
                    key={item.newsId} 
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                    activeOpacity={0.9}
                >
                    <View style={styles.newsCard}>
                        {item.imageUrl ? (
                            <View style={styles.newsImageContainer}>
                                <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.newsImageGradient}
                                >
                                    <Ionicons name="newspaper" size={24} color="white" />
                                </LinearGradient>
                            </View>
                        ) : (
                            <View style={styles.newsNoImage}>
                                <Ionicons name="newspaper" size={40} color="#667eea" />
                            </View>
                        )}
                        <View style={styles.newsContent}>
                            <Text style={styles.newsTitle}>{item.title}</Text>
                            <View style={styles.newsMetaContainer}>
                                <Ionicons name="calendar-outline" size={14} color="#999" />
                                <Text style={styles.newsDate}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
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

    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            >
                <Ionicons name="chevron-back" size={20} color={page === 1 ? '#ccc' : '#667eea'} />
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>Trước</Text>
            </TouchableOpacity>
            <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>{page}</Text>
                <Text style={styles.paginationSeparator}>/</Text>
                <Text style={styles.paginationTotal}>{totalPages}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            >
                <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>Sau</Text>
                <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#ccc' : '#667eea'} />
            </TouchableOpacity>
        </View>
    );

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
            {loading && (
                <View style={styles.loadingContainer}>
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.loadingGradient}>
                        <PaperActivityIndicator animating size="large" color="white" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </LinearGradient>
                </View>
            )}
            {!loading && news.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="book-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Không có bài kiến thức</Text>
                </View>
            )}
            {news.map(item => (
                <TouchableOpacity 
                    key={item.newsId} 
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                    activeOpacity={0.9}
                >
                    <View style={styles.knowledgeCard}>
                        {item.imageUrl ? (
                            <View style={styles.knowledgeImageContainer}>
                                <Image source={{ uri: item.imageUrl }} style={styles.knowledgeImage} />
                                <View style={styles.knowledgeBadge}>
                                    <Ionicons name="book" size={16} color="white" />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.knowledgeNoImage}>
                                <Ionicons name="book" size={40} color="#667eea" />
                            </View>
                        )}
                        <View style={styles.knowledgeContent}>
                            <Text style={styles.knowledgeTitle}>{item.title}</Text>
                            <View style={styles.knowledgeMetaContainer}>
                                <Ionicons name="time-outline" size={14} color="#999" />
                                <Text style={styles.knowledgeDate}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </View>
                </TouchableOpacity>
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

    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            >
                <Ionicons name="chevron-back" size={20} color={page === 1 ? '#ccc' : '#667eea'} />
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>Trước</Text>
            </TouchableOpacity>
            <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>{page}</Text>
                <Text style={styles.paginationSeparator}>/</Text>
                <Text style={styles.paginationTotal}>{totalPages}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            >
                <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>Sau</Text>
                <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#ccc' : '#667eea'} />
            </TouchableOpacity>
        </View>
    );

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
            {loading && (
                <View style={styles.loadingContainer}>
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.loadingGradient}>
                        <PaperActivityIndicator animating size="large" color="white" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </LinearGradient>
                </View>
            )}
            {!loading && news.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="videocam-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Không có video</Text>
                </View>
            )}
            {news.map(item => (
                <TouchableOpacity 
                    key={item.newsId} 
                    onPress={() => (navigation as any).navigate('NewsDetail', { news: item })}
                    activeOpacity={0.9}
                >
                    <View style={styles.videoCard}>
                        {item.imageUrl ? (
                            <View style={styles.videoImageContainer}>
                                <Image source={{ uri: item.imageUrl }} style={styles.videoImage} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.videoGradientOverlay}
                                >
                                    <View style={styles.playButton}>
                                        <Ionicons name="play" size={32} color="white" />
                                    </View>
                                </LinearGradient>
                            </View>
                        ) : (
                            <View style={styles.videoNoImage}>
                                <Ionicons name="videocam" size={40} color="#667eea" />
                            </View>
                        )}
                        <View style={styles.videoContent}>
                            <Text style={styles.videoTitle}>{item.title}</Text>
                            <View style={styles.videoMetaContainer}>
                                <Ionicons name="calendar-outline" size={14} color="#999" />
                                <Text style={styles.videoDate}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
            {renderPagination()}
        </View>
    );
};

const TABS = ['Dịch vụ', 'Tin tức', 'Kiến Thức', 'Video'];

// Mock banner images
const BANNER_IMAGES = [
    require('../../assets/images/Banner1.png'),
    require('../../assets/images/Banner2.png'),
    require('../../assets/images/Banner3.png'),
    require('../../assets/images/Banner4.png'),
    require('../../assets/images/Banner5.png'),
  ];

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState(0);
    const [resetSignal, setResetSignal] = useState(0);
    const [showAssistant, setShowAssistant] = useState(false);

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
        <GradientBackground>
            <SafeAreaView style={{ flex: 1 }}>
                <Surface style={{ flex: 1, backgroundColor: 'transparent' }}>
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
                <View style={styles.tabContainer}>
                    {TABS.map((tab, idx) => {
                        const isActive = activeTab === idx;
                        return (
                            <TouchableWithoutFeedback
                                key={tab}
                                onPress={() => {
                                    setActiveTab(idx);
                                    setResetSignal(s => s + 1);
                                }}
                            >
                                <View style={styles.tabButtonWrapper}>
                                    {isActive ? (
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.tabButtonActive}
                                        >
                                            <Text style={styles.tabTextActive} numberOfLines={2}>
                                                {tab}
                                            </Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.tabButtonInactive}>
                                            <Text style={styles.tabTextInactive} numberOfLines={2}>
                                                {tab}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableWithoutFeedback>
                        );
                    })}
                </View>
                <Divider />
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                    {renderContent()}
                </ScrollView>
            </Surface>
            <VirtualAssistant 
                screen="Home"
                visible={showAssistant}
                onClose={() => { console.log('HomeScreen: onClose called -> hide assistant'); setShowAssistant(false); }}
                onAction={(actionType, actionData) => {
                    console.log('HomeScreen: onAction', actionType, actionData);
                    if (actionType === 'book_appointment') {
                        navigation.navigate('ServiceDetail');
                        setShowAssistant(false);
                    } else if (actionType === 'view_service' && actionData?.serviceId) {
                        navigation.navigate('ServiceDetail', { serviceId: actionData.serviceId });
                        setShowAssistant(false);
                    }
                }}
            />
            <AssistantButton onPress={() => { console.log('HomeScreen: open assistant requested'); setShowAssistant(true); }} disabled={showAssistant} />
        </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    assistantContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
    },
    
    // Tab Container
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabButtonWrapper: {
        flex: 1,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    tabButtonInactive: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 20,
        backgroundColor: '#f5f7fa',
        borderWidth: 1,
        borderColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    tabTextActive: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center',
    },
    tabTextInactive: {
        color: '#667eea',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
    
    // Section Title
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#718096',
    },
    
    // Category Card (Services Categories)
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    categoryContent: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    categoryDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 18,
    },
    
    // Back Button
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f0f4ff',
        alignSelf: 'flex-start',
    },
    backButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    
    // Loading
    loadingContainer: {
        marginVertical: 40,
        alignItems: 'center',
    },
    loadingGradient: {
        paddingVertical: 24,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    
    // Empty State
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    
    // Service Item Card
    serviceItemCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    serviceImageContainer: {
        position: 'relative',
        height: 160,
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    serviceImageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    serviceNoImage: {
        height: 160,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceItemContent: {
        padding: 16,
    },
    serviceItemTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
    },
    serviceItemDescription: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 20,
        marginBottom: 12,
    },
    serviceItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceMetaText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    
    // News Card
    newsCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    newsImageContainer: {
        width: 120,
        height: 120,
        position: 'relative',
    },
    newsImage: {
        width: '100%',
        height: '100%',
    },
    newsImageGradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 8,
    },
    newsNoImage: {
        width: 120,
        height: 120,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    newsContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    newsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        lineHeight: 20,
    },
    newsMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    newsDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 6,
    },
    
    // Knowledge Card
    knowledgeCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    knowledgeImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
        position: 'relative',
    },
    knowledgeImage: {
        width: '100%',
        height: '100%',
    },
    knowledgeBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#667eea',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    knowledgeNoImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    knowledgeContent: {
        flex: 1,
    },
    knowledgeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        lineHeight: 20,
        marginBottom: 8,
    },
    knowledgeMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    knowledgeDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 6,
    },
    
    // Video Card
    videoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    videoImageContainer: {
        height: 180,
        position: 'relative',
    },
    videoImage: {
        width: '100%',
        height: '100%',
    },
    videoGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    videoNoImage: {
        height: 180,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContent: {
        padding: 12,
    },
    videoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        lineHeight: 20,
        marginBottom: 8,
    },
    videoMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    videoDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 6,
    },
    
    // Pagination
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f0f4ff',
        borderWidth: 1,
        borderColor: '#667eea',
    },
    paginationButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    paginationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
        marginHorizontal: 4,
    },
    paginationButtonTextDisabled: {
        color: '#ccc',
    },
    paginationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#667eea',
    },
    paginationText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    paginationSeparator: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginHorizontal: 8,
    },
    paginationTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    
    // Service Detail Styles
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    detailBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailServiceName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
        textAlign: 'center',
    },
    detailInfoCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    detailInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailInfoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    detailInfoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
    },
    detailCategoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    detailCategoryText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    detailDescriptionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailDescriptionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 12,
    },
    detailDescriptionText: {
        fontSize: 15,
        color: '#4a5568',
        lineHeight: 24,
    },
    detailActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    detailActionButtonText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
}); 

export function ServiceDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    // @ts-ignore
    const { service } = route.params || {};
    
    if (!service) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={64} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#999' }}>Không tìm thấy thông tin dịch vụ</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <GradientBackground>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header with Back Button */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.detailHeader}
                >
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.detailBackButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>Chi tiết dịch vụ</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                    {/* Service Name Card */}
                    <View style={styles.detailCard}>
                        <Text style={styles.detailServiceName}>{service.name}</Text>
                    </View>

                    {/* Price & Duration Card */}
                    <View style={styles.detailInfoCard}>
                        <View style={styles.detailInfoRow}>
                            <View style={styles.detailInfoItem}>
                                <Ionicons name="pricetag" size={24} color="#667eea" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.detailInfoLabel}>Giá dịch vụ</Text>
                                    <Text style={styles.detailInfoValue}>{service.priceText || 'Liên hệ'}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.detailInfoItem}>
                                <Ionicons name="time" size={24} color="#764ba2" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.detailInfoLabel}>Thời lượng</Text>
                                    <Text style={styles.detailInfoValue}>{service.durationText || 'Liên hệ'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Category */}
                    {service.category && (
                        <View style={styles.detailCategoryCard}>
                            <Ionicons name="folder" size={20} color="#667eea" />
                            <Text style={styles.detailCategoryText}>Danh mục: {service.category}</Text>
                        </View>
                    )}

                    {/* Description Card */}
                    <View style={styles.detailDescriptionCard}>
                        <Text style={styles.detailDescriptionTitle}>📋 Mô tả dịch vụ</Text>
                        <Text style={styles.detailDescriptionText}>{service.description}</Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.detailActionButton}
                        >
                            <Ionicons name="calendar" size={24} color="white" />
                            <Text style={styles.detailActionButtonText}>Đặt lịch ngay</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
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