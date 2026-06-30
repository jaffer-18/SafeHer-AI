import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Premium Dark Mode Styles for Google Maps
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#F3F4F6" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#374151" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1F2937" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0F172A" }] }
];

export default function RouteFinderScreen({ token, backendUrl, onNavigate, googleMapsApiKey }) {
  const [source, setSource] = useState('Sector 62, Noida, UP');
  const [destination, setDestination] = useState('Indirapuram, Ghaziabad, UP');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0); // 0 to 100%
  const [geminiUtilized, setGeminiUtilized] = useState(false);

  // Google Maps States
  const mapRef = useRef(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderers, setDirectionsRenderers] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [userMarker, setUserMarker] = useState(null);
  const [activeRoutePath, setActiveRoutePath] = useState([]);

  // 1. Load Google Maps Script (Web Only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapsLoaded(true);
        return;
      }

      const scriptId = 'google-maps-script';
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        // If API Key is missing, it will load with a development watermark
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey || ''}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setMapsLoaded(true);
          console.log('Google Maps API Loaded.');
        };
        script.onerror = () => {
          console.error('Failed to load Google Maps SDK.');
        };
        document.head.appendChild(script);
      } else {
        setMapsLoaded(true);
      }
    };

    loadGoogleMaps();
  }, [googleMapsApiKey]);

  // 2. Initialize Google Map instance
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstance || Platform.OS !== 'web') return;

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.6273, lng: 77.3725 }, // Centered around Sector 62
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: darkMapStyles
      });

      setMapInstance(googleMap);
      setDirectionsService(new window.google.maps.DirectionsService());
    } catch (err) {
      console.error('Error creating Google Maps instance:', err);
    }
  }, [mapsLoaded, mapInstance]);

  // 3. Clear Map Overlay components
  const clearMapOverlays = () => {
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    setDirectionsRenderers([]);
    mapMarkers.forEach(marker => marker.setMap(null));
    setMapMarkers([]);
    if (userMarker) {
      userMarker.setMap(null);
      setUserMarker(null);
    }
  };

  // 4. Find routes using Google Directions and score via Gemini backend
  const handleSearch = async () => {
    if (!source || !destination) return;
    setLoading(true);
    setSelectedRoute(null);
    setIsNavigating(false);
    setNavProgress(0);
    clearMapOverlays();

    // If Google maps loaded, perform actual Directions search
    if (mapsLoaded && directionsService && mapInstance) {
      directionsService.route({
        origin: source,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      }, async (result, status) => {
        if (status === 'OK') {
          try {
            // Hit backend for safety analysis based on directions results
            const backendRes = await fetch(`${backendUrl}/api/routes/analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ source, destination }),
            });

            const safetyData = await backendRes.json();
            setGeminiUtilized(safetyData.gemini_utilized);

            // Match Directions routes to our safety ratings
            const renderers = [];
            const processedRoutes = result.routes.map((googleRoute, index) => {
              // Fallback safety score configuration
              const mockSafety = safetyData.routes[index] || safetyData.routes[0];
              
              // Colors: Safest (Green), Unsafe (Red), Moderate (Yellow)
              let strokeColor = '#EF4444'; // Red
              if (mockSafety.safety_score >= 85) strokeColor = '#10B981'; // Green
              else if (mockSafety.safety_score >= 70) strokeColor = '#F59E0B'; // Yellow

              const renderer = new window.google.maps.DirectionsRenderer({
                map: mapInstance,
                directions: result,
                routeIndex: index,
                polylineOptions: {
                  strokeColor,
                  strokeOpacity: index === 0 ? 0.9 : 0.4,
                  strokeWeight: index === 0 ? 6 : 4
                },
                suppressMarkers: true
              });

              renderers.push(renderer);

              return {
                route_id: mockSafety.route_id || `route_${index}`,
                route_name: googleRoute.summary ? `Route via ${googleRoute.summary}` : mockSafety.route_name,
                distance: googleRoute.legs[0].distance.text,
                duration: googleRoute.legs[0].duration.text,
                safety_score: mockSafety.safety_score,
                safety_rating: mockSafety.safety_rating,
                reasons: mockSafety.reasons,
                nearby_assets: mockSafety.nearby_assets,
                recommendation_text: mockSafety.recommendation_text,
                overview_path: googleRoute.overview_path // Real GPS nodes list
              };
            });

            setRoutes(processedRoutes);
            setDirectionsRenderers(renderers);

            // Select safest route by default
            const safest = processedRoutes.reduce((prev, current) => 
              (prev.safety_score > current.safety_score) ? prev : current
            );
            
            setSelectedRoute(safest);
            fitMapBounds(result);
            setLoading(false);
          } catch (err) {
            console.error('Backend safety evaluation failed:', err);
            setLoading(false);
          }
        } else {
          alert('Directions search failed. Please verify location names.');
          setLoading(false);
        }
      });
    } else {
      // Fallback if Google script isn't running
      alert('Google Maps SDK is initializing. Please wait.');
      setLoading(false);
    }
  };

  // Adjust zoom bounds to fit routes
  const fitMapBounds = (directionsResult) => {
    const bounds = new window.google.maps.LatLngBounds();
    directionsResult.routes.forEach(route => {
      route.overview_path.forEach(point => bounds.extend(point));
    });
    mapInstance.fitBounds(bounds);
  };

  // 5. Redraw Map Markers when route selection changes
  useEffect(() => {
    if (!selectedRoute || !mapInstance || Platform.OS !== 'web') return;

    // Highlights selected route on Map
    const selectedIdx = routes.findIndex(r => r.route_id === selectedRoute.route_id);
    directionsRenderers.forEach((renderer, idx) => {
      renderer.setOptions({
        polylineOptions: {
          strokeColor: renderer.polylineOptions.strokeColor,
          strokeOpacity: idx === selectedIdx ? 0.95 : 0.3,
          strokeWeight: idx === selectedIdx ? 7 : 4
        }
      });
    });

    // Clear old asset markers
    mapMarkers.forEach(m => m.setMap(null));
    const newMarkers = [];

    const path = selectedRoute.overview_path;
    setActiveRoutePath(path);

    if (path && path.length > 0) {
      // Plot start pin
      const startMarker = new window.google.maps.Marker({
        position: path[0],
        map: mapInstance,
        title: 'Start Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 8
        }
      });
      newMarkers.push(startMarker);

      // Plot destination pin
      const destMarker = new window.google.maps.Marker({
        position: path[path.length - 1],
        map: mapInstance,
        title: 'Destination Location',
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: '#22C55E',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 6
        }
      });
      newMarkers.push(destMarker);

      // Plot safety assets along path
      if (selectedRoute.nearby_assets) {
        selectedRoute.nearby_assets.forEach((asset, idx) => {
          // Put markers at spacing intervals along path
          const pathIndex = Math.floor((path.length / (selectedRoute.nearby_assets.length + 1)) * (idx + 1));
          const assetPos = path[pathIndex] || path[Math.floor(path.length / 2)];

          let iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'; // Police
          if (asset.type === 'hospital') iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
          if (asset.type === 'pharmacy') iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
          if (asset.type === 'petrol') iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

          const assetMarker = new window.google.maps.Marker({
            position: assetPos,
            map: mapInstance,
            title: asset.name,
            icon: {
              url: iconUrl,
              scaledSize: new window.google.maps.Size(30, 30)
            }
          });
          newMarkers.push(assetMarker);
        });
      }
    }

    setMapMarkers(newMarkers);
  }, [selectedRoute]);

  // 6. Real-time User position navigation simulation
  useEffect(() => {
    let interval;
    if (isNavigating && activeRoutePath.length > 0 && mapInstance) {
      // Create user dot marker if missing
      let dot = userMarker;
      if (!dot) {
        dot = new window.google.maps.Marker({
          position: activeRoutePath[0],
          map: mapInstance,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#38BDF8',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
          }
        });
        setUserMarker(dot);
      }

      interval = setInterval(() => {
        setNavProgress(prev => {
          const nextVal = prev + 2;
          if (nextVal >= 100) {
            clearInterval(interval);
            setIsNavigating(false);
            dot.setMap(null);
            setUserMarker(null);
            alert('Safe Arrival! You have reached your destination.');
            return 100;
          }

          // Move marker position along path array index
          const nodeIndex = Math.floor((activeRoutePath.length - 1) * (nextVal / 100));
          const currentPos = activeRoutePath[nodeIndex];
          if (currentPos) {
            dot.setPosition(currentPos);
            mapInstance.panTo(currentPos);
          }

          return nextVal;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isNavigating, activeRoutePath]);

  const getScoreColor = (score) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#EAB308';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      {!isNavigating && (
        <View style={styles.searchHeader}>
          <View style={styles.inputRow}>
            <Ionicons name="radio-button-on" size={16} color="#3B82F6" style={styles.inputMarker} />
            <TextInput
              style={styles.input}
              placeholder="Source Location"
              placeholderTextColor="#6B7280"
              value={source}
              onChangeText={setSource}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="location" size={16} color="#EF4444" style={styles.inputMarker} />
            <TextInput
              style={styles.input}
              placeholder="Destination Location"
              placeholderTextColor="#6B7280"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.searchBtnText}>Find Safest Route</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Progress bar */}
      {isNavigating && (
        <View style={styles.navProgressCard}>
          <View style={styles.navProgressHeader}>
            <Text style={styles.navProgressTitle}>Navigating Safely...</Text>
            <TouchableOpacity style={styles.stopNavBtn} onPress={() => setIsNavigating(false)}>
              <Text style={styles.stopNavBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${navProgress}%` }]} />
          </View>
          <View style={styles.navProgressFooter}>
            <Text style={styles.navProgressText}>{navProgress}% completed</Text>
            <Text style={styles.navProgressText}>GPS Connection Active</Text>
          </View>
        </View>
      )}

      {/* Google Maps Container */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
        ) : (
          <View style={styles.fallbackMap}>
            <Ionicons name="map-outline" size={40} color="#4B5563" />
            <Text style={styles.fallbackText}>Native SDK required on device</Text>
          </View>
        )}

        {/* Loading overlay */}
        {loading && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.mapOverlayText}>AI Safety Scorer evaluating routes...</Text>
          </View>
        )}

        {/* Initial Search Helper overlay */}
        {routes.length === 0 && !loading && (
          <View style={styles.mapOverlay}>
            <Ionicons name="map-outline" size={40} color="#4B5563" />
            <Text style={styles.mapOverlayText}>Enter route details to view real-time safety analysis</Text>
          </View>
        )}
      </View>

      {/* Route Cards & Insights */}
      {routes.length > 0 && !isNavigating && (
        <View style={styles.detailsContainer}>
          <Text style={styles.engineText}>
            {geminiUtilized ? '⚡ Scored by Gemini AI' : '⚙️ Scored by Local Safety Scorer'}
          </Text>

          {/* Horizonal Route Choices */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeCardsScroll}>
            {routes.map((route) => (
              <TouchableOpacity
                key={route.route_id}
                style={[
                  styles.routeCard,
                  selectedRoute?.route_id === route.route_id && styles.routeCardSelected
                ]}
                onPress={() => setSelectedRoute(route)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{route.route_name}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(route.safety_score) }]}>
                    <Text style={styles.scoreText}>{route.safety_score}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{route.distance} • {route.duration}</Text>
                <Text style={styles.cardRating}>Safety: {route.safety_rating}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Route Insights Panel */}
          {selectedRoute && (
            <View style={styles.selectedRouteDetails}>
              <Text style={styles.detailsTitle}>Safety Insights</Text>
              <Text style={styles.detailsDesc}>{selectedRoute.recommendation_text}</Text>
              
              <View style={styles.assetsList}>
                <Text style={styles.assetsTitle}>Safety Havens along path:</Text>
                {selectedRoute.nearby_assets && selectedRoute.nearby_assets.length > 0 ? (
                  <View style={styles.assetsRow}>
                    {selectedRoute.nearby_assets.map((asset, i) => (
                      <View key={i} style={styles.assetTag}>
                        <Ionicons 
                          name={
                            asset.type === 'police' ? 'shield' :
                            asset.type === 'hospital' ? 'medical' :
                            asset.type === 'pharmacy' ? 'leaf' : 'cart'
                          } 
                          size={11} 
                          color="#FFF" 
                        />
                        <Text style={styles.assetTagText}>{asset.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noAssetsText}>No emergency response units along this path.</Text>
                )}
              </View>

              <TouchableOpacity style={styles.navigateBtn} onPress={() => setIsNavigating(true)}>
                <Ionicons name="navigate" size={18} color="#FFF" style={styles.navBtnIcon} />
                <Text style={styles.navigateBtnText}>Start Safe Navigation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchHeader: {
    backgroundColor: '#1F2937',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    height: 38,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  inputMarker: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  navProgressCard: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  navProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navProgressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  stopNavBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stopNavBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#111827',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  navProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  navProgressText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111827',
  },
  fallbackMap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  fallbackText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    zIndex: 100,
  },
  mapOverlayText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  engineText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  routeCardsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 10,
    width: 150,
    marginRight: 10,
  },
  routeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
    flex: 1,
  },
  scoreBadge: {
    width: 24,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  scoreText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  cardMeta: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  cardRating: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedRouteDetails: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  detailsDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 15,
  },
  assetsList: {
    marginTop: 10,
  },
  assetsTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  assetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  assetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  assetTagText: {
    color: '#FFF',
    fontSize: 9,
    marginLeft: 4,
  },
  noAssetsText: {
    color: '#EF4444',
    fontSize: 10,
    fontStyle: 'italic',
  },
  navigateBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  navBtnIcon: {
    marginRight: 6,
  },
  navigateBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
