import React, { useEffect, useState, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-sdk/services/directions";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapComponent.css"; // Import CSS
import EmergencyCorner from "./Email";

const accessTokenMapBOX =
  "pk.eyJ1IjoicmFtYW5yZWQiLCJhIjoiY204dmlwbzlzMHcwZzJrczNkbDAwdDNoNSJ9.5FE_MvlTHXSuyl7scCBK6w";
mapboxgl.accessToken = accessTokenMapBOX;

const MapComponent = ({
  startCoords,
  endCoords,
  avoidPoints = [],
  routeLimit = 3,
  onUpdateStartLocation = () => {}
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [actualStartCoords, setActualStartCoords] = useState(startCoords);
  // New state for danger detection
  const [isDangerZoneDetected, setIsDangerZoneDetected] = useState(false);
  const [lastMovementTime, setLastMovementTime] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const proximityCheckTimerRef = useRef(null);
  const dangerCooldownRef = useRef(null);

  /** ✅ Fetch routes avoiding specific points */
  const getRoutes = useCallback(async (start = actualStartCoords, end = endCoords) => {
    if (!start || !end) {
      console.error("Invalid coordinates provided.");
      return;
    }

    try {
      const directionsClient = MapboxDirections({
        accessToken: mapboxgl.accessToken,
      });

      const response = await directionsClient
        .getDirections({
          profile: "driving",
          waypoints: [
            { coordinates: start }, 
            { coordinates: end }
          ],
          alternatives: true,
          geometries: "geojson",
        })
        .send();

      if (!response.body || !response.body.routes || !response.body.routes.length) {
        console.error("No routes found");
        return;
      }

      let routesData = response.body.routes;
      
      // Limit the number of routes to display
      routesData = routesData.slice(0, routeLimit);
      
      // Update the routes state
      setRoutes(routesData);
      
      // Set the first route as selected by default
      if (routesData.length > 0) {
        setSelectedRoute(routesData[0]);
        setSelectedRouteIndex(0);
      }

      const countIntersections = (route) => {
        let penaltyScore = 0;
        const routeLine = turf.lineString(route.geometry.coordinates);

        avoidPoints.forEach((point) => {
          const pointFeature = turf.point(point);
          const distance = turf.pointToLineDistance(pointFeature, routeLine, {
            units: "meters",
          });

          if (distance <= 50) {
            penaltyScore += 5; // High penalty for very close points
          } else if (distance <= 200) {
            penaltyScore += 3; // Medium penalty for moderately close points
          } else if (distance <= 500) {
            penaltyScore += 1; // Low penalty for slightly close points
          }
        });

        return penaltyScore;
      };

      // Find the index of the best route (minimum penalty score)
      let minIndex = 0;
      let minScore = Infinity;

      routesData.forEach((route, index) => {
        const score = countIntersections(route);
        if (score < minScore) {
          minScore = score;
          minIndex = index;
        }
      });

      if (map.current) {
        // Check if the map is loaded
        if (!map.current.isStyleLoaded()) {
          console.log("Map style not fully loaded, waiting...");
          return;
        }

        // Remove any previously drawn routes
        const layers = map.current.getStyle().layers || [];
        layers.forEach((layer) => {
          if (layer.id.startsWith("route-")) {
            map.current.removeLayer(layer.id);
          }
        });

        const sources = map.current.getStyle().sources || {};
        Object.keys(sources).forEach((sourceId) => {
          if (sourceId.startsWith("route-")) {
            map.current.removeSource(sourceId);
          }
        });

        // Draw all routes on the map with different colors
        routesData.forEach((route, index) => {
          const routeId = `route-${index}`;
          const isSelected = index === minIndex;
          
          // Add the route to the map
          map.current.addSource(routeId, {
            type: "geojson",
            data: { type: "Feature", geometry: route.geometry },
          });

          map.current.addLayer({
            id: routeId,
            type: "line",
            source: routeId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": isSelected ? "#0000FF" : "#888888", // Blue for selected, gray for others
              "line-width": isSelected ? 6 : 4,
              "line-opacity": isSelected ? 0.9 : 0.6,
            },
          });
        });

        // Select the best route automatically
        setSelectedRouteIndex(minIndex);
        setSelectedRoute(routesData[minIndex]);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  }, [endCoords, avoidPoints, routeLimit]);

  /** ✅ Check if user is near any avoid points and detect non-movement */
  const checkProximityToDangerZones = useCallback(() => {
    // Get the effective position - when not navigating, use startCoords
    const effectivePosition = isNavigating ? userPosition : startCoords;
    
    console.log(`Checking proximity: avoid points ${avoidPoints.length}, position: ${effectivePosition}`);
    if (!effectivePosition || avoidPoints.length === 0) return;
    
    // Check if we're already in a danger cooldown period
    if (dangerCooldownRef.current) return;

    // Check distance to avoid points
    let inDangerZone = false;
    const userPoint = turf.point(effectivePosition);
    
    for (const point of avoidPoints) {
      const avoidPoint = turf.point(point);
      const distance = turf.distance(userPoint, avoidPoint, { units: "meters" });
      
      // If user is within 100 meters of any avoid point, consider it a danger zone
      if (distance <= 100) {
        inDangerZone = true;
        break;
      }
    }
    
    // Check if user has moved in the last 3 minutes (only when navigating)
    let isStationaryTooLong = false;
    
    if (isNavigating && lastPosition && lastMovementTime) {
      // Calculate distance moved since last significant position
      const distanceMoved = turf.distance(
        turf.point(lastPosition),
        turf.point(effectivePosition),
        { units: "meters" }
      );
      
      // If user hasn't moved more than 10 meters in 3 minutes
      const timeSinceLastMovement = Date.now() - lastMovementTime;
      if (distanceMoved < 10 && timeSinceLastMovement > 3 * 60 * 1000) {
        isStationaryTooLong = true;
      }
      
      // Update last position if moved significantly
      if (distanceMoved > 10) {
        setLastPosition(effectivePosition);
        setLastMovementTime(Date.now());
      }
    } else if (isNavigating) {
      // Initialize if first time while navigating
      setLastPosition(effectivePosition);
      setLastMovementTime(Date.now());
    }
    
    // Set danger zone flag if either condition is met
    if (inDangerZone || isStationaryTooLong) {
      console.log(`DANGER ZONE DETECTED! ${inDangerZone ? 'Near avoid point' : 'Not moving for extended period'}`);
      setIsDangerZoneDetected(true);
      
      // Set a cooldown period of 15 minutes before triggering another alert
      dangerCooldownRef.current = setTimeout(() => {
        dangerCooldownRef.current = null;
      }, 15 * 60 * 1000); // 15 minutes cooldown
    } else {
      setIsDangerZoneDetected(false);
    }
  }, [userPosition, avoidPoints, lastPosition, lastMovementTime, isNavigating, startCoords]);

  /** ✅ Reset danger detection */
  const handleDangerAlertClose = useCallback(() => {
    setIsDangerZoneDetected(false);
  }, []);

  /** ✅ Initialize Mapbox */
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: startCoords || [0, 0],
        zoom: startCoords ? 12 : 2,
      });

      map.current.on("load", () => {
        if (startCoords && endCoords) {
          setActualStartCoords(startCoords);
          getRoutes(startCoords, endCoords);
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [startCoords, endCoords, getRoutes]);
  
  /** ✅ Set up periodic check timer */
  useEffect(() => {
    // Set up timer to check proximity every 3 minutes (180000ms)
    if (proximityCheckTimerRef.current) {
      clearInterval(proximityCheckTimerRef.current);
    }
    
    proximityCheckTimerRef.current = setInterval(() => {
      checkProximityToDangerZones();
    }, 3 * 1* 1000); // Check every 3 minutes
    
    // Initial check immediately
    checkProximityToDangerZones();
    console.log("check proximity");
    
    return () => {
      if (proximityCheckTimerRef.current) {
        clearInterval(proximityCheckTimerRef.current);
      }
      
      if (dangerCooldownRef.current) {
        clearTimeout(dangerCooldownRef.current);
      }
    };
  }, [checkProximityToDangerZones]);

  /** ✅ Update routes when dependencies change */
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && startCoords && endCoords) {
      setActualStartCoords(startCoords);
      getRoutes(startCoords, endCoords);
    }
  }, [startCoords, endCoords, avoidPoints, routeLimit, getRoutes]);

  /** ✅ Track real-time user movement and update the marker */
  useEffect(() => {
    let watchId;

    // Add or update user marker based on navigation state
    if (map.current && map.current.isStyleLoaded()) {
      const createOrUpdateMarker = (position) => {
        if (!position) return;
        
        if (!userMarker.current) {
          // Create a new user location marker if it doesn't exist
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '22px';
          el.style.height = '22px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#007aff';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
          
          userMarker.current = new mapboxgl.Marker(el)
            .setLngLat(position)
            .addTo(map.current);
        } else {
          // Update existing marker position
          userMarker.current.setLngLat(position);
        }
        
        // Center the map on user's location
        map.current.flyTo({ center: position, zoom: 15 });
      };

      if (isNavigating && !isPaused) {
        // Get user's current location through geolocation when navigating
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            const newPosition = [longitude, latitude];
            
            // Update user position state
            setUserPosition(newPosition);
            createOrUpdateMarker(newPosition);

            // Recalculate route if user deviates significantly from the path
            const selectedRouteLine = selectedRoute ? 
              turf.lineString(selectedRoute.geometry.coordinates) : null;
            
            if (selectedRouteLine) {
              const distanceFromRoute = turf.pointToLineDistance(
                turf.point(newPosition),
                selectedRouteLine,
                { units: "meters" }
              );
              
              // If user is more than 50 meters from route, recalculate
              if (distanceFromRoute > 50) {
                setActualStartCoords(newPosition);
                getRoutes(newPosition, endCoords);
                onUpdateStartLocation(newPosition); // Notify parent component
              }
            }

            // Stop navigation if user reaches near the destination
            if (
              endCoords && turf.distance(
                turf.point(newPosition),
                turf.point(endCoords),
                { units: "kilometers" }
              ) < 0.005
            ) {
              setIsNavigating(false);
              alert("You have reached your destination!");
              if (watchId) navigator.geolocation.clearWatch(watchId);
            }
          },
          (error) => console.error("Error getting location:", error),
          { enableHighAccuracy: true }
        );
      } else {
        // When not navigating, use the startCoords for the marker position
        if (startCoords) {
          createOrUpdateMarker(startCoords);
        }
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating, isPaused, endCoords, selectedRoute, getRoutes, onUpdateStartLocation, startCoords]);

  // Update user marker when startCoords changes and not navigating
  useEffect(() => {
    if (!isNavigating && startCoords && map.current && map.current.isStyleLoaded()) {
      if (!userMarker.current) {
        // Create a new user location marker if it doesn't exist
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.width = '22px';
        el.style.height = '22px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#007aff';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
        
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat(startCoords)
          .addTo(map.current);
      } else {
        // Update existing marker position
        userMarker.current.setLngLat(startCoords);
      }
      
      // Center the map on start location
      map.current.flyTo({ center: startCoords, zoom: 15 });
    }
  }, [startCoords, isNavigating]);

  /** ✅ Handle route selection */
  const handleRouteSelection = (index) => {
    if (!routes[index]) return;
    
    setSelectedRoute(routes[index]);
    setSelectedRouteIndex(index);
    
    // Update route display on map
    if (map.current && map.current.isStyleLoaded()) {
      // Update route colors based on selection
      routes.forEach((route, i) => {
        const routeId = `route-${i}`;
        const isSelected = i === index;
        
        if (map.current.getLayer(routeId)) {
          map.current.setPaintProperty(
            routeId,
            "line-color",
            isSelected ? "#0000FF" : "#888888"
          );
          map.current.setPaintProperty(
            routeId, 
            "line-width", 
            isSelected ? 6 : 4
          );
          map.current.setPaintProperty(
            routeId,
            "line-opacity",
            isSelected ? 0.9 : 0.6
          );
        }
      });
    }
  };

  /** ✅ Start navigation */
  const startNavigation = () => {
    if (!endCoords) {
      alert("Please set a destination first");
      return;
    }
    
    // Get user's current position before starting navigation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const currentUserPosition = [longitude, latitude];
        
        // Update user position and actual start coordinates
        setUserPosition(currentUserPosition);
        setActualStartCoords(currentUserPosition);
        
        // Recalculate routes with actual user location
        getRoutes(currentUserPosition, endCoords);
        
        // Notify parent component about the location change
        onUpdateStartLocation(currentUserPosition);
        
        // Start navigation
        setIsNavigating(true);
        setIsPaused(false);
        
        // Reset movement tracking
        setLastPosition(currentUserPosition);
        setLastMovementTime(Date.now());
        
        // Add a notification to confirm navigation started from current location
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'location-notification';
        notificationDiv.textContent = 'Navigating from your current location';
        notificationDiv.style.position = 'absolute';
        notificationDiv.style.top = '20px';
        notificationDiv.style.left = '50%';
        notificationDiv.style.transform = 'translateX(-50%)';
        notificationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notificationDiv.style.color = 'white';
        notificationDiv.style.padding = '10px 15px';
        notificationDiv.style.borderRadius = '5px';
        notificationDiv.style.zIndex = '1000';
        
        document.body.appendChild(notificationDiv);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notificationDiv.remove();
        }, 3000);
      },
      (error) => {
        console.error("Error getting initial location:", error);
        alert("Could not get your current location. Please check your location permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  /** ✅ Pause/Resume navigation */
  const pauseNavigation = () => {
    setIsPaused((prev) => !prev);
  };

  /** ✅ Stop navigation */
  const stopNavigation = () => {
    setIsNavigating(false);
    setIsPaused(false);
    
    // Reset to original start/end if needed
    if (startCoords && startCoords !== actualStartCoords) {
      setActualStartCoords(startCoords);
      getRoutes(startCoords, endCoords);
    }
  };

  // Visualize avoid points on the map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || avoidPoints.length === 0) return;
    
    // Remove existing avoid points
    if (map.current.getSource('avoid-points')) {
      map.current.removeLayer('avoid-points-layer');
      map.current.removeSource('avoid-points');
    }
    
    // Add avoid points as a source
    map.current.addSource('avoid-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: avoidPoints.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point
          },
          properties: {
            description: 'Danger Zone'
          }
        }))
      }
    });
    
    // Add a layer to display avoid points
    map.current.addLayer({
      id: 'avoid-points-layer',
      type: 'circle',
      source: 'avoid-points',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ff0000',
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
    
    // Add danger zone radius visualization
    map.current.addSource('danger-zones', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: avoidPoints.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point
          }
        }))
      }
    });
    
    map.current.addLayer({
      id: 'danger-zone-radius',
      type: 'circle',
      source: 'danger-zones',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 20,
          15, 100,
          20, 500
        ],
        'circle-color': '#ff0000',
        'circle-opacity': 0.2,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ff0000',
        'circle-stroke-opacity': 0.5
      }
    });
    
  }, [avoidPoints, map.current]);

  // Get the effective position for the EmergencyCorner component
  const effectivePosition = isNavigating ? userPosition : startCoords;

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map-view" />
      {/* Pass danger detection flag and reset function to EmergencyCorner */}
      <EmergencyCorner 
        currentPosition={effectivePosition}
        autoExpand={isDangerZoneDetected}
        onClose={handleDangerAlertClose}
      />
      {routes.length > 0 && (
        <div className="route-controls">
          <select
            value={selectedRouteIndex}
            onChange={(e) => handleRouteSelection(parseInt(e.target.value))}
            className="route-dropdown"
            disabled={isNavigating}
          >
            {routes.map((route, index) => (
              <option key={index} value={index}>
                Route {index + 1} (Duration: {Math.round(route.duration / 60)}{" "}
                min)
              </option>
            ))}
          </select>

          {!isNavigating ? (
            <button
              onClick={startNavigation}
              className="nav-button"
            >
              Start Navigation from Current Location
            </button>
          ) : (
            <>
              <button
                onClick={pauseNavigation}
                className={`pause-button ${isPaused ? "resume" : "pause"}`}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stopNavigation}
                className="stop-button"
              >
                Stop Navigation
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Danger detection status indicator - for debugging */}
      {isDangerZoneDetected && (
        <div className="danger-alert-indicator">
          ⚠️ Danger zone detected! Sending emergency alert.
        </div>
      )}
    </div>
  );
};

export default MapComponent;