app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city || "Coimbatore";

    console.log("Weather requested for:", city);
    console.log("API Key:", process.env.WEATHER_API_KEY);

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    console.log("Weather API Success");

    res.json(response.data);

  } catch (err) {

    console.log("Weather Error:");
    console.log(err.response?.data || err.message);

    res.status(500).json({
      message: "Unable to fetch weather",
      error: err.response?.data || err.message,
    });
  }
});