import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PlaceholderScreen } from "./src/screens/PlaceholderScreen";
import { colors } from "./src/theme/colors";
import { AddMealScreen } from "./src/screens/AddMealScreen";
import { AddWaterScreen } from "./src/screens/AddWaterScreen";
import { DiaryScreen } from "./src/screens/DiaryScreen";
import { DayDetailScreen } from "./src/screens/DayDetailScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { WaterScreen } from "./src/screens/WaterScreen";
import { EditWaterScreen } from "./src/screens/EditWaterScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** Tipado laxo para pantallas con `route.params` (evita conflicto FC<{}> vs Props). */
const StackScreen = Stack.Screen as React.ComponentType<any>;

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, color: focused ? colors.purple : "rgba(17,24,39,0.35)" }}>
      {label}
    </Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: "rgba(17,24,39,0.35)",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Diario"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="✎" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Agua"
        component={WaterScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="💧" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="IA"
        children={() => <PlaceholderScreen title="Asesor IA" />}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="AddMeal" component={AddMealScreen} />
        <Stack.Screen name="EditMeal" component={AddMealScreen} />
        <Stack.Screen name="AddWater" component={AddWaterScreen} />
        <StackScreen name="EditWater" component={EditWaterScreen} />
        <StackScreen name="DayDetail" component={DayDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
