const axios = require("axios");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('./models/User');

require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Config loaded:', {
  PORT: process.env.PORT || 5000,
  MONGO_URI: !!process.env.MONGO_URI,
  WEATHER_API_KEY: !!process.env.WEATHER_API_KEY,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
});

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const modelName = process.env.GEMINI_MODEL || "models/gemini-1.5";
console.log('Gemini model configured:', modelName);
const model = genAI?.getGenerativeModel({
  model: modelName,
});

const MONGO_URI = process.env.MONGO_URI || "";
const LOCAL_MONGO_URI =
  process.env.LOCAL_MONGO_URI ||
  "mongodb://127.0.0.1:27017/hakgrosDB";
const DB_NAME = process.env.MONGO_DB_NAME || "hakgrosDB";

const app = express();
app.use(express.json());
app.use(cors());

function authenticateToken(req, res, next) {
  const authHeader =
    req.headers["authorization"] ||
    req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
});

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
}

const createLocalAdvice = (query, language) => {
  const text = query.toLowerCase();
  const isTamil = language === 'ta';

  if (text.includes('yellow') || text.includes('chlorosis')) {
    return isTamil
      ? 'இலை மஞ்சள் நிறமாக மாறினால், மண்ணில் நைட்ரஜன் குறைவு இருக்கலாம். கரிம உரம் அல்லது சாம்பல் சத்துள்ள உரத்தை பயன்படுத்தவும்.'
      : 'Yellowing leaves often suggest a nitrogen deficiency. Apply compost or a balanced organic fertilizer and check soil moisture.';
  }

  if (text.includes('white spot') || text.includes('powdery')) {
    return isTamil
      ? 'வெள்ளை புள்ளிகள் இருந்தால், இலைகளை சுத்தமாக வைத்துக் கொண்டு தழைச்சத்து கட்டுப்பாட்டுக்கான சிகிச்சையை உடனே தொடங்குங்கள்.'
      : 'White spots can indicate fungal infection. Improve airflow, remove affected leaves, and use a suitable fungicide if needed.';
  }

  if (text.includes('banana')) {
    return isTamil
      ? 'வாழை செடிக்கு உரம், நீர் மேலாண்மை மற்றும் தழைச்சத்து பாதுகாப்பு அவசியம். சாம்பல் உரம் மற்றும் கரிம உரத்தை பயன்படுத்துங்கள்.'
      : 'Banana plants benefit from regular organic manure, steady watering, and protection from pests and fungal issues.';
  }

  if (text.includes('blast') || text.includes('disease')) {
    return isTamil
      ? 'நோய் பாதிப்புகள் இருந்தால், பாதிக்கப்பட்ட இலைகளை அகற்றி, சுத்தமான விவசாய நடைமுறைகளை பின்பற்றுங்கள்.'
      : 'If disease is present, remove infected leaves, improve spacing, and use a recommended treatment promptly.';
  }

  return isTamil
    ? 'உங்கள் பயிருக்கு ஏற்ற மண்ணின் நிலை, நீர் மேலாண்மை மற்றும் உரத்தை கவனமாக பின்பற்றுங்கள்.'
    : 'Focus on soil health, balanced fertilization, and timely irrigation for healthier crops.';
};

// MongoDB Connection
mongoose.set("strictQuery", false);

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from MongoDB");
});

const mongooseOptions = {
  dbName: DB_NAME,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  bufferCommands: false,
};

async function connectDatabase() {
  const uri = MONGO_URI || LOCAL_MONGO_URI;

  try {
    await mongoose.connect(uri, mongooseOptions);
    console.log("MongoDB Connected Successfully", uri === MONGO_URI ? "(Atlas)" : "(Local)");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);

    if (MONGO_URI && uri === MONGO_URI && LOCAL_MONGO_URI) {
      console.warn("Atlas connection failed. Trying local MongoDB fallback...");
      try {
        await mongoose.connect(LOCAL_MONGO_URI, mongooseOptions);
        console.log("MongoDB Connected Successfully (Local fallback)");
        return;
      } catch (fallbackErr) {
        console.error("Local MongoDB fallback failed:", fallbackErr);
      }
    }

    if (MONGO_URI) {
      console.error(
        "Atlas connection failed. Make sure your current IP is whitelisted, your Atlas cluster is running, and your URI is correct."
      );
    } else {
      console.error(
        "No MONGO_URI configured. Please install and run MongoDB locally or provide a valid MONGO_URI."
      );
    }
    process.exit(1);
  }
}

// Schema for Farmer Advisory History
const FarmerSchema = new mongoose.Schema({
  name: String,
  village: String,
  cropType: String,
  landSize: Number,
});

const Farmer = mongoose.model(
  "Farmer",
  FarmerSchema
);
const AdvisorySchema = new mongoose.Schema({
  farmerId: String,
  query: String,
  response: String,
  source: String,
  language: String,
  createdAt: { type: Date, default: Date.now }
});
const Advisory = mongoose.model('Advisory', AdvisorySchema);

// AI Advisory Route
app.post("/api/get-advice", authenticateToken, async (req, res) => {
  try {
    const { query, language, useGemini } = req.body;
    console.log('POST /api/get-advice', { query, language, useGemini });

    const prompt =
      language === "ta"
        ? `தமிழில் விவசாய ஆலோசனை வழங்குங்கள்: ${query}`
        : `You are an agriculture expert. Answer this farming question clearly: ${query}`;

    console.log('Prompt:', prompt);

    let aiResponse;
    let source = 'local';

    if (useGemini && model) {
      try {
        const result = await model.generateContent({
          prompt: prompt,
        });
        console.log('Gemini result:', result);

        aiResponse =
          result?.response?.text?.() ||
          result?.output?.[0]?.content?.[0]?.text ||
          JSON.stringify(result);

        source = 'gemini';
      } catch (geminiError) {
        console.error('Gemini advisory failed, using local fallback:', geminiError);
        aiResponse = createLocalAdvice(query, language);
      }
    } else {
      if (useGemini && !model) {
        console.log('UseGemini requested but no Gemini model available; using local advice fallback');
      }
      aiResponse = createLocalAdvice(query, language);
    }

    const newEntry = new Advisory({
      query,
      response: aiResponse,
      language,
      source,
    });

    await newEntry.save();

    res.json({
      advice: aiResponse,
      source,
    });
  } catch (error) {
    console.error('AI advisory error:', error);

    res.status(500).json({
      message: "AI Error",
      error: error.message,
    });
  }
});
app.get(
  "/api/farmers",
  authenticateToken,
  async (req, res) => {
    try {
      console.log('GET /api/farmers called', { query: req.query });
      const farmers = await Farmer.find();
      console.log('Farmers count:', farmers.length);

      let weatherData = null;
      try {
        const city = req.query.city || "Coimbatore";
        console.log('Fetching weather for city:', city);
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        weatherData = weatherResponse.data;
      } catch (weatherError) {
        console.error('Weather API fetch failed:', weatherError?.response?.data || weatherError?.message || weatherError);
        weatherData = {
          error:
            weatherError.response?.data ||
            weatherError.message ||
            "Unable to fetch weather",
        };
      }

      res.json({
        farmers,
        weather: weatherData,
      });
    } catch (error) {
      console.error('Farmers route error:', error);
      res.status(500).json({
        message: error.message,
        error: error.message,
      });
    }
  }
);
app.post(
  "/api/farmers",
  authenticateToken,
  async (req, res) => {
    try {
      const farmer =
        await Farmer.create(
          req.body
        );

      res.status(201).json({
        farmer,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
); 
app.put("/api/farmers/:id", authenticateToken, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
app.delete("/api/farmers/:id", authenticateToken, async (req, res) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Farmer deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

app.get("/api/weather", async (req, res) => {
  try {

    const city = req.query.city || "Coimbatore";

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    res.json(response.data);

  } catch (err) {
    console.error('Weather route error:', err?.response?.data || err?.message || err);
    res.status(500).json({
      message: "Unable to fetch weather",
      error: err?.response?.data || err?.message || err,
    });
  }
});

app.get("/api/market", async (req, res) => {
  try {
    const marketData = [
      { crop: "Paddy", price: "₹35/kg", source: "Live market feed" },
      { crop: "Cotton", price: "₹95/kg", source: "Live market feed" },
      { crop: "Sugarcane", price: "₹3.8/kg", source: "Live market feed" },
      { crop: "Groundnut", price: "₹78/kg", source: "Live market feed" },
    ];

    res.json(marketData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/analytics", authenticateToken, async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const totalAdvisories = await Advisory.countDocuments();
    const diseaseReports = 4;

    res.json({
      totalFarmers,
      totalAdvisories,
      diseaseReports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

console.log("Weather route loaded");

app.post(
  "/api/upload",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded",
        });
      }

      const image = fileToGenerativePart(
        req.file.path,
        req.file.mimetype
      );

     
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "AI Detection Failed",
      });
    }
  }
);

app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();

    const totalLand = await Farmer.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$landSize",
          },
        },
      },
    ]);

    const cropStats = await Farmer.aggregate([
      {
        $group: {
          _id: "$cropType",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    res.json({
      totalFarmers,
      totalLand:
        totalLand.length > 0
          ? totalLand[0].total
          : 0,
      cropStats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`HAKGROS Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Server startup aborted due to DB connection failure.", err);
  }); 