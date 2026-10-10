const cors = require("cors")
const express = require("express");
const mongoose = require("mongoose");
const axios  = require("axios");
require("dotenv").config();
console.log(
  "IMD KEY STATUS:",
  process.env.IMD_API_KEY ? "FOUND" : "MISSING"
);



const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb+srv://ranakirtika351_db_user:xstnzPPP2XhEQjgk@cluster0.lqs0vd2.mongodb.net/disaster-react?appName=Cluster0")
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error.message);
  });

// Disaster model
const disasterSchema = new mongoose.Schema({
  type: String,
  location: String,
  latitude: Number,
  longitude: Number,
  severity: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Disaster = mongoose.model("Disaster", disasterSchema);
// Resource model
const resourceSchema = new mongoose.Schema({
  name: String,
  type: String,
  location: String,
  latitude: Number,
  longitude: Number,
  status: String,
  contact: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Resource = mongoose.model("Resource", resourceSchema);
// ===============================
// DISASTER-X INTELLIGENCE SOURCES
// ===============================

const DATA_SOURCES = [
  {
    name: "IMD",
    type: "Weather & Warnings",
    status: process.env.IMD_API_KEY ? "configured" : "not-configured",
    official: true,
    url: "https://api.imd.gov.in/"
  },
  {
    name: "NCS",
    type: "Earthquake Monitoring",
    status: "official-source",
    official: true,
    url: "https://www.ncs.gov.in/"
  },
  {
    name: "CWC",
    type: "Flood & River Information",
    status: "official-source",
    official: true,
    url: "https://cwc.gov.in/"
  },
  {
    name: "INCOIS",
    type: "Tsunami & Ocean Hazards",
    status: "official-source",
    official: true,
    url: "https://incois.gov.in/"
  },
  {
    name: "NDMA SACHET",
    type: "Official Disaster Alerts",
    status: "active",
    official: true,
    url: "https://sachet.ndma.gov.in/"
  },
  {
    name: "DISASTER-X",
    type: "User Reports & AI Risk",
    status: "active",
    official: false,
    url: "http://localhost:5000"
  }
];


// ===============================
// ALERT MODEL
// ===============================

const alertSchema = new mongoose.Schema({
  source: String,
  hazard: String,
  severity: String,
  location: String,
  title: String,
  message: String,
  official: Boolean,
  sourceUrl: String,

  latitude: Number,
  longitude: Number,

  severityColor: String,
  alertSource: String,
  language: String,

  effectiveStartTime: String,
  effectiveEndTime: String,

  ncsIdentifier: {
  type: String,
  unique: true,
  sparse: true
},
cwcIdentifier: {
  type: String,
  unique: true,
  sparse: true
},

  sachetIdentifier: {
    type: Number,
    unique: true,
    sparse: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});



const Alert = mongoose.model("Alert", alertSchema);

// ===============================
// IMD WEATHER INTELLIGENCE
// ===============================

const fetchIMDWeather = async () => {
  try {

    const apiKey = process.env.IMD_API_KEY;

    if (!apiKey) {
      return {
        configured: false,
        data: []
      };
    }

    const response = await axios.get(
      "https://api.imd.gov.in/api/v1/current_wx",
      {
        headers: {
          "x-api-key": apiKey
        },
        timeout: 15000
      }
    );

    return {
      configured: true,
      data: response.data
    };

  } catch (error) {

    console.error(
      "IMD connection failed:",
      error.message
    );

    return {
      configured: true,
      data: []
    };
  }
};

app.get("/api/intelligence/imd", async (req, res) => {

  try {

    const result = await fetchIMDWeather();

    res.json({
      source: "IMD",
      configured: result.configured,
      count: result.data.length || 0,
      data: result.data
    });

  } catch (error) {

    res.status(500).json({
      error: "IMD data fetch failed"
    });

  }

});

// ===============================
// IMD INTELLIGENCE
// ===============================

const fetchIMDData = async () => {
  try {

    const response = await axios.get(
      "https://api.imd.gov.in/api/v1/current_wx",
      {
        timeout: 15000
      }
    );

    console.log(
      "IMD data received:",
      response.data?.length || 0
    );

    return response.data;

  } catch (error) {

    console.error(
      "IMD connection failed:",
      error.response?.status || error.message
    );

    return [];

  }
};

app.get("/api/intelligence/imd", async (req, res) => {

  try {

    const data = await fetchIMDData();

    res.json({
      source: "IMD",
      connected: data.length > 0,
      count: data.length,
      data: data
    });
  } catch (error) {

    res.status(500).json({
      source: "IMD",
      connected: false,
      error: "IMD data fetch failed"
    });

  }

});

// ===============================
// NCS EARTHQUAKE INTELLIGENCE
// ===============================

const fetchNCSData = async () => {
  try {
    const response = await axios.get(
      "https://riseq.seismo.gov.in/riseq/earthquake/recent_earthquake",
      {
        timeout: 20000,
        responseType: "text"
      }
    );

    const html = response.data;

    console.log(
  "CWC HTML LENGTH:",
  html.length
);

console.log(
  "CWC SAMPLE:",
  html.substring(0, 1000)
);

    // Earthquake table rows extract
    const rowRegex =
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

    const rows = [];
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1];

      const cells = [
        ...row.matchAll(
          /<td[^>]*>([\s\S]*?)<\/td>/gi
        )
      ].map((m) =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
      );

      if (cells.length >= 7) {
        rows.push(cells);
      }
    }

    const earthquakes = rows
      .map((cells) => ({
        originTime: cells[0],
        latitude: Number(cells[1]),
        longitude: Number(cells[2]),
        depth: Number(cells[3]),
        magnitude: Number(cells[4]),
        region: cells[5],
        location: cells[6]
      }))
      .filter(
        (item) =>
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude) &&
          Number.isFinite(item.magnitude)
      );
const recentEarthquakes = earthquakes.slice(0, 100);

console.log(
  "NCS earthquakes parsed:",
  recentEarthquakes.length
);

return recentEarthquakes;

  } catch (error) {

    console.error(
      "NCS connection failed:",
      error.message
    );

    return [];
  }
};

const syncNCSToMongo = async (earthquakes) => {

  let inserted = 0;
  let updated = 0;

  for (const quake of earthquakes) {

    const magnitude = Number(quake.magnitude);

    if (
      !Number.isFinite(quake.latitude) ||
      !Number.isFinite(quake.longitude) ||
      !Number.isFinite(magnitude)
    ) {
      continue;
    }

    let severity = "INFO";

    if (magnitude >= 6) {
      severity = "CRITICAL";
    } else if (magnitude >= 5) {
      severity = "WARNING";
    } else if (magnitude >= 4) {
      severity = "ALERT";
    }

    const title =
      `Earthquake M${magnitude}`;

    const message =
      `NCS reported an earthquake near ${
        quake.location || quake.region || "Unknown location"
      }. Depth: ${
        quake.depth || "N/A"
      } km.`;

  const ncsIdentifier =
  `${quake.originTime}_${quake.latitude}_${quake.longitude}_${quake.magnitude}`;

const result = await Alert.updateOne(
  {
    ncsIdentifier
  },
      {
        $set: {
          ncsIdentifier, 
          
          source: "NCS",
          hazard: "Earthquake",
          severity,
          location:
            quake.location ||
            quake.region ||
            "Unknown Location",
          title,
          message,
          official: true,
          sourceUrl:
            "https://riseq.seismo.gov.in/",
          latitude: quake.latitude,
          longitude: quake.longitude
        }
      },
      {
        upsert: true
      }
    );

    if (result.upsertedCount > 0) {
      inserted++;
    } else if (result.modifiedCount > 0) {
      updated++;
    }
  }

  return {
    inserted,
    updated
  };
};
app.get("/api/intelligence/ncs", async (req, res) => {
  try {

    const data = await fetchNCSData();
    const sync = await syncNCSToMongo(data);

    res.json({
      source: "NCS",
      connected: data.length > 0,
      count: data.length,
      sync,
      data
    });

  } catch (error) {

    console.error(
      "NCS route failed:",
      error.message
    );

    res.status(500).json({
      source: "NCS",
      connected: false,
      count: 0,
      data: []
    });
  }
});

 const fetchCWCData = async () => {
  try {
    const response = await axios.get(
      "https://aff.india-water.gov.in/textdata/Floodday1.geojson",
      {
        timeout: 30000
      }
    );

    const geojson = response.data;

    console.log(
      "🌊 CWC GEOJSON RECEIVED"
    );

    console.log(
      "🌊 CWC FEATURES:",
      geojson.features?.length || 0
    );

    if (!geojson.features) {
      console.log(
        "❌ CWC GeoJSON has no features"
      );
      return [];
    }

    const stations = geojson.features.map(
      (feature, index) => {

        const properties =
          feature.properties || {};

        const coordinates =
          feature.geometry?.coordinates || [];

        return {
          serial: index + 1,

          siteName:
            properties.SiteName ||
            properties.siteName ||
              properties.SITE_NAME ||
            properties.site ||
            properties.name ||
            "Unknown",

          river:
            properties.river ||
            properties.RIVER ||
            "Unknown",

          district:
            properties.district ||
            properties.DISTRICT ||
            "Unknown",

          state:
            properties.state ||
            properties.STATE ||
            "Unknown",

          currentCondition:
            properties.FloodCondition ||
             properties.condition ||
              properties.CONDITION |
            properties.flood_condition ||
            "Unknown",

          currentForecastWL:
            properties.popupContent ||
            null,

          latitude:
            coordinates[1] ?? null,

          longitude:
            coordinates[0] ?? null,

          raw: properties
        };
      }
    );

    console.log(
      "🌊 CWC STATIONS PARSED:",
      stations.length
    );

    console.log(
      "🌊 CWC FIRST STATION:",
      stations[0]
    );

    return stations;

  } catch (error) {

    console.error(
      "❌ CWC ERROR:",
      error.message
    );

    console.error(
      "❌ CWC STATUS:",
      error.response?.status
    );

    return [];
  }
};

app.get("/api/intelligence/cwc", async (req, res) => {
  try {

    const data = await fetchCWCData();
     const sync = await syncCWCToMongo(data);

    res.json({
      source: "CWC",
      connected: data.length > 0,
      count: data.length,
      sync,
      data
    });

  } catch (error) {

    console.error(
      "❌ CWC route failed:",
      error.message
    );

    res.status(500).json({
      source: "CWC",
      connected: false,
      count: 0,
      sync: {
        inserted: 0,
        updated: 0
      },
      data: []
    });
  }
});



    const syncCWCToMongo = async (stations) => {
  let inserted = 0;
  let updated = 0;

  for (const station of stations) {
    const cwcIdentifier =
      `CWC_${station.siteName}_${station.river}_${station.latitude}_${station.longitude}`;

    const condition =
      String(station.currentCondition || "").toLowerCase();

    let severity = "INFO";

    if (condition.includes("extreme")) {
      severity = "CRITICAL";
    } else if (condition.includes("severe")) {
      severity = "WARNING";
    } else if (condition.includes("above normal")) {
      severity = "ALERT";
    }

    const result = await Alert.updateOne(
      { cwcIdentifier },
      {
        $set: {
          cwcIdentifier,
          source: "CWC",
          hazard: "Flood",
          severity,

          location: station.siteName || "Unknown",

          title:
            `CWC Flood Status - ${station.siteName}`,

          message:
            `${station.currentCondition} at ${station.siteName}. ` +
            `River: ${station.river}. ` +
            `HFL: ${station.raw?.HFL ?? "N/A"}, ` +
            `Danger Level: ${station.raw?.DangerLevel ?? "N/A"}, ` +
            `Warning Level: ${station.raw?.WarningLevel ?? "N/A"}.`,

          official: true,

          sourceUrl:
            "https://aff.india-water.gov.in/",

          latitude: Number(station.latitude),
          longitude: Number(station.longitude),

          currentForecastWL:
            station.currentForecastWL || null
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      inserted++;
    } else if (result.modifiedCount > 0) {
      updated++;
    }
  }

  return {
    inserted,
    updated
  };
};

  



   


const fetchINCOISData = async () => {
  try {
    const response = await axios.get(
      "https://incois.gov.in/",
      {
        timeout: 20000,
        responseType: "text"
      }
    );

    const html = response.data;
    console.log("CWC HAS AYODHYA:", html.includes("AYODHYA"));
    const ayodhyaIndex = html.toUpperCase().indexOf("AYODHYA");

console.log("🔎 AYODHYA INDEX:", ayodhyaIndex);

console.log(
  "🔎 AYODHYA HTML:",
  ayodhyaIndex >= 0
    ? html.substring(
        Math.max(0, ayodhyaIndex - 1000),
        ayodhyaIndex + 5000
      )
    : "AYODHYA NOT FOUND"
);

    console.log(
      "🌊 INCOIS response received:",
      html.length
    );

    return {
      connected: true,
      responseLength: html.length,
      source: "INCOIS"
    };

  } catch (error) {
    console.error(
      "INCOIS connection failed:",
      error.response?.status || error.message
    );

    return {
      connected: false,
      responseLength: 0,
      source: "INCOIS"
    };
  }
};

app.get(
  "/api/intelligence/incois",
  async (req, res) => {
    try {
      const data = await fetchINCOISData();

      res.json({
        source: "INCOIS",
        connected: data.connected,
        data
      });

    } catch (error) {
      res.status(500).json({
        source: "INCOIS",
        connected: false,
        data: null
      });
    }
  }
);

app.get("/api/intelligence/incois/raw", async (req, res) => {
  try {
    const response = await axios.get(
      "https://incois.gov.in/",
      {
        timeout: 20000,
        responseType: "text"
      }
    );

    res.type("text").send(response.data);

  } catch (error) {
    res.status(500).send(
      "INCOIS fetch failed: " + error.message
    );
  }
});

app.get("/api/intelligence/nearby-resources", async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (lat == null || lng == null) {
      return res.status(400).json({
        error: "Latitude and longitude are required"
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const searchRadius = Math.min(
      Math.max(Number(radius) || 10000, 1000),
      25000
    );

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        error: "Invalid coordinates"
      });
    }

    // ==========================================
    // 🌍 REAL OPENSTREETMAP RESOURCE SEARCH
    // ==========================================

    const query = `
      [out:json][timeout:25];

      (
        nwr(around:${searchRadius},${latitude},${longitude})["amenity"="hospital"];
        nwr(around:${searchRadius},${latitude},${longitude})["healthcare"="hospital"];

        nwr(around:${searchRadius},${latitude},${longitude})["amenity"="fire_station"];

        nwr(around:${searchRadius},${latitude},${longitude})["amenity"="police"];

        nwr(around:${searchRadius},${latitude},${longitude})["amenity"="shelter"];

        nwr(around:${searchRadius},${latitude},${longitude})["emergency"="ambulance_station"];
      );

      out center tags;
    `;

  const overpassServers = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

let response = null;
let lastError = null;

for (const server of overpassServers) {
  try {
    console.log("🌍 Trying Overpass:", server);

    response = await axios.post(
      server,
      query,
      {
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "Disaster-X/1.0"
        },
        timeout: 30000
      }
    );

    console.log(
      "✅ Overpass success:",
      server
    );

    break;

  } catch (error) {
    lastError = error;

    console.error(
      "❌ Overpass failed:",
      server,
      error.response?.status ||
        error.message
    );
  }
}

if (!response) {
  throw new Error(
    `All Overpass servers failed: ${
      lastError?.response?.status ||
      lastError?.message ||
      "Unknown error"
    }`
  );
}

    // ==========================================
    // 📏 DISTANCE CALCULATOR
    // ==========================================

    const calculateDistance = (
      lat1,
      lng1,
      lat2,
      lng2
    ) => {

      const R = 6371;

      const dLat =
        ((lat2 - lat1) * Math.PI) / 180;

      const dLng =
        ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
          (lat1 * Math.PI) / 180
        ) *
          Math.cos(
            (lat2 * Math.PI) / 180
          ) *
          Math.sin(dLng / 2) ** 2;

      return (
        R *
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        )
      );
    };

    // ==========================================
    // 🏥 FORMAT REAL RESOURCES
    // ==========================================

    const resources = response.data.elements
      .map((item) => {

        const itemLat =
          item.lat ??
          item.center?.lat;

        const itemLng =
          item.lon ??
          item.center?.lon;

        if (
          itemLat == null ||
          itemLng == null
        ) {
          return null;
        }

        const tags =
          item.tags || {};

        let type = "Other";

        if (
          tags.amenity === "hospital" ||
          tags.healthcare === "hospital"
        ) {
          type = "Hospital";

        } else if (
          tags.amenity === "fire_station"
        ) {
          type = "Fire Station";

        } else if (
          tags.amenity === "police"
        ) {
          type = "Police Station";

        } else if (
          tags.amenity === "shelter"
        ) {
          type = "Shelter";

        } else if (
          tags.emergency ===
          "ambulance_station"
        ) {
          type = "Ambulance Station";
        }

        const distance =
          calculateDistance(
            latitude,
            longitude,
            Number(itemLat),
            Number(itemLng)
          );

        const address =
          tags["addr:full"] ||
          [
            tags["addr:housenumber"],
            tags["addr:street"],
            tags["addr:city"],
            tags["addr:state"]
          ]
            .filter(Boolean)
            .join(", ");

        return {
          id: `${item.type}-${item.id}`,

          name:
            tags.name ||
            `${type} (name unavailable)`,

          type,

          latitude:
            Number(itemLat),

          longitude:
            Number(itemLng),

          distanceKm:
            Number(distance.toFixed(2)),

          address:
            address ||
            "Address not available",

          phone:
            tags.phone ||
            tags["contact:phone"] ||
            null,

          website:
            tags.website ||
            tags["contact:website"] ||
            null,

          emergency:
            tags.emergency === "yes" ||
            type === "Hospital" ||
            type === "Fire Station" ||
            type === "Ambulance Station",

          source:
            "OpenStreetMap",

          mapsUrl:
            `https://www.google.com/maps/dir/?api=1` +
            `&destination=${Number(itemLat)},${Number(itemLng)}`
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.distanceKm -
          b.distanceKm
      );

    // ==========================================
    // 🔄 REMOVE DUPLICATES
    // ==========================================

    const uniqueResources =
      Array.from(
        new Map(
          resources.map((resource) => [
            `${resource.type}-${resource.latitude}-${resource.longitude}`,
            resource
          ])
        ).values()
      );

    // ==========================================
    // 📊 CATEGORY SUMMARY
    // ==========================================

    const summary = {
      hospitals:
        uniqueResources.filter(
          (r) => r.type === "Hospital"
        ).length,

      fireStations:
        uniqueResources.filter(
          (r) => r.type === "Fire Station"
        ).length,

      policeStations:
        uniqueResources.filter(
          (r) => r.type === "Police Station"
        ).length,

      shelters:
        uniqueResources.filter(
          (r) => r.type === "Shelter"
        ).length,

      ambulanceStations:
        uniqueResources.filter(
          (r) =>
            r.type ===
            "Ambulance Station"
        ).length
    };

    console.log(
      "🌍 REAL OSM RESOURCES:",
      {
        center: {
          latitude,
          longitude
        },
        radius: searchRadius,
        total:
          uniqueResources.length,
        summary
      }
    );

    res.json({
      success: true,

      center: {
        latitude,
        longitude
      },

      radius:
        searchRadius,

      total:
        uniqueResources.length,

      summary,

      source:
        "OpenStreetMap",

      availabilityNote:
        "Facility existence is from OpenStreetMap. Live operational availability is not guaranteed.",

      resources:
        uniqueResources
    });

  } catch (error) {

    console.error(
      "❌ NEARBY RESOURCE ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      error:
        "Failed to find nearby resources",
      message:
        error.message
    });
  }
});

// ===============================
// SACHET ALERT INTELLIGENCE
// ===============================

const fetchSachetAlerts = async () => {
  try {
    const response = await axios.get(
      "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails",
      {
        timeout: 15000
      }
    );

    console.log(
  "SACHET KEYS:",
  Object.keys(response.data[0])
);

    console.log(
  "🚨 SACHET FIRST ITEM:",
  response.data[0]
);
    console.log(
      "SACHET alerts received:",
      response.data.length
    );

    console.log(
  "FIRST SACHET ALERT:",
  response.data[0]
);

console.log(
  "SACHET CENTROID:",
  response.data[0]?.centroid
);

    return response.data;

  } catch (error) {
    console.error(
      "SACHET connection failed:",
      error.message
    );

    return [];
  }
};


// ===============================
// NORMALIZE SACHET ALERT
// ===============================

const normalizeSachetAlert = (item) => {

  const [longitude, latitude] = String(
    item.centroid || ""
  )
    .split(",")
    .map(Number);

  let normalizedSeverity = "INFO";

  const severity = String(
    item.severity || ""
  ).toUpperCase();

  const severityColor = String(
    item.severity_color || ""
  ).toLowerCase();

  if (
    severity === "CRITICAL" ||
    severity === "RED" ||
    severityColor === "red"
  ) {
    normalizedSeverity = "CRITICAL";

  } else if (
    severity === "WARNING" ||
    severity === "ORANGE" ||
    severityColor === "orange"
  ) {
    normalizedSeverity = "WARNING";

  } else if (
    severity === "ALERT" ||
    severity === "WATCH" ||
    severity === "YELLOW" ||
    severityColor === "yellow"
  ) {
    normalizedSeverity = "ALERT";
  }

  return {

    source: "NDMA SACHET",

    hazard:
      item.disaster_type || "Disaster",

    severity:
      normalizedSeverity,

    location:
      item.area_description || "India",

    title:
      `${item.disaster_type || "Disaster"} Alert`,

    message:
      item.warning_message || "",

    official: true,

    sourceUrl:
      "https://sachet.ndma.gov.in/",

    latitude:
      Number.isFinite(latitude)
        ? latitude
        : null,

    longitude:
      Number.isFinite(longitude)
        ? longitude
        : null,

    severityColor:
      item.severity_color || null,

    alertSource:
      item.alert_source || null,

    language:
      item.actual_lang || "en",

    effectiveStartTime:
      item.effective_start_time || null,

    effectiveEndTime:
      item.effective_end_time || null,

    sachetIdentifier:
      item.identifier
  };
};


      
 

 

    

// ===============================
// SYNC SACHET ALERTS TO MONGODB
// ===============================

const syncSachetAlertsToMongo = async (items) => {

  const validItems = items.filter(
    (item) => item.identifier
  );

  const operations = validItems.map((item) => ({
    updateOne: {

      filter: {
        sachetIdentifier: item.identifier
      },

      update: {
        $set: normalizeSachetAlert(item)
      },

      upsert: true
    }
  }));


  if (operations.length === 0) {

    return {
      inserted: 0,
      updated: 0
    };

  }


  const result = await Alert.bulkWrite(
    operations,
    {
      ordered: false
    }
  );


  return {
    inserted: result.upsertedCount || 0,
    updated: result.modifiedCount || 0
  };

};

// ===============================
// SOURCE STATUS
// ===============================

app.get("/api/intelligence/source-status", async (req, res) => {
  try {

    const sachetCount = await Alert.countDocuments({
      source: "NDMA SACHET"
    });

    const ncsCount = await Alert.countDocuments({
      source: "NCS"
    });

    const cwcCount = await Alert.countDocuments({
      source: "CWC"
    });

    const disasterXCount = await Alert.countDocuments({
      source: "DISASTER-X AI"
    });

    res.json({
      sources: [
        {
          name: "IMD",
          type: "Weather & Warnings",
          status: process.env.IMD_API_KEY
            ? "CONNECTED"
            : "NOT CONFIGURED",
          alerts: 0,
          official: true,
          url: "https://api.imd.gov.in/"
        },

        {
          name: "NCS",
          type: "Earthquake Monitoring",
          status: ncsCount > 0
            ? "LIVE"
            : "OFFICIAL SOURCE",
          alerts: ncsCount,
          official: true,
          url: "https://www.ncs.gov.in/"
        },

        {
          name: "CWC",
          type: "Flood & River Information",
          status: cwcCount > 0
            ? "LIVE"
            : "OFFICIAL SOURCE",
          alerts: cwcCount,
          official: true,
          url: "https://aff.india-water.gov.in/"
        },

        {
          name: "INCOIS",
          type: "Tsunami & Ocean Hazards",
          status: "OFFICIAL SOURCE",
          alerts: 0,
          official: true,
          url: "https://incois.gov.in/"
        },

        {
          name: "NDMA SACHET",
          type: "Official Disaster Alerts",
          status: sachetCount > 0
            ? "LIVE"
            : "OFFICIAL SOURCE",
          alerts: sachetCount,
          official: true,
          url: "https://sachet.ndma.gov.in/"
        },

        {
          name: "DISASTER-X",
          type: "User Reports & AI Risk",
          status: disasterXCount > 0
            ? "ACTIVE"
            : "ACTIVE",
          alerts: disasterXCount,
          official: false,
          url: "http://localhost:5000"
        }
      ]
    });

  } catch (error) {

    console.error(
      "❌ SOURCE STATUS ERROR:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch source status",
      message: error.message
    });
  }
});

// ===============================
// SACHET API
// ===============================

app.get(
  "/api/intelligence/sachet",
  async (req, res) => {

    try {

      const data =
        await fetchSachetAlerts();

      const sync =
        await syncSachetAlertsToMongo(data);

      res.json({

        source: "NDMA SACHET",

        configured: true,

        count: data.length,

        sync: sync,

        data: data

      });

    } catch (error) {

      console.error(
        "SACHET route failed:",
        error.message
      );

      res.status(500).json({
        error: error.message
      });

    }

  }
);

//
// ===============================
// GET DATA SOURCE STATUS
// ===============================

app.get("/api/intelligence/sources", (req, res) => {
  res.json({
    totalSources: DATA_SOURCES.length,
    sources: DATA_SOURCES
  });
});


// ===============================
// CREATE AI ALERT FROM DISASTER REPORT
// ===============================

const createRiskAlert = async (disaster) => {

  const severity = disaster.severity?.toLowerCase();

  let alertLevel = "INFO";

  if (severity === "critical") {
    alertLevel = "CRITICAL";
  } else if (severity === "high") {
    alertLevel = "WARNING";
  } else if (severity === "medium") {
    alertLevel = "WATCH";
  }

  if (alertLevel === "INFO") {
    return null;
  }

  const existingAlert = await Alert.findOne({
    source: "DISASTER-X AI",
    location: disaster.location,
    hazard: disaster.type,
    severity: alertLevel
  });

  if (existingAlert) {
    return existingAlert;
  }

  const alert = new Alert({
    source: "DISASTER-X AI",
    hazard: disaster.type || "Unknown",
    severity: alertLevel,
    location: disaster.location || "Unknown",
    title: `${alertLevel}: ${disaster.type || "Disaster"} Risk Detected`,
    message:
      `AI-assisted risk signal detected at ${disaster.location}. ` +
      `Reported severity: ${disaster.severity}. ` +
      `${disaster.description || "Immediate monitoring is recommended."}`,
    official: false,
    sourceUrl: "http://localhost:5000",
    latitude: disaster.latitude,
    longitude: disaster.longitude
  });

  return await alert.save();
};


// ===============================
// GET ALL ALERTS
// ===============================

app.get("/api/alerts", async (req, res) => {

  try {

    const alerts = await Alert
      .find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts);

  } catch (error) {
  console.error("Alerts fetch failed:", error.message);
    res.status(500).json({
      error: "failed to fetch alerts"
    });

  }

});

app.get("/api/intelligence/normalize-alerts", async (req, res) => {
  try {
    const alerts = await Alert.find();

    let updated = 0;

    for (const alert of alerts) {
      const oldSeverity = String(alert.severity || "").toLowerCase();

      let newSeverity = "INFO";

      if (oldSeverity === "red" || oldSeverity === "critical") {
        newSeverity = "CRITICAL";
      } else if (
        oldSeverity === "orange" ||
        oldSeverity === "warning"
      ) {
        newSeverity = "WARNING";
      } else if (
        oldSeverity === "yellow" ||
        oldSeverity === "alert"
      ) {
        newSeverity = "ALERT";
      }

      if (alert.severity !== newSeverity) {
        alert.severity = newSeverity;
        await alert.save();
        updated++;
      }
    }

    res.json({
      success: true,
      total: alerts.length,
      updated
    });

  } catch (error) {
    console.error(
      "Alert normalization failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Alert normalization failed"
    });
  }
});


// ===============================
// INTELLIGENCE SUMMARY
// ===============================

app.get("/api/intelligence/summary", async (req, res) => {

  try {

    const disasters = await Disaster.find();

    const critical = disasters.filter(
      d => d.severity?.toLowerCase() === "critical"
    ).length;

    const high = disasters.filter(
      d => d.severity?.toLowerCase() === "high"
    ).length;

    const medium = disasters.filter(
      d => d.severity?.toLowerCase() === "medium"
    ).length;

    const resources = await Resource.find();

    const availableResources = resources.filter(
      r => r.status?.toLowerCase() === "available"
    ).length;

    const alerts = await Alert
      .find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({

      sources: DATA_SOURCES,

      statistics: {
        totalDisasters: disasters.length,
        critical,
        high,
        medium,
        totalResources: resources.length,
        availableResources,
        activeAlerts: alerts.length
      },

      alerts

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});
// Home
app.get("/", (req, res) => {
  res.send("Disaster X Backend is running");
});

// Get all disasters
app.get("/api/disasters", async (req, res) => {
  try {
    const disasters = await Disaster.find();
    res.json(disasters);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/api/disasters", async (req, res) => {
  try {
    const disaster = new Disaster(req.body);

    const savedDisaster = await disaster.save();
     await createRiskAlert(savedDisaster);
    res.status(201).json({
      message: "Disaster report saved successfully",
      disaster: savedDisaster
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

// ================= SOS MODEL =================



const sosSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "SOS"
  },

  status: {
    type: String,
    default: "ACTIVE"
  },

  priority: {
    type: String,
    default: "CRITICAL"
  },

  latitude: {
    type: Number,
    default: null
  },

  longitude: {
    type: Number,
    default: null
  },

  locationAccuracy: {
    type: Number,
    default: null
  },

  source: {
    type: String,
    default: "Disaster-X SOS"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SOS = mongoose.model("SOS", sosSchema);


// ================= CREATE SOS =================

app.post("/api/sos", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      locationAccuracy
    } = req.body;

    const sos = new SOS({
      latitude,
      longitude,
      locationAccuracy
    });

    const savedSOS = await sos.save();

    console.log("🚨 SOS RECEIVED:", savedSOS);

    res.status(201).json({
      success: true,
      message: "SOS received successfully",
      sos: savedSOS
    });

  } catch (error) {
    console.error("SOS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save SOS"
    });
  }
});


// ================= GET SOS =================

app.get("/api/sos", async (req, res) => {
  try {

    const sosReports = await SOS
      .find()
      .sort({ createdAt: -1 });

    res.json(sosReports);

  } catch (error) {

    console.error("GET SOS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch SOS reports"
    });
  }
});

app.patch("/api/sos/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updatedSOS = await SOS.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedSOS) {
      return res.status(404).json({
        success: false,
        message: "SOS not found"
      });
    }

    res.json({
      success: true,
      message: "SOS status updated",
      sos: updatedSOS
    });

  } catch (error) {
    console.error("UPDATE SOS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update SOS"
    });
  }
});

// Get all resources
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
// Add resource
app.post("/api/resources", async (req, res) => {
  try {
    const resource = new Resource(req.body);

    const savedResource = await resource.save();

    res.status(201).json({
      message: "Resource added successfully",
      resource: savedResource
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get("/api/resources/sample", async (req, res) => {
  try {
    const sampleResources = [
      {
        name: "Agra Emergency Hospital",
        type: "Hospital",
        location: "Agra",
        latitude: 27.1767,
        longitude: 78.0081,
        status: "Available",
        contact: "112"
      },
      {
        name: "Agra Fire Station",
        type: "Fire Station",
        location: "Agra",
        latitude: 27.1833,
        longitude: 78.0167,
        status: "Available",
        contact: "101"
      },
      {
        name: "Emergency Ambulance Team",
        type: "Ambulance",
        location: "Agra",
        latitude: 27.1751,
        longitude: 78.0421,
        status: "Available",
        contact: "108"
      },
      {
        name: "Disaster Rescue Team",
        type: "Rescue Team",
        location: "Agra",
        latitude: 27.1980,
        longitude: 77.9970,
        status: "Busy",
        contact: "112"
      },
      {
  name: "Agra Emergency Shelter",
  type: "Shelter",
  location: "Agra",
  latitude: 27.1767,
  longitude: 78.0081,
  status: "Available",
  contact: "112"
},
{
  name: "Rescue Vehicle Unit",
  type: "Rescue Vehicle",
  location: "Agra",
  latitude: 27.1900,
  longitude: 78.0200,
  status: "Available",
  contact: "112"
},

    ];

    const resources = await Resource.insertMany(sampleResources);

    res.json({
      message: "Sample resources added",
      resources
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/api/resources/reset-demo", async (req, res) => {
  try {
    // Remove old demo/duplicate resources
    await Resource.deleteMany({});

    const demoResources = [
      // HIMACHAL PRADESH
      {
        name: "Shimla Emergency Hospital",
        type: "Hospital",
        location: "Shimla, Himachal Pradesh",
        latitude: 31.1048,
        longitude: 77.1734,
        status: "Available",
        contact: "108"
      },
      {
        name: "Manali Rescue Team",
        type: "Rescue Team",
        location: "Manali, Himachal Pradesh",
        latitude: 32.2396,
        longitude: 77.1887,
        status: "Available",
        contact: "112"
      },
      {
        name: "Kangra Emergency Shelter",
        type: "Shelter",
        location: "Kangra, Himachal Pradesh",
        latitude: 32.0998,
        longitude: 76.2691,
        status: "Available",
        contact: "1070"
      },
      {
        name: "Mandi Rescue Vehicle",
        type: "Rescue Vehicle",
        location: "Mandi, Himachal Pradesh",
        latitude: 31.5892,
        longitude: 76.9182,
        status: "Busy",
        contact: "112"
      },

      // UTTARAKHAND
      {
        name: "Dehradun Emergency Hospital",
        type: "Hospital",
        location: "Dehradun, Uttarakhand",
        latitude: 30.3165,
        longitude: 78.0322,
        status: "Available",
        contact: "108"
      },
      {
        name: "Chamoli Rescue Team",
        type: "Rescue Team",
        location: "Chamoli, Uttarakhand",
        latitude: 30.4040,
        longitude: 79.3210,
        status: "Busy",
        contact: "112"
      },
      {
        name: "Rudraprayag Emergency Shelter",
        type: "Shelter",
        location: "Rudraprayag, Uttarakhand",
        latitude: 30.2844,
        longitude: 78.9811,
        status: "Available",
        contact: "1070"
      },

      // ASSAM
      {
        name: "Guwahati Emergency Hospital",
        type: "Hospital",
        location: "Guwahati, Assam",
        latitude: 26.1445,
        longitude: 91.7362,
        status: "Available",
        contact: "108"
      },
      {
        name: "Dibrugarh Rescue Team",
        type: "Rescue Team",
        location: "Dibrugarh, Assam",
        latitude: 27.4728,
        longitude: 94.9120,
        status: "Available",
        contact: "112"
      },
      {
        name: "Guwahati Flood Shelter",
        type: "Shelter",
        location: "Guwahati, Assam",
        latitude: 26.1158,
        longitude: 91.7086,
        status: "Available",
        contact: "1070"
      },

      // KERALA
      {
        name: "Kochi Emergency Hospital",
        type: "Hospital",
        location: "Kochi, Kerala",
        latitude: 9.9312,
        longitude: 76.2673,
        status: "Available",
        contact: "108"
      },
      {
        name: "Wayanad Rescue Team",
        type: "Rescue Team",
        location: "Wayanad, Kerala",
        latitude: 11.6854,
        longitude: 76.1320,
        status: "Busy",
        contact: "112"
      },
      {
        name: "Idukki Emergency Shelter",
        type: "Shelter",
        location: "Idukki, Kerala",
        latitude: 9.9189,
        longitude: 76.9558,
        status: "Available",
        contact: "1070"
      },

      // BIHAR
      {
        name: "Patna Emergency Hospital",
        type: "Hospital",
        location: "Patna, Bihar",
        latitude: 25.5941,
        longitude: 85.1376,
        status: "Available",
        contact: "108"
      },
      {
        name: "Patna Flood Rescue Team",
        type: "Rescue Team",
        location: "Patna, Bihar",
        latitude: 25.6200,
        longitude: 85.1410,
        status: "Available",
        contact: "112"
      },

      // ODISHA
      {
        name: "Bhubaneswar Emergency Hospital",
        type: "Hospital",
        location: "Bhubaneswar, Odisha",
        latitude: 20.2961,
        longitude: 85.8245,
        status: "Available",
        contact: "108"
      },
      {
        name: "Odisha Cyclone Response Team",
        type: "Rescue Team",
        location: "Puri, Odisha",
        latitude: 19.8135,
        longitude: 85.8312,
        status: "Available",
        contact: "112"
      },

      // MAHARASHTRA
      {
        name: "Mumbai Emergency Hospital",
        type: "Hospital",
        location: "Mumbai, Maharashtra",
        latitude: 19.0760,
        longitude: 72.8777,
        status: "Available",
        contact: "108"
      },
      {
        name: "Mumbai Flood Rescue Team",
        type: "Rescue Team",
        location: "Mumbai, Maharashtra",
        latitude: 19.0330,
        longitude: 73.0297,
        status: "Busy",
        contact: "112"
      },

      // GUJARAT
      {
        name: "Ahmedabad Emergency Hospital",
        type: "Hospital",
        location: "Ahmedabad, Gujarat",
        latitude: 23.0225,
        longitude: 72.5714,
        status: "Available",
        contact: "108"
      },
      {
        name: "Gujarat Emergency Shelter",
        type: "Shelter",
        location: "Surat, Gujarat",
        latitude: 21.1702,
        longitude: 72.8311,
        status: "Available",
        contact: "112"
      },

      // DELHI
      {
        name: "Delhi Emergency Hospital",
        type: "Hospital",
        location: "New Delhi, Delhi",
        latitude: 28.6139,
        longitude: 77.2090,
        status: "Available",
        contact: "108"
      },
      {
        name: "Delhi Rescue Vehicle Unit",
        type: "Rescue Vehicle",
        location: "New Delhi, Delhi",
        latitude: 28.6280,
        longitude: 77.2180,
        status: "Available",
        contact: "112"
      },

      // RAJASTHAN
      {
        name: "Jaipur Emergency Hospital",
        type: "Hospital",
        location: "Jaipur, Rajasthan",
        latitude: 26.9124,
        longitude: 75.7873,
        status: "Available",
        contact: "108"
      },

      // UTTAR PRADESH
      {
        name: "Agra Emergency Hospital",
        type: "Hospital",
        location: "Agra, Uttar Pradesh",
        latitude: 27.1767,
        longitude: 78.0081,
        status: "Available",
        contact: "108"
      },
      {
        name: "Agra Rescue Team",
        type: "Rescue Team",
        location: "Agra, Uttar Pradesh",
        latitude: 27.1980,
        longitude: 77.9970,
        status: "Available",
        contact: "112"
      }
    ];

    const resources = await Resource.insertMany(demoResources);

    res.json({
      message: "Demo resources reset successfully",
      totalResources: resources.length,
      resources
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ===============================
// DISASTER-X AI RISK ENGINE
// ===============================

app.get("/api/intelligence/risk", async (req, res) => {
  try {
    const alerts = await Alert.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).sort({ createdAt: -1 }).limit(100);

    let rainfall = 0;
    let flood = 0;
    let earthquake = 0;

    alerts.forEach((alert) => {
      const hazard = String(alert.hazard || "").toLowerCase();
      const severity = String(alert.severity || "").toLowerCase();

      let score = 0;

      if (
        severity.includes("critical")
      ) {
        score = 100;
      } else if (
        severity.includes("warning")
      ) {
        score = 80;
      } else if (
        severity.includes("alert")
      ) {
        score = 60;
      } else {
        score = 30;
      }

      if (
        hazard.includes("rain") ||
        hazard.includes("thunderstorm") ||
        hazard.includes("lightning")
      ) {
        rainfall = Math.max(rainfall, score);
      }

      if (
        hazard.includes("flood") ||
        hazard.includes("water")
      ) {
        flood = Math.max(flood, score);
      }

      if (
        hazard.includes("earthquake") ||
        hazard.includes("seismic")
      ) {
        earthquake = Math.max(earthquake, score);
      }
    });

    const riskScore = Math.round(
      rainfall * 0.4 +
      flood * 0.4 +
      earthquake * 0.2
    );

    let riskLevel = "LOW";

    if (riskScore >= 75) {
      riskLevel = "CRITICAL";
    } else if (riskScore >= 50) {
      riskLevel = "HIGH";
    } else if (riskScore >= 25) {
      riskLevel = "MEDIUM";
    }

    res.json({
      riskScore,
      riskLevel,

      factors: {
        rainfall,
        flood,
        earthquake
      },

      recommendation:
        riskScore >= 75
          ? "Activate emergency response and evacuation readiness."
          : riskScore >= 50
          ? "Monitor the zone and prepare emergency resources."
          : riskScore >= 25
          ? "Continue monitoring disaster indicators."
          : "Normal monitoring recommended."
    });

  } catch (error) {

    console.error(
      "Risk engine failed:",
      error.message
    );

    res.status(500).json({
      error: "Risk engine failed"
    });
  }
});
// ===============================
// SMART RESOURCE ALLOCATION
// ===============================

// ===============================
// SMART RESOURCE ALLOCATION
// ===============================

app.get("/api/intelligence/resource-plan", async (req, res) => {
  try {
    // Get current disaster alerts
    const alerts = await Alert.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // Get actual resources from MongoDB
    const resources = await Resource.find();

    // -----------------------------
    // ALERT ANALYSIS
    // -----------------------------

    const criticalAlerts = alerts.filter(
      a =>
        String(a.severity || "").toLowerCase() === "critical"
    );

    const warningAlerts = alerts.filter(
      a =>
        String(a.severity || "").toLowerCase() === "warning"
    );

    const alertAlerts = alerts.filter(
      a =>
        String(a.severity || "").toLowerCase() === "alert"
    );

    // -----------------------------
    // RESOURCE ANALYSIS
    // -----------------------------

    const availableResources = resources.filter(
      r =>
        String(r.status || "").toLowerCase() === "available"
    );

    const busyResources = resources.filter(
      r =>
        String(r.status || "").toLowerCase() === "busy"
    );

    const unavailableResources = resources.filter(
      r =>
        String(r.status || "").toLowerCase() === "unavailable"
    );

    // -----------------------------
    // RESOURCE TYPE COUNTS
    // -----------------------------

    const availableRescueTeams =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "rescue team"
      ).length;

    const availableAmbulances =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "ambulance"
      ).length;

    const availableShelters =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "shelter"
      ).length;

    const availableHospitals =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "hospital"
      ).length;

    const availableFireStations =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "fire station"
      ).length;

    const availablePoliceStations =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "police station"
      ).length;

    const availableRescueVehicles =
      availableResources.filter(
        r =>
          String(r.type || "").toLowerCase() === "rescue vehicle"
      ).length;

    // -----------------------------
    // RESOURCE AVAILABILITY
    // -----------------------------

    const availabilityPercentage =
      resources.length > 0
        ? Math.round(
            (availableResources.length / resources.length) * 100
          )
        : 0;

    // -----------------------------
    // PRIORITY LEVEL
    // -----------------------------

    let priority = "NORMAL";

    if (criticalAlerts.length > 0) {
      priority = "CRITICAL";
    } else if (warningAlerts.length > 0) {
      priority = "HIGH";
    } else if (alertAlerts.length > 0) {
      priority = "MEDIUM";
    }

    // -----------------------------
    // DEPLOYMENT RECOMMENDATION
    // -----------------------------

    let recommendation =
      "Normal emergency readiness recommended.";

    if (criticalAlerts.length > 0) {
      recommendation =
        "Critical disaster detected. Deploy available rescue teams, ambulances and emergency resources to the affected zone.";
    } else if (warningAlerts.length > 0) {
      recommendation =
        "Warning-level disaster detected. Keep rescue teams and medical resources on standby near affected zones.";
    } else if (alertAlerts.length > 0) {
      recommendation =
        "Alert-level disaster detected. Increase monitoring and prepare emergency resources.";
    }

    // -----------------------------
    // RESPONSE
    // -----------------------------

    res.json({
      status: "ACTIVE",

      priority,

      resources: {
        total: resources.length,
        available: availableResources.length,
        busy: busyResources.length,
        unavailable: unavailableResources.length,

        rescueTeams: availableRescueTeams,
        ambulances: availableAmbulances,
        shelters: availableShelters,
        hospitals: availableHospitals,
        fireStations: availableFireStations,
        policeStations: availablePoliceStations,
        rescueVehicles: availableRescueVehicles
      },

      availabilityPercentage,

      basedOn: {
        criticalAlerts: criticalAlerts.length,
        warningAlerts: warningAlerts.length,
        alertAlerts: alertAlerts.length
      },

      recommendation
    });

  } catch (error) {

    console.error(
      "Resource allocation failed:",
      error.message
    );

    res.status(500).json({
      error: "Resource allocation failed",
      message: error.message
    });
  }
});

app.get("/api/intelligence/report-deployment", async (req, res) => {
  try {
    const { reportId } = req.query;

    if (!reportId) {
      return res.status(400).json({
        error: "Report ID is required"
      });
    }

    // Selected user report
    const report = await Disaster.findById(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    // All available resources having location
    const resources = await Resource.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    });

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;

      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

      return R * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );
    };

    const findNearest = (type) => {

      const available = resources
        .filter(resource =>
          String(resource.status || "").toLowerCase() === "available"
        )
        .filter(resource =>
          String(resource.type || "").toLowerCase() === type
        );

      if (available.length === 0) {
        return null;
      }

      return available
        .map(resource => {

          const distance = calculateDistance(
            Number(report.latitude),
            Number(report.longitude),
            Number(resource.latitude),
            Number(resource.longitude)
          );

          return {
            id: resource._id,
            name: resource.name,
            type: resource.type,
            location: resource.location,
            latitude: Number(resource.latitude),
            longitude: Number(resource.longitude),
            status: resource.status,
            contact: resource.contact || "",
            distanceKm: Number(distance.toFixed(2))
          };

        })
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    };


    const rescueTeam = findNearest("rescue team");
    const ambulance = findNearest("ambulance");
    const hospital = findNearest("hospital");
    const shelter = findNearest("shelter");
    const fireStation = findNearest("fire station");
    const rescueVehicle = findNearest("rescue vehicle");


    const severity =
      String(report.severity || "low").toLowerCase();

    let priority = "MONITOR";

    if (severity === "critical") {
      priority = "IMMEDIATE";
    } else if (severity === "high") {
      priority = "HIGH";
    } else if (severity === "medium") {
      priority = "MEDIUM";
    }


    let recommendation =
      "Continue monitoring the incident.";

    if (severity === "critical") {

      recommendation =
        "Immediate response recommended. Dispatch nearby rescue and medical resources.";

    } else if (severity === "high") {

      recommendation =
        "High-priority incident. Prepare nearby emergency resources.";

    } else if (severity === "medium") {

      recommendation =
        "Maintain monitoring and keep emergency resources ready.";
    }


    res.json({

      status: "ACTIVE",

      target: {
        id: report._id,
        source: "USER REPORT",
        hazard: report.type || "Disaster",
        severity: report.severity || "LOW",
        location: report.location || "Unknown Location",
        latitude: Number(report.latitude),
        longitude: Number(report.longitude),
        description: report.description || ""
      },

      priority,

      resources: {
        rescueTeam,
        ambulance,
        hospital,
        shelter,
        fireStation,
        rescueVehicle
      },

      recommendation

    });

  } catch (error) {

    console.error(
      "❌ REPORT DEPLOYMENT ERROR:",
      error.message
    );

    res.status(500).json({
      error: "Failed to generate report deployment plan",
      message: error.message
    });
  }
});


app.get("/api/intelligence/alert-deployment", async (req, res) => {
  try {
    const { alertId } = req.query;

    if (!alertId) {
      return res.status(400).json({
        error: "Alert ID is required"
      });
    }

    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found"
      });
    }

    if (
      alert.latitude == null ||
      alert.longitude == null
    ) {
      return res.status(400).json({
        error: "Alert location coordinates are not available"
      });
    }

    const resources = await Resource.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    });

    // Distance in KM
    const calculateDistance = (
      lat1,
      lon1,
      lat2,
      lon2
    ) => {
      const R = 6371;

      const dLat =
        (lat2 - lat1) * Math.PI / 180;

      const dLon =
        (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

      return (
        R *
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        )
      );
    };

    // Find nearest AVAILABLE resource
    const findNearest = (type) => {

      const available =
        resources
          .filter(
            resource =>
              String(
                resource.status || ""
              ).toLowerCase() === "available"
          )
          .filter(
            resource =>
              String(
                resource.type || ""
              ).toLowerCase() ===
              type
          );

      if (available.length === 0) {
        return null;
      }

      return available
        .map(resource => {

          const distance =
            calculateDistance(
              Number(alert.latitude),
              Number(alert.longitude),
              Number(resource.latitude),
              Number(resource.longitude)
            );

          return {
            id: resource._id,
            name: resource.name,
            type: resource.type,
            location: resource.location,
            latitude: Number(resource.latitude),
            longitude: Number(resource.longitude),
            status: resource.status,
            contact: resource.contact || "",
            distanceKm:
              Number(distance.toFixed(2))
          };
        })
        .sort(
          (a, b) =>
            a.distanceKm - b.distanceKm
        )[0];
    };

    const rescueTeam =
      findNearest("rescue team");

    const ambulance =
      findNearest("ambulance");

    const hospital =
      findNearest("hospital");

    const shelter =
      findNearest("shelter");

    const fireStation =
      findNearest("fire station");

    const rescueVehicle =
      findNearest("rescue vehicle");

    const severity =
      String(
        alert.severity || "INFO"
      ).toLowerCase();

    let priority = "MONITOR";

    if (severity === "critical") {
      priority = "IMMEDIATE";
    } else if (severity === "warning") {
      priority = "HIGH";
    } else if (severity === "alert") {
      priority = "MEDIUM";
    }

    let recommendation =
      "Continue monitoring the alert.";

    if (severity === "critical") {
      recommendation =
        "Critical alert detected. Prioritize nearby rescue and medical resources.";
    } else if (severity === "warning") {
      recommendation =
        "Warning alert detected. Keep nearby emergency resources ready.";
    } else if (severity === "alert") {
      recommendation =
        "Alert detected. Increase monitoring and prepare nearby resources.";
    }

    res.json({

      status: "ACTIVE",

      target: {
        id: alert._id,
        source: alert.source || "OFFICIAL ALERT",
        hazard:
          alert.hazard ||
          "Disaster",
        severity:
          alert.severity ||
          "INFO",
        location:
          alert.location ||
          "Unknown Location",
        latitude:
          Number(alert.latitude),
        longitude:
          Number(alert.longitude),
        title:
          alert.title ||
          "Disaster Alert",
        message:
          alert.message || ""
      },

      priority,

      resources: {
        rescueTeam,
        ambulance,
        hospital,
        shelter,
        fireStation,
        rescueVehicle
      },

      recommendation
    });

  } catch (error) {

    console.error(
      "❌ ALERT DEPLOYMENT ERROR:",
      error.message
    );

    res.status(500).json({
      error:
        "Failed to generate alert deployment plan",
      message:
        error.message
    });
  }
});

// ==========================================
// SMART RESOURCE DEPLOYMENT
// ==========================================

app.get("/api/intelligence/resource-deployment", async (req, res) => {
  try {

    // ------------------------------------------
    // 1. GET HIGHEST PRIORITY DISASTER
    // ------------------------------------------

    const alerts = await Alert.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).sort({ createdAt: -1 });

    const priorityScore = {
      critical: 4,
      warning: 3,
      alert: 2,
      info: 1
    };

    const priorityAlert = [...alerts].sort((a, b) => {

      const scoreA =
        priorityScore[
          String(a.severity || "").toLowerCase()
        ] || 0;

      const scoreB =
        priorityScore[
          String(b.severity || "").toLowerCase()
        ] || 0;

      return scoreB - scoreA;

    })[0];

    if (!priorityAlert) {
      return res.json({
        status: "NO_ACTIVE_ALERT",
        message: "No disaster with location data found.",
        target: null,
        resources: {}
      });
    }


    // ------------------------------------------
    // 2. GET ACTUAL RESOURCES FROM DATABASE
    // ------------------------------------------

    const resources = await Resource.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    });


    // ------------------------------------------
    // 3. HAVERSINE DISTANCE FUNCTION
    // ------------------------------------------

    const calculateDistance = (
      lat1,
      lon1,
      lat2,
      lon2
    ) => {

      const R = 6371;

      const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

      const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

      const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return R * c;
    };


    // ------------------------------------------
    // 4. FIND NEAREST RESOURCE BY TYPE
    // ------------------------------------------

    const findNearest = (type) => {

      const available = resources
        .filter(
          resource =>
            String(resource.status || "")
              .toLowerCase() === "available"
        )
        .filter(
          resource =>
            String(resource.type || "")
              .toLowerCase() === type
        );

      if (available.length === 0) {
        return null;
      }

      const sorted = available
        .map(resource => {

          const distance =
            calculateDistance(
              Number(priorityAlert.latitude),
              Number(priorityAlert.longitude),
              Number(resource.latitude),
              Number(resource.longitude)
            );

          return {
            id: resource._id,
            name: resource.name,
            type: resource.type,
            location: resource.location,
            latitude: resource.latitude,
            longitude: resource.longitude,
            status: resource.status,
            contact: resource.contact,
            distanceKm: Number(
              distance.toFixed(2)
            )
          };

        })
        .sort(
          (a, b) =>
            a.distanceKm - b.distanceKm
        );

      return sorted[0];
    };


    // ------------------------------------------
    // 5. FIND NEAREST EMERGENCY RESOURCES
    // ------------------------------------------

    const nearestRescueTeam =
      findNearest("rescue team");

    const nearestAmbulance =
      findNearest("ambulance");

    const nearestHospital =
      findNearest("hospital");

    const nearestShelter =
      findNearest("shelter");

    const nearestFireStation =
      findNearest("fire station");

    const nearestRescueVehicle =
      findNearest("rescue vehicle");


    // ------------------------------------------
    // 6. DEPLOYMENT RECOMMENDATION
    // ------------------------------------------

    const severity =
      String(
        priorityAlert.severity || "INFO"
      ).toLowerCase();

    let recommendation =
      "Continue monitoring and keep resources ready.";

    if (severity === "critical") {

      recommendation =
        "Immediate emergency deployment recommended. Dispatch the nearest available rescue and medical resources.";

    } else if (severity === "warning") {

      recommendation =
        "Prepare emergency resources near the affected zone and keep rescue teams on standby.";

    } else if (severity === "alert") {

      recommendation =
        "Increase monitoring and prepare nearby emergency resources.";

    }


    // ------------------------------------------
    // 7. RESPONSE
    // ------------------------------------------

    res.json({

      status: "ACTIVE",

      target: {
        id: priorityAlert._id,
        hazard:
          priorityAlert.hazard ||
          priorityAlert.type ||
          "Disaster",

        severity:
          priorityAlert.severity ||
          "INFO",

        location:
          priorityAlert.location ||
          "Unknown Location",

        latitude:
          Number(priorityAlert.latitude),

        longitude:
          Number(priorityAlert.longitude),

        title:
          priorityAlert.title ||
          "Emergency Alert",

        message:
          priorityAlert.message ||
          ""
      },

      resources: {

        rescueTeam:
          nearestRescueTeam,

        ambulance:
          nearestAmbulance,

        hospital:
          nearestHospital,

        shelter:
          nearestShelter,

        fireStation:
          nearestFireStation,

        rescueVehicle:
          nearestRescueVehicle

      },

      recommendation

    });

  } catch (error) {

    console.error(
      "❌ RESOURCE DEPLOYMENT ERROR:",
      error.message
    );

    res.status(500).json({
      error:
        "Failed to generate deployment plan",
      message:
        error.message
    });

  }
});

console.log("IMD KEY:", process.env.IMD_API_KEY ? "FOUND" : "MISSING");


const autoSyncNCS = async () => {
  try {

    const earthquakes = await fetchNCSData();

    if (earthquakes.length === 0) {
      console.log("NCS: No earthquake data");
      return;
    }

    const sync = await syncNCSToMongo(
      earthquakes
    );

    console.log(
      "🌍 NCS AUTO SYNC:",
      sync
    );

  } catch (error) {

    console.error(
      "NCS auto sync failed:",
      error.message
    );

  }
};

autoSyncNCS();

setInterval(() => {
  autoSyncNCS();
}, 5 * 60 * 1000);

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});