import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { Dimensions, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

function extractMediaLinks(text: string) {
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=)?([\w\-]+))/gi;
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

function removeMediaLinksFromText(text: string) {
    // Loại bỏ các đường dẫn ảnh, video, youtube khỏi mô tả
    return text.replace(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function splitDescriptionWithMedia(text: string) {
    // Regex khớp media link
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(match[0]);
        lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.filter(p => p && p.trim() !== '');
}

export default function ServiceDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    // @ts-ignore
    const { service } = route.params || {};
    if (!service) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Không tìm thấy thông tin dịch vụ.</Text></View>;
    const mediaLinks = extractMediaLinks(service.description || '');
    const descriptionParts = splitDescriptionWithMedia(service.description || '');
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                    <Ionicons name="arrow-back" size={28} color="#007bff" />
                </TouchableOpacity>
                <View style={{ minHeight: 40 }} />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{service.name}</Text>
                <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Giá: {service.priceText || 'Liên hệ'}</Text>
                <Text style={{ color: '#28a745', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Thời lượng: {service.durationText || 'Liên hệ'}</Text>
                {service.category && <Text style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Loại: {service.category}</Text>}
                {/* Render mô tả và media đúng thứ tự */}
                {descriptionParts.map((part, idx) => {
                    if (isImage(part)) {
                        return <Image key={idx} source={{ uri: part }} style={{ width: width - 40, height: 200, borderRadius: 10, marginBottom: 15 }} resizeMode="cover" />;
                    } else if (isMp4(part)) {
                        return <Video key={idx} source={{ uri: part }} style={{ width: width - 40, height: 220, borderRadius: 10, marginBottom: 15 }} useNativeControls resizeMode={ResizeMode.CONTAIN} />;
                    } else if (isYouTube(part)) {
                        let videoId = '';
                        const ytMatch = part.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
                        if (ytMatch) videoId = ytMatch[1];
                        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : part;
                        return <WebView key={idx} source={{ uri: embedUrl }} style={{ width: width - 40, height: 220, borderRadius: 10, marginBottom: 15 }} />;
                    } else {
                        // Là text
                        return <Text key={idx} style={{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 16 }}>{part.trim()}</Text>;
                    }
                })}
            </ScrollView>
        </SafeAreaView>
    );
} 