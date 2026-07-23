import React, { useState, useEffect } from "react";
import {
  Leaf,
  CloudSun,
  TrendingUp,
  Globe,
  Menu,
} from "lucide-react";

const premiumCardStyle = {
  background: "rgba(255,255,255,0.96)",
  padding: "22px",
  borderRadius: "18px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
  transition: "transform 0.25s ease, box-shadow 0.25s ease",
};

function App() {

  // ===========================
  // STATES
  // ===========================

  const [language, setLanguage] = useState("en");

  const [query, setQuery] = useState("");

  const [response, setResponse] = useState("");
  const [responseSource, setResponseSource] = useState("");

  const [farmers, setFarmers] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [marketPrices, setMarketPrices] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalFarmers: 0,
    totalAdvisories: 0,
    diseaseReports: 0,
  });

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    village: "",
    cropType: "",
    landSize: "",
  });

  const [activePage, setActivePage] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(true);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [useGemini, setUseGemini] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("hakgros_token") || ""
  );
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("hakgros_user")) || null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("hakgros_token")
  );
  const [preview, setPreview] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

  const getAuthHeaders = () => ({
    ...(authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {}),
  });

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("hakgros_token");
    localStorage.removeItem("hakgros_user");
    setAuthToken("");
    setUser(null);
    setIsAuthenticated(false);
    setActivePage("auth");
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      const url = `${API_BASE}/api/${authMode}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "login") {
        localStorage.setItem("hakgros_token", data.token);
        localStorage.setItem(
          "hakgros_user",
          JSON.stringify(data.user)
        );
        setAuthToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setActivePage("dashboard");
        setAuthForm({ name: "", email: "", password: "" });
      } else {
        setAuthMode("login");
        setAuthForm({ ...authForm, password: "" });
        setAuthError(
          "Registration successful. Please login to continue."
        );
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const t = (en, ta) => (language === "en" ? en : ta);

  const authFetch = async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...getAuthHeaders(),
      },
    });
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/weather?city=Coimbatore`
      );

      if (!res.ok) {
        throw new Error("Unable to load weather data");
      }

      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.log("Weather fetch error:", error);
      setWeatherError(error.message || "Unable to load weather data");
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      "01d": "☀️",
      "01n": "🌙",
      "02d": "⛅",
      "02n": "☁️",
      "03d": "☁️",
      "03n": "☁️",
      "04d": "☁️",
      "04n": "☁️",
      "09d": "🌧️",
      "09n": "🌧️",
      "10d": "🌦️",
      "10n": "🌧️",
      "11d": "⛈️",
      "11n": "⛈️",
      "13d": "❄️",
      "13n": "❄️",
      "50d": "🌫️",
      "50n": "🌫️",
    };

    return iconMap[iconCode] || "🌤️";
  };

  useEffect(() => {
    if (isAuthenticated) {
      authFetch(`${API_BASE}/api/farmers`)
        .then((res) => res.json())
        .then((data) => {
          setFarmers(data.farmers || []);
        })
        .catch((err) => console.log(err));

      fetch(`${API_BASE}/api/market`)
        .then((res) => res.json())
        .then((data) => {
          setMarketPrices(data || []);
        })
        .catch((err) => console.log(err));

      authFetch(`${API_BASE}/api/analytics`)
        .then((res) => res.json())
        .then((data) => {
          setAnalytics(data || {});
        })
        .catch((err) => console.log(err));
    } else {
      setFarmers([]);
      setMarketPrices([]);
      setAnalytics({
        totalFarmers: 0,
        totalAdvisories: 0,
        diseaseReports: 0,
      });
    }

    fetchWeather();
  }, [isAuthenticated, authToken]);

  // ===========================
  // LANGUAGE
  // ===========================

  const toggleLanguage = () => {

    setLanguage(
      language === "en"
        ? "ta"
        : "en"
    );

  };

  // ===========================
  // AI ADVISORY
  // ===========================

  const handleAskAI = async () => {
    if (!query) return;

    setIsLoadingAdvice(true);
    setResponse("");
    setResponseSource("");

    try {
      const response = await authFetch(`${API_BASE}/api/get-advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          language,
          useGemini,
        }),
      });

      const data = await response.json();

      setResponse(data.advice || t("Unable to get AI advice.", "AI ஆலோசனை பெற முடியவில்லை."));
      setResponseSource(data.source || "local");
    } catch (error) {

      console.log(error);

      setResponse("Unable to get AI advice.");
      setResponseSource("local");

    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // ===========================
  // FORM CHANGE
  // ===========================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,

    });

  };

  // ===========================
  // ADD / UPDATE FARMER
  // ===========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    const payload = {
      ...formData,
      landSize: Number(formData.landSize) || 0,
    };

    try {

      let url =
        `${API_BASE}/api/farmers`;

      let method = "POST";

      if (editingId) {

        url =
          `${API_BASE}/api/farmers/${editingId}`;

        method = "PUT";

      }

      const res =
        await authFetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await res.json();

      if (editingId) {

        setFarmers(

          farmers.map((farmer) =>

            farmer._id === editingId
              ? data.farmer
              : farmer

          )

        );

        alert(
          "Farmer Updated Successfully 🌾"
        );

      } else {

        setFarmers([
          ...farmers,
          data.farmer,
        ]);

        alert(
          "Farmer Added Successfully 🌾"
        );

      }

      setEditingId(null);

      setFormData({

        name: "",

        village: "",

        cropType: "",

        landSize: "",

      });

    } catch (error) {

      console.log(error);

    }

  };

  // ===========================
  // DELETE FARMER
  // ===========================

  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this farmer?"
      );

    if (!confirmDelete)
      return;

    try {

      await authFetch(
        `${API_BASE}/api/farmers/${id}`,
        {
          method: "DELETE",
        }
      );

      setFarmers(

        farmers.filter(
          (farmer) =>
            farmer._id !== id
        )

      );

      alert(
        "Farmer Deleted Successfully 🌾"
      );

    } catch (error) {

      console.log(error);

    }

  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setUploadMessage("");
      setAnalysis(null);
    }
  };

  const handleImageUpload = async () => {
  if (!selectedImage) {
    alert(
      t(
        "Please select an image first.",
        "தயவுசெய்து முதலில் ஒரு படத்தை தேர்ந்தெடுக்கவும்."
      )
    );
    return;
  }

  setUploadMessage("");
  setAnalysis(null);

  const formData = new FormData();
  formData.append("image", selectedImage);
  formData.append("language", language);

  try {
    const response = await authFetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    setAnalysis({
      disease: data.diagnosis,
      recommendation: "",
    });

  } catch (error) {
    console.error("Upload Error:", error);

    setUploadMessage(
      error.message ||
      t("Image upload failed.", "படம் பதிவேற்றப்படவில்லை.")
    );
  }
};

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f4f9f2 0%, #e8f5e9 100%)",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <div
          style={{
            margin: "auto",
            width: "100%",
            maxWidth: "460px",
            padding: "30px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "22px",
              padding: "32px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            }}
          >
            <h1 style={{ color: "#1b5e20", marginBottom: "8px" }}>
              🌾 {t("Welcome to HAKGROS", "HAKGROS க்கு வரவேற்பு")}
            </h1>
            <p style={{ color: "#555", marginBottom: "24px" }}>
              {t(
                "Login or register to access farmer management and AI tools.",
                "விவசாயி மேலாண்மை மற்றும் AI கருவிகளை அணுக உள்நுழையவோ பதிவு செய்யவோ செய்யவும்."
              )}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: authMode === "login" ? "2px solid #2e7d32" : "1px solid #ccc",
                  background: authMode === "login" ? "#e8f5e9" : "white",
                  cursor: "pointer",
                }}
              >
                {t("Login", "உள்நுழை")}
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: authMode === "register" ? "2px solid #2e7d32" : "1px solid #ccc",
                  background: authMode === "register" ? "#e8f5e9" : "white",
                  cursor: "pointer",
                }}
              >
                {t("Register", "பதிவு செய்யவும்")}
              </button>
            </div>

            {authError && (
              <div
                style={{
                  background: "#fdecea",
                  color: "#611a15",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "20px",
                }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    {t("Name", "பெயர்")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={authForm.name}
                    onChange={handleAuthChange}
                    placeholder={t("Your name", "உங்கள் பெயர்")}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      marginBottom: "18px",
                    }}
                  />
                </>
              )}

              <label style={{ display: "block", marginBottom: "8px" }}>
                {t("Email", "மின்னஞ்சல்")}
              </label>
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder={t("Email address", "மின்னஞ்சல் முகவரி")}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  marginBottom: "18px",
                }}
              />

              <label style={{ display: "block", marginBottom: "8px" }}>
                {t("Password", "கடவுச்சொல்")}
              </label>
              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder={t("Password", "கடவுச்சொல்")}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  marginBottom: "24px",
                }}
              />

              <button
                type="submit"
                style={{
                  width: "100%",
                  background: "#2e7d32",
                  color: "white",
                  border: "none",
                  padding: "14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                {authMode === "login"
                  ? t("Login", "உள்நுழை")
                  : t("Create account", "கணக்கை உருவாக்கவும்")}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f4f9f2 0%, #e8f5e9 100%)",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      {/* ================= SIDEBAR ================= */}
      <div
        style={{
          width: "260px",
          background: "linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)",
          color: "white",
          padding: "24px 18px",
          boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginBottom: "12px", fontSize: "24px" }}>🌾 HAKGROS</h2>

        <hr />

        <MenuItem
          title={`🏠 ${t("Dashboard", "டாஷ்போர்டு")}`}
          onClick={() => setActivePage("dashboard")}
        />

        <MenuItem
          title={`👨‍🌾 ${t("Farmers", "விவசாயிகள்")}`}
          onClick={() => setActivePage("farmers")}
        />

        <MenuItem
          title={`🌤 ${t("Weather", "வானிலை")}`}
          onClick={() => setActivePage("weather")}
        />

        <MenuItem
          title={`📈 ${t("Market Prices", "சந்தை விலை")}`}
          onClick={() => setActivePage("market")}
        />

        <MenuItem
          title={`🧠 ${t("AI Advisory", "கணினி ஆலோசனை")}`}
          onClick={() => setActivePage("advisory")}
        />

        <MenuItem
          title={`📸 ${t("Disease Detection", "வியாதி கண்டறிதல்")}`}
          onClick={() => setActivePage("disease")}
        />

        <MenuItem
          title={`⚙ ${t("Settings", "மைதானம்")}`}
          onClick={() => setActivePage("settings")}
        />
      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div
        style={{
          flex: 1,
          padding: "30px",
        }}
      >
        {/* ================= NAVBAR ================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            background: "rgba(255,255,255,0.75)",
            padding: "16px 20px",
            borderRadius: "16px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <Menu
              size={30}
              style={{
                cursor: "pointer",
              }}
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
            />

            <h1
              style={{
                color: "#1b5e20",
              }}
            >
              🌾 HAKGROS UZHAVAN
            </h1>
          </div>

          <button
            onClick={toggleLanguage}
            style={{
              background: "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <Globe size={18} />

            {language === "en"
              ? " தமிழ்"
              : " English"}
          </button>
        </div>

        {/* ================= DASHBOARD ================= */}

        {activePage === "dashboard" && (
          <>
            <div
              style={{
                background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
                borderRadius: "22px",
                padding: "26px",
                color: "white",
                marginBottom: "24px",
                boxShadow: "0 12px 30px rgba(46,125,50,0.22)",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "28px" }}>🌾 {t("Smart Farming Dashboard", "அறிவூட்டு விவசாய டாஷ்போர்டு")}</h2>
              <p style={{ margin: 0, opacity: 0.95 }}>
                {t(
                  "Monitor weather, markets, and farmer insights in one place.",
                  "ஒரே இடத்தில் வானிலை, சந்தை மற்றும் விவசாயிகள் பற்றிய தகவல்களை கண்காணிக்கவும்."
                )}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div style={{ ...premiumCardStyle, textAlign: "center" }}>
                <h3>Total Farmers</h3>
                <h2>{analytics.totalFarmers}</h2>
              </div>
              <div style={{ ...premiumCardStyle, textAlign: "center" }}>
                <h3>AI Queries</h3>
                <h2>{analytics.totalAdvisories}</h2>
              </div>
              <div style={{ ...premiumCardStyle, textAlign: "center" }}>
                <h3>Disease Reports</h3>
                <h2>{analytics.diseaseReports}</h2>
              </div>
              <div style={{ ...premiumCardStyle, textAlign: "center" }}>
                <h3>Weather</h3>
                <h2>{weather ? `${Math.round(weather.main?.temp)}°C` : "--"}</h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(250px,1fr))",
                gap: "20px",
              }}
            >
              <Card
                icon={<CloudSun size={35} />}
                title="Weather"
                value={
                  weatherLoading
                    ? "Loading..."
                    : weather
                    ? `${weather.name || "Coimbatore"}\n${Math.round(weather.main?.temp)}°C • ${weather.weather?.[0]?.description || ""}`
                    : "No data"
                }
              />

              <Card
                icon={<TrendingUp size={35} />}
                title="Market"
                value="₹2200"
              />

              <Card
                icon={<Leaf size={35} />}
                title="Crop Health"
                value="Good"
              />
            </div>
          </>
        )}

        {/* ================= FARMERS ================= */}

        {activePage === "farmers" && (
          <>

            <form
              onSubmit={handleSubmit}
              style={{
                background: "rgba(255,255,255,0.95)",
                padding: "22px",
                borderRadius: "16px",
                marginBottom: "25px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            >

              <h2>
                {editingId
                  ? `✏ ${t("Update Farmer", "விவசாயியை மேம்படுத்து")}`
                  : `➕ ${t("Add Farmer", "விவசாயியைச் சேர்க்கவும்")}`}
              </h2>

              <br />

              <input
                type="text"
                name="name"
                placeholder={t("Farmer Name", "விவசாயியின் பெயர்")}
                value={formData.name}
                onChange={handleChange}
              />

              <br /><br />

              <input
                type="text"
                name="village"
                placeholder={t("Village", "ஊர்")}
                value={formData.village}
                onChange={handleChange}
              />

              <br /><br />

              <input
                type="text"
                name="cropType"
                placeholder={t("Crop Type", "பயிர் வகை")}
                value={formData.cropType}
                onChange={handleChange}
              />

              <br /><br />

              <input
                type="number"
                name="landSize"
                placeholder={t("Land Size", "நிலத்தின் பரப்பு")}
                value={formData.landSize}
                onChange={handleChange}
              />

              <br /><br />

              <button
                type="submit"
                style={{
                  background: "#2e7d32",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                {editingId
                  ? `${t("Update Farmer", "விவசாயியை மேம்படுத்து")} 🌾`
                  : `${t("Add Farmer", "விவசாயியைச் சேர்க்கவும்")} 🌾`}
              </button>

            </form>

            <h2
              style={{
                color: "#1b5e20",
              }}
            >
              👨‍🌾 {t("Registered Farmers", "பதிவு செய்யப்பட்ட விவசாயிகள்")}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(250px,1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {farmers.map((farmer) => (

                <div
                  key={farmer._id}
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    padding: "20px",
                    borderRadius: "15px",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  }}
                >

                  <h3>
                    👨‍🌾 {farmer.name}
                  </h3>

                  <p>
                    📍 {farmer.village}
                  </p>

                  <p>
                    🌾 {farmer.cropType}
                  </p>

                  <p>
                    🌱 {farmer.landSize} Acres
                  </p>

                      <button
                    onClick={() => {

                      setEditingId(farmer._id);

                      setFormData({

                        name: farmer.name,

                        village: farmer.village,

                        cropType: farmer.cropType,

                        landSize: farmer.landSize,

                      });

                    }}
                  >
                    ✏ {t("Edit", "தொகு")}
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(farmer._id)
                    }
                    style={{
                      marginLeft: "10px",
                    }}
                  >
                    ❌ {t("Delete", "அழி")}
                  </button>

                </div>

              ))}
            </div>

          </>
        )}
                {/* ================= WEATHER ================= */}

        {activePage === "weather" && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              padding: "30px",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <h2>🌤 {t("Live Weather", "நேரடி வானிலை")}</h2>
            {weatherLoading && <p>{t("Loading weather...", "வானிலை ஏறும்...")}</p>}
            {weatherError && (
              <p style={{ color: "red" }}>
                {t("Error loading weather:", "வானிலை ஏற்றதில் தவறு:")} {weatherError}
              </p>
            )}
            {weather && !weatherLoading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <div style={{ fontSize: "48px" }}>
                  {getWeatherIcon(weather.weather?.[0]?.icon)}
                </div>
                <h3>
                  {weather.name}, {weather.sys?.country}
                </h3>
                <p>
                  <strong>{t("Temperature:", "தாபநிலை:")}</strong> {Math.round(weather.main?.temp)}°C
                </p>
                <p>
                  <strong>{t("Description:", "விளக்கம்:")}</strong> {weather.weather?.[0]?.description}
                </p>
                <p>
                  <strong>{t("Humidity:", " ஈரப்பதம்:")}</strong> {weather.main?.humidity}%
                </p>
                <p>
                  <strong>{t("Wind Speed:", "காற்றின் வேகம்:")}</strong> {weather.wind?.speed} m/s
                </p>
              </div>
            )}
            {!weather && !weatherLoading && !weatherError && (
              <p>No weather data available.</p>
            )}
          </div>
        )}

        {/* ================= MARKET ================= */}

        {activePage === "market" && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              padding: "30px",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <h2>📈 {t("Market Prices", "சந்தை விலைகள்")}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {marketPrices.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "#f1f8e9",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #c8e6c9",
                  }}
                >
                  <h3>{item.crop}</h3>
                  <p style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32" }}>
                    {item.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= DISEASE ================= */}

        {activePage === "disease" && (

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h2 style={{ color: "#1b5e20" }}>
              📸 {t("Crop Disease Detection", "பயிர் நோய் கண்டறிதல்")}
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p style={{ marginTop: "10px", color: "#555" }}>
              {t("Choose a leaf image to upload.", "பதிவேற்றுவதற்கு ஒரு இலை படத்தை தேர்ந்தெடுக்கவும்.")}
            </p>

            <br /><br />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "300px",
                  borderRadius: "10px",
                }}
              />
            )}

            <br /><br />

            <button
              onClick={handleImageUpload}
              style={{
                background: "#2e7d32",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              {t("Upload Image", "படத்தைக் பதிவேற்றவும்")}
            </button>

            {uploadMessage && (
              <p
                style={{
                  marginTop: "20px",
                  color: "green",
                }}
              >
                {uploadMessage}
              </p>
            )}

            {analysis && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "18px",
                  borderRadius: "12px",
                  background: "#f1f8e9",
                  border: "1px solid #c8e6c9",
                }}
              >
                <h3 style={{ color: "#1b5e20" }}>
                  {t("Analysis Result", "பகுப்பாய்வு முடிவு")}
                </h3>
                <p>
                  <strong>{t("Disease:", "நோய்:")}</strong> {analysis.disease}
                </p>
                <p>
                  <strong>{t("Recommendation:", "பரிந்துரை:")}</strong> {analysis.recommendation}
                </p>
              </div>
            )}
          </div>

        )}

        {/* ================= SETTINGS ================= */}

        {activePage === "settings" && (
          <PageCard
            title="⚙ Settings"
            text="Application settings page."
          />
        )}

        {/* ================= AI ADVISORY ================= */}

        {activePage === "advisory" && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                color: "#1b5e20",
              }}
            >
              🧠 AI Advisory
            </h2>

            <textarea
              rows="4"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder={
                language === "en"
                  ? "Ask your farming question..."
                  : "உங்கள் விவசாய கேள்வியை கேளுங்கள்..."
              }
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "10px",
                borderRadius: "10px",
              }}
            />

            <div style={{ marginTop: "12px", display: "flex", alignItems: "center" }}>
              <input
                id="useGemini"
                type="checkbox"
                checked={useGemini}
                onChange={(e) => setUseGemini(e.target.checked)}
              />
              <label htmlFor="useGemini" style={{ marginLeft: "8px", color: "#2e7d32" }}>
                Use Gemini (when key configured)
              </label>
            </div>

            <button
              onClick={handleAskAI}
              style={{
                marginTop: "15px",
                background: "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              {isLoadingAdvice ? t("Thinking...", "சிந்திக்கிறது...") : t("Ask AI", "AI ஐ கேளுங்கள்")}
            </button>

            {response && (
              <div
                style={{
                  marginTop: "20px",
                  background: "#e8f5e9",
                  padding: "15px",
                  borderRadius: "10px",
                  border: "1px solid #c8e6c9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "14px", color: "#2e7d32" }}>{response}</div>
                  <div style={{ marginLeft: "12px", fontSize: "12px", color: "#555", background: "white", padding: "6px 8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                    {t("Source", " மூலம்")} : {responseSource === 'gemini' ? 'Gemini' : t("Local", "உள்ளூர்")}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= MENU ITEM ================= */

const MenuItem = ({
  title,
  onClick,
}) => (
  <div
    onClick={onClick}
    style={{
      padding: "12px",
      marginTop: "10px",
      cursor: "pointer",
      borderRadius: "8px",
      transition: "0.3s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background =
        "#2e7d32";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background =
        "transparent";
    }}
  >
    {title}
  </div>
);

/* ================= PAGE CARD ================= */

const PageCard = ({
  title,
  text,
}) => (
  <div
    style={{
      background: "white",
      padding: "30px",
      borderRadius: "15px",
      boxShadow:
        "0 4px 12px rgba(0,0,0,0.15)",
    }}
  >
    <h2>{title}</h2>

    <p>{text}</p>
  </div>
);

/* ================= DASHBOARD CARD ================= */

const Card = ({
  icon,
  title,
  value,
}) => (
  <div
    style={{
      ...premiumCardStyle,
      textAlign: "center",
      cursor: "pointer",
      minHeight: "170px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-8px)";
      e.currentTarget.style.boxShadow = "0 16px 34px rgba(46,125,50,0.18)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.08)";
    }}
  >
    <div>{icon}</div>

    <h3>{title}</h3>

    <h2>{value}</h2>
  </div>
);

export default App;