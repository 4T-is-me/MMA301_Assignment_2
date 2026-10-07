import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    sectionLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 5,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },

    themeContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 28,
    },

    themeCard: {
        flex: 1,
        padding: 6,
        borderRadius: 16,
        borderWidth: 1.5,
    },

    preview: {
        height: 68,
        borderRadius: 11,
        padding: 10,
        justifyContent: "center",
        gap: 7,
    },

    previewLine: {
        width: "58%",
        height: 6,
        borderRadius: 3,
    },

    previewLineLong: {
        width: "100%",
        height: 5,
        borderRadius: 3,
    },

    previewLineMedium: {
        width: "78%",
        height: 5,
        borderRadius: 3,
    },

    previewLineShort: {
        width: "60%",
        height: 5,
        borderRadius: 3,
    },

    themeInfo: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        paddingVertical: 7,
        gap: 5,
    },

    themeText: {
        fontSize: 10,
        fontWeight: "500",
    },

    check: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: "auto",
    },
    infoCard: {
        minHeight: 145,
        borderRadius: 22,
        borderWidth: 1,
        overflow: "hidden",
        position: "relative",
        marginTop: 4,
    },

    infoContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        zIndex: 2,
    },

    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },

    infoTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },

    infoDescription: {
        fontSize: 11,
        lineHeight: 16,
        maxWidth: "72%",
    },

    infoFooter: {
        marginTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "space-between",
        alignItems: "center",
    },

    infoVersion: {
        fontSize: 8,
        fontWeight: "700",
        letterSpacing: 1,
    },

    infoCircleLarge: {
        position: "absolute",
        width: 125,
        height: 125,
        borderRadius: 63,
        right: -35,
        top: -35,
        opacity: 0.07,
    },

    infoCircleSmall: {
        position: "absolute",
        width: 65,
        height: 65,
        borderRadius: 33,
        right: 25,
        bottom: -18,
        opacity: 0.06,
    },
});
