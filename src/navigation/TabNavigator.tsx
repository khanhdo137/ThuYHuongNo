import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import CustomBottomTab from '../components/CustomBottomTab';
import BookingScreen from '../screens/BookingScreen';
import ContactScreen from '../screens/ContactScreen';
import HomeScreen from '../screens/HomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator tabBar={props => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contact" component={ContactScreen} />
      <Tab.Screen name="Booking" component={BookingScreen} />
      <Tab.Screen name="Notification" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
} 