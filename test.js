import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';

export default function App() {
    const [recordings, setRecordings] = useState([null, null, null]);
    const [recordingUris, setRecordingUris] = useState([null, null, null]);
    const [loopingStates, setLoopingStates] = useState([false, false, false]);
    const [loopingSounds, setLoopingSounds] = useState([null, null, null]);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const db = SQLite.openDatabase('soundboard.db');

    useEffect(() => {
        db.transaction(tx => {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Sounds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, audio_uri TEXT)'
            );
        });

        return () => db.close;
    }, []);

    const storedSounds = [
        { sound: require('./stored/mixkit-bass-guitar-single-note-2331.wav'), label: 'Guitar 1' },
        { sound: require('./stored/mixkit-cool-guitar-riff-2321.wav'), label: 'Guitar 2' },
        { sound: require('./stored/mixkit-electric-guitar-distorted-slide-2340.wav'), label: 'Guitar 3' },
        { sound: require('./stored/mixkit-guitar-stroke-down-slow-2339.wav'), label: 'Guitar 4' },
    ];

    const playAdditionalSound = async (sound) => {
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(sound);
            await newSound.playAsync();
        } catch (error) {
            console.log("Error during playAdditionalSound(): ", error);
        }
    };

    const startRecording = async (buttonNumber) => {
        try {
            if (permissionResponse.status !== 'granted') {
                await requestPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            const newRecordings = [...recordings];
            newRecordings[buttonNumber - 1] = recording;
            setRecordings(newRecordings);
        } catch (error) {
            console.log("Error during startRecording(): ", error);
        }
    }

    const stopRecording = async (buttonNumber) => {
        try {
            const recording = recordings[buttonNumber - 1];
            if (!recording) return;

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            const newRecordings = [...recordings];
            newRecordings[buttonNumber - 1] = null;
            setRecordings(newRecordings);

            const newRecordingUris = [...recordingUris];
            newRecordingUris[buttonNumber - 1] = uri;
            setRecordingUris(newRecordingUris);

            db.transaction(tx => {
                tx.executeSql(
                    'INSERT INTO Sounds (name, audio_uri) VALUES (?, ?)',
                    [`Recording ${buttonNumber}`, uri]
                );
            });
        } catch (error) {
            console.log("Error during stopRecording(): ", error);
        }
    }

    const playRecordingOnce = async (buttonNumber) => {
        try {
            const uri = recordingUris[buttonNumber - 1];
            if (!uri) return;

            const { sound } = await Audio.Sound.createAsync({ uri });
            await sound.playAsync();
        } catch (error) {
            console.log("Error during playRecordingOnce(): ", error);
        }
    }

    const toggleLooping = async (buttonNumber) => {
        try {
            const currentLoopingSound = loopingSounds[buttonNumber - 1];
            if (currentLoopingSound) {
                await currentLoopingSound.stopAsync();
                setLoopingSounds([...loopingSounds.slice(0, buttonNumber - 1), null, ...loopingSounds.slice(buttonNumber)]);
                setLoopingStates([...loopingStates.slice(0, buttonNumber - 1), false, ...loopingStates.slice(buttonNumber)]);
            } else {
                const uri = recordingUris[buttonNumber - 1];
                if (!uri) return;

                const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, isLooping: true });
                setLoopingSounds([...loopingSounds.slice(0, buttonNumber - 1), sound, ...loopingSounds.slice(buttonNumber)]);
                setLoopingStates([...loopingStates.slice(0, buttonNumber - 1), true, ...loopingStates.slice(buttonNumber)]);
            }
        } catch (error) {
            console.log("Error during toggleLooping(): ", error);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Guitar Hero Sound Board</Text>
            <View style={styles.soundBoardGrid}>
                {/* Map over the additional sounds array to render pressable buttons */}
                {storedSounds.map((item, index) => (
                    <View key={index} style={styles.sbGridOne}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: pressed ? 'lightblue' : 'skyblue' }
                            ]}
                            onPress={() => playAdditionalSound(item.sound)}>
                            <Text style={styles.buttonText}>{item.label}</Text>
                        </Pressable>
                    </View>
                ))}
            </View>
            <View style={styles.soundBoardGrid}>
                {[1, 2, 3].map((buttonNumber) => (
                    <View key={buttonNumber} style={styles.sbGridTwo}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: pressed ? 'lightblue' : 'skyblue' }
                            ]}
                            onPressIn={() => startRecording(buttonNumber)}
                            onPressOut={() => stopRecording(buttonNumber)}>
                            <Text style={styles.buttonText}>{recordings[buttonNumber - 1] ? 'Stop Recording' : 'Start Recording'}</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: pressed ? 'lightblue' : 'skyblue' }
                            ]}
                            onPress={() => playRecordingOnce(buttonNumber)}>
                            <Text style={styles.buttonText}>Play Once</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: pressed ? 'lightblue' : 'skyblue' }
                            ]}
                            onPress={() => toggleLooping(buttonNumber)}>
                            <Text style={styles.buttonText}>{loopingStates[buttonNumber - 1] ? 'Stop Looping' : 'Start Looping'}</Text>
                        </Pressable>
                    </View>
                ))}

            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'grey',
        alignItems: 'center',
        justifyContent: 'center',
    },
    soundBoardGrid: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        //borderWidth: 1,
        padding: 10,
        margin: 10,
        width: 410,
    },
    sbGridOne: {
        flexDirection: 'column',
        justifyContent: 'space-evenly',
    },
    sbGridTwo: {
        flexDirection: 'column',
        justifyContent: 'space-evenly',
    },
    button: {
        borderWidth: 1,
        backgroundColor: 'skyblue',
        padding: 10,
        borderRadius: 5,
        width: 90,
        height: 90,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
    },

    buttonText: {
        textAlign: 'center',
    },

    header: {
        flex: 0.5,
        textAlign: 'center',
        textAlignVertical: 'top',
        fontSize: 60,
        color: 'orange',
    }
});
