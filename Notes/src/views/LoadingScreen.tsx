import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingScreenProps {
    onAnimationComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onAnimationComplete }) => {
    const logoScale = useRef(new Animated.Value(0)).current;
    const letterAnimations = useRef(
        ['N', 'o', 't', 'e', 's'].map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        const logoAnimation = Animated.timing(logoScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.bounce,
        });

        const letterAnimationsSequence = letterAnimations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: index * 150, // Creates the "waterfall" effect
                useNativeDriver: true,
                easing: Easing.bounce,
            })
        );

        Animated.sequence([
            logoAnimation,
            Animated.stagger(100, letterAnimationsSequence),
        ]).start(() => {
            onAnimationComplete();
        });
    }, [logoScale, letterAnimations, onAnimationComplete]);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../assets/icons/NoteLogo.png')}
                style={[styles.logo, { transform: [{ scale: logoScale }] }]}
                resizeMode="contain"
            />
            <View style={styles.textContainer}>
                {['N', 'o', 't', 'e', 's'].map((letter, index) => (
                    <Animated.Text
                        key={index}
                        style={[
                            styles.text,
                            { opacity: letterAnimations[index], transform: [{ translateY: letterAnimations[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 0], // Bouncy drop-in effect
                              }) }] },
                        ]}
                    >
                        {letter}
                    </Animated.Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    logo: {
        width: 100,
        height: 100,
    },
    textContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    text: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 1,
    },
});

export default LoadingScreen;
