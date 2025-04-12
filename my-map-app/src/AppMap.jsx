import React, { useState, useEffect } from "react";
import axios from "axios";
import * as turf from "@turf/turf";
import Papa from "papaparse"; // Import CSV parsing library
import MapComponent from "./MapComponent";
import "./AppMap.css";

const accessTokenMapBOX =
  "pk.eyJ1IjoicmFtYW5yZWQiLCJhIjoiY204dmlwbzlzMHcwZzJrczNkbDAwdDNoNSJ9.5FE_MvlTHXSuyl7scCBK6w";

const AppMap = () => {
  const [startCoords, setStartCoords] = useState([-74.006, 40.7128]);
  const [endCoords, setEndCoords] = useState([-87.6298, 41.8781]);
  const [userStart, setUserStart] = useState("");
  const [userEnd, setUserEnd] = useState("");
  const [avoidPoints, setAvoidPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Load stored locations from localStorage on component mount
    const storedData = JSON.parse(localStorage.getItem("registeredData"));

    if (storedData) {
      setUserStart(storedData.Start || "");
      setUserEnd(storedData.Destination || "");
      
      // Convert stored addresses to coordinates
      if (storedData.Start) handleFind(storedData.Start, setStartCoords);
      if (storedData.Destination) handleFind(storedData.Destination, setEndCoords);
    }

    // Load CSV data and update avoid points
    fetchCsvData();
  }, []);

  const fetchCsvData = async () => {
    try {
      // Fetch CSV file from the backend server
      const response = await axios.get("http://localhost:3001/crime_open.csv", {
        headers: { "Content-Type": "text/csv" },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch CSV: HTTP ${response.status}`);
      }

      const csvText = response.data;

      // Parse CSV data using PapaParse
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            console.error("CSV parsing errors:", result.errors);
            return;
          }

          const points = result.data
            .map((row) => [
              parseFloat(row.longitude), 
              parseFloat(row.latitude),
            ])
            .filter(
              (coord) =>
                !isNaN(coord[0]) &&
                !isNaN(coord[1]) &&
                coord[0] >= -180 && coord[0] <= 180 &&
                coord[1] >= -90 && coord[1] <= 90
            );

            setAvoidPoints(points.slice(0, 100));
            console.log("Successfully parsed avoid points:", points.length);
        },
      });
    } catch (error) {
      console.error("❌ Error loading CSV data:", error.message);
    }
  };

  const handleFindRoutes = async () => {
    setIsLoading(true);
    
    try {
      if (!userStart || !userEnd) {
        alert("Please enter both start and destination locations.");
        setIsLoading(false);
        return;
      }

      await handleFind(userStart, setStartCoords);
      await handleFind(userEnd, setEndCoords);
      await saveTravelHistory();
      
      // Reset navigation state when finding new routes
      setIsNavigating(false);
    } catch (err) {
      console.error(
        `❌ Error occurred while processing routes: ${err.message}`
      );
      alert("Failed to process routes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveTravelHistory = async () => {
    const storedData = JSON.parse(localStorage.getItem("registeredData"));
    if (!storedData) {
      console.log("No registered data found to save travel history");
      return;
    }

    const savingDetails = JSON.parse(localStorage.getItem("savingData"));

    const sharedData = {
      start: userStart,
      destination: userEnd,
      email: storedData.Email,
      route: savingDetails,
    };
    
    try {
      const saveResponse = await axios.post(
        "http://localhost:3001/save",
        sharedData
      );
      console.log("Travel History Stored Successfully", saveResponse.status);
    } catch (err) {
      console.log(`Error occurred while storing data ${err.message}`);
    }
  };
  
  const handleFind = async (address, setFunction) => {
    if (!address) {
      return;
    }

    if (address === "Current Location") {
      // Handle current location specially
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setFunction([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting current location:", error);
          alert("Could not get your current location. Please check your location permissions.");
        },
        { enableHighAccuracy: true }
      );
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessTokenMapBOX}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        alert("No location found for the given address: " + address);
        return;
      }
      const coords = data.features[0].center;
      setFunction([coords[0], coords[1]]);
    } catch (error) {
      console.error("❌ Error fetching coordinates:", error);
      alert("Something went wrong while searching for location. Check the console for details.");
    }
  };

  const handleCurrentLocationAsStart = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setStartCoords([longitude, latitude]);
        setUserStart("Current Location");
      },
      (error) => {
        console.error("Error getting current location:", error);
        alert("Could not get your current location. Please check your location permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Handle updates to start location from MapComponent during navigation
  const handleStartLocationUpdate = (newLocation) => {
    setStartCoords(newLocation);
    setIsNavigating(true);
    
    // If we were not already using "Current Location" as the label, update it
    if (userStart !== "Current Location") {
      setUserStart("Current Location");
    }
    
    // Save updated travel history with new start location
    saveTravelHistory();
  };

  return (
    <div className="app-container">
      <div className="input-container">
        <div className="input-group">
          <input
            type="text"
            placeholder="Start Location"
            value={userStart}
            onChange={(e) => setUserStart(e.target.value)}
            className="location-input"
            disabled={isNavigating}
          />
          <button 
            onClick={handleCurrentLocationAsStart} 
            className="current-location-button" 
            title="Use current location"
            disabled={isNavigating}
          >
            📍
          </button>
        </div>
        <input
          type="text"
          placeholder="End Location"
          value={userEnd}
          onChange={(e) => setUserEnd(e.target.value)}
          className="location-input"
          disabled={isNavigating}
        />
        <button 
          onClick={handleFindRoutes} 
          className="find-routes-button"
          disabled={isLoading || isNavigating}
        >
          {isLoading ? "Finding..." : "Find Routes"}
        </button>
        {isNavigating && (
          <div className="navigation-status">
            Navigating from current location to {userEnd}
          </div>
        )}
      </div>

      <MapComponent
        startCoords={startCoords}
        endCoords={endCoords}
        avoidPoints={avoidPoints}
        routeLimit={3}
        onUpdateStartLocation={handleStartLocationUpdate}
      />
    </div>
  );
};

export default AppMap;