import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Image,
    TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import virtualAssistantService, { AssistantSuggestion } from '../services/virtualAssistantService';
import apiClient from '../api/client';
import assistantAvatar from '../constants/assistantAvatar';
import { setModalClosedNow } from '../constants/assistantState';

const { width } = Dimensions.get('window');

interface VirtualAssistantProps {
    screen: string;
    visible: boolean;
    onClose: () => void;
    onAction?: (actionType: string, actionData?: any) => void;
}

export default function VirtualAssistant({ screen, visible, onClose, onAction }: VirtualAssistantProps) {
    const [suggestion, setSuggestion] = useState<AssistantSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const requestIdRef = useRef(0);

    useEffect(() => {
        loadCustomerId();
    }, []);

    useEffect(() => {
        if (visible && !suggestion) {
            checkAndShowAssistant();
        }
    }, [visible, screen, suggestion]);

    // Log changes in suggestion and visibility
    useEffect(() => {
        console.log('Suggestion or visibility changed:', { suggestion, visible });
    }, [suggestion, visible]);



    const loadCustomerId = async () => {
        try {
            const response = await apiClient.get('/User/profile');
            if (response.data?.customerId) {
                setCustomerId(response.data.customerId);
            }
        } catch (error) {
            console.log('Could not load customer ID:', error);
        }
    };

    const checkAndShowAssistant = async () => {
        try {
            setLoading(true);
            const shouldShow = await virtualAssistantService.shouldShow(screen);
            if (!shouldShow) {
                onClose();
                return;
            }

            // Tự động tạo gợi ý khi vào màn hình
            generateSuggestion();
        } catch (error) {
            console.error('Error in checkAndShowAssistant:', error);
            onClose();
        }
    };

    const generateSuggestion = async (rotate = false) => {
        // mark a new request id for this generation; used to cancel stale async updates
        requestIdRef.current += 1;
        const reqId = requestIdRef.current;

        setLoading(true);
        let finalSuggestion: AssistantSuggestion | null = null;
        
        try {
            const context = await virtualAssistantService.analyzeSituation(screen, customerId || undefined);
            
            if (!context) {
                // Nếu không có context, vẫn hiển thị gợi ý mặc định
                finalSuggestion = {
                    id: 'default_fallback',
                    message: 'Xin chào! Mình là trợ lý ảo của phòng khám. Mình có thể giúp bạn tìm dịch vụ phù hợp.',
                    priority: 'low'
                };
            } else {
                // Thử tạo gợi ý rule-based trước
                let suggestion;
                if (rotate) {
                    // ask service to rotate/choose a different suggestion
                    suggestion = await virtualAssistantService.generateRotatingSuggestion(context);
                } else {
                    suggestion = await virtualAssistantService.generateSuggestion(context);
                }
                console.log('Rule-based suggestion:', suggestion);
                
                // Nếu không có, thử dùng AI
                if (!suggestion) {
                    try {
                        const aiMessage = await virtualAssistantService.generateAISuggestion(context);
                        console.log('AI suggestion:', aiMessage);
                        if (aiMessage) {
                            suggestion = {
                                id: 'ai_suggestion',
                                message: aiMessage,
                                priority: 'medium',
                            };
                        }
                    } catch (aiError) {
                        console.log('AI suggestion failed, using fallback:', aiError);
                    }
                }

                // Đảm bảo luôn có suggestion (fallback đã được xử lý trong service)
                finalSuggestion = (suggestion as AssistantSuggestion) || ({
                    id: 'fallback',
                    message: 'Xin chào! Mình có thể giúp bạn tìm dịch vụ phù hợp cho thú cưng.',
                    priority: 'low'
                } as AssistantSuggestion);
            }
        } catch (error) {
            console.error('Error generating suggestion:', error);
            // Ngay cả khi có lỗi, vẫn hiển thị gợi ý mặc định
            finalSuggestion = {
                id: 'error_fallback',
                message: 'Xin chào! Mình là trợ lý ảo. Mình có thể giúp bạn tìm dịch vụ phù hợp.',
                priority: 'low'
            };
        } finally {
            // Đảm bảo luôn có suggestion trước khi hiển thị
            if (!finalSuggestion) {
                finalSuggestion = {
                    id: 'final_fallback',
                    message: 'Xin chào! Mình là trợ lý ảo của phòng khám. Mình có thể giúp bạn tìm dịch vụ phù hợp cho thú cưng.',
                    priority: 'low'
                };
            }

            // If this request was cancelled (modal closed or a newer request started), skip applying state
            if (reqId !== requestIdRef.current) {
                console.log('generateSuggestion aborted (stale request)');
                return;
            }

            console.log('Setting suggestion:', finalSuggestion);
            console.log('Suggestion message:', finalSuggestion.message);
            // Đảm bảo message không rỗng
            if (!finalSuggestion.message || finalSuggestion.message.trim() === '') {
                finalSuggestion.message = 'Xin chào! Mình là trợ lý ảo của phòng khám. Mình có thể giúp bạn tìm dịch vụ phù hợp cho thú cưng.';
                console.log('Message was empty, using fallback');
            }
            // Set suggestion và hiển thị ngay lập tức
            setSuggestion(finalSuggestion);
            setLoading(false);
        }
    };

    const handleDismissToday = async () => {
        // Cancel any pending suggestion generation
        requestIdRef.current += 1;
        await virtualAssistantService.dismissToday();
        // mark modal closed so button won't reopen immediately
        setModalClosedNow();
        onClose();
    };

    // Permanent dismiss option removed per request

    const handleAction = () => {
        // Cancel pending requests so async callbacks don't re-open modal
        requestIdRef.current += 1;
        // mark modal closed so button won't reopen immediately
        setModalClosedNow();
        if (suggestion?.actionType && onAction) {
            onAction(suggestion.actionType, suggestion.actionData);
        }
        onClose();
    };

    const handleClose = () => {
        // Cancel any pending async operations so they don't set state after close
        requestIdRef.current += 1;
        // mark modal closed so button won't reopen immediately
        setModalClosedNow();

        // Close modal immediately to avoid race where a later async callback re-opens it
        try {
            onClose();
        } catch (e) {
            console.warn('onClose failed in handleClose', e);
        }

        // Reset animation value for next open
        try {
            scaleAnim.setValue(1);
        } catch (e) {
            // ignore
        }
    };

    if (!visible && !loading) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={() => { /* consume touches so they don't fall through */ }}>
                <View style={styles.modalOverlay} pointerEvents="auto">
                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Image source={assistantAvatar} style={styles.avatarImage} resizeMode="cover" />
                        </View>
                        <Text style={styles.title}>Trợ lý ảo</Text>
                    </View>

                    {loading ? (
                        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={[styles.suggestionText, { marginTop: 10 }]}>
                                Đang tải gợi ý...
                            </Text>
                        </View>
                    ) : (
                        <>
                            <ScrollView 
                                style={styles.content} 
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.suggestionContainer}>
                                    <Text style={styles.suggestionText} accessibilityRole="text">
                                        {suggestion?.message || 'Xin chào! Mình là trợ lý ảo của phòng khám.'}
                                    </Text>

                                    {/* Show structured details if available */}
                                    {suggestion?.actionData?.petName ? (
                                        <Text style={styles.detailText}>Thú cưng: {suggestion.actionData.petName}</Text>
                                    ) : null}

                                    {suggestion?.actionData?.serviceName ? (
                                        <Text style={styles.detailText}>Dịch vụ: {suggestion.actionData.serviceName}</Text>
                                    ) : null}

                                    {suggestion?.actionData?.reason ? (
                                        <Text style={styles.detailText}>Lý do: {suggestion.actionData.reason}</Text>
                                    ) : suggestion?.actionData?.daysSince ? (
                                        <Text style={styles.detailText}>Lý do: Đã {suggestion.actionData.daysSince} ngày chưa đưa bé đi khám</Text>
                                    ) : null}
                                </View>

                                {suggestion?.actionType && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleAction}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {suggestion.actionType === 'book_appointment'
                                                ? 'Đặt lịch ngay'
                                                : suggestion.actionType === 'view_service'
                                                ? 'Xem dịch vụ'
                                                : suggestion.actionType === 'view_appointment'
                                                ? 'Xem lịch hẹn'
                                                : 'Xem thêm'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>

                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[styles.refreshButton, loading ? styles.buttonDisabled : null]}
                            onPress={() => { if (!loading) generateSuggestion(true); }}
                                    disabled={loading}
                                >
                                    <Text style={styles.refreshButtonText}>{loading ? 'Đang tải...' : 'Làm mới gợi ý'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dismissButton}
                                    onPress={handleDismissToday}
                                >
                                    <Text style={styles.dismissButtonText}>
                                        Ẩn hôm nay
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Animated.View>
            </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: width * 0.9,
        maxHeight: '75%',
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 6,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        // Give the ScrollView a defined max height so content is visible
        maxHeight: '55%',
        marginBottom: 12,
    },
    suggestionContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: 50,
        width: '100%',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        textAlign: 'left',
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginTop: 8,
    },
    debugText: {
        marginTop: 8,
        fontSize: 12,
        color: '#c00',
    },
    actionButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
        marginTop: 8,
    },
    dismissButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    dismissButtonText: {
        color: '#666',
        fontSize: 14,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    refreshButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

