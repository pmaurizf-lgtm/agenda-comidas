import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PastelTableclothBackground } from "./src/components/PastelTableclothBackground";
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
    background: "transparent",
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
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: colors.appCanvas },
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: "rgba(17,24,39,0.35)",
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.88)",
          borderTopColor: "rgba(255,255,255,0.6)",
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
    <View style={{ flex: 1, backgroundColor: colors.appCanvas }}>
      <PastelTableclothBackground />
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="AddMeal" component={AddMealScreen} />
          <Stack.Screen name="EditMeal" component={AddMealScreen} />
          <Stack.Screen name="AddWater" component={AddWaterScreen} />
          <StackScreen name="EditWater" component={EditWaterScreen} />
          <StackScreen name="DayDetail" component={DayDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
