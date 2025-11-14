import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import assistantAvatar from '../constants/assistantAvatar';
import { wasModalClosedRecently } from '../constants/assistantState';

interface AssistantButtonProps {
    onPress: () => void;
    disabled?: boolean;
}

const AssistantButton: React.FC<AssistantButtonProps> = ({ onPress, disabled = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const lastPressRef = useRef(0);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();

        return () => {
            pulse.stop();
        };
    }, []);

    const handlePress = () => {
        const now = Date.now();
        // Ignore press if disabled (modal visible) or was just closed to avoid accidental re-open from touch propagation
        if (disabled) {
            console.log('AssistantButton press ignored: disabled');
            return;
        }
        if (wasModalClosedRecently(300)) {
            console.log('AssistantButton press ignored: modal closed recently');
            return;
        }
        // Debounce rapid presses
        if (now - lastPressRef.current < 300) return;
        lastPressRef.current = now;

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Animated.View
                style={[
                    styles.button,
                    {
                        transform: [
                            { scale: Animated.multiply(scaleAnim, pulseAnim) },
                        ],
                    },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Image source={assistantAvatar} style={styles.avatarSmall} resizeMode="cover" />
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
});

export default AssistantButton;