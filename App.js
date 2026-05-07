import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './src/theme/colors';
import { StatusBar, View } from 'react-native';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ReportScreen from './src/screens/ReportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createMaterialTopTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle="light-content" backgroundColor={theme.background} />
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ color }) => {
                  let iconName = 'help-outline'; // Default icon to prevent crash

                  if (route.name === 'Dashboard') {
                    iconName = 'dashboard';
                  } else if (route.name === 'Raporlar') {
                    iconName = 'insert-chart';
                  } else if (route.name === 'Ayarlar') {
                    iconName = 'settings';
                  }

                  return <MaterialIcons name={iconName} size={20} color={color} />;
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textMuted,
                tabBarShowIcon: true,
                tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'none' },
                tabBarStyle: {
                  backgroundColor: theme.surface,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
                tabBarIndicatorStyle: {
                  backgroundColor: theme.primary,
                  height: 3,
                },
                tabBarContentContainerStyle: {
                  height: 60,
                },
              })}
            >
              <Tab.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{ title: 'Ana Sayfa' }}
              />
              <Tab.Screen 
                name="Raporlar" 
                component={ReportScreen} 
                options={{ title: 'Raporlar' }}
              />
              <Tab.Screen 
                name="Ayarlar" 
                component={SettingsScreen} 
                options={{ title: 'Ayarlar' }}
              />
            </Tab.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}
