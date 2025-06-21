import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ProfileScreen from '@/screens/ProfileScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import BookingScreen from '@/screens/BookingScreen';
import ContactScreen from '@/screens/ContactScreen';
import HomeScreen from '@/screens/HomeScreen';

const Tab = createBottomTabNavigator();

type TabParamList = {
    Home: undefined;
    Contact: undefined;
    Booking: undefined;
    Profile: undefined;
};

export default function TabNavigator() {
    const colorScheme = useColorScheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle-outline';

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Contact') {
                        iconName = focused ? 'call' : 'call-outline';
                    } else if (route.name === 'Booking') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors[colorScheme].tint,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }}/>
            <Tab.Screen name="Contact" component={ContactScreen} options={{ title: "Liên hệ" }}/>
            <Tab.Screen name="Booking" component={BookingScreen} options={{ title: "Đặt lịch" }}/>
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Cá nhân" }}/>
        </Tab.Navigator>
    );
} 