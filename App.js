import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, View, StyleSheet, Modal, TextInput, Button, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Accelerometer } from 'expo-sensors';

export default function App() {
  const webviewRef = useRef(null);
  const targetWebsite = 'https://empire.goodgamestudios.com/?nomobileredirect=true';
  const [widthScreen, setWidthScreen] = useState('122');
  const [isShaken, setIsShaken] = useState(false);

  useEffect(() => {
    let lastShake = 0;

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > 2.5) { 
        const now = Date.now();

        if (now - lastShake > 1000) { 
          lastShake = now;
          setIsShaken(true);
        }
      }
    });

    Accelerometer.setUpdateInterval(100); 

    return () => subscription && subscription.remove();
  }, []);

  const performanceScript = `
    (function() {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=0.71, maximum-scale=0.71, user-scalable=0';
      document.head.appendChild(meta);

      const removeAds = () => {
        const adSelectors = [
          'iframe[src*="ads"]',
          'div[class*="ad"]',
          'div[id*="ad"]',
          'script[src*="ads"]',
          'img[src*="ads"]',
          'div[class*="banner"]',
          'div[id*="banner"]',
          'div[class*="advertisement"]',
          'div[id*="advertisement"]',
          'div[class*="popup"]',
          'div[id*="popup"]',
          'a[href*="ads"]',
          'a[href*="track"]',
          'span[class*="ads"]',
          'span[id*="ads"]',
          'ins[class*="ads"]',
          'ins[id*="ads"]'
        ];

        adSelectors.forEach(selector => {
          const ads = document.querySelectorAll(selector);
          ads.forEach(ad => ad.remove());
        });
      };

      const observer = new MutationObserver(removeAds);
      observer.observe(document.body, { childList: true, subtree: true });

      removeAds();

      window.addEventListener('unload', () => observer.disconnect());
    })();
  `;

  return (
    <>
      <StatusBar hidden={true} />
      <Modal transparent={true} visible={isShaken} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              value={widthScreen}
              keyboardType="numeric"
              style={styles.textInput}
              onChangeText={setWidthScreen}
            />
            <Button title="Hide" onPress={() => setIsShaken(false)} />
          </View>
        </View>
      </Modal>
      <View style={styles.container}>
        <WebView
          ref={webviewRef}
          source={{ uri: targetWebsite }}
          style={[styles.webView, { width: `${widthScreen}%` }]}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          injectedJavaScript={performanceScript}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={(request) => request.url.includes('goodgamestudios.com')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  textInput: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#fff',
    width: 100,
    textAlign: 'center',
  },
});
