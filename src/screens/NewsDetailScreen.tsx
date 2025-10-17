import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View, StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
    shadowColor: '#007bff',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerSpacer: {
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 36,
  },
  dateText: {
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 24,
  },
  mainImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 24,
    alignSelf: 'center',
    shadowColor: '#007bff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  mediaContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#007bff',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  contentImage: {
    width: width - 48,
    height: 220,
    borderRadius: 16,
    alignSelf: 'center',
  },
  contentVideo: {
    width: width - 48,
    height: 240,
    borderRadius: 16,
    alignSelf: 'center',
  },
  webViewContainer: {
    width: width - 48,
    height: 240,
    borderRadius: 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  contentText: {
    fontSize: 18,
    color: '#334155',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'justify',
    lineHeight: 28,
    fontWeight: '400',
  },
  tagsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#007bff',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tagsLabel: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagsText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

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

  if (!news) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="newspaper-outline" size={80} color="#cbd5e1" />
          <Text style={{ fontSize: 18, color: '#64748b', marginTop: 16, textAlign: 'center' }}>
            Không tìm thấy tin tức
          </Text>
        </View>
      </View>
    );
  }

  const contentParts = splitContentWithMedia(news.content || '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['rgba(0, 123, 255, 0.05)', 'transparent']}
            style={styles.gradientOverlay}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007bff" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{news.title}</Text>
          <Text style={styles.dateText}>
            {news.createdAt ? new Date(news.createdAt).toLocaleString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : ''}
          </Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Main Image */}
          {news.imageUrl && (
            <Image 
              source={{ uri: news.imageUrl }} 
              style={styles.mainImage} 
              resizeMode="cover" 
            />
          )}

          {/* Content Parts */}
          {contentParts.map((part, idx) => {
            if (isImage(part)) {
              return (
                <View key={idx} style={styles.mediaContainer}>
                  <Image 
                    source={{ uri: part }} 
                    style={styles.contentImage} 
                    resizeMode="cover" 
                  />
                </View>
              );
            } else if (isMp4(part)) {
              return (
                <View key={idx} style={styles.mediaContainer}>
                  <Video 
                    source={{ uri: part }} 
                    style={styles.contentVideo} 
                    useNativeControls 
                    resizeMode={ResizeMode.CONTAIN} 
                  />
                </View>
              );
            } else if (isYouTube(part)) {
              let videoId = '';
              const ytMatch = part.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
              if (ytMatch) videoId = ytMatch[1];
              const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : part;
              return (
                <View key={idx} style={styles.mediaContainer}>
                  <WebView 
                    source={{ uri: embedUrl }} 
                    style={styles.webViewContainer} 
                  />
                </View>
              );
            } else {
              return (
                <Text key={idx} style={styles.contentText}>
                  {part.trim()}
                </Text>
              );
            }
          })}

          {/* Tags Section */}
          {(news.tagList || news.tags) && (news.tagList?.length > 0 || news.tags) && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>🏷️ Tags</Text>
              <Text style={styles.tagsText}>
                {news.tagList ? news.tagList.join(' • ') : (news.tags || '')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 