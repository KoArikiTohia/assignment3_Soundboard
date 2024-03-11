import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';

const PressableButton = ({buttonText,buttonID, }) => {

    return (
        <View style={styles.container}>
            <Pressable
                key={buttonID}
                style={styles.button}
                style={({ pressed }) => [
                    styles.button,
                    { opacity: pressed ? 0.5 : 1 }, // Adjust opacity when pressed
                ]}
            >
                <Text style={styles.text}>
                    {buttonText}
                </Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    text: {
        color: 'black',
        textAlign: 'center',
        fontSize: 16,
    },

   button: {
        borderWidth: 1,
        backgroundColor: 'skyblue', 
        padding: 10,
        borderRadius: 5,
        width: 100,
        height: 100,
        borderRadius:70, // Makes the button circular
    }
});

export default PressableButton;
