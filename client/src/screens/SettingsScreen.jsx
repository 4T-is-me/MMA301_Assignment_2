import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { styles } from "../styles/SettingsStyles";
export default function SettingsScreen() {
    const { theme, themeMode, toggleTheme } = useTheme();
    const isDarkMode = themeMode === "dark";

    const handleLightMode = () => {
        if (isDarkMode) {
            toggleTheme();
        }
    };

    const handleDarkMode = () => {
        if (!isDarkMode) {
            toggleTheme();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            <Text style={[styles.sectionLabel, { color: theme.colors.subText }]}>APPEARANCE</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>App Theme</Text>

            <View style={styles.themeContainer}>

                <TouchableOpacity onPress={handleLightMode} style={[styles.themeCard, { backgroundColor: theme.colors.card, borderColor: !isDarkMode ? theme.colors.primary : theme.colors.border }]}>
                    <View style={[styles.preview, { backgroundColor: "#F5F3FF" }]}>
                        <View style={[styles.previewLine, { backgroundColor: theme.colors.primary }]} />
                        <View style={[styles.previewLineLong, { backgroundColor: "#DCD8EA" }]} />
                        <View style={[styles.previewLineMedium, { backgroundColor: "#DCD8EA" }]} />
                        <View style={[styles.previewLineShort, { backgroundColor: "#DCD8EA" }]} />
                    </View>

                    <View style={styles.themeInfo}>
                        <Ionicons name="sunny-outline" size={14} color={theme.colors.text} />
                        <Text style={[styles.themeText, { color: theme.colors.text }]}>Light</Text>
                        {!isDarkMode && (
                            <View style={[styles.check, { backgroundColor: theme.colors.primary }]}>
                                <Ionicons name="checkmark" size={11} color="#FFF" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDarkMode} style={[styles.themeCard, { backgroundColor: theme.colors.card, borderColor: isDarkMode ? theme.colors.primary : theme.colors.border }]}>
                    <View style={[styles.preview, { backgroundColor: "#292638" }]}>
                        <View style={[styles.previewLine, { backgroundColor: theme.colors.primary }]} />
                        <View style={[styles.previewLineLong, { backgroundColor: "#575166" }]} />
                        <View style={[styles.previewLineMedium, { backgroundColor: "#575166" }]} />
                        <View style={[styles.previewLineShort, { backgroundColor: "#575166" }]} />
                    </View>

                    <View style={styles.themeInfo}>
                        <Ionicons name="moon-outline" size={14} color={theme.colors.text} />
                        <Text style={[styles.themeText, { color: theme.colors.text }]}>Dark</Text>
                        {isDarkMode && (
                            <View style={[styles.check, { backgroundColor: theme.colors.primary }]}>
                                <Ionicons name="checkmark" size={11} color="#FFF" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.subText }]}>APPLICATION</Text>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.welcomeBg, borderColor: theme.colors.border }]}>
                <View style={[styles.infoCircleLarge, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.infoCircleSmall, { backgroundColor: theme.colors.primary }]} />

                <View style={styles.infoContent}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="sparkles-outline" size={24} color={theme.colors.primary} />
                    </View>

                    <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Your Space</Text>
                    <Text style={[styles.infoDescription, { color: theme.colors.subText }]}>Personalize your experience and manage your information.</Text>
                </View>

                <View style={styles.infoFooter}>
                    <Text style={[styles.infoVersion, { color: theme.colors.subText }]}>PROFILE & ACTIVITY</Text>
                    <Text style={[styles.infoVersion, { color: theme.colors.primary }]}>v1.0</Text>
                </View>
            </View>
        </View>
    );
}