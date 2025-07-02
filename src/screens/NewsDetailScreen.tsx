import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

function isImage(url: string) {
    return url.match(/\.(jpg|jpeg|png|gif)$/i);
}
function isMp4(url: string) {
    return url.match(/\.mp4$/i);
}
function isYouTube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}
function splitContentWithMedia(text: string) {
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

export default function NewsDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore
  const { news } = route.params || {};

  if (!news) return <View><Text>Không tìm thấy tin tức.</Text></View>;

  const contentParts = splitContentWithMedia(news.content || '');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#007bff" />
      </TouchableOpacity>
      {news.imageUrl && (
        <Image source={{ uri: news.imageUrl }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 16 }} resizeMode="cover" />
      )}
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{news.title}</Text>
      <Text style={{ color: '#888', marginBottom: 12 }}>{news.createdAt ? new Date(news.createdAt).toLocaleString() : ''}</Text>
      {/* Render content và media đúng thứ tự */}
      {contentParts.map((part, idx) => {
        if (isImage(part)) {
          return <Image key={idx} source={{ uri: part }} style={{ width: width - 32, height: 200, borderRadius: 10, marginBottom: 15 }} resizeMode="cover" />;
        } else if (isMp4(part)) {
          return <Video key={idx} source={{ uri: part }} style={{ width: width - 32, height: 220, borderRadius: 10, marginBottom: 15 }} useNativeControls resizeMode={ResizeMode.CONTAIN} />;
        } else if (isYouTube(part)) {
          let videoId = '';
          const ytMatch = part.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
          if (ytMatch) videoId = ytMatch[1];
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : part;
          return <WebView key={idx} source={{ uri: embedUrl }} style={{ width: width - 32, height: 220, borderRadius: 10, marginBottom: 15 }} />;
        } else {
          return <Text key={idx} style={{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 16 }}>{part.trim()}</Text>;
        }
      })}
      {(news.tagList || news.tags) && (news.tagList?.length > 0 || news.tags) && (
        <Text style={{ color: '#007bff', marginTop: 10 }}>
          Tags: {news.tagList ? news.tagList.join(', ') : (news.tags || '')}
        </Text>
      )}
    </ScrollView>
  );
} 