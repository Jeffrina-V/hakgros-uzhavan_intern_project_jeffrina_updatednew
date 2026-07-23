const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/:city/:crop", async (req, res) => {
  try {
    const city = req.params.city;
    const crop = req.params.crop;

    const apiKey = process.env.WEATHER_API_KEY;

    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;

    const response = await axios.get(url);

    const weatherData = response.data;
    console.log(weatherData); 

  if (weatherData.error) {
  return res.status(400).json({
    success: false,
    message: weatherData.error.message,
  });
}

if (!weatherData.current) {
  return res.status(400).json({
    success: false,
    message: "Weather data not found",
  });
} 
const temperature = weatherData.current?.temp_c || 0;
const humidity = weatherData.current?.humidity || 0;
const weather =
  weatherData.current?.condition?.text || "Unknown"; 
    let advice = "";
    let farmHealth = 100;

    // Crop-specific AI logic

    if (crop.toLowerCase() === "rice") {
      advice =
        "Maintain proper water level for rice crops.";
    }

    else if (crop.toLowerCase() === "cotton") {
      advice =
        "Monitor pest activity due to humidity.";
    }

    else if (crop.toLowerCase() === "tomato") {

      advice =
        "Monitor tomato leaves carefully for fungal infection.";

      if (
        humidity > 75 ||
        weather.toLowerCase().includes("rain")
      ) {

        advice +=
          " High fungal disease risk detected for tomato crops.";

        farmHealth -= 20;
      }
    }

    else {

      advice =
        "Weather conditions are normal for farming.";

    }

    // Temperature Risk

    if (temperature > 35) {

      advice +=
        " High temperature detected.";

      farmHealth -= 15;
    }

    // Humidity Risk

    if (humidity > 85) {

      advice +=
        " Humidity is very high.";

      farmHealth -= 10;
    }

    // Rain Logic

    if (
      humidity > 75 &&
      weather.toLowerCase().includes("rain")
    ) {

      advice +=
        " Avoid irrigation today.";
    }

    // Tamil Support

    const tamil = req.query.tamil;

    if (tamil === "true") {

      if (crop.toLowerCase() === "rice") {

        advice =
          "நெல் பயிருக்கு தேவையான நீர் அளவை பராமரிக்கவும்.";
      }

      else if (crop.toLowerCase() === "cotton") {

        advice =
          "ஈரப்பதம் காரணமாக பூச்சி தாக்கத்தை கவனிக்கவும்.";
      }

      else if (crop.toLowerCase() === "tomato") {

        advice =
          "தக்காளி இலைகளை பூஞ்சை தொற்றுக்காக கவனிக்கவும்.";

        if (
          humidity > 75 ||
          weather.toLowerCase().includes("rain")
        ) {

          advice +=
            " அதிக பூஞ்சை நோய் அபாயம் கண்டறியப்பட்டது.";
        }
      }
    }

    // Farm Health Status

    let status = "";

    if (farmHealth >= 90) {
      status = "Excellent";
    }

    else if (farmHealth >= 70) {
      status = "Moderate";
    }

    else {
      status = "Risk";
    }

    // Response

    res.json({
      city,
      crop,
      temperature,
      humidity,
      weather,
      advice,
      farmHealth,
      status,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

module.exports = router; 