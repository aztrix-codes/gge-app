import React, { useEffect, useRef } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Accelerometer } from 'expo-sensors';

export default function App() {
  const webviewRef = useRef(null);
  const targetWebsite = 'https://empire.goodgamestudios.com/?nomobileredirect=true';
  const dnsServer = 'https://dns.adguard.com/dns-query';

  useEffect(() => {
    let lastShake = 0;
    
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      if (magnitude > 2.5) {
        const now = Date.now();
        if (now - lastShake > 1000) {
          lastShake = now;
        }
      }
    });
    Accelerometer.setUpdateInterval(100);
    
    return () => subscription && subscription.remove();
  }, []);

  const contentBlockingScript = `
    (function() {
      // Enhanced viewport settings
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=0.73, maximum-scale=0.73, user-scalable=0';
      document.head.appendChild(meta);

      // Comprehensive list of ad-related patterns
      const adPatterns = {
        elements: [
          // Ad containers
          'div[id*="ad"], div[class*="ad"]:not([class*="game"]):not([class*="play"])',
          'div[id*="banner"], div[class*="banner"]:not([class*="game"])',
          'div[id*="sponsor"], div[class*="sponsor"]',
          'div[id*="advertisement"], div[class*="advertisement"]',
          // Common ad providers
          'ins[class*="adsbygoogle"]',
          'div[id*="google_ads"], div[class*="google_ads"]',
          'div[data-ad]',
          'div[data-advertisement]',
          'div[id*="dfp"], div[class*="dfp"]',
          // Social widgets and tracking
          'div[class*="social-widget"]',
          'div[id*="tracker"], div[class*="tracker"]',
          // Ad iframes
          'iframe[src*="doubleclick"]',
          'iframe[src*="ad."], iframe[src*=".ad"]',
          'iframe[src*="advertising"]',
          'iframe[src*="banner"]',
          // Specific ad networks
          'div[id*="taboola"], div[class*="taboola"]',
          'div[id*="outbrain"], div[class*="outbrain"]',
          'div[id*="revcontent"]'
        ],
        scripts: [
          'google-analytics',
          'googlesyndication',
          'doubleclick',
          'adnxs',
          'facebook.net',
          'quantserve',
          'scorecardresearch',
          'analytics',
          'tracking'
        ]
      };

      // Enhanced ad blocking function
      const blockAds = () => {
        // Remove ad-related elements
        adPatterns.elements.forEach(pattern => {
          const elements = document.querySelectorAll(pattern);
          elements.forEach(element => {
            // Skip removal if element is part of core game functionality
            const isGameElement = element.closest('[class*="game"], [id*="game"], [class*="play"], [id*="play"]');
            const isShopElement = element.closest('[class*="shop"], [id*="shop"], [class*="payment"], [id*="payment"]');
            
            if (!isGameElement && !isShopElement) {
              element.style.display = 'none';
              element.remove();
            }
          });
        });

        // Clean empty ad containers
        document.querySelectorAll('div').forEach(div => {
          if (div.innerHTML.trim() === '' && 
              (div.id.toLowerCase().includes('ad') || 
               div.className.toLowerCase().includes('ad'))) {
            div.remove();
          }
        });
      };

      // Enhanced fetch interceptor
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        // Allow game-essential requests
        if (url.includes('game') || 
            url.includes('play') || 
            url.includes('shop') || 
            url.includes('payment') || 
            url.includes('purchase') || 
            url.includes('goodgamestudios.com')) {
          return originalFetch(url, options);
        }

        // Block ad and tracking requests
        if (adPatterns.scripts.some(pattern => url.includes(pattern))) {
          return new Promise(resolve => {
            resolve(new Response('', { status: 200 }));
          });
        }

        return originalFetch(url, options);
      };

      // Enhanced XHR interceptor
      const originalXHR = window.XMLHttpRequest.prototype.open;
      window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (adPatterns.scripts.some(pattern => url.includes(pattern))) {
          return;
        }
        return originalXHR.call(this, method, url, ...rest);
      };

      // Block inline scripts containing ad-related content
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'script') {
          const originalSetAttribute = element.setAttribute;
          element.setAttribute = function(name, value) {
            if (adPatterns.scripts.some(pattern => value.includes(pattern))) {
              return;
            }
            return originalSetAttribute.call(this, name, value);
          };
        }
        return element;
      };

      // Enhanced observer configuration
      const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'style', 'class', 'id']
      };

      // Create mutation observer with debouncing
      let timeout;
      const observer = new MutationObserver((mutations) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          blockAds();
        }, 100);
      });

      // Start observing with enhanced configuration
      observer.observe(document.body, observerConfig);

      // Initial blocking
      blockAds();
    })();
  `;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <WebView
        ref={webviewRef}
        source={{ 
          uri: targetWebsite,
          headers: {
            'DNS-Server': dnsServer,
            'Accept': 'application/dns-json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1'
          }
        }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        injectedJavaScript={contentBlockingScript}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request) => {
          // Enhanced URL filtering
          const blockedPatterns = [
            'doubleclick', 'google-analytics', 'googlesyndication',
            'facebook.net', 'adnxs', 'quantserve', 'analytics',
            'tracking', 'advertisement', 'banner'
          ];
          const allowedPatterns = [
            'game', 'play', 'shop', 'payment', 'purchase',
            'goodgamestudios.com'
          ];
          
          // Always allow essential game functionality
          if (allowedPatterns.some(pattern => request.url.includes(pattern))) {
            return true;
          }
          // Block known ad and tracking URLs
          return !blockedPatterns.some(pattern => request.url.includes(pattern));
        }}
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        scalesPageToFit={true}
        cacheEnabled={false}
        thirdPartyCookiesEnabled={false}
        sharedCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webView: {
    flex: 1,
  },
  webViewContainer: {
    width: '100%',
    height: '100%',
  }
});