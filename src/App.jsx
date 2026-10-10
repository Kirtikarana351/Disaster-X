import DisasterForm from "./DisasterForm";
import {
  Activity,
  AlertTriangle,
  CloudRain,
  Flame,
  Waves,
  Wind,
  MapPin,
  ShieldCheck,
  Radio,
  Users,
  Navigation,
  Brain,
  Clock3,
} from "lucide-react";
import * as THREE from "three";
import { CircleMarker } from "react-leaflet";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";





import React, { useEffect, useState, useRef } from "react";

import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, useMap, Polyline} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


function RiskBar({ value }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-red-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function EvacuationRoute({ alert, resources = [] }) {
  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!alert?.latitude || !alert?.longitude) return;

    const startLat = Number(alert.latitude);
    const startLng = Number(alert.longitude);

    // Find nearest resource having coordinates
    const validResources = resources.filter(
      (resource) =>
        resource.latitude != null &&
        resource.longitude != null
    );

    let destination;

    if (validResources.length > 0) {
      let nearest = validResources[0];
      let minDistance = Infinity;

      validResources.forEach((resource) => {
        const lat = Number(resource.latitude);
        const lng = Number(resource.longitude);

        const distance =
          Math.pow(lat - startLat, 2) +
          Math.pow(lng - startLng, 2);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = resource;
        }
      });

      destination = {
        lat: Number(nearest.latitude),
        lng: Number(nearest.longitude),
        name: nearest.name || nearest.location || "Nearest Safe Resource"
      };
    } else {
      // Temporary fallback
      destination = {
        lat: startLat + 0.12,
        lng: startLng + 0.12,
        name: "Simulated Safe Zone"
      };
    }

    const getRoute = async () => {
      try {
        const response = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );

        const routeData = response.data.routes?.[0];

        if (!routeData) return;

        const coordinates =
          routeData.geometry?.coordinates || [];

        setRoute(
          coordinates.map(([lng, lat]) => [lat, lng])
        );

        setRouteInfo({
          distance: (routeData.distance / 1000).toFixed(1),
          duration: Math.round(routeData.duration / 60),
          destination: destination.name
        });

      } catch (error) {
        console.error(
          "Evacuation route failed:",
          error.message
        );
      }
    };

    getRoute();

  }, [alert, resources]);

  if (route.length === 0) return null;

  return (
    <>
      <Polyline
        positions={route}
        pathOptions={{
          color: "blue",
          weight: 6
        }}
      />

      <Marker
        position={route[route.length - 1]}
      >
        <Popup>
          <strong>🟢 Safe Destination</strong>
          <br />
          📍 {routeInfo?.destination}
          <br />
          🚗 Distance: {routeInfo?.distance} km
          <br />
          ⏱️ Estimated Time: {routeInfo?.duration} min
        </Popup>
      </Marker>
    </>
  );
}

function DisasterMap({
  disasters = [],
  resources = [],
  alerts = [],
  simulationActive = false,
  simulationRadius = 5,
  selectedMapAlert = null
}) {

  console.log("===== MAP DEBUG =====");
  console.log("DISASTERS:", disasters);
  console.log("DISASTER COUNT:", disasters.length);

  console.log("ALERTS:", alerts);
  console.log("ALERT COUNT:", alerts.length);

  console.log("SELECTED MAP ALERT:", selectedMapAlert);
 
 
  const [selectedAlert, setSelectedAlert] = useState(null);

  const validReports = disasters.filter(
    (item) =>
      item.latitude != null &&
      item.longitude != null &&
      !Number.isNaN(Number(item.latitude)) &&
      !Number.isNaN(Number(item.longitude))
  );
  
const validAlerts = (alerts || []).filter(
  (item) =>
    item &&
    item.latitude != null &&
    item.longitude != null &&
    !Number.isNaN(Number(item.latitude)) &&
    !Number.isNaN(Number(item.longitude))
);

console.log("SACHET MAP ALERTS:", validAlerts);
console.log("VALID ALERT COUNT:", validAlerts.length);
function MapFocus({ alert }) {
  const map = useMap();

  useEffect(() => {
    if (
      alert?.latitude != null &&
      alert?.longitude != null
    ) {
      map.flyTo(
        [
          Number(alert.latitude),
          Number(alert.longitude)
        ],
        10,
        {
          duration: 1.2
        }
      );
    }
  }, [alert, map]);

  return null;
}

function AlertFocus({ alert }) {

  const map = useMap();

  useEffect(() => {

    if (
      alert?.latitude != null &&
      alert?.longitude != null
    ) {

      map.flyTo(
        [
          Number(alert.latitude),
          Number(alert.longitude)
        ],
        10,
        {
          duration: 1.2
        }
      );

    }

  }, [alert, map]);

  return null;
}

  return (
    <div className="relative w-full h-full">

      <div className="absolute top-4 right-4 z-[1000] bg-black/80 text-white p-3 rounded-xl text-xs">
  <div className="font-bold mb-2">SACHET ALERTS</div>

  <div className="flex items-center gap-2 mb-1">
    <span className="w-3 h-3 rounded-full bg-red-500"></span>
    Critical
  </div>

  <div className="flex items-center gap-2 mb-1">
    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
    Warning
  </div>

  <div className="flex items-center gap-2 mb-1">
    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
    Alert
  </div>

  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-500"></span>
    Other
  </div>
</div>
<div className="absolute top-4 left-4 z-[1000] bg-black/90 text-white p-4 rounded-xl w-72 max-h-80 overflow-y-auto shadow-xl">

  <div className="flex items-center justify-between mb-3">
    <div className="font-bold text-sm">
      🚨 LIVE SACHET ALERTS
    </div>

    <div className="text-xs text-green-400">
      ● LIVE
    </div>
  </div>

  {validAlerts.slice(0, 8).map((alert) => (
    <div
      key={`panel-${alert._id || alert.sachetIdentifier}`}
      onClick={() => setSelectedAlert(alert)}
      className="border-b border-gray-700 py-2 cursor-pointer hover:bg-white/10">
      <div className="font-semibold text-sm">
        {alert.hazard || "Disaster"}
      </div>

      <div className="text-xs text-gray-300 mt-1">
        📍 {alert.location}
      </div>

      <div className="text-xs mt-1">
        ⚠️ {alert.severity}
      </div>

      <div className="text-[10px] text-gray-400 mt-1">
        Source: {alert.alertSource || "NDMA SACHET"}
      </div>
    </div>
  ))}

  {validAlerts.length === 0 && (
    <div className="text-xs text-gray-400">
      No active alerts
    </div>
  )}

</div>


    <MapContainer
    
      center={[22.9734, 78.6569]}
      zoom={5}
      className="w-full h-full"
    >
      <MapFocus alert={selectedMapAlert} />
      <AlertFocus alert={selectedAlert} />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validReports.map((item) => {
        const severity = item.severity?.toLowerCase();
        const markerColor =
  severity === "critical"
    ? "red"
    : severity === "high"
    ? "orange"
    : severity === "medium"
    ? "yellow"
    : "green";

        const risk =
          severity === "critical"
            ? 95
            : severity === "high"
            ? 85
            : severity === "medium"
            ? 60
            : 30;

        return (
          
          <Marker
            key={item._id}
            position={[
              Number(item.latitude),
              Number(item.longitude),
            ]}
            
          >
            <Tooltip permanent direction="top">
  {item.location}
</Tooltip>
            <Popup>
              <div>
                <strong>{item.type || "Disaster"}</strong>
                <br />
                📍 {item.location}
                <br />
                ⚠️ Severity: {item.severity}
                <br />
                📊 Risk: {risk}%
                <br />
                {item.description && (
                  <>
                    📝 {item.description}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
                   

                   
                
        );
      })}

      {validAlerts
  .filter(
    (alert) =>
      String(alert.source || "").toUpperCase() === "NCS"
  )
  .map((alert) => (
    <Circle
      key={`ncs-${alert._id}`}
      center={[
        Number(alert.latitude),
        Number(alert.longitude)
      ]}
      radius={8000}
      pathOptions={{
        color: "purple",
        fillColor: "purple",
        fillOpacity: 0.25,
        weight: 2
      }}
    >
      <Tooltip>
        🌍 NCS Earthquake
      </Tooltip>

      <Popup>
        <div className="text-sm">
          <strong>
            🌍 {alert.title || "NCS Earthquake"}
          </strong>

          <br />

          📍 {alert.location}

          <br />

          ⚠️ Severity: {alert.severity}

          <br />

          🏛️ Source: NCS

          <br />

          📝 {alert.message}

          <br />

          ✓ Official NCS Data
        </div>
      </Popup>
    </Circle>
  ))}

      {/* ============================= */}
{/* SACHET OFFICIAL ALERT MARKERS */}
{/* ============================= */}


     {validAlerts.map((alert) => {
  const severity = (alert.severity || "").toLowerCase();

  let alertColor = "green";

  if (severity === "critical") {
    alertColor = "red";
  } else if (severity === "warning") {
    alertColor = "orange";
  } else if (severity === "alert") {
    alertColor = "yellow";
  }

  return (
    <Circle
      key={`sachet-${alert._id || alert.sachetIdentifier}`}
      center={[
        Number(alert.latitude),
        Number(alert.longitude)
      ]}
      radius={15000}
      pathOptions={{
        color: alertColor,
        fillColor: alertColor,
        fillOpacity: 0.20,
        weight: 3
      }}
    >
      <Tooltip>
        🚨 {alert.hazard || "Disaster Alert"}
      </Tooltip>

      <Popup>
        <div className="text-sm">
          <strong>
            🚨 {alert.title || "Official Disaster Alert"}
          </strong>

          <br />
          📍 {alert.location}

          <br />
          ⚠️ Severity: {alert.severity}

          <br />
          🏛️ Source: {alert.alertSource || "NDMA SACHET"}

          <br />
          🌐 Language: {alert.language || "en"}

          <br />
          🕐 Start: {alert.effectiveStartTime || "N/A"}

          <br />
          🕐 End: {alert.effectiveEndTime || "N/A"}

          <br />

          {alert.message && (
            <>
              📝 {alert.message}
              <br />
            </>
          )}


          <span style={{ color: "green" }}>
            ✓ Official Alert
          </span>
        </div>
      </Popup>
    </Circle>
  );
})}
          {simulationActive && validAlerts.length > 0 && (
  <Circle
    center={[
      Number(validAlerts[0].latitude),
      Number(validAlerts[0].longitude)
    ]}
    radius={simulationRadius * 1000}
    pathOptions={{
      color: "cyan",
      fillColor: "cyan",
      fillOpacity: 0.12,
      weight: 3
    }}
  >
    <Tooltip permanent>
      🌐 Digital Twin Impact Zone: {simulationRadius} km
    </Tooltip>
  </Circle>
)}
    </MapContainer>
    </div>
  );
}

function DigitalTwin3D({
  alerts = [],
  hasCoordinates,
  simulatedRisk,
  nearbyTwinSOS = [],
  twinResources = [],
  hazardName = "Severe Thunderstorm",
  hazardLocation = "Live Disaster Zone",
  severity = "HIGH",
  twinLayer = "all",
  twinHour = 0,
  disasterLat = null,
  disasterLng = null
}) {
  const mountRef = useRef(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
const [selectedLocationName, setSelectedLocationName] = useState("");
const [locationLoading, setLocationLoading] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  const cityRef = useRef(null);
  const roadsRef = useRef(null);
  const riskRef = useRef(null);
  const sosRef = useRef(null);
  const resourcesRef = useRef(null);
  const alertsRef = useRef(null);
const cameraTargetRef = useRef({ x: 0, y: 0, z: 0 });
const updateCameraRef = useRef(null);

  const riskCoreRef = useRef(null);
  const riskCylinderRef = useRef(null);
  const beamRef = useRef(null);

  const riskValueRef = useRef(Number(simulatedRisk) || 0);
  const hourRef = useRef(Number(twinHour) || 0);

  const centerRef = useRef({
    lat: Number(disasterLat),
    lng: Number(disasterLng)
  });

  const dragRef = useRef({
    active: false,
    x: 0,
    y: 0,
    rotX: 0.62,
    rotY: -0.65
  });

  const zoomRef = useRef(40);

  /* ---------------- LIVE VALUES ---------------- */

  useEffect(() => {
    riskValueRef.current = Number(simulatedRisk) || 0;
    hourRef.current = Number(twinHour) || 0;

    centerRef.current = {
      lat: Number(disasterLat),
      lng: Number(disasterLng)
    };
  }, [
    simulatedRisk,
    twinHour,
    disasterLat,
    disasterLng
  ]);

  /* ---------------- GEO → CITY POSITION ---------------- */

/* ---------------- ALERT COORDINATES ---------------- */

const isValidGeo = (lat, lng) => {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined ||
    String(lat).trim() === "" ||
    String(lng).trim() === ""
  ) {
    return false;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
};

/* Only alerts with valid coordinates */

const locatedAlerts = alerts.filter((alert) =>
  isValidGeo(alert.latitude, alert.longitude)
);

/* Calculate geographic bounds */

const alertLats = locatedAlerts.map((a) =>
  Number(a.latitude)
);

const alertLngs = locatedAlerts.map((a) =>
  Number(a.longitude)
);

const minLat =
  alertLats.length > 0
    ? Math.min(...alertLats)
    : 28.6139;

const maxLat =
  alertLats.length > 0
    ? Math.max(...alertLats)
    : 28.6139;

const minLng =
  alertLngs.length > 0
    ? Math.min(...alertLngs)
    : 77.2090;

const maxLng =
  alertLngs.length > 0
    ? Math.max(...alertLngs)
    : 77.2090;

/* Center of all located alerts */

const mapCenterLat = (minLat + maxLat) / 2;
const mapCenterLng = (minLng + maxLng) / 2;

/* Approximate local geographic distance in km */

/* Geographic bounds in kilometres */

/* Geographic bounds in kilometres */

const latitudeSpanKm =
  Math.abs(maxLat - minLat) * 111.32;

const longitudeSpanKm =
  Math.abs(maxLng - minLng) *
  111.32 *
  Math.max(
    Math.cos((mapCenterLat * Math.PI) / 180),
    0.01
  );

/* Fit the geographic area into a 120-unit scene */

const geoScale =
  120 /
  Math.max(
    latitudeSpanKm,
    longitudeSpanKm,
    0.1
  );

/* GEO -> THREE.JS CITY POSITION */

const geoToCity = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const centerLat = Number(mapCenterLat);
  const centerLng = Number(mapCenterLng);

  const x =
    (longitude - centerLng) *
    111.32 *
    Math.cos((centerLat * Math.PI) / 180) *
    geoScale;

  const z =
    -(latitude - centerLat) *
    111.32 *
    geoScale;

  return { x, z };
};

  /* =====================================================
     MAIN THREE.JS SCENE
     ===================================================== */

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color("#030712");

    scene.fog = new THREE.Fog(
      "#030712",
      80,
      220
    );

    sceneRef.current = scene;

    /* ---------------- CAMERA ---------------- */

    const camera = new THREE.OrthographicCamera(
      -50,
      50,
      38,
      -38,
      0.1,
      500
    );

    camera.position.set(
      65,
      72,
      65
    );

    camera.lookAt(0, 0, 0);

    cameraRef.current = camera;

    /* ---------------- RENDERER ---------------- */

    const renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      mount.clientWidth,
      mount.clientHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    mount.appendChild(renderer.domElement);

    rendererRef.current = renderer;

    /* =================================================
       LIGHTING
       ================================================= */

    const ambient = new THREE.AmbientLight(
      0xffffff,
      1.5
    );

    scene.add(ambient);

    const mainLight =
      new THREE.DirectionalLight(
        0xffffff,
        2.3
      );

    mainLight.position.set(
      40,
      90,
      20
    );

    mainLight.castShadow = true;

    scene.add(mainLight);

    const orangeLight =
      new THREE.PointLight(
        0xff6a00,
        8,
        90
      );

    orangeLight.position.set(
      0,
      7,
      0
    );

    scene.add(orangeLight);

    /* =================================================
       WORLD / CITY GROUPS
       ================================================= */

    const world = new THREE.Group();

    scene.add(world);

    /* ---------------- CITY ---------------- */

    const city = new THREE.Group();

    city.userData.twinLayer =
      "buildings";

    world.add(city);

    cityRef.current = city;

    /* ---------------- ROADS ---------------- */

    const roads = new THREE.Group();

    roads.userData.twinLayer =
      "roads";

    world.add(roads);

    roadsRef.current = roads;

    /* ---------------- RISK ---------------- */

    const risk = new THREE.Group();

    risk.userData.twinLayer =
      "risk";

    world.add(risk);

    riskRef.current = risk;

    /* ---------------- SOS ---------------- */

    const sosGroup =
      new THREE.Group();

    sosGroup.userData.twinLayer =
      "sos";

    world.add(sosGroup);

    sosRef.current = sosGroup;

    /* ---------------- ALERTS ---------------- */

const alertGroup = new THREE.Group();

alertGroup.userData.twinLayer = "alerts";

world.add(alertGroup);

alertsRef.current = alertGroup;

    /* ---------------- RESOURCES ---------------- */

    const resourceGroup =
      new THREE.Group();

    resourceGroup.userData.twinLayer =
      "resources";

    world.add(resourceGroup);

    resourcesRef.current =
      resourceGroup;

    /* =================================================
       GROUND
       ================================================= */

    const groundGeometry =
      new THREE.PlaneGeometry(
        180,
        180
      );

    const groundMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x07101b,
        roughness: 0.92,
        metalness: 0.05
      });

    const ground =
      new THREE.Mesh(
        groundGeometry,
        groundMaterial
      );

    ground.rotation.x =
      -Math.PI / 2;

    ground.position.y = -1.2;

    world.add(ground);

    /* =================================================
       CITY GRID
       ================================================= */

    const grid = new THREE.GridHelper(
      170,
      34,
      0x263241,
      0x111827
    );

    grid.position.y = -1.05;

    grid.material.opacity = 0.45;
    grid.material.transparent = true;

    world.add(grid);

    /* =================================================
       BUILDINGS
       ================================================= */

    const buildingMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x59616b,
        roughness: 0.86,
        metalness: 0.08
      });

    const roofMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x69727c,
        roughness: 0.9
      });

    const buildingPositions = [];

    const rows = [
      [-48, -38, 7, 9],
      [-32, -38, 5, 7],
      [-15, -38, 8, 10],
      [3, -38, 6, 8],
      [22, -38, 8, 7],
      [42, -38, 5, 10],

      [-50, -20, 9, 6],
      [-34, -20, 6, 11],
      [-16, -20, 7, 6],
      [2, -20, 5, 9],
      [20, -20, 8, 6],
      [40, -20, 6, 9],

      [-48, 1, 7, 8],
      [-32, 1, 9, 5],
      [-15, 1, 5, 8],
      [3, 1, 8, 6],
      [22, 1, 6, 9],
      [41, 1, 8, 5],

      [-45, 22, 8, 7],
      [-28, 22, 5, 9],
      [-11, 22, 8, 6],
      [8, 22, 6, 8],
      [26, 22, 9, 6],
      [45, 22, 6, 9],

      [-42, 41, 7, 8],
      [-25, 41, 8, 5],
      [-7, 41, 6, 8],
      [11, 41, 8, 6],
      [29, 41, 5, 9],
      [45, 41, 8, 6]
    ];

    rows.forEach(
      ([x, z, w, d], index) => {
        const height =
          4 +
          ((index * 7) % 9);

        const geometry =
          new THREE.BoxGeometry(
            w,
            height,
            d
          );

        const material =
          index % 4 === 0
            ? roofMaterial
            : buildingMaterial;

        const building =
          new THREE.Mesh(
            geometry,
            material
          );

        building.position.set(
          x,
          height / 2 - 1,
          z
        );

        building.castShadow = true;
        building.receiveShadow = true;

        city.add(building);

        buildingPositions.push(
          building
        );
      }
    );

    /* =================================================
       ROADS
       ================================================= */

    const roadMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.92,
        metalness: 0.03
      });

    const roadLines =
      new THREE.MeshBasicMaterial({
        color: 0x303b49
      });

    const addRoad = (
      x,
      z,
      width,
      depth
    ) => {
      const geometry =
        new THREE.BoxGeometry(
          width,
          0.25,
          depth
        );

      const road =
        new THREE.Mesh(
          geometry,
          roadMaterial
        );

      road.position.set(
        x,
        -0.82,
        z
      );

      roads.add(road);

      return road;
    };

    /* MAIN HORIZONTAL ROADS */

    [-31, -8, 16, 38].forEach(
      (z) => {
        addRoad(
          0,
          z,
          145,
          5
        );
      }
    );

    /* MAIN VERTICAL ROADS */

    [-37, -13, 12, 36].forEach(
      (x) => {
        addRoad(
          x,
          0,
          5,
          145
        );
      }
    );

    /* ROAD LIGHT LINES */

    const roadLineGeometry =
      new THREE.BoxGeometry(
        145,
        0.05,
        0.15
      );

    [-31, -8, 16, 38].forEach(
      (z) => {
        const line =
          new THREE.Mesh(
            roadLineGeometry,
            roadLines
          );

        line.position.set(
          0,
          -0.67,
          z
        );

        roads.add(line);
      }
    );

    const verticalLineGeometry =
      new THREE.BoxGeometry(
        0.15,
        0.05,
        145
      );

    [-37, -13, 12, 36].forEach(
      (x) => {
        const line =
          new THREE.Mesh(
            verticalLineGeometry,
            roadLines
          );

        line.position.set(
          x,
          -0.67,
          0
        );

        roads.add(line);
      }
    );

    /* =================================================
       EPICENTER
       ================================================= */

    const coreMaterial =
      new THREE.MeshBasicMaterial({
        color: 0xff7a00
      });

    const core =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          2.4,
          32,
          32
        ),
        coreMaterial
      );

    core.position.y = 1.5;

    risk.add(core);

    riskCoreRef.current =
      core;

    /* =================================================
       INNER GLOW
       ================================================= */

    const glow =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.45,
          16,
          16
        ),
        new THREE.MeshBasicMaterial({
          color: 0xff5a00,
          transparent: true,
          opacity: 0.18,
          blending:
            THREE.AdditiveBlending,
          depthWrite: false
        })
      );

    glow.position.y = 1.5;

    risk.add(glow);

    /* =================================================
       HAZARD CYLINDER
       ================================================= */

    const cylinder =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          15,
          5,
          18,
          64,
          1,
          true
        ),
        new THREE.MeshBasicMaterial({
          color: 0xff6500,
          transparent: true,
          opacity: 0.10,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );

    cylinder.position.y = 8;

    risk.add(cylinder);

    riskCylinderRef.current =
      cylinder;

    /* =================================================
       CYLINDER TOP
       ================================================= */

    const top =
      new THREE.Mesh(
        new THREE.RingGeometry(
          0.65,
          0.9,
          24
        ),
        new THREE.MeshBasicMaterial({
          color: 0xff7900,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );

    top.rotation.x =
      -Math.PI / 2;

    top.position.y = 17.1;

    risk.add(top);

    /* =================================================
       CONCENTRIC RINGS
       ================================================= */

    [5, 9, 13, 18, 23].forEach(
      (radius, index) => {
        const ring =
          new THREE.Mesh(
            new THREE.RingGeometry(
              radius - 0.18,
              radius,
              96
            ),
            new THREE.MeshBasicMaterial({
              color:
                index === 0
                  ? 0xffae00
                  : 0xff6500,
              transparent: true,
              opacity:
                0.72 -
                index * 0.09,
              side:
                THREE.DoubleSide,
              depthWrite: false
            })
          );

        ring.rotation.x =
          -Math.PI / 2;

        ring.position.y =
          -0.55 + index * 0.015;

        risk.add(ring);
      }
    );

    /* =================================================
       BEAM
       ================================================= */

    const beam =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.42,
          0.9,
          35,
          32,
          true
        ),
        new THREE.MeshBasicMaterial({
          color: 0xff7b00,
          transparent: true,
          opacity: 0.18,
          blending:
            THREE.AdditiveBlending,
          depthWrite: false
        })
      );

    beam.position.y =
      17.5;

    risk.add(beam);

    beamRef.current = beam;

    /* =================================================
       BEAM CORE
       ================================================= */

    const beamCore =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.12,
          0.22,
          35,
          16
        ),
        new THREE.MeshBasicMaterial({
          color: 0xffd27a,
          transparent: true,
          opacity: 0.8,
          blending:
            THREE.AdditiveBlending,
          depthWrite: false
        })
      );

    beamCore.position.y =
      17.5;

    risk.add(beamCore);

    /* =================================================
       CAMERA ROTATION
       ================================================= */
const updateCamera = () => {
  const camera = cameraRef.current;

  if (!camera) return;

  const distance = Math.max(
    15,
    Math.min(100, zoomRef.current)
  );

  const rx = dragRef.current.rotX;
  const ry = dragRef.current.rotY;

  const target = cameraTargetRef.current;

  camera.position.set(
    target.x +
      Math.sin(ry) *
        Math.cos(rx) *
        distance,

    target.y +
      Math.sin(rx) *
        distance,

    target.z +
      Math.cos(ry) *
        Math.cos(rx) *
        distance
  );

  /* Keep zoom consistent with camera distance */

  camera.zoom = 1;

  camera.updateProjectionMatrix();

  camera.lookAt(
    target.x,
    target.y,
    target.z
  );
};

updateCameraRef.current = updateCamera;
    updateCamera();

    /* =================================================
       POINTER DRAG
       ================================================= */

    const pointerDown = (event) => {
      dragRef.current.active =
        true;

      dragRef.current.x =
        event.clientX;

      dragRef.current.y =
        event.clientY;
    };

    const pointerMove = (event) => {
      if (
        !dragRef.current.active
      ) {
        return;
      }

      const dx =
        event.clientX -
        dragRef.current.x;

      const dy =
        event.clientY -
        dragRef.current.y;

      dragRef.current.x =
        event.clientX;

      dragRef.current.y =
        event.clientY;

      dragRef.current.rotY -=
        dx * 0.006;

      dragRef.current.rotX +=
        dy * 0.004;

      dragRef.current.rotX =
        Math.max(
          0.38,
          Math.min(
            0.95,
            dragRef.current.rotX
          )
        );

      updateCamera();
    };

    const pointerUp = () => {
      dragRef.current.active =
        false;
    };

  const wheel = (event) => {
  event.preventDefault();

  const direction =
    event.deltaY > 0 ? 1 : -1;

  zoomRef.current = Math.max(
    15,
    Math.min(
      100,
      zoomRef.current + direction * 4
    )
  );

  updateCameraRef.current?.();
};


    mount.addEventListener(
      "pointerdown",
      pointerDown
    );

    window.addEventListener(
      "pointermove",
      pointerMove
    );

    window.addEventListener(
      "pointerup",
      pointerUp
    );

    mount.addEventListener(
      "wheel",
      wheel,
      { passive: false }
    );

    /* =================================================
       RESIZE
       ================================================= */

    const resize = () => {
      if (!mount) return;

      const width =
        mount.clientWidth;

      const height =
        mount.clientHeight;

      if (!width || !height) {
        return;
      }

      const aspect =
        width / height;

      const size = 140;

      camera.left =
        (-size * aspect) / 2;

      camera.right =
        (size * aspect) / 2;

      camera.top =
        size / 2;

      camera.bottom =
        -size / 2;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height
      );
    };

    window.addEventListener(
      "resize",
      resize
    );

    resize();

    /* =================================================
       ANIMATION
       ================================================= */

    let animationId;

    const animate = () => {
      animationId =
        requestAnimationFrame(
          animate
        );

      const t =
        performance.now() *
        0.001;

      const riskValue =
        Math.max(
          0,
          Math.min(
            100,
            Number(
              riskValueRef.current
            ) || 0
          )
        );

      /* pulse epicenter */

      if (riskCoreRef.current) {
        const pulse =
          1 +
          Math.sin(t * 4) *
            0.13;

        riskCoreRef.current.scale.set(
          pulse,
          pulse,
          pulse
        );
      }

      /* cylinder breathing */

      if (
        riskCylinderRef.current
      ) {
        riskCylinderRef.current.scale.x =
          0.95 +
          Math.sin(t * 1.7) *
            0.04;

        riskCylinderRef.current.scale.z =
          0.95 +
          Math.sin(t * 1.7) *
            0.04;
      }

      /* beam pulse */

      if (beamRef.current) {
        beamRef.current.material.opacity =
          0.13 +
          Math.sin(t * 3) *
            0.05;
      }

      /* simulation movement */

      const hour =
        Number(
          hourRef.current
        ) || 0;

      risk.position.y =
        Math.sin(
          (t + hour) *
            0.7
        ) *
        0.15;

      /* subtle city motion */

      city.rotation.y =
        Math.sin(t * 0.08) *
        0.004;

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    /* =================================================
       CLEANUP
       ================================================= */

    return () => {
      cancelAnimationFrame(
        animationId
      );

      mount.removeEventListener(
        "pointerdown",
        pointerDown
      );

      mount.removeEventListener(
        "wheel",
        wheel
      );

      window.removeEventListener(
        "pointermove",
        pointerMove
      );

      window.removeEventListener(
        "pointerup",
        pointerUp
      );

      window.removeEventListener(
        "resize",
        resize
      );

      renderer.dispose();

      if (
        renderer.domElement &&
        mount.contains(
          renderer.domElement
        )
      ) {
        mount.removeChild(
          renderer.domElement
        );
      }

      scene.clear();
    };
  }, []);

  /* =====================================================
     SOS MARKERS
     ===================================================== */

  useEffect(() => {
    const group =
      sosRef.current;

    if (!group) return;

    while (
      group.children.length
    ) {
      group.remove(
        group.children[0]
      );
    }

    nearbyTwinSOS.forEach(
      (sos) => {
        if (
          sos.latitude == null ||
          sos.longitude == null
        ) {
          return;
        }

        const pos =
          geoToCity(
            sos.latitude,
            sos.longitude
          );

          if (!pos) return;

        const marker =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.45,
              20,
              20
            ),
            new THREE.MeshBasicMaterial({
              color: 0xff1f3d
            })
          );

        marker.position.set(
          pos.x,
          1.5,
          pos.z
        );

        group.add(marker);

        const ring =
          new THREE.Mesh(
            new THREE.RingGeometry(
              0.65,
              0.9,
              32
            ),
            new THREE.MeshBasicMaterial({
              color: 0xff2948,
              transparent: true,
              opacity: 0.7,
              side: THREE.DoubleSide
            })
          );

        ring.rotation.x =
          -Math.PI / 2;

        ring.position.set(
          pos.x,
          0.15,
          pos.z
        );

        group.add(ring);
      }
    );
  }, [
    nearbyTwinSOS,
    disasterLat,
    disasterLng
  ]);

  /* =====================================================
     RESOURCE MARKERS
     ===================================================== */

  useEffect(() => {
    const group =
      resourcesRef.current;

    if (!group) return;

    while (
      group.children.length
    ) {
      group.remove(
        group.children[0]
      );
    }

    twinResources.forEach(
      (resource) => {
        if (
          resource.latitude == null ||
          resource.longitude == null
        ) {
          return;
        }

        const pos =
          geoToCity(
            resource.latitude,
            resource.longitude
          );

          if (!pos) return;

        const marker =
          new THREE.Mesh(
            new THREE.BoxGeometry(
              1.5,
              1.5,
              1.5
            ),
            new THREE.MeshBasicMaterial({
              color: 0x22c55e
            })
          );

        marker.position.set(
          pos.x,
          1.0,
          pos.z
        );

        group.add(marker);

        const ring =
          new THREE.Mesh(
            new THREE.RingGeometry(
              1.5,
              1.8,
              32
            ),
            new THREE.MeshBasicMaterial({
              color: 0x22c55e,
              transparent: true,
              opacity: 0.65,
              side: THREE.DoubleSide
            })
          );

        ring.rotation.x =
          -Math.PI / 2;

        ring.position.set(
          pos.x,
          0.1,
          pos.z
        );

        group.add(ring);
      }
    );
  }, [
    twinResources,
    disasterLat,
    disasterLng
  ]);

  /* =====================================================
   ACTUAL ALERT MARKERS
   ===================================================== */

useEffect(() => {
  const group = alertsRef.current;

  if (!group) return;

  /* Remove old markers before rebuilding */

  while (group.children.length > 0) {
    const object = group.children[0];

    group.remove(object);

    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material) => {
          material.dispose();
        });
      }
    });
  }

  locatedAlerts.forEach((alert) => {
    const pos = geoToCity(
      alert.latitude,
      alert.longitude
    );

    if (!pos) return;

    const level = String(
      alert.severity || alert.level || ""
    ).toUpperCase();

    const color =
      level === "CRITICAL" || level === "RED"
        ? 0xff3b47
        : level === "WARNING" ||
          level === "HIGH" ||
          level === "ORANGE"
        ? 0xffa126
        : level === "WATCH" ||
          level === "MEDIUM" ||
          level === "YELLOW"
        ? 0xffd54a
        : 0x38bdf8;

    /* Vertical alert beacon */

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12,
        0.35,
        5,
        12,
        1,
        true
      ),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      })
    );

    beacon.position.set(
      pos.x,
      3.5,
      pos.z
    );

    beacon.userData.alertId = String(
      alert._id || alert.id || alert.title || ""
    );

    group.add(beacon);

    /* Main alert marker */

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(
        1.15,
        20,
        20
      ),
      new THREE.MeshBasicMaterial({
        color
      })
    );

    marker.position.set(
      pos.x,
      1.5,
      pos.z
    );

    marker.userData.alertId = String(
      alert._id || alert.id || alert.title || ""
    );

    group.add(marker);

    /* Ground ring */

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(
        1.5,
        2.1,
        32
      ),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    );

    ring.rotation.x = -Math.PI / 2;

    ring.position.set(
      pos.x,
      0.15,
      pos.z
    );

    ring.userData.alertId = String(
      alert._id || alert.id || alert.title || ""
    );

    group.add(ring);
  });

}, [alerts, mapCenterLat, mapCenterLng, geoScale]);

/* CLICK ALERT MARKER TO SHOW LOCATION */

useEffect(() => {
  const renderer = rendererRef.current;

  if (!renderer) return;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const handleMapClick = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const camera = cameraRef.current;
    const group = alertsRef.current;

    if (!camera || !group) return;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(
      group.children,
      true
    );

    const hit = hits.find(
      (item) => item.object.userData.alertId
    );

    if (!hit) return;

    const alertId = hit.object.userData.alertId;

    const alert = locatedAlerts.find(
      (item) =>
        String(item._id || item.id || item.title || "") ===
        alertId
    );

    if (!alert) {
      console.warn("Alert not found:", alertId);
      return;
    }

    setSelectedAlert(alert);

    getLocationName(
      alert.latitude,
      alert.longitude
    );
  };

  renderer.domElement.addEventListener(
    "click",
    handleMapClick
  );

  return () => {
    renderer.domElement.removeEventListener(
      "click",
      handleMapClick
    );
  };
}, [locatedAlerts]);
  /* =====================================================
     LAYER VISIBILITY
     ===================================================== */

  useEffect(() => {
    const groups = {
      buildings:
        cityRef.current,
      roads:
        roadsRef.current,
      risk:
        riskRef.current,
      sos:
        sosRef.current,
      resources:
        resourcesRef.current,
      alerts: 
      alertsRef.current,
    };

    Object.entries(groups).forEach(
      ([key, group]) => {
        if (!group) return;

        group.visible =
          twinLayer === "all" ||
          twinLayer === key;
      }
    );
  }, [twinLayer]);

  const safeRisk = Math.max(
    0,
    Math.min(
      100,
      Number(simulatedRisk) || 0
    )
  );

  const riskColor =
    safeRisk >= 75
      ? "#ef4444"
      : safeRisk >= 50
      ? "#f97316"
      : "#22c55e";

  const displayLat =
    Number.isFinite(
      Number(disasterLat)
    )
      ? Number(disasterLat).toFixed(4)
      : "28.6139";

  const displayLng =
    Number.isFinite(
      Number(disasterLng)
    )
      ? Number(disasterLng).toFixed(4)
      : "77.2090";


const getLocationName = async (lat, lng) => {
  try {
    setLocationLoading(true);
    setSelectedLocationName("Finding location...");

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );

    if (!response.ok) {
      throw new Error("Location lookup failed");
    }

    const data = await response.json();

    setSelectedLocationName(
      data.display_name || "Location name unavailable"
    );
  } catch (error) {
    console.error("Location lookup error:", error);
    setSelectedLocationName("Unable to fetch location name");
  } finally {
    setLocationLoading(false);
  }
};
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-orange-500/20 bg-[#020617]"
      style={{
        height: "560px",
        minHeight: "460px"
      }}
    >
      {/* THREE JS */}

      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{
          cursor: "grab",
          touchAction: "none"
        }}
      />

      {/* DARK VIGNETTE */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, transparent 35%, rgba(2,6,23,.55) 100%)"
        }}
      />

      {/* ALERT LOCATION SELECTOR */}

<div className="absolute left-4 top-[165px] z-10 w-64 max-w-[calc(100%-2rem)] rounded-xl border border-white/15 bg-black/85 p-3 backdrop-blur-md">
  <div className="mb-2 flex items-center justify-between">
    <span className="text-[10px] font-black tracking-widest text-red-400">
      LOCATED ALERTS
    </span>

    <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-300">
      {locatedAlerts.length}
    </span>
  </div>

  <div className="max-h-44 space-y-1 overflow-y-auto">
    {locatedAlerts.length === 0 ? (
      <p className="py-2 text-xs text-slate-400">
        No alerts have valid coordinates.
      </p>
    ) : (
      locatedAlerts.map((alert, index) => (
        <button
          key={alert._id || alert.id || index}
          type="button"
          onClick={() => focusAlert(alert)}
          className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-left transition hover:border-orange-400/60 hover:bg-orange-500/10"
        >
          <div className="truncate text-xs font-bold text-white">
            {alert.title ||
              `${alert.hazard || alert.type || "Disaster"} Alert`}
          </div>

          <div className="mt-1 truncate text-[10px] text-slate-400">
            {alert.location || "Location not specified"}
          </div>

          <div className="mt-1 text-[9px] text-orange-300">
            {Number(alert.latitude).toFixed(4)},{" "}
            {Number(alert.longitude).toFixed(4)}
          </div>
        </button>
      ))
    )}
  </div>
</div>

{/* SELECTED ALERT DETAILS */}

{selectedAlert && (
  <div className="absolute bottom-4 left-4 z-50 w-[min(340px,90%)] rounded-2xl border border-red-400/40 bg-slate-950/95 p-5 text-white shadow-2xl">

    <button
      onClick={() => setSelectedAlert(null)}
      className="float-right rounded-lg px-2 py-1 text-gray-400 hover:bg-white/10"
    >
      ✕
    </button>

    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400">
      Selected Disaster Alert
    </div>

    <h3 className="mb-2 text-lg font-black">
      {selectedAlert.title ||
        selectedAlert.disasterType ||
        selectedAlert.type ||
        "Disaster Alert"}
    </h3>

    <p className="mb-3 text-sm text-slate-300">
      📍 {locationLoading
        ? "Finding location..."
        : selectedLocationName || "Location not loaded"}
    </p>

    <div className="space-y-2 text-sm">
      <p>
        <span className="text-slate-400">Latitude: </span>
        {selectedAlert.latitude}
      </p>

      <p>
        <span className="text-slate-400">Longitude: </span>
        {selectedAlert.longitude}
      </p>

      <p>
        <span className="text-slate-400">Severity: </span>
        {selectedAlert.severity ||
          selectedAlert.level ||
          "Unknown"}
      </p>

      <p>
        <span className="text-slate-400">Status: </span>
        {selectedAlert.status || "Unknown"}
      </p>
    </div>
  </div>
)}

      {/* TOP LEFT INFO */}

      <div className="absolute left-4 top-4 max-w-[320px] rounded-xl border border-red-500/40 bg-black/80 px-4 py-3 backdrop-blur-md">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

          <span className="text-[10px] font-black tracking-[0.18em] text-red-400">
            DIGITAL TWIN • 3D LIVE
          </span>
        </div>

        <div className="text-sm font-black text-white">
          {hazardName}
        </div>

        <div className="mt-1 text-[11px] font-medium text-slate-400">
          {hazardLocation}
        </div>

        <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Severity:{" "}
          <span className="text-orange-400">
            {severity}
          </span>
        </div>
      </div>

      {/* TOP RIGHT RISK */}

      <div className="absolute right-4 top-4 w-[125px] rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-center backdrop-blur-md">
        <div className="text-[9px] font-black tracking-[0.18em] text-slate-500">
          LIVE RISK
        </div>

        <div
          className="mt-1 text-3xl font-black"
          style={{
            color: riskColor
          }}
        >
          {safeRisk}%
        </div>

        <div className="text-[9px] font-black uppercase text-slate-500">
          {safeRisk >= 75
            ? "CRITICAL"
            : safeRisk >= 50
            ? "HIGH"
            : "MODERATE"}
        </div>
      </div>

      {/* BOTTOM LEFT COORDINATES */}

      <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-md">
        <div className="text-[10px] font-bold tracking-wider text-slate-400">
          LAT{" "}
          <span className="text-white">
            {displayLat}
          </span>

          <span className="mx-2 text-slate-600">
            •
          </span>

          LNG{" "}
          <span className="text-white">
            {displayLng}
          </span>
        </div>
      </div>

      {/* BOTTOM RIGHT LEGEND */}

      <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
        <div className="mb-2 text-[9px] font-black tracking-[0.18em] text-slate-500">
          LIVE LAYERS
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Risk Zone
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            SOS
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Resources
          </div>
        </div>
      </div>

      {/* LIVE INDICATOR */}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-orange-500/20 bg-black/70 px-3 py-1.5 text-[9px] font-black tracking-widest text-orange-400 backdrop-blur-md">
        ● LIVE DIGITAL TWIN
      </div>
    </div>
  );
}

function RiskCommandCenter({ risk, resources, setActivePage }) {
  const [simRainfall, setSimRainfall] = React.useState(89);
  const [simRiver, setSimRiver] = React.useState(76);

  const rainfall = 89;
  const riverLevel = 76;
  const soilMoisture = 68;
  const wind = 64;

  const baseRisk = Number(risk?.probability) || 64;

  // -----------------------------
  // DISASTER RISK ENGINE
  // -----------------------------

  const floodRisk = Math.min(
    100,
    Math.round(rainfall * 0.45 + riverLevel * 0.4 + soilMoisture * 0.15)
  );

  const landslideRisk = Math.min(
    100,
    Math.round(soilMoisture * 0.65 + rainfall * 0.25 + riverLevel * 0.1)
  );

  const stormRisk = Math.min(
    100,
    Math.round(wind * 0.7 + rainfall * 0.2 + riverLevel * 0.1)
  );

  const fireRisk = Math.min(
    100,
    Math.max(
      15,
      Math.round(
        100 -
          soilMoisture * 0.55 -
          rainfall * 0.25 +
          wind * 0.2
      )
    )
  );

  const threats = [
    {
      name: "FLOOD",
      value: floodRisk,
      icon: "≈",
      reason: "Rainfall + river elevation",
    },
    {
      name: "LANDSLIDE",
      value: landslideRisk,
      icon: "△",
      reason: "Soil saturation detected",
    },
    {
      name: "STORM",
      value: stormRisk,
      icon: "↯",
      reason: "Wind activity increasing",
    },
    {
      name: "FIRE",
      value: fireRisk,
      icon: "◇",
      reason: "Dryness / wind conditions",
    },
  ].sort((a, b) => b.value - a.value);

  // -----------------------------
  // WHAT-IF SIMULATION
  // -----------------------------

  const simulatedRisk = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        baseRisk +
          (simRainfall - rainfall) * 0.18 +
          (simRiver - riverLevel) * 0.22
      )
    )
  );

  const getLevel = (value) => {
    if (value >= 80) return "CRITICAL";
    if (value >= 60) return "HIGH";
    if (value >= 40) return "MODERATE";
    return "LOW";
  };

  const getRiskClass = (value) => {
    if (value >= 80) return "text-red-400";
    if (value >= 60) return "text-orange-400";
    if (value >= 40) return "text-yellow-300";
    return "text-green-400";
  };

  // -----------------------------
  // 24 HOUR FORECAST
  // -----------------------------

  const forecast = [
    simulatedRisk,
    Math.min(100, simulatedRisk + 3),
    Math.min(100, simulatedRisk + 7),
    Math.min(100, simulatedRisk + 11),
    Math.min(100, simulatedRisk + 15),
  ];

  const highestThreat = threats[0];

  const teams =
    resources?.filter(
      (item) => item.type?.toLowerCase() === "rescue team"
    ).length || 0;

  const ambulances =
    resources?.filter(
      (item) => item.type?.toLowerCase() === "ambulance"
    ).length || 0;

  const shelters =
    resources?.filter(
      (item) => item.type?.toLowerCase() === "shelter"
    ).length || 0;

  // -----------------------------
  // AI SITUATION BRIEF
  // -----------------------------

  let situationText = "";

  if (highestThreat.name === "FLOOD") {
    situationText =
      "Flood conditions are currently the dominant threat. Elevated rainfall and river levels indicate increasing water-related exposure.";
  } else if (highestThreat.name === "LANDSLIDE") {
    situationText =
      "Landslide probability is elevated. High soil moisture combined with rainfall may destabilize vulnerable terrain.";
  } else if (highestThreat.name === "STORM") {
    situationText =
      "Storm activity is showing elevated potential. Strong wind conditions may increase infrastructure and mobility risks.";
  } else {
    situationText =
      "Fire probability is elevated due to environmental dryness and wind conditions. High-risk areas should remain under observation.";
  }

  return (
    <section className="min-h-screen bg-[#05080d] text-white p-4 md:p-7">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-5 mb-6">

        <div>
          <div className="flex items-center gap-3 mb-2">

            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

            <span className="text-[11px] tracking-[0.3em] text-cyan-400 font-mono">
              AI EMERGENCY COMMAND CENTER
            </span>

          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Risk Intelligence
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Predictive disaster monitoring & decision support engine
          </p>
        </div>

        <div className="flex items-center gap-5 mt-5 md:mt-0">

          <div className="text-right">
            <p className="text-[10px] text-gray-600 font-mono">
              ENGINE STATUS
            </p>

            <p className="text-sm text-green-400 font-mono">
              ● ONLINE
            </p>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <p className="text-[10px] text-gray-600 font-mono">
              MODEL
            </p>

            <p className="text-sm text-gray-300 font-mono">
              PREDICT-X / 01
            </p>
          </div>

        </div>
      </div>


      {/* =====================================================
          MAIN COMMAND GRID
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.6fr] gap-5">

        {/* ===================================================
            THREAT INTELLIGENCE
        =================================================== */}

        <div className="border border-white/10 bg-[#080c12]">

          <div className="px-5 py-4 border-b border-white/10 flex justify-between">

            <div>
              <p className="text-[10px] text-cyan-400 tracking-[0.2em] font-mono">
                THREAT INTELLIGENCE
              </p>

              <h2 className="text-lg font-semibold mt-1">
                Active Threat Matrix
              </h2>
            </div>

            <span className="text-[10px] text-gray-600 font-mono">
              LIVE
            </span>

          </div>


          <div className="p-5">

            <div className="mb-6">

              <p className="text-[10px] text-gray-600 font-mono mb-2">
                PRIMARY THREAT
              </p>

              <div className="flex items-end gap-4">

                <span className="text-5xl font-black text-orange-400">
                  {highestThreat.value}
                </span>

                <div className="pb-1">

                  <p className="text-xl font-bold">
                    {highestThreat.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {highestThreat.reason}
                  </p>

                </div>

              </div>

            </div>


            {/* Threat list */}

            <div className="border-t border-white/10">

              {threats.map((threat, index) => (

                <div
                  key={threat.name}
                  className="grid grid-cols-[35px_1fr_60px] items-center py-4 border-b border-white/5"
                >

                  <span className="font-mono text-xs text-gray-600">
                    0{index + 1}
                  </span>

                  <div className="flex items-center gap-3">

                    <span className="text-cyan-400 text-xl">
                      {threat.icon}
                    </span>

                    <div>
                      <p className="text-sm font-semibold">
                        {threat.name}
                      </p>

                      <p className="text-[10px] text-gray-600">
                        {threat.reason}
                      </p>
                    </div>

                  </div>

                  <div className="text-right">

                    <span
                      className={`text-lg font-bold ${getRiskClass(
                        threat.value
                      )}`}
                    >
                      {threat.value}
                    </span>

                    <p className="text-[9px] text-gray-600">
                      {getLevel(threat.value)}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>
        </div>


        {/* ===================================================
            24 HOUR FORECAST
        =================================================== */}

        <div className="border border-white/10 bg-[#080c12]">

          <div className="px-5 py-4 border-b border-white/10 flex justify-between">

            <div>

              <p className="text-[10px] text-cyan-400 tracking-[0.2em] font-mono">
                TEMPORAL ANALYSIS
              </p>

              <h2 className="text-lg font-semibold mt-1">
                Next 24 Hours
              </h2>

            </div>

            <div className="text-right">

              <p className="text-[10px] text-gray-600 font-mono">
                TREND
              </p>

              <p className="text-sm text-orange-400 font-mono">
                ↑ ESCALATING
              </p>

            </div>

          </div>


          <div className="p-6">

            {/* chart */}

            <div className="relative h-[260px] border-l border-b border-white/10">

              {/* horizontal grid */}

              {[20, 40, 60, 80].map((line) => (

                <div
                  key={line}
                  className="absolute left-0 right-0 border-t border-white/5"
                  style={{
                    bottom: `${line}%`,
                  }}
                />

              ))}


              {/* SVG forecast */}

              <svg
                viewBox="0 0 500 200"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >

                <polyline
                  points={forecast
                    .map((value, index) => {
                      const x = 25 + index * 112;
                      const y = 180 - value * 1.55;
                      return `${x},${Math.max(15, y)}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-cyan-400"
                />

                {forecast.map((value, index) => {

                  const x = 25 + index * 112;
                  const y = Math.max(15, 180 - value * 1.55);

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#05080d"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-cyan-400"
                    />
                  );

                })}

              </svg>


              {/* labels */}

              <div className="absolute left-0 right-0 bottom-[-28px] flex justify-between px-3">

                {["+0H", "+6H", "+12H", "+18H", "+24H"].map(
                  (time) => (

                    <span
                      key={time}
                      className="text-[10px] text-gray-600 font-mono"
                    >
                      {time}
                    </span>

                  )
                )}

              </div>

            </div>


            <div className="grid grid-cols-5 gap-2 mt-12">

              {forecast.map((value, index) => (

                <div
                  key={index}
                  className="text-center border-t border-white/10 pt-3"
                >

                  <p className="text-lg font-bold">
                    {value}
                  </p>

                  <p
                    className={`text-[9px] font-mono ${getRiskClass(
                      value
                    )}`}
                  >
                    {getLevel(value)}
                  </p>

                </div>

              ))}

            </div>

          </div>
        </div>

      </div>


      {/* =====================================================
          LIVE SENSOR TELEMETRY
      ===================================================== */}

      <div className="mt-5 border border-white/10 bg-[#080c12]">

        <div className="px-5 py-3 border-b border-white/10">

          <span className="text-[10px] text-cyan-400 tracking-[0.2em] font-mono">
            LIVE ENVIRONMENTAL TELEMETRY
          </span>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">

          {[
            ["RAINFALL", rainfall, "mm/h"],
            ["RIVER LEVEL", riverLevel, "%"],
            ["SOIL MOISTURE", soilMoisture, "%"],
            ["WIND ACTIVITY", wind, "km/h"],
          ].map(([label, value, unit], index) => (

            <div
              key={label}
              className={`p-5 ${
                index !== 3 ? "border-r border-white/10" : ""
              }`}
            >

              <p className="text-[10px] text-gray-600 font-mono">
                {label}
              </p>

              <div className="flex items-end gap-2 mt-2">

                <span className="text-3xl font-bold">
                  {value}
                </span>

                <span className="text-xs text-gray-600 mb-1">
                  {unit}
                </span>

              </div>

              <div className="mt-3 h-[2px] bg-white/5">

                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* =====================================================
          AI SITUATION BRIEF
      ===================================================== */}

      <div className="mt-5 border border-cyan-400/20 bg-[#071016]">

        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_auto]">

          <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/10">

            <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em]">
              AI ANALYSIS
            </p>

            <p className="text-2xl font-bold mt-3">
              SITUATION
              <br />
              BRIEF
            </p>

          </div>


          <div className="p-6">

            <div className="flex items-center gap-3 mb-3">

              <span className="text-orange-400 text-xl">
                ⚠
              </span>

              <h3 className="text-lg font-bold">
                {highestThreat.name} RISK ESCALATING
              </h3>

            </div>

            <p className="text-sm text-gray-400 max-w-3xl leading-7">
              {situationText}
            </p>

            <p className="text-[10px] text-gray-600 font-mono mt-4">
              GENERATED FROM ENVIRONMENTAL TELEMETRY + RISK ENGINE
            </p>

          </div>


          <div className="p-6 flex flex-col gap-2 justify-center">

            <button
              onClick={() => setActivePage("map")}
              className="px-5 py-2 border border-cyan-400/30 text-cyan-400 text-xs font-mono hover:bg-cyan-400/10 transition"
            >
              VIEW AFFECTED ZONES →
            </button>

            <button
              onClick={() => setActivePage("resources")}
              className="px-5 py-2 border border-white/10 text-gray-400 text-xs font-mono hover:bg-white/5 transition"
            >
              OPEN RESPONSE COMMAND →
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          RESPONSE + WHAT IF
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">


        {/* RESPONSE READINESS */}

        <div className="border border-white/10 bg-[#080c12]">

          <div className="px-5 py-4 border-b border-white/10">

            <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em]">
              RESPONSE READINESS
            </p>

            <h2 className="text-lg font-semibold mt-1">
              Emergency Capacity
            </h2>

          </div>


          <div className="grid grid-cols-3">

            {[
              ["RESCUE TEAMS", teams],
              ["AMBULANCES", ambulances],
              ["SHELTERS", shelters],
            ].map(([name, value]) => (

              <div
                key={name}
                className="p-5 border-r border-white/10 last:border-r-0"
              >

                <p className="text-[10px] text-gray-600 font-mono">
                  {name}
                </p>

                <p className="text-3xl font-bold mt-3">
                  {value}
                </p>

                <p className="text-[9px] text-green-400 font-mono mt-2">
                  AVAILABLE
                </p>

              </div>

            ))}

          </div>

        </div>


        {/* WHAT IF LAB */}

        <div className="border border-white/10 bg-[#080c12]">

          <div className="px-5 py-4 border-b border-white/10">

            <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em]">
              SCENARIO LAB
            </p>

            <h2 className="text-lg font-semibold mt-1">
              What-if Simulation
            </h2>

          </div>


          <div className="p-5">

            {/* rainfall */}

            <div className="mb-5">

              <div className="flex justify-between mb-2">

                <span className="text-xs text-gray-400">
                  Rainfall intensity
                </span>

                <span className="text-xs font-mono text-cyan-400">
                  {simRainfall}
                </span>

              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={simRainfall}
                onChange={(e) =>
                  setSimRainfall(Number(e.target.value))
                }
                className="w-full accent-cyan-400"
              />

            </div>


            {/* river */}

            <div className="mb-5">

              <div className="flex justify-between mb-2">

                <span className="text-xs text-gray-400">
                  River level
                </span>

                <span className="text-xs font-mono text-cyan-400">
                  {simRiver}
                </span>

              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={simRiver}
                onChange={(e) =>
                  setSimRiver(Number(e.target.value))
                }
                className="w-full accent-cyan-400"
              />

            </div>


            <div className="flex items-center justify-between border-t border-white/10 pt-4">

              <div>

                <p className="text-[10px] text-gray-600 font-mono">
                  PROJECTED RISK
                </p>

                <p
                  className={`text-4xl font-black ${getRiskClass(
                    simulatedRisk
                  )}`}
                >
                  {simulatedRisk}
                </p>

              </div>

              <div className="text-right">

                <p
                  className={`text-sm font-bold ${getRiskClass(
                    simulatedRisk
                  )}`}
                >
                  {getLevel(simulatedRisk)}
                </p>

                <p className="text-[9px] text-gray-600 font-mono mt-1">
                  REAL-TIME MODEL OUTPUT
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          FOOTER STATUS
      ===================================================== */}

      <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-white/10">

        <span className="text-[9px] text-gray-600 font-mono">
          DATA STREAM: ACTIVE
        </span>

        <span className="text-[9px] text-gray-600 font-mono">
          PREDICTION WINDOW: 24H
        </span>

        <span className="text-[9px] text-gray-600 font-mono">
          THREATS MONITORED: 04
        </span>

        <span className="text-[9px] text-gray-600 font-mono">
          ENGINE: PREDICT-X
        </span>

      </div>

    </section>
  );
}


function App() {
  const [disasters, setDisasters] = useState([]);
  const [resources, setResources] = useState([]);
  const [risk, setRisk] = useState(null);
  const [aiPrediction, setAIPrediction] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
const [latestAlert, setLatestAlert] = useState(null);
  const [aiRisk, setAiRisk] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
const [locationStatus, setLocationStatus] = useState("Detecting...");

  const [resourcePlan, setResourcePlan] = useState(null);
  const [scenarioMode, setScenarioMode] = useState(false);
const [scenarioRadius, setScenarioRadius] = useState(5);
  const [selectedEvacuationAlert, setSelectedEvacuationAlert] = useState(null);
  const [selectedMapAlert, setSelectedMapAlert] = useState(null);
const [evacuationMode, setEvacuationMode] = useState(false);
  const [simulationRadius, setSimulationRadius] = useState(5);
const [simulationActive, setSimulationActive] = useState(false);
const [dataSources, setDataSources] = useState([]);
const [alertLoading, setAlertLoading] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [reportSearch, setReportSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [resourceStatus, setResourceStatus] = useState("all");
  const [resourceSearched, setResourceSearched] = useState(false);
  const [filteredResourceCount, setFilteredResourceCount] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resourceTargetReport, setResourceTargetReport] = useState(null);
  const [resourceTargetAlert, setResourceTargetAlert] = useState(null);
  const [twinDisaster, setTwinDisaster] = useState("Flood");
  const [twinSeverity, setTwinSeverity] = useState("High");
  const [twinRadius, setTwinRadius] = useState(5);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [twinLocation, setTwinLocation] = useState("");
  

  const lastAlertIdRef = useRef(null);
const initializedAlertsRef = useRef(false);
const audioContextRef = useRef(null);

const [nearbyAlerts, setNearbyAlerts] = useState([]);
const [nearbyResources, setNearbyResources] = useState([]);
const [nearbyResourceLoading, setNearbyResourceLoading] = useState(false);
const [resourceRadius, setResourceRadius] = useState(10);
const [resourceCenter, setResourceCenter] = useState(null);
const [deploymentPlan, setDeploymentPlan] = useState(null);
const [deploymentLoading, setDeploymentLoading] = useState(false);
const [nearestResource, setNearestResource] = useState(null);
const [contactMessage, setContactMessage] = useState("");
const [showResourceMap, setShowResourceMap] = useState(false);
const [deploymentStatuses, setDeploymentStatuses] = useState({});
const [sosStatus, setSosStatus] = useState("");
const [sosLoading, setSosLoading] = useState(false);
const [sosReports, setSosReports] = useState([]);
const [twinSimulation, setTwinSimulation] = useState(0);
const [twinLayer, setTwinLayer] = useState("all");
const [twinHour, setTwinHour] = useState(0);
const [priorityDisaster, setPriorityDisaster] = useState(null);
const twinCanvasRef = useRef(null);
const [simRainfall, setSimRainfall] = useState(89);
const [simRiver, setSimRiver] = useState(76);
const [mapFilter, setMapFilter] = React.useState("all");
const [mapSearch, setMapSearch] = React.useState("");
const [showCriticalOnly, setShowCriticalOnly] = React.useState(false);






const fetchAlerts = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/alerts"
    );

    console.log("🚨 ALERTS FROM BACKEND:", response.data);

    setAlerts(response.data || []);

  } catch (error) {
    console.error(
      "❌ Failed to fetch alerts:",
      error.response?.data || error.message
    );

    setAlerts([]);
  }
};
const selectPriorityResourceTarget = () => {
  // 1️⃣ Official alerts ko priority do
  if (Array.isArray(alerts) && alerts.length > 0) {

    const severityRank = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      INFO: 0
    };

    const sortedAlerts = [...alerts]
      .filter((alert) => alert)
      .sort((a, b) => {
        const aSeverity =
          severityRank[String(a.severity || "INFO").toUpperCase()] ?? 0;

        const bSeverity =
          severityRank[String(b.severity || "INFO").toUpperCase()] ?? 0;

        return bSeverity - aSeverity;
      });

    const priorityAlert = sortedAlerts[0];

    if (priorityAlert) {
      setResourceTargetAlert(priorityAlert);
      setResourceTargetReport(null);
      return;
    }
  }

  // 2️⃣ Agar official alert nahi hai,
  //    to user reports me highest severity choose karo
  if (Array.isArray(disasters) && disasters.length > 0) {

    const severityRank = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      INFO: 0
    };

    const sortedReports = [...disasters]
      .filter((report) => report)
      .sort((a, b) => {
        const aSeverity =
          severityRank[String(a.severity || "LOW").toUpperCase()] ?? 1;

        const bSeverity =
          severityRank[String(b.severity || "LOW").toUpperCase()] ?? 1;

        return bSeverity - aSeverity;
      });

    const priorityReport = sortedReports[0];

    if (priorityReport) {
      setResourceTargetReport(priorityReport);
      setResourceTargetAlert(null);
      return;
    }
  }

  // 3️⃣ Kuch bhi available nahi hai
  setResourceTargetAlert(null);
  setResourceTargetReport(null);
};

useEffect(() => {
  if (!userLocation || !alerts || alerts.length === 0) {
    setNearbyAlerts([]);
    return;
  }
  
  
  


  const nearby = alerts.filter((alert) => {
    if (
      alert.latitude == null ||
      alert.longitude == null
    ) {
      return false;
    }

    const lat1 = userLocation.latitude;
    const lon1 = userLocation.longitude;

    const lat2 = Number(alert.latitude);
    const lon2 = Number(alert.longitude);

    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) / 180;

    const dLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const distance =
      2 *
      R *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return distance <= 50;
  });

  setNearbyAlerts(nearby);
  console.log(
  "🚨 NEARBY ALERT DETAILS:",
  nearby[0]
);

  console.log(
    "📍 NEARBY ALERTS:",
    nearby.length
  );
}, [userLocation, alerts]);


useEffect(() => {
  if (!("geolocation" in navigator)) {
    setLocationStatus("Not supported");
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setUserLocation({
        latitude,
        longitude,
        accuracy
      });

      setLocationStatus("LIVE");

      console.log("📍 LIVE USER LOCATION:", {
        latitude,
        longitude,
        accuracy
      });
    },

    (error) => {
      console.error(
        "📍 Location error:",
        error.message
      );

      setLocationStatus("Permission denied");
    },

    {
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 30000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, []);

const handleSOS = () => {
  if (!navigator.geolocation) {
    setSosStatus("❌ GPS is not supported on this device.");
    return;
  }

  setSosLoading(true);
  setSosStatus("📍 Getting your location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationAccuracy = position.coords.accuracy;

        const sosData = {
          latitude,
          longitude,
          locationAccuracy,
          createdAt: new Date().toISOString(),
          status: "active"
        };

        console.log("🚨 SOS DATA:", sosData);

        const response = await axios.post(
          "http://localhost:5000/api/sos",
          sosData
        );

        console.log("🚨 SOS RESPONSE:", response.data);

       setSosStatus("🚨 SOS Alert Sent Successfully!");
setSosLoading(false);

try {
  const sosResponse = await axios.get(
    "http://localhost:5000/api/sos"
  );

  console.log("🚨 SOS ALERTS:", sosResponse.data);

  setSosReports(
    Array.isArray(sosResponse.data)
      ? sosResponse.data
      : sosResponse.data.sosReports || sosResponse.data.sos || []
  );

} catch (fetchError) {
  console.error(
    "❌ SOS fetch error:",
    fetchError.response?.data || fetchError.message
  );
}
      } catch (error) {
        console.error(
          "❌ SOS submission error:",
          error.response?.data || error.message
        );

        setSosStatus(
          error.response?.data?.message ||
          "❌ Failed to send SOS alert."
        );

        setSosLoading(false);
      }
    },

    (error) => {
      console.error("❌ GPS ERROR:", error);

      let message = "❌ Unable to get your location.";

      if (error.code === 1) {
        message =
          "❌ Location permission denied. Please allow location access.";
      } else if (error.code === 2) {
        message =
          "❌ Location unavailable. Please turn on GPS/location.";
      } else if (error.code === 3) {
        message =
          "❌ Location request timed out. Try again.";
      }

      setSosStatus(message);
      setSosLoading(false);
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
};
const updateSOSStatus = async (sosId, status) => {
  try {
    await axios.patch(
      `http://localhost:5000/api/sos/${sosId}`,
      { status }
    );

    setSosStatus(
      status === "RESPONDING"
        ? "🚑 SOS marked as RESPONDING."
        : "✅ SOS marked as RESOLVED."
    );

    fetchSOSReports();

  } catch (error) {
    console.error("SOS status update failed:", error);

    setSosStatus(
      "❌ Failed to update SOS status."
    );
  }
};

useEffect(() => {
  const syncOfflineSOS = async () => {
    const queuedSOS =
      JSON.parse(
        localStorage.getItem("disasterXSOSQueue") || "[]"
      );

    if (queuedSOS.length === 0) return;

    const remainingSOS = [];

    for (const sos of queuedSOS) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/sos",
          sos
        );

        if (!response.data.success) {
          remainingSOS.push(sos);
        }
      } catch (error) {
        console.error("Offline SOS sync failed:", error);
        remainingSOS.push(sos);
      }
    }

    localStorage.setItem(
      "disasterXSOSQueue",
      JSON.stringify(remainingSOS)
    );

    if (queuedSOS.length > 0 && remainingSOS.length === 0) {
      setSosStatus(
        "🌐 Internet restored — offline SOS synced successfully."
      );

      fetchSOSReports();
    }
  };

  window.addEventListener("online", syncOfflineSOS);

  if (navigator.onLine) {
    syncOfflineSOS();
  }

  return () => {
    window.removeEventListener("online", syncOfflineSOS);
  };
}, []);

const playAlertSound = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      console.log("AudioContext not supported");
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current =
        new AudioContext();
    }

    const audioContext =
      audioContextRef.current;

    const playSound = () => {
      console.log("🔊 PLAY SOUND FUNCTION RUNNING");
      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.type = "square";

      oscillator.frequency.setValueAtTime(
        1000,
        audioContext.currentTime
      );

      gainNode.gain.setValueAtTime(
        0.4,
        audioContext.currentTime
      );

      oscillator.connect(gainNode);

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 1
      );
    };

    if (
      audioContext.state === "suspended"
    ) {
      audioContext.resume().then(() => {
        playSound();
      });
    } else {
      playSound();
    }

  } catch (error) {
    console.error(
      "Alert sound failed:",
      error
    );
  }
};

useEffect(() => {
  const unlockAudio = () => {
    try {
      if ("Notification" in window) {
  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("🔔 Notification permission:", permission);
    });
  }
}
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return;

      if (!audioContextRef.current) {
        audioContextRef.current =
          new AudioContext();
      }

      const audioContext =
        audioContextRef.current;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      console.log(
        "🔊 Audio unlocked:",
        audioContext.state
      );

    } catch (error) {
      console.error(
        "Audio unlock failed:",
        error
      );
    }
  };

  window.addEventListener(
    "click",
    unlockAudio,
    { once: true }
  );

  return () => {
    window.removeEventListener(
      "click",
      unlockAudio
    );
  };
}, []);
   
    


  useEffect(() => {
    fetchDisasterData();
    fetchAlerts();
  }, []);


  useEffect(() => {

  fetchIntelligenceData();

  const interval = setInterval(() => {
    fetchIntelligenceData();
  }, 60000);

  return () => clearInterval(interval);

}, []);
  

  const fetchDisasterData = async () => {
    try {

      const disasterResponse = await axios.get(
  "http://localhost:5000/api/disasters"
);


setDisasters(disasterResponse.data);


setRisk(calculateRisk(disasterResponse.data));
setAIPrediction(getAIPrediction(disasterResponse.data));

setLoading(false);
    } catch (error) {
      console.error("Backend connection failed:", error);
      setLoading(false);
    }
  };

  const fetchNearbyRealResources = async (
  latitude,
  longitude
) => {
  try {
    if (
      latitude == null ||
      longitude == null
    ) {
      return;
    }

    setNearbyResourceLoading(true);

    setResourceCenter({
      latitude,
      longitude
    });

    const response = await axios.get(
      "http://localhost:5000/api/intelligence/nearby-resources",
      {
        params: {
          lat: latitude,
          lng: longitude,
          radius: resourceRadius * 1000
        }
      }
    );

    setNearbyResources(
      response.data?.resources || []
    );

    console.log(
      "🌍 REAL NEARBY RESOURCES:",
      response.data
    );

    } catch (error) {
  console.error(
    "❌ Nearby resource error:",
    error.response?.data || error.message
  );

  setNearbyResources([]);
} finally {

    setNearbyResources([]);



    setNearbyResourceLoading(false);

  }
};


const fetchResources = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/resources"
    );

    setResources(response.data);

    console.log("Actual resources:", response.data);
  } catch (error) {
    console.error("Resources load failed:", error);
    setResources([]);
  }
};

const resourceStats = {
  hospitals: resources.filter(
    item => item.type?.toLowerCase() === "hospital"
  ).length,

  shelters: resources.filter(
    item => item.type?.toLowerCase() === "shelter"
  ).length,

  rescueTeams: resources.filter(
    item => item.type?.toLowerCase() === "rescue team"
  ).length,

  rescueVehicles: resources.filter(
    item => item.type?.toLowerCase() === "rescue vehicle"
  ).length,

  ambulances: resources.filter(
    item => item.type?.toLowerCase() === "ambulance"
  ).length,

  fireStations: resources.filter(
    item => item.type?.toLowerCase() === "fire station"
  ).length,

  policeStations: resources.filter(
    item => item.type?.toLowerCase() === "police station"
  ).length,

  available: resources.filter(
    item => item.status?.toLowerCase() === "available"
  ).length,

  busy: resources.filter(
    item => item.status?.toLowerCase() === "busy"
  ).length,

  unavailable: resources.filter(
    item => item.status?.toLowerCase() === "unavailable"
  ).length
};
const resourceAvailability =
  resources.length > 0
    ? Math.round(
        (resourceStats.available / resources.length) * 100
      )
    : 0;

    const priorityAlert = [...alerts]
  .sort((a, b) => {
    const score = {
      critical: 4,
      warning: 3,
      alert: 2,
      info: 1
    };

    return (
      (score[String(b.severity || "").toLowerCase()] || 0) -
      (score[String(a.severity || "").toLowerCase()] || 0)
    );
  })[0] || null;


const fetchNearbyResources = async (latitude, longitude, radiusKm = 10) => {
  try {
    if (
      latitude == null ||
      longitude == null
    ) {
      return;
    }

    setNearbyResourceLoading(true);

    const response = await axios.get(
      "http://localhost:5000/api/intelligence/nearby-resources",
      {
        params: {
          lat: latitude,
          lng: longitude,
          radius: radiusKm * 1000
        }
      }
    );

    setNearbyResources(response.data.resources || []);

    setResourceCenter({
      latitude,
      longitude
    });

  } catch (error) {
    console.error(
      "Nearby resources error:",
      error
    );

    setNearbyResources([]);
  } finally {
    setNearbyResourceLoading(false);
  }
};

const fetchDeploymentPlan = async () => {
  try {
    setDeploymentLoading(true);

    const response = await axios.get(
      "http://localhost:5000/api/intelligence/resource-deployment"
    );

    setDeploymentPlan(response.data);

  } catch (error) {
    console.error(
      "Deployment plan error:",
      error
    );

    setDeploymentPlan(null);

  } finally {
    setDeploymentLoading(false);
  }
};
const fetchReportDeploymentPlan = async () => {
  try {

    if (!resourceTargetReport?._id) {
      console.log("No report selected");
      return;
    }

    setDeploymentLoading(true);

    const response = await axios.get(
      "http://localhost:5000/api/intelligence/report-deployment",
      {
        params: {
          reportId: resourceTargetReport._id
        }
      }
    );

    setDeploymentPlan(response.data);

  } catch (error) {

    console.error(
      "Report deployment error:",
      error
    );

    setDeploymentPlan(null);

  } finally {

    setDeploymentLoading(false);

  }
};

const openResourceRoute = (resource) => {
  if (!resource?.latitude || !resource?.longitude) {
    alert("Route location is not available for this resource.");
    return;
  }

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${resource.latitude},${resource.longitude}`;

  window.open(url, "_blank");
};

const callResource = async (resource) => {
  const phone =
    resource?.phone ||
    resource?.contact;

  if (!phone) {
    setContactMessage("Contact number not available");
    return;
  }

  const cleanPhone = String(phone).replace(/[^\d+]/g, "");

  if (!cleanPhone) {
    setContactMessage("Invalid contact number");
    return;
  }

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    window.location.href = `tel:${cleanPhone}`;
    return;
  }

  try {
    await navigator.clipboard.writeText(cleanPhone);

    setContactMessage(
      `Contact number ${cleanPhone} copied`
    );

    setTimeout(() => {
      setContactMessage("");
    }, 2500);

  } catch (error) {
    setContactMessage(
      `Contact: ${cleanPhone}`
    );
  }
};
   

const findNearestAvailableResource = () => {
  const target =
    resourceTargetAlert ||
    resourceTargetReport;

  if (!target?.latitude || !target?.longitude) {
    alert("Disaster location coordinates are not available.");
    return;
  }

  const available = resources.filter(
    (resource) =>
      resource?.status === "Available" &&
      resource?.latitude != null &&
      resource?.longitude != null
  );

  if (available.length === 0) {
    setNearestResource(null);
    alert("No available resource with location found.");
    return;
  }

  const toRad = (value) =>
    (Number(value) * Math.PI) / 180;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };

  const nearest = available
    .map((resource) => ({
      ...resource,
      calculatedDistance: calculateDistance(
        target.latitude,
        target.longitude,
        resource.latitude,
        resource.longitude
      )
    }))
    .sort(
      (a, b) =>
        a.calculatedDistance -
        b.calculatedDistance
    )[0];

  setNearestResource(nearest);
};

 const fetchAlertDeploymentPlan = async () => {
  try {
    if (!resourceTargetAlert?._id) {
      console.log("❌ No alert selected");
      return;
    }

    setDeploymentLoading(true);

    console.log(
      "🚨 GENERATING ALERT DEPLOYMENT:",
      resourceTargetAlert._id
    );

    const response = await axios.get(
      "http://localhost:5000/api/intelligence/alert-deployment",
      {
        params: {
          alertId: resourceTargetAlert._id
        }
      }
    );

    console.log(
      "🚑 DEPLOYMENT RESPONSE:",
      response.data
    );

    const data = response.data || {};

    const resourceList = Object.entries(
      data.resources || {}
    )
      .filter(([_, resource]) => resource != null)
      .map(([role, resource]) => ({
        ...resource,
        resourceRole: role
      }));

    const finalPlan = {
      ...data,
      resources: resourceList
    };

    console.log(
      "✅ FINAL DEPLOYMENT PLAN:",
      finalPlan
    );

    setDeploymentPlan(finalPlan);

  } catch (error) {

    console.error(
      "❌ Alert deployment error:",
      error.response?.data || error.message
    );

    setDeploymentPlan(null);

  } finally {

    setDeploymentLoading(false);

  }
};

const getSelectedResourceTarget = () => {
if (resourceTargetAlert) {
return {
source: "OFFICIAL ALERT",
hazard:
resourceTargetAlert.hazard ||
resourceTargetAlert.type ||
"Disaster",
severity: resourceTargetAlert.severity || "INFO",
location: resourceTargetAlert.location || "Unknown Location",
latitude: resourceTargetAlert.latitude,
longitude: resourceTargetAlert.longitude,
};
}

if (resourceTargetReport) {
return {
source: "USER REPORT",
hazard: resourceTargetReport.type || "Disaster",
severity: resourceTargetReport.severity || "LOW",
location: resourceTargetReport.location || "Unknown Location",
latitude: resourceTargetReport.latitude,
longitude: resourceTargetReport.longitude,
};
}

return null;
};

const handleGenerateDeployment = async () => {
  console.log("✅ BUTTON CLICKED - DEPLOYMENT FUNCTION CALLED");
if (resourceTargetAlert?._id) {
await fetchAlertDeploymentPlan();
console.log("✅ ALERT DEPLOYMENT FUNCTION FINISHED");
return;
}


if (resourceTargetReport?._id) {
await fetchReportDeploymentPlan();
console.log("✅ REPORT DEPLOYMENT FUNCTION FINISHED");
return;
}

await fetchDeploymentPlan();
}; 

const updateDeploymentStatus = (resource, status) => {
  const resourceId =
    resource?._id ||
    resource?.id ||
    resource?.name;

  if (!resourceId) return;

  setDeploymentStatuses((prev) => ({
    ...prev,
    [resourceId]: status
  }));
};


const fetchIntelligenceData = async () => {
  try {
    setAlertLoading(true);

    // SACHET SYNC
    try {
      const sachetResponse = await axios.get(
        "http://localhost:5000/api/intelligence/sachet"
      );

      console.log(
        "SACHET alerts received:",
        sachetResponse.data.data?.length || 0
      );

    } catch (error) {
      console.error(
        "SACHET sync failed:",
        error.message
      );
    }

    // GET INTELLIGENCE DATA
 const [
  alertResponse,
  sourceResponse,
  riskResponse,
  resourceResponse,
  sourceStatusResponse
] = await Promise.all([
  axios.get("http://localhost:5000/api/alerts"),
  axios.get("http://localhost:5000/api/intelligence/sources"),
  axios.get("http://localhost:5000/api/intelligence/risk"),
  axios.get("http://localhost:5000/api/intelligence/resource-plan"),
  axios.get("http://localhost:5000/api/intelligence/source-status")
]);
  
 

    
// ALERT DATA
const allAlerts =
  alertResponse.data || [];

const newAlerts = allAlerts.filter((alert) => {

  // Agar expiry time available nahi hai
  // to alert ko active maanenge
  if (!alert.effectiveEndTime) {
    return true;
  }

  const endTime =
    new Date(alert.effectiveEndTime);

  // Invalid date hai to alert hide nahi karenge
  if (Number.isNaN(endTime.getTime())) {
    return true;
  }

  // Sirf future expiry wale alerts active
  return endTime > new Date();

});

setAlerts(newAlerts);

// ==========================================
// 🚨 DISASTER-X PRIORITY RESOURCE ENGINE
// ==========================================

const severityScore = {
  CRITICAL: 40,
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
  INFO: 0
};

const priorityAlerts = newAlerts
  .filter((alert) => alert)
  .map((alert) => {

    const severity =
      String(alert.severity || "LOW").toUpperCase();

    let score =
      severityScore[severity] ?? 10;

    // 1️⃣ OFFICIAL SOURCE PRIORITY
    const sourceText = String(
      alert.source ||
      alert.alertSource ||
      ""
    ).toUpperCase();

    if (
      alert.official === true ||
      sourceText.includes("NDMA") ||
      sourceText.includes("SACHET") ||
      sourceText.includes("CWC") ||
      sourceText.includes("NCS") ||
      sourceText.includes("IMD")
    ) {
      score += 20;
    }

    // 2️⃣ ACTIONABLE LOCATION
    const hasCoordinates =
      alert.latitude != null &&
      alert.longitude != null &&
      !Number.isNaN(Number(alert.latitude)) &&
      !Number.isNaN(Number(alert.longitude));

    if (hasCoordinates) {
      score += 20;
    }

    // 3️⃣ FRESHNESS
    let ageHours = 999;

    if (alert.createdAt) {
      const createdTime =
        new Date(alert.createdAt).getTime();

      if (!Number.isNaN(createdTime)) {
        ageHours =
          (Date.now() - createdTime) /
          (1000 * 60 * 60);

        if (ageHours <= 6) {
          score += 10;
        } else if (ageHours <= 24) {
          score += 5;
        }
      }
    }

    return {
      ...alert,
      priorityScore: Math.min(score, 100),
      priorityReason: [
        severity !== "INFO"
          ? `${severity} severity`
          : null,

        (
          alert.official === true ||
          sourceText.includes("NDMA") ||
          sourceText.includes("SACHET") ||
          sourceText.includes("CWC") ||
          sourceText.includes("NCS") ||
          sourceText.includes("IMD")
        )
          ? "official source"
          : null,

        hasCoordinates
          ? "location available"
          : null,

        ageHours <= 6
          ? "fresh alert"
          : ageHours <= 24
          ? "recent alert"
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    };
  })
  .sort((a, b) => {

    // Highest priority score first
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    // If same score → newer alert first
    const aTime =
      new Date(a.createdAt || 0).getTime();

    const bTime =
      new Date(b.createdAt || 0).getTime();

    return bTime - aTime;
  });


// ==========================================
// 🎯 AUTOMATIC PRIORITY TARGET
// ==========================================

const priorityDisaster =
  priorityAlerts.find(
    (alert) =>
      alert.latitude != null &&
      alert.longitude != null
  ) || priorityAlerts[0];

if (priorityDisaster) {

  // 🎯 Save priority disaster for Digital Twin
  setPriorityDisaster(priorityDisaster);

  setResourceTargetAlert(
    priorityDisaster
  );

  setResourceTargetReport(null);
  if (
  priorityDisaster.latitude != null &&
  priorityDisaster.longitude != null
) {
  fetchNearbyRealResources(
    Number(priorityDisaster.latitude),
    Number(priorityDisaster.longitude)
  );
}

  console.log(
    "🚨 DISASTER-X PRIORITY TARGET:",
    {
      hazard: priorityDisaster.hazard,
      location: priorityDisaster.location,
      severity: priorityDisaster.severity,
      source:
        priorityDisaster.source ||
        priorityDisaster.alertSource,
      score:
        priorityDisaster.priorityScore,
      reason:
        priorityDisaster.priorityReason
    }
  );

} else {
  setPriorityDisaster(null);
  // No active alert → report can be used
  if (disasters && disasters.length > 0) {

    const report =
      [...disasters]
        .filter(Boolean)
        .sort((a, b) => {

          const aScore =
            severityScore[
              String(
                a.severity || "LOW"
              ).toUpperCase()
            ] ?? 10;

          const bScore =
            severityScore[
              String(
                b.severity || "LOW"
              ).toUpperCase()
            ] ?? 10;

          return bScore - aScore;
        })[0];

    if (report) {
      setResourceTargetReport(report);
      setResourceTargetAlert(null);
    }

  } else {

    setResourceTargetAlert(null);
    setResourceTargetReport(null);
  }
}


    // --------------------------------
    // NEW ALERT DETECTION
    // --------------------------------

    if (newAlerts.length > 0) {

      const latest = newAlerts[0];

      const currentAlertId =
        latest?._id ||
        latest?.sachetIdentifier;

      // First time data load
      if (!initializedAlertsRef.current) {

        lastAlertIdRef.current =
          currentAlertId;

        initializedAlertsRef.current = true;

      }

      // NEW ALERT
      else if (
        currentAlertId &&
        currentAlertId !== lastAlertIdRef.current
      ) {

        console.log(
          "🚨 NEW DISASTER ALERT DETECTED"
        );

        lastAlertIdRef.current =
          currentAlertId;

        setLatestAlert(latest);

        setShowAlertPopup(true);

        if (
  "Notification" in window &&
  Notification.permission === "granted"
) {
  new Notification(
    `🚨 ${latest.hazard || "Disaster"} Warning`,
    {
      body:
        `${latest.location || "Nearby Area"}\n` +
        `${latest.message || latest.title || "New disaster alert received."}\n` +
        `Severity: ${latest.severity || "ALERT"}\n` +
        `Source: ${latest.alertSource || latest.source || "NDMA SACHET"}`,
      tag: String(currentAlertId)
    }
  );
}



        // 🔊 AUTOMATIC SOUND
        console.log("PLAYING ALERT SOUND");
        playAlertSound();

        setTimeout(() => {
          setShowAlertPopup(false);
        }, 8000);
      }
    }

    // OTHER DATA
    setDataSources(
      sourceStatusResponse.data.sources
    );
    console.log(
  "LIVE SOURCE STATUS:",
  sourceStatusResponse.data.sources
);

    setAiRisk(
      riskResponse.data
    );

    setResourcePlan(
      resourceResponse.data
    );

    // DEBUG
    console.log(
      "FIRST ALERT DATA:",
      alertResponse.data[0]
    );

    console.log(
  "🚨 FIRST ALERT DETAILS:",
  {
    source: alertResponse.data[0]?.source,
    hazard: alertResponse.data[0]?.hazard,
    severity: alertResponse.data[0]?.severity,
    location: alertResponse.data[0]?.location,
    latitude: alertResponse.data[0]?.latitude,
    longitude: alertResponse.data[0]?.longitude,
    message: alertResponse.data[0]?.message,
    official: alertResponse.data[0]?.official,
    start: alertResponse.data[0]?.effectiveStartTime,
    end: alertResponse.data[0]?.effectiveEndTime
  }
);

    console.log(
      "SACHET COUNT IN ALERTS:",
      alertResponse.data.filter(
        (item) =>
          item.source === "NDMA SACHET"
      ).length
    );

    console.log(
      "Disaster-X Alerts:",
      alertResponse.data
    );

    console.log(
      "Data Sources:",
      sourceResponse.data.sources
    );

  } catch (error) {

    console.error(
      "Intelligence data loading failed:",
      error
    );

  } finally {

    setAlertLoading(false);

  }
};
      // const [disasterResponse, resourceResponse, riskResponse] =
      //   await Promise.all([
      //      axios.get("http://localhost:5000/api/disasters"),
      //      axios.get("http://localhost:5000/api/resources"),
      //      axios.get("http://localhost:5000/api/risk"),
      //   ]);

      // setDisasters(disasterResponse.data);
      // setResources(resourceResponse.data.resources);
      // setRisk(riskResponse.data.prediction);

      // setLoading(false);


  
  const calculateRisk = (data) => {
  if (!data || data.length === 0) {
    return {
      probability: 0,
      disaster: "No Active Threat"
    };
  }

  const severityScore = {
    low: 30,
    medium: 60,
    high: 85,
    critical: 95
  };

  const latest = data[data.length - 1];
  const severity = latest.severity?.toLowerCase();

  return {
    probability: severityScore[severity] || 30,
    disaster: latest.type || "Unknown Disaster"
  };
};

 const getLocationRisk = (location) => {
  const reports = disasters.filter(
    (item) =>
      item.location?.toLowerCase() === location.toLowerCase()
  );

  if (reports.length === 0) return 0;

  const scores = {
    low: 30,
    medium: 60,
    high: 85,
    critical: 95,
  };

  const total = reports.reduce((sum, item) => {
    return sum + (scores[item.severity?.toLowerCase()] || 30);
  }, 0);

  return Math.round(total / reports.length);
};


const getAIPrediction = (data) => {
  if (!data || data.length === 0) {
    return {
      disaster: "No Threat Detected",
      location: "No active location",
      probability: 0,
      message: "Insufficient disaster data for prediction.",
      action: "Continue monitoring the situation."
    };
  };
  
 
  
    

  const severityValue = {
    low: 30,
    medium: 60,
    high: 85,
    critical: 95
  };

  const latest = [...data].sort((a, b) => {
    const scoreA = severityValue[a.severity?.toLowerCase()] || 0;
    const scoreB = severityValue[b.severity?.toLowerCase()] || 0;

    return scoreB - scoreA;
  })[0];

  const severity = latest.severity?.toLowerCase() || "low";

  let action = "Continue monitoring the situation.";

  if (severity === "critical") {
    action = "Immediate evacuation and emergency response recommended.";
  } else if (severity === "high") {
    action = "Alert local authorities and prepare emergency response teams.";
  } else if (severity === "medium") {
    action = "Increase monitoring and keep emergency resources ready.";
  }

  return {
    disaster: latest.type || "Unknown Disaster",
    location: latest.location || "Unknown Location",
    probability: severityValue[severity] || 30,
    message:
      `Based on the highest-risk ${severity} severity report in ${latest.location}, ` +
      `the system has detected an elevated disaster risk.`,
    action: action
  };
};


  // baaki tumhara existing JSX yahan...

  return (
    <div className="min-h-screen bg-[#07111f]">

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-[#091525]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
              <Activity className="text-cyan-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">
                DISASTER<span className="text-cyan-400">X</span>
              </h1>
              <p className="text-xs text-slate-400">
                Predict • Detect • Respond
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <button
  onClick={() => setActivePage("dashboard")}
  className={activePage === "dashboard" ? "text-cyan-400" : "text-slate-300"}
>
  Dashboard
</button>

<button
  type="button"
  onClick={handleSOS}
  disabled={sosLoading}
  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 hover:bg-red-500 transition disabled:opacity-50"
>
  {sosLoading ? "📍 LOCATING..." : "🚨 SOS"}
</button>
{sosStatus && (
  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
    {sosStatus}
  </div>
)}

<button
  onClick={() => setActivePage("risk")}
  className={activePage === "risk" ? "text-cyan-400" : "text-slate-300"}
>
  Risk Analysis
</button>

<button
  onClick={() => setActivePage("digital-twin")}
  className={
    activePage === "digital-twin"
      ? "text-cyan-400"
      : "text-slate-300"
  }
>
  Digital Twin
</button>
<button
  onClick={() => {
    setSelectedMapAlert(null);
    setActivePage("map");
 }}
  className={activePage === "map" ? "text-cyan-400" : "text-slate-300"}
>
  Map
</button>

<button
  onClick={() => {
    setActivePage("resources");
    fetchResources();
  }}
  className={activePage === "resources" ? "text-cyan-400" : "text-slate-300"}
>
  Resources
</button>

<button
  onClick={() => setActivePage("reports")}
  className={
    activePage === "reports"
      ? "text-cyan-400"
      : "text-slate-300"
  }
>
  Reports
</button>
<button
  onClick={() => setActivePage("Evacuation")}
  className={
    activePage === "Evacuation"
      ? "text-cyan-400"
      : "text-slate-300"
  }
>
  🚨 Evacuation
</button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            SYSTEM ONLINE
          </div>

        </div>
      </header>


      {/* MAIN */}

      <main className="max-w-7xl mx-auto px-5 py-7">
      
      {activePage === "dashboard" &&(
        <>

        {/* LIVE LOCATION BAR */}
<div className="mb-6 bg-[#0c1a2c] border border-cyan-500/20 rounded-2xl p-5">

  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

    <div className="flex items-center gap-4">

      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
        <MapPin className="text-cyan-400" size={24} />
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          Your Area
        </p>

        <h3 className="text-lg font-bold text-white mt-1">
          Live Location Monitoring
        </h3>

        {userLocation && (
          <p className="text-xs text-slate-500 mt-1">
            {userLocation.latitude.toFixed(4)},{" "}
            {userLocation.longitude.toFixed(4)}
          </p>
        )}
      </div>

    </div>


    <div className="flex items-center gap-4">

      {/* STATUS */}
      <div className="text-right">
        <p className="text-xs text-slate-500">
          Location Status
        </p>

        <p className="text-sm font-semibold text-green-400">
          ● {locationStatus}
        </p>
      </div>


      {/* ALERT STATUS */}
      
 {/* LOCAL ALERT STATUS */}
<div
  className={`px-4 py-3 rounded-xl border min-w-[240px] ${
    nearbyAlerts.length > 0
      ? "bg-red-500/10 border-red-500/30"
      : "bg-green-500/10 border-green-500/20"
  }`}
>

  {nearbyAlerts.length > 0 ? (
    <>
      <p className="text-sm font-bold text-red-400">
        🚨 {nearbyAlerts.length} Alert
        {nearbyAlerts.length > 1 ? "s" : ""} Nearby
      </p>

      <p className="text-xs text-white font-semibold mt-1">
        {nearbyAlerts[0]?.hazard || "Disaster Alert"}
      </p>

      <p className="text-[11px] text-slate-400 mt-1">
        📍 {nearbyAlerts[0]?.location || "Nearby Area"}
      </p>

      <p className="text-[11px] text-orange-400 mt-1">
        ⚠️ {nearbyAlerts[0]?.severity || "ALERT"}
      </p>

    </>
  ) : (
    <>
      <p className="text-sm font-semibold text-green-400">
        🟢 No Active Alert Nearby
      </p>

      <p className="text-[11px] text-slate-500 mt-1">
        50 km area continuously monitored
      </p>
    </>
  )}

</div>

    </div>

  </div>

</div>
      
    {/* ================= LIVE THREAT FEED ================= */}
<div className="mt-6 rounded-2xl border border-slate-800 bg-[#081321] overflow-hidden">

  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-800">

    <div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>

        <h2 className="text-sm font-bold text-white">
          Live Threat Feed
        </h2>
      </div>

      <p className="text-[11px] text-slate-500 mt-1">
        Real-time disaster intelligence from connected sources
      </p>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-green-400">
        ● LIVE
      </span>

      <span className="text-[9px] text-slate-600">
        {alerts.length} alerts
      </span>
    </div>

  </div>




  {/* Alerts */}
  <div className="divide-y divide-slate-800/70">

    {alerts.length === 0 ? (

      <div className="px-5 py-10 text-center">
        <div className="text-2xl mb-2">✓</div>

        <p className="text-sm text-slate-300">
          No active threats detected
        </p>

        <p className="text-[10px] text-slate-600 mt-1">
          Disaster-X is continuously monitoring connected sources.
        </p>
      </div>

    ) : (

      alerts.slice(0, 6).map((alert, index) => {

        const severity =
          String(alert.severity || "INFO").toUpperCase();

        let severityClass =
          "border-slate-700 bg-slate-900/40 text-slate-400";

        let dotClass = "bg-slate-400";

        if (severity === "CRITICAL") {
          severityClass =
            "border-red-500/20 bg-red-500/[0.04] text-red-400";
          dotClass = "bg-red-400";
        }

        if (severity === "WARNING") {
          severityClass =
            "border-orange-500/20 bg-orange-500/[0.04] text-orange-400";
          dotClass = "bg-orange-400";
        }

        if (severity === "ALERT") {
          severityClass =
            "border-yellow-500/20 bg-yellow-500/[0.04] text-yellow-400";
          dotClass = "bg-yellow-400";
        }

        const source =
          alert.source || "DISASTER-X";

        return (

          <div
            key={alert._id || index}
            className="px-5 py-4 hover:bg-slate-900/40 transition"
          >

            <div className="flex gap-3">

              {/* Status dot */}
              <div className="pt-1.5">
                <span
                  className={`block h-2 w-2 rounded-full ${dotClass}`}
                />
              </div>


              {/* Main content */}
              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="text-xs font-bold text-white">
                    {alert.title || "Disaster Alert"}
                  </h3>

                  <span
                    className={`rounded-md border px-2 py-0.5 text-[8px] font-bold ${severityClass}`}
                  >
                    {severity}
                  </span>

                </div>


                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {alert.message || "No additional information available."}
                </p>


                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">

                  <span className="text-[9px] text-slate-600">
                    📍 {alert.location || "Unknown location"}
                  </span>

                  <span className="text-[9px] text-slate-600">
                    ◉ {source}
                  </span>

                </div>

              </div>


              


              {/* Action */}
            {/* ACTIONS */}
<div className="self-center shrink-0 flex flex-col gap-2">

  {/* VIEW MAP */}
  
    <button
  onClick={() => {
    setActivePage("map");
  }}
  className={
    activePage === "map"
      ? "text-cyan-400"
      : "text-slate-300"
  }
>
  Map
</button>

  {/* FIND RESOURCES */}
  <button
    type="button"
    onClick={() => {
      setResourceTargetAlert(alert);
      setResourceTargetReport(null);
      setActivePage("resources");
    }}
    className="rounded-lg border border-green-500/30 px-3 py-2 text-[9px] font-bold text-green-400 hover:bg-green-500/10 transition"
  >
    🚑 Resources
  </button>

</div>
            </div>

          </div>

        );

      })

    )}

  </div>

   {/* Footer */}
  {alerts.length > 6 && (
    <div className="border-t border-slate-800 px-5 py-3 text-center">
      <button
        type="button"
        onClick={() => setActivePage("alerts")}
        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300"
      >
        View all {alerts.length} alerts →
      </button>
    </div>
  )}

</div>
 {/* ================= EMERGENCY SOS CENTER ================= */}
<section className="mt-8">

  {/* HEADER */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

    <div>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-xl">🚨</span>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Emergency SOS Center
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Live emergency requests from affected people
          </p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">

      {/* LIVE INDICATOR */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>

        <span className="text-xs font-bold text-green-400">
          LIVE MONITORING
        </span>
      </div>

      {/* ACTIVE COUNT */}
      <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
        <span className="text-red-400 text-lg font-black">
          {sosReports.filter(
            (sos) => sos.status === "ACTIVE"
          ).length}
        </span>

        <span className="ml-2 text-xs font-bold text-red-400">
          ACTIVE
        </span>
      </div>

    </div>
  </div>


  {/* NO SOS */}
  {sosReports.length === 0 ? (

    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">

      <div className="text-4xl mb-3">
        🛡️
      </div>

      <h3 className="text-white font-black text-lg">
        No Emergency SOS Alerts
      </h3>

      <p className="text-gray-500 text-sm mt-1">
        Disaster-X is currently monitoring for emergency requests.
      </p>

    </div>

  ) : (

    /* SOS LIST */
    <div className="space-y-4">

      {sosReports.slice(0, 2).map((sos, index) => {

        const mapUrl =
          sos.latitude != null &&
          sos.longitude != null
            ? `https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`
            : null;

        return (

          <div
            key={sos._id}
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all
              ${
                sos.status === "ACTIVE"
                  ? "border-red-500/30 bg-red-500/[0.06]"
                  : "border-white/10 bg-white/[0.03]"
              }
            `}
          >

            {/* RED SIDE INDICATOR */}
            {sos.status === "ACTIVE" && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            )}

            {/* TOP ROW */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-lg">
                    🚨
                  </span>
                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="text-white font-black">
                      EMERGENCY SOS
                    </h3>

                    <span className="px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-black">
                      {sos.status}
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-black">
                      {sos.priority}
                    </span>

                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Source: {sos.source || "Disaster-X SOS"}
                  </p>

                </div>

              </div>


              {/* TIME */}
              <div className="lg:text-right">

                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Received
                </p>

                <p className="text-sm text-gray-300 font-semibold mt-1">
                  {new Date(sos.createdAt).toLocaleString()}
                </p>

              </div>

            </div>


            {/* LOCATION DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

              {/* LATITUDE */}
              <div className="rounded-xl bg-black/20 border border-white/5 p-4">

                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Latitude
                </p>

                <p className="text-sm text-white font-black mt-2 break-all">
                  {sos.latitude ?? "Unavailable"}
                </p>

              </div>


              {/* LONGITUDE */}
              <div className="rounded-xl bg-black/20 border border-white/5 p-4">

                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Longitude
                </p>

                <p className="text-sm text-white font-black mt-2 break-all">
                  {sos.longitude ?? "Unavailable"}
                </p>

              </div>


              {/* ACCURACY */}
              <div className="rounded-xl bg-black/20 border border-white/5 p-4">

                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  GPS Accuracy
                </p>

                <p className="text-sm text-white font-black mt-2">
                  {sos.locationAccuracy != null
                    ? `${Math.round(sos.locationAccuracy)} meters`
                    : "Unavailable"}
                </p>

              </div>

            </div>


            {/* ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">

              <div className="flex items-center gap-2 text-xs text-gray-500">

                <span className="w-2 h-2 rounded-full bg-red-500"></span>

                <span>
                  Emergency request #{sosReports.length - index}
                </span>

              </div>


              <div className="flex flex-wrap gap-2">

                {/* VIEW LOCATION */}
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black hover:bg-cyan-500/20 transition"
                  >
                    📍 VIEW LOCATION
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-xs font-black cursor-not-allowed"
                  >
                    📍 LOCATION UNAVAILABLE
                  </button>
                )}

              </div>

            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">

  {sos.status === "ACTIVE" && (
    <button
      type="button"
      onClick={() =>
        updateSOSStatus(sos._id, "RESPONDING")
      }
      className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black hover:bg-orange-500/20"
    >
      🚑 MARK RESPONDING
    </button>
  )}

  {sos.status === "RESPONDING" && (
    <button
      type="button"
      onClick={() =>
        updateSOSStatus(sos._id, "RESOLVED")
      }
      className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black hover:bg-green-500/20"
    >
      ✅ MARK RESOLVED
    </button>
  )}

</div>

          </div>

        );
      })}
      {sosReports.length > 2 && (
  <div className="mt-4 flex justify-center">
    <button
      type="button"
      onClick={() => setActivePage("sos")}
      className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-black hover:bg-red-500/20 transition"
    >
      🚨 VIEW ALL SOS ({sosReports.length})
    </button>
  </div>
)}

    </div>
  )}

</section>

 

{/* 🌐 DATA SOURCE INTELLIGENCE */}
<section className="mb-6">
  <div className="bg-[#0b1628] border border-slate-800 rounded-2xl p-5">

    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-lg font-bold text-white">
          🌐 Disaster Intelligence Sources
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          Official sources monitored by Disaster-X
        </p>
      </div>

      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
        {dataSources.length} SOURCES
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {dataSources.map((source) => (
        <div
          key={source.name}
          className="bg-[#091525] border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 transition"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="font-semibold text-white">
                {source.name}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {source.type}
              </p>
              {source.alerts !== undefined && (
  <p className="text-[11px] text-cyan-400 mt-2">
    🚨 {source.alerts} alerts
  </p>
)}
            </div>

        <span
  className={`w-2.5 h-2.5 rounded-full ${
    source.status === "LIVE" ||
    source.status === "ACTIVE" ||
    source.status === "CONNECTED"
      ? "bg-green-400"
      : source.status === "NOT CONFIGURED"
      ? "bg-yellow-400"
      : "bg-cyan-400"
  }`}
/>
          </div>

          <div className="flex items-center justify-between mt-4">

             <span
  className={`text-[11px] font-semibold ${
    source.status === "LIVE" ||
    source.status === "ACTIVE" ||
    source.status === "CONNECTED"
      ? "text-green-400"
      : source.status === "NOT CONFIGURED"
      ? "text-yellow-400"
      : "text-cyan-400"
  }`}
>
  {source.status}
</span>

            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              Official Source ↗
            </a>

          </div>

        </div>
      ))}

    </div>
  </div>
</section>



        {/* TITLE */}
        <section className="mb-7">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

            <div>
              <p className="text-cyan-400 text-sm font-semibold mb-2">
                AI-POWERED DISASTER INTELLIGENCE
              </p>

              <h2 className="text-3xl md:text-4xl font-bold">
                National Disaster Command Center
              </h2>

              <p className="text-slate-400 mt-2 max-w-2xl">
                Monitor disaster conditions, analyze risk levels and
                coordinate emergency response from one intelligent platform.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock3 size={16} />
              Updated just now
            </div>

          </div>
        </section>

        


        {/* STAT CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

          <div className="bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Active Alerts</p>
            <h3 className="text-3xl font-bold mt-2 text-red-400">{alerts.length} </h3>
            <p className="text-xs text-red-300 mt-2">
              +2 in last hour
            </p>
          </div>

          <div className="bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">High Risk Zones</p>
            <h3 className="text-3xl font-bold mt-2 text-orange-400">
  {
    new Set(
      alerts
        .filter(
          (item) =>
          ["critical", "warning"].includes(
            String(item.severity || "").toLowerCase()
          )
        
        )
        .map((item) => item.location)
    ).size
  }
</h3>
            <p className="text-xs text-orange-300 mt-2">
              Monitoring required
            </p>
          </div>

          <div className="bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">People at Risk</p>
            <h3 className="text-3xl font-bold mt-2 text-yellow-400">
  {(
    alerts.filter(
      (a) =>
        String(a.severity || "").toLowerCase() === "critical"
    ).length * 0.4 +
    alerts.filter(
      (a) =>
        String(a.severity || "").toLowerCase() === "warning"
    ).length * 0.15
  ).toFixed(1)}M
</h3>
            <p className="text-xs text-slate-400 mt-2">
              Across monitored regions
            </p>
          </div>

          <div className="bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Response Teams</p>
            <h3 className="text-3xl font-bold mt-2 text-green-400">
  {disasters.length > 0 ? Math.min(disasters.length * 2, 50) : 0}
</h3>
            <p className="text-xs text-green-300 mt-2">
              Ready for deployment
            </p>
          </div>

        </section>


        {/* AI PREDICTION + MAP */}
        <section className="grid lg:grid-cols-3 gap-5 mb-7">

          {/* AI CARD */}
          {/* ================= AI RISK INTELLIGENCE ================= */}

<div className="lg:col-span-2 bg-[#0c1a2c] border border-cyan-500/20 rounded-2xl overflow-hidden">

  {/* HEADER */}
  <div className="px-6 py-5 border-b border-slate-800">

    <div className="flex items-center justify-between gap-4">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Brain className="text-cyan-400" size={23} />
        </div>

        <div>
          <h3 className="font-bold text-lg text-white">
            AI Risk Intelligence
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Multi-source disaster risk assessment
          </p>
        </div>

      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[9px] font-bold text-green-400">
          ENGINE ACTIVE
        </span>
      </div>

    </div>

  </div>


  {/* MAIN RISK */}
  <div className="p-6">

    <div className="grid md:grid-cols-2 gap-5">

      {/* SCORE */}
      <div className="rounded-2xl bg-[#091525] border border-slate-800 p-5">

        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Current Risk Score
        </p>

        <div className="flex items-end gap-3 mt-3">

          <span className="text-5xl font-black text-white">
            {aiRisk?.riskScore ?? 0}
          </span>

          <span className="text-sm text-slate-500 mb-2">
            / 100
          </span>

        </div>

        <div className="mt-4">

          <div className="flex justify-between text-[10px] mb-2">
            <span className="text-slate-500">
              Overall risk
            </span>

            <span
              className={
                aiRisk?.riskLevel === "CRITICAL"
                  ? "text-red-400"
                  : aiRisk?.riskLevel === "HIGH"
                  ? "text-orange-400"
                  : aiRisk?.riskLevel === "MEDIUM"
                  ? "text-yellow-400"
                  : "text-green-400"
              }
            >
              {aiRisk?.riskLevel || "CALCULATING"}
            </span>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-700"
              style={{
                width: `${Math.min(
                  Math.max(aiRisk?.riskScore ?? 0, 0),
                  100
                )}%`
              }}
            />

          </div>

        </div>

      </div>


      {/* PREDICTION */}
      <div className="rounded-2xl bg-[#091525] border border-slate-800 p-5">

        <div className="flex items-center justify-between">

          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Next 24 Hours
          </p>

          <span className="text-[9px] text-cyan-400">
            AI ANALYSIS
          </span>

        </div>

        <div className="mt-4">

          <p className="text-4xl font-black text-red-400">
            {risk?.probability ?? aiRisk?.riskScore ?? 0}%
          </p>

          <p className="text-sm text-slate-300 mt-1">
            {risk?.disaster || "Overall disaster risk"}
          </p>

        </div>

        {aiPrediction && (
          <div className="mt-4 pt-4 border-t border-slate-800">

            <p className="text-[10px] text-slate-500 uppercase">
              Highest Risk Location
            </p>

            <p className="text-xs font-semibold text-cyan-400 mt-1">
              📍 {aiPrediction.location}
            </p>

          </div>
        )}

      </div>

    </div>


    {/* RISK FACTORS */}

    <div className="mt-5">

      <div className="flex items-center justify-between mb-3">

        <div>
          <p className="text-xs font-bold text-white">
            Risk Factors
          </p>

          <p className="text-[10px] text-slate-500">
            Signals contributing to the current assessment
          </p>
        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


        {/* RAINFALL */}

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-slate-300">
              🌧️ Rainfall
            </span>

            <span className="text-sm font-bold text-blue-400">
              {aiRisk?.factors?.rainfall ?? 0}%
            </span>

          </div>

          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">

            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  aiRisk?.factors?.rainfall ?? 0,
                  100
                )}%`
              }}
            />

          </div>

        </div>


        {/* FLOOD */}

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-slate-300">
              🌊 Flood
            </span>

            <span className="text-sm font-bold text-cyan-400">
              {aiRisk?.factors?.flood ?? 0}%
            </span>

          </div>

          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">

            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  aiRisk?.factors?.flood ?? 0,
                  100
                )}%`
              }}
            />

          </div>

        </div>


        {/* EARTHQUAKE */}

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-slate-300">
              🌍 Earthquake
            </span>

            <span className="text-sm font-bold text-orange-400">
              {aiRisk?.factors?.earthquake ?? 0}%
            </span>

          </div>

          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">

            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  aiRisk?.factors?.earthquake ?? 0,
                  100
                )}%`
              }}
            />

          </div>

        </div>

      </div>

    </div>


    {/* EXPLANATION */}

    <div className="mt-5 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10 p-4">

      <div className="flex items-start gap-3">

        <div className="text-lg">
          🧠
        </div>

        <div>

          <p className="text-xs font-bold text-white">
            Why this risk level?
          </p>

          <p className="text-[11px] leading-relaxed text-slate-500 mt-1">
            Disaster-X combines multiple disaster signals from
            connected intelligence sources to generate an
            explainable risk assessment.
          </p>

        </div>

      </div>

      <div className="flex flex-wrap gap-4 mt-3">

        <span className="text-[10px] text-green-400">
          ✓ Multi-factor analysis
        </span>

        <span className="text-[10px] text-green-400">
          ✓ Explainable assessment
        </span>

        <span className="text-[10px] text-green-400">
          ✓ Alert integration
        </span>

      </div>

    </div>


    {/* RECOMMENDATION */}

    <div className="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/[0.03] p-4">

      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
        Recommended Action
      </p>

      <p className="text-xs text-slate-300 mt-2">
        🛡️{" "}
        {aiRisk?.recommendation ||
          aiPrediction?.action ||
          "Continue monitoring current disaster indicators."}
      </p>

    </div>


    {/* ANALYSIS BUTTON */}

    <button
      type="button"
      onClick={() => {

        setRisk(calculateRisk(disasters));
        setAIPrediction(getAIPrediction(disasters));
        setLastAnalysis(new Date());

      }}
      className="w-full mt-5 py-3 rounded-xl bg-cyan-400 text-slate-950 text-sm font-bold hover:bg-cyan-300 transition"
    >
      🧠 Run AI Analysis
    </button>


    {lastAnalysis && (

      <p className="text-[9px] text-slate-600 text-center mt-2">
        Last analysis: {lastAnalysis.toLocaleTimeString()}
      </p>

    )}

  </div>

</div>


{/* ================= AFFECTED AREAS ================= */}

<div className="bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">

  <div className="flex items-center justify-between mb-5">

    <div>

      <h3 className="font-bold text-lg text-white">
        📍 Affected Areas
      </h3>

      <p className="text-[10px] text-slate-500 mt-1">
        Locations from active disaster intelligence
      </p>

    </div>

    <span className="flex items-center gap-1.5 text-[9px] font-bold text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      LIVE
    </span>

  </div>


  <div className="space-y-2.5">

    {alerts
      .filter(
        (alert) =>
          alert.location &&
          alert.latitude != null &&
          alert.longitude != null
      )
      .slice(0, 6)
      .map((alert) => {

        const severity =
          String(alert.severity || "").toUpperCase();

        const severityColor =
          severity === "CRITICAL"
            ? "text-red-400"
            : severity === "WARNING"
            ? "text-orange-400"
            : severity === "ALERT"
            ? "text-yellow-400"
            : "text-green-400";

        return (

          <button
            type="button"
            key={alert._id || alert.sachetIdentifier}
            onClick={() => {
              setSelectedMapAlert(alert);
              setActivePage("map");
            }}
            className="w-full text-left bg-[#091525] border border-slate-800 rounded-xl p-3 hover:border-cyan-500/30 transition"
          >

            <div className="flex items-center justify-between gap-3">

              <div className="min-w-0">

                <p className="text-xs font-semibold text-white truncate">
                  {alert.location}
                </p>

                <p className="text-[10px] text-slate-500 mt-1">
                  {alert.hazard || "Disaster"} •{" "}
                  {alert.source || "Unknown Source"}
                </p>

              </div>

              <div className="text-right shrink-0">

                <p className={`text-[9px] font-bold ${severityColor}`}>
                  {severity || "ALERT"}
                </p>

                <p className="text-[9px] text-cyan-400 mt-1">
                  View →
                </p>

              </div>

            </div>

          </button>

        );

      })}


    {alerts.filter(
      (alert) =>
        alert.location &&
        alert.latitude != null &&
        alert.longitude != null
    ).length === 0 && (

      <div className="py-8 text-center">

        <div className="text-xl mb-2">
          ✓
        </div>

        <p className="text-xs text-slate-400">
          No mapped affected areas
        </p>

        <p className="text-[9px] text-slate-600 mt-1">
          Disaster-X is monitoring connected sources.
        </p>

      </div>

    )}

  </div>

</div>
       {/* ================= LIVE RISK MAP ================= */}

<div className="lg:col-span-2 bg-[#0c1a2c] border border-slate-800 rounded-2xl overflow-hidden">

  <div className="p-5 border-b border-slate-800">

    <div className="flex items-center justify-between gap-4">

      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>

          <h3 className="font-bold text-lg text-white">
            Live Risk Map
          </h3>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Real-time regional disaster monitoring
        </p>
      </div>

      <div className="flex items-center gap-2">

        <span className="text-[10px] px-2.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
          ● LIVE
        </span>

        <span className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300">
          <MapPin size={13} className="inline mr-1" />
          India
        </span>

      </div>

    </div>


    <div className="grid grid-cols-3 gap-2 mt-4">

      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
        <p className="text-[9px] text-slate-500 uppercase">
          Critical
        </p>

        <p className="text-xl font-bold text-red-400">
          {resourcePlan?.basedOn?.criticalAlerts ?? 0}
        </p>
      </div>


      <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-3">
        <p className="text-[9px] text-slate-500 uppercase">
          Warning
        </p>

        <p className="text-xl font-bold text-orange-400">
          {resourcePlan?.basedOn?.warningAlerts ?? 0}
        </p>
      </div>


      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3">
        <p className="text-[9px] text-slate-500 uppercase">
          Alerts
        </p>

        <p className="text-xl font-bold text-yellow-400">
          {resourcePlan?.basedOn?.alertAlerts ?? 0}
        </p>
      </div>

    </div>

  </div>


  {/* MAP */}

  <div className="relative h-[370px] bg-[#091725]">

    <div className="absolute inset-0 z-10">

      <DisasterMap
        disasters={disasters}
        resources={resources}
        alerts={alerts}
        simulationActive={simulationActive}
        simulationRadius={simulationRadius}
        selectedMapAlert={selectedMapAlert}
      />

    </div>


    <div className="absolute bottom-4 left-4 z-20">

      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2">

        <div className="flex items-center gap-3 text-[10px]">

          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Critical
          </span>

          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Warning
          </span>

          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Alert
          </span>

        </div>

      </div>

    </div>

  </div>

</div>


        

{/* ================= EMERGENCY RESOURCES ================= */}

<div className="mt-5 bg-[#0c1a2c] border border-slate-800 rounded-2xl p-5">

  <div className="flex items-center justify-between mb-5">

    <div className="flex items-center gap-3">

      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">

        <ShieldCheck
          size={19}
          className="text-green-400"
        />

      </div>

      <div>

        <h3 className="font-bold text-lg text-white">
          Emergency Resources
        </h3>

        <p className="text-xs text-slate-400">
          Available response infrastructure
        </p>

      </div>

    </div>


    <span className="text-[9px] px-2.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
      ● RESPONSE READY
    </span>

  </div>


  {/* RESOURCE CARDS */}

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

    {resources.map((item) => {

      const Icon = item.icon;

      return (

        <div
          key={item.name}
          className="bg-[#091525] border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 transition"
        >

          <div className="flex items-center justify-between">

            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">

              <Icon
                size={19}
                className="text-cyan-400"
              />

            </div>

            <span className="w-2 h-2 rounded-full bg-green-400"></span>

          </div>


          <p className="text-2xl font-bold text-white mt-4">
            {item.count}
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            {item.name}
          </p>

        </div>

      );

    })}

  </div>


  {/* AI DEPLOYMENT */}

  <div className="mt-4 grid lg:grid-cols-3 gap-4">

    <div className="lg:col-span-2 bg-slate-900/70 border border-slate-700 rounded-xl p-4">

      <div className="flex items-center justify-between">

        <div>

          <p className="font-semibold text-sm text-white">
            🧠 Smart Resource Deployment
          </p>

          <p className="text-[10px] text-slate-500 mt-1">
            Allocation based on current disaster intelligence
          </p>

        </div>

        <span className="text-[9px] text-green-400">
          ● ACTIVE
        </span>

      </div>


      <div className="grid grid-cols-3 gap-2 mt-4">

        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-500">CRITICAL</p>
          <p className="text-xl font-bold text-red-400">
            {resourcePlan?.basedOn?.criticalAlerts ?? 0}
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-500">WARNING</p>
          <p className="text-xl font-bold text-orange-400">
            {resourcePlan?.basedOn?.warningAlerts ?? 0}
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-500">ALERTS</p>
          <p className="text-xl font-bold text-yellow-400">
            {resourcePlan?.basedOn?.alertAlerts ?? 0}
          </p>
        </div>

      </div>


      <div className="mt-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15">

        <p className="text-[9px] text-cyan-400 font-semibold">
          AI RECOMMENDATION
        </p>

        <p className="text-xs text-slate-300 mt-1.5">
          {resourcePlan?.recommendation ||
            "Analyzing current disaster alerts..."}
        </p>

      </div>

    </div>


    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">

      <p className="text-[9px] text-slate-500 uppercase">
        Response Readiness
      </p>

      <p className="text-2xl font-bold text-green-400 mt-3">
        {resources.length > 0 ? "READY" : "WAIT"}
      </p>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">

        <div
          className="h-full bg-green-500 rounded-full"
          style={{
            width: resources.length > 0 ? "100%" : "20%"
          }}
        />

      </div>

      <p className="text-[10px] text-slate-500 mt-2">
        {resources.length > 0
          ? "Response infrastructure available."
          : "Waiting for resource data."}
      </p>

    </div>

  </div>


  {/* SMART RESPONSE ROUTING */}

  <div className="mt-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">

    <div className="flex items-start gap-3">

      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">

        <Navigation
          className="text-cyan-400"
          size={20}
        />

      </div>


      <div className="flex-1">

        <p className="font-semibold text-sm text-white">
          Smart Response Routing
        </p>

        <p className="text-[10px] text-slate-400 mt-1">
          Find and generate a response route for an affected zone.
        </p>


        <select
          value={selectedEvacuationAlert?._id || ""}
          onChange={(e) => {

            const selected = alerts.find(
              (alert) =>
                String(alert._id) === e.target.value
            );

            setSelectedEvacuationAlert(
              selected || null
            );

          }}
          className="w-full mt-4 bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
        >

          <option value="">
            Select disaster area...
          </option>

          {alerts
            .filter(
              (alert) =>
                alert.location &&
                alert.latitude != null &&
                alert.longitude != null
            )
            .slice(0, 10)
            .map((alert) => (

              <option
                key={alert._id || alert.sachetIdentifier}
                value={alert._id}
              >
                {alert.location} — {alert.hazard || "Disaster"}
              </option>

            ))}

        </select>


        <button
          type="button"
          disabled={!selectedEvacuationAlert}
          onClick={() => {

            if (!selectedEvacuationAlert) return;

            setEvacuationMode(true);
            setActivePage("Evacuation");

          }}
          className={`mt-3 w-full py-3 rounded-lg text-sm font-semibold transition ${
            selectedEvacuationAlert
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >

          {selectedEvacuationAlert
            ? "🧭 Generate Response Route →"
            : "Select an affected area first"}

        </button>


        {selectedEvacuationAlert && (

          <div className="mt-3 grid grid-cols-2 gap-2">

            <div className="bg-slate-900 rounded-lg p-3">

              <p className="text-[9px] text-slate-500">
                AFFECTED AREA
              </p>

              <p className="text-xs font-semibold text-white mt-1">
                {selectedEvacuationAlert.location}
              </p>

            </div>


            <div className="bg-slate-900 rounded-lg p-3">

              <p className="text-[9px] text-slate-500">
                HAZARD
              </p>

              <p className="text-xs font-semibold text-orange-400 mt-1">
                {selectedEvacuationAlert.hazard || "Disaster"}
              </p>

            </div>

          </div>

        )}

      </div>

    </div>

  </div>

</div>

        </section>
        </>
      )}
     

{activePage === "digital-twin" && (() => {

 const twinDisaster =
  priorityDisaster ||
  alerts?.find(
    (alert) =>
      alert.latitude != null &&
      alert.longitude != null
  ) ||
  disasters?.find(
    (disaster) =>
      disaster.latitude != null &&
      disaster.longitude != null
  );

  const disasterLat = twinDisaster?.latitude != null
    ? Number(twinDisaster.latitude)
    : null;

  const disasterLng = twinDisaster?.longitude != null
    ? Number(twinDisaster.longitude)
    : null;

  const baseRisk = Number(
    aiRisk?.riskScore ??
    risk?.probability ??
    40
  );

  const simulatedRisk = Math.min(
    100,
    Math.round(baseRisk + twinSimulation * 0.6)
  );

  const basePopulation = 12000;

  const simulatedPopulation = Math.round(
    basePopulation *
      (1 + twinSimulation / 100)
  );

  const rescueTeams =
    Number(resourcePlan?.resources?.rescueTeams || 4);

  const requiredTeams = Math.max(
    rescueTeams,
    Math.ceil(rescueTeams * (1 + twinSimulation / 100))
  );

  const nearbyTwinSOS = (sosReports || []).filter(
    (sos) =>
      sos.latitude != null &&
      sos.longitude != null
  );

  const twinResources = (resources || []).filter(
    (item) =>
      item.latitude != null &&
      item.longitude != null
  );

  const hazardName =
    twinDisaster?.hazard ||
    twinDisaster?.type ||
    twinDisaster?.disaster ||
    "Disaster Risk";

  const hazardLocation =
    twinDisaster?.location ||
    twinDisaster?.district ||
    twinDisaster?.city ||
    "Location unavailable";

  const severity =
    twinDisaster?.severity ||
    "HIGH";

  const hasCoordinates =
    disasterLat != null &&
    disasterLng != null &&
    Number.isFinite(disasterLat) &&
    Number.isFinite(disasterLng);

  const riskColor =
    simulatedRisk >= 75
      ? "red"
      : simulatedRisk >= 50
      ? "orange"
      : "green";

  return (
    <section className="mt-6 space-y-5">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>

            <div className="flex items-center gap-3">

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-2xl">
                  🌐
                </span>
              </div>

              <div>

                <p className="text-xs font-bold tracking-widest text-cyan-400">
                  DISASTER-X DIGITAL TWIN
                </p>

                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  Live Disaster Simulation Center
                </h2>

              </div>

            </div>

            <p className="text-sm text-slate-400 mt-3 max-w-2xl">
              Real-time operational model using disaster alerts,
              risk intelligence, SOS reports and emergency resources.
            </p>

          </div>


          {/* LIVE STATUS */}

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">

              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <span className="text-xs font-bold text-green-400">
                DIGITAL TWIN LIVE
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================== */}
      {/* TOP INFORMATION */}
      {/* ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* PRIORITY DISASTER */}

        <div className="bg-slate-900/90 border border-red-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            PRIORITY DISASTER
          </p>

          <p className="text-lg font-bold text-red-400 mt-2 truncate">
            {hazardName}
          </p>

          <p className="text-xs text-slate-400 mt-1 truncate">
            📍 {hazardLocation}
          </p>

        </div>


        {/* RISK */}

        <div className="bg-slate-900/90 border border-orange-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            LIVE RISK
          </p>

          <p className="text-3xl font-bold text-orange-400 mt-2">
            {simulatedRisk}%
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {severity} threat level
          </p>

        </div>


        {/* SOS */}

        <div className="bg-slate-900/90 border border-red-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            ACTIVE SOS
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">
            {nearbyTwinSOS.length}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Emergency signals
          </p>

        </div>


        {/* RESOURCES */}

        <div className="bg-slate-900/90 border border-green-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            RESPONSE RESOURCES
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {twinResources.length}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Resources with location
          </p>

        </div>

      </div>


      {/* ===================================================== */}
      {/* MAIN DIGITAL TWIN */}
      {/* ===================================================== */}

    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">


        {/* =================================================== */}
        {/* 3D VIEW */}
        {/* =================================================== */}

        <div className="min-w-0 bg-slate-950 border border-cyan-500/20 rounded-2xl overflow-hidden">

          <div className="p-5 border-b border-slate-800">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <h3 className="text-lg font-bold text-white">
                  🌐 3D Affected Area
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Operational visualization of disaster impact
                </p>

              </div>


              {/* LAYER CONTROLS */}

              <div className="flex flex-wrap gap-2">

                {[
                  ["all", "ALL"],
                  ["risk", "RISK"],
                  ["resources", "RESOURCES"],
                  ["sos", "SOS"],

                  ["buildings", "BUILDINGS"],
                  ["roads", "ROADS"]
                ].map(([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() => setTwinLayer(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                      twinLayer === value
                        ? "bg-cyan-500 text-slate-950 border-cyan-400"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500/40"
                    }`}
                  >
                    {label}
                  </button>

                ))}

              </div>

            </div>

          </div>


        <DigitalTwin3D
        disasters={disasters}
        alerts={alerts}
        resources={resources}
        sosReports={sosReports}
  hasCoordinates={hasCoordinates}
  simulatedRisk={simulatedRisk}
  nearbyTwinSOS={nearbyTwinSOS}
  twinResources={twinResources}
  hazardName={hazardName}
  hazardLocation={hazardLocation}
  severity={severity}
  disasterLat={disasterLat}
  disasterLng={disasterLng}
  twinLayer={twinLayer}
  twinHour={twinHour}
/>


          {/* LEGEND */}

          <div className="p-4 border-t border-slate-800 flex flex-wrap gap-5 text-xs text-slate-400">

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Disaster zone
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400" />
              Risk zone
            </div>

            <div className="flex items-center gap-2">
              🆘 SOS
            </div>

            <div className="flex items-center gap-2">
              🚑 Resources
            </div>

            <div className="flex items-center gap-2">
              👤 User
            </div>

          </div>

        </div>


        {/* =================================================== */}
        {/* RIGHT CONTROL PANEL */}
        {/* =================================================== */}

        <div className="space-y-5">


          {/* PRIORITY DISASTER */}

          <div className="bg-slate-900/90 border border-red-500/20 rounded-2xl p-5">

            <p className="text-xs font-bold tracking-widest text-red-400">
              🚨 PRIORITY DISASTER
            </p>

            <h3 className="text-xl font-bold text-white mt-3">
              {hazardName}
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              📍 {hazardLocation}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">

              <div className="bg-slate-800 rounded-xl p-3">

                <p className="text-[10px] text-slate-500">
                  SEVERITY
                </p>

                <p className="text-sm font-bold text-red-400 mt-1">
                  {severity}
                </p>

              </div>

              <div className="bg-slate-800 rounded-xl p-3">

                <p className="text-[10px] text-slate-500">
                  RISK
                </p>

                <p className="text-sm font-bold text-orange-400 mt-1">
                  {simulatedRisk}%
                </p>

              </div>

            </div>

          </div>


          {/* SIMULATION */}

          <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold tracking-widest text-purple-400">
                  🧪 WHAT-IF SIMULATION
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  Disaster intensity
                </p>

              </div>

              <span className="text-xl font-bold text-purple-400">
                +{twinSimulation}%
              </span>

            </div>


            <input
              type="range"
              min="0"
              max="100"
              value={twinSimulation}
              onChange={(e) =>
                setTwinSimulation(
                  Number(e.target.value)
                )
              }
              className="w-full mt-5 accent-purple-500"
            />


            <div className="flex justify-between text-[10px] text-slate-500 mt-2">

              <span>Current</span>
              <span>Severe</span>

            </div>


            <div className="grid grid-cols-2 gap-3 mt-5">

              <div className="bg-slate-800 rounded-xl p-3">

                <p className="text-[10px] text-slate-500">
                  PEOPLE AT RISK
                </p>

                <p className="text-lg font-bold text-orange-400 mt-1">
                  {simulatedPopulation.toLocaleString()}
                </p>

              </div>

              <div className="bg-slate-800 rounded-xl p-3">

                <p className="text-[10px] text-slate-500">
                  TEAMS NEEDED
                </p>

                <p className="text-lg font-bold text-red-400 mt-1">
                  {requiredTeams}
                </p>

              </div>

            </div>

          </div>


          {/* TIME SIMULATION */}

          <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-xs font-bold tracking-widest text-cyan-400">
                  ⏱️ TIME SIMULATION
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  Forecast timeline
                </p>

              </div>

              <span className="text-sm font-bold text-cyan-400">
                +{twinHour}h
              </span>

            </div>


            <input
              type="range"
              min="0"
              max="24"
              value={twinHour}
              onChange={(e) =>
                setTwinHour(
                  Number(e.target.value)
                )
              }
              className="w-full mt-5 accent-cyan-500"
            />


            <div className="grid grid-cols-3 gap-2 mt-4">

              {[0, 6, 12].map((hour) => (

                <button
                  key={hour}
                  type="button"
                  onClick={() =>
                    setTwinHour(hour)
                  }
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    twinHour === hour
                      ? "bg-cyan-500 text-slate-950 border-cyan-400"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  +{hour}h
                </button>

              ))}

            </div>

          </div>


          {/* RESET */}

          <button
            type="button"
            onClick={() => {
              setTwinSimulation(0);
              setTwinHour(0);
              setTwinLayer("all");
            }}
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition"
          >
            ↻ Reset Digital Twin
          </button>

        </div>

      </div>


      {/* ===================================================== */}
      {/* IMPACT ANALYSIS */}
      {/* ===================================================== */}

      <div className="grid md:grid-cols-4 gap-4">


        <div className="bg-slate-900/90 border border-orange-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            POPULATION IMPACT
          </p>

          <p className="text-2xl font-bold text-orange-400 mt-2">
            +{twinSimulation}%
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Estimated exposure
          </p>

        </div>


        <div className="bg-slate-900/90 border border-red-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            RESOURCE DEMAND
          </p>

          <p className="text-2xl font-bold text-red-400 mt-2">
            +{Math.round(twinSimulation * 0.8)}%
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Additional deployment
          </p>

        </div>


        <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            SIMULATION RISK
          </p>

          <p className="text-2xl font-bold text-purple-400 mt-2">
            {simulatedRisk}%
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Scenario risk score
          </p>

        </div>


        <div className="bg-slate-900/90 border border-green-500/20 rounded-2xl p-5">

          <p className="text-xs text-slate-500">
            RESPONSE TEAMS
          </p>

          <p className="text-2xl font-bold text-green-400 mt-2">
            {requiredTeams}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Recommended deployment
          </p>

        </div>

      </div>


      {/* ===================================================== */}
      {/* AI RESPONSE PLAN */}
      {/* ===================================================== */}

      <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-6">

        <div className="flex items-center gap-3 mb-5">

          <div className="p-3 rounded-xl bg-cyan-500/10">
            🧠
          </div>

          <div>

            <h3 className="text-lg font-bold text-white">
              AI Response Recommendation
            </h3>

            <p className="text-xs text-slate-500">
              Digital Twin generated operational guidance
            </p>

          </div>

        </div>


        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-slate-800 rounded-xl p-4">

            <p className="text-cyan-400 font-bold text-sm">
              01 — MONITOR
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Continuously monitor the priority disaster
              zone and surrounding high-risk areas.
            </p>

          </div>


          <div className="bg-slate-800 rounded-xl p-4">

            <p className="text-orange-400 font-bold text-sm">
              02 — PREPARE
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Keep approximately {requiredTeams} rescue teams
              ready according to the simulated demand.
            </p>

          </div>


          <div className="bg-slate-800 rounded-xl p-4">

            <p className="text-red-400 font-bold text-sm">
              03 — RESPOND
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Prioritize active SOS signals and emergency
              resources closest to the affected zone.
            </p>

          </div>

        </div>


        <div className="mt-5 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">

          <p className="text-xs text-yellow-400 font-semibold">
            ⚠ SIMULATION NOTICE
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Digital Twin outputs are operational simulations
            for Disaster-X. They should not be treated as
            official government evacuation orders.
          </p>

        </div>

      </div>

    </section>
  );

})()}

{activePage === "Evacuation" && (
  <div className="space-y-6">

    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-white">
            🚨 Evacuation & Emergency Planner
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Plan response for active disaster zones
          </p>
        </div>

        <span className="text-xs text-cyan-400">
          ● RESPONSE MODE
        </span>

      </div>

    </div>


{/* TODAY'S ACTIVE ALERTS */}

<div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">

  <h3 className="text-lg font-semibold text-white">
    📍 Select Today's Active Disaster
  </h3>

  <p className="text-sm text-gray-400 mt-1">
    Select an active alert to generate its evacuation plan.
  </p>

  <select
    value={selectedEvacuationAlert?.sachetIdentifier || ""}
    onChange={(e) => {

      const selected = alerts.find(
        (alert) =>
          String(alert.sachetIdentifier) === e.target.value
      );

      setSelectedEvacuationAlert(selected || null);
      setEvacuationMode(false);

    }}
    className="w-full mt-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
  >

    <option value="">
      🚨 Select today's active disaster alert
    </option>

    {alerts
      .filter((alert) => {

        // Location required
        if (
          alert.latitude == null ||
          alert.longitude == null
        ) {
          return false;
        }

        // Today's date
        const today =
          new Date().toISOString().split("T")[0];

        const alertDate = alert.createdAt
          ? new Date(alert.createdAt)
              .toISOString()
              .split("T")[0]
          : "";

        // Active status
        const status = String(
          alert.status || "active"
        ).toLowerCase();

        const active =
          status === "active" ||
          status === "ongoing" ||
          status === "warning" ||
          status === "critical";

        return (
          alertDate === today &&
          active
        );

      })
      .map((alert) => (

        <option
          key={alert._id || alert.sachetIdentifier}
          value={alert.sachetIdentifier}
        >

          🚨 {alert.hazard || "Disaster"} —{" "}
          {alert.location || "Unknown Location"} —{" "}
          {alert.severity || "HIGH"}

        </option>

      ))}

  </select>


  {/* SELECTED ALERT DETAILS */}

  {selectedEvacuationAlert && (

    <div className="mt-4 p-4 rounded-xl bg-slate-800 border border-cyan-500/20">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <p className="text-xs text-gray-500">
            📍 Location
          </p>

          <p className="text-sm font-semibold text-white mt-1">
            {selectedEvacuationAlert.location}
          </p>
        </div>


        <div>
          <p className="text-xs text-gray-500">
            ⚠️ Hazard
          </p>

          <p className="text-sm font-semibold text-orange-400 mt-1">
            {selectedEvacuationAlert.hazard}
          </p>
        </div>


        <div>
          <p className="text-xs text-gray-500">
            🚨 Severity
          </p>

          <p className="text-sm font-semibold text-red-400 mt-1">
            {selectedEvacuationAlert.severity}
          </p>
        </div>

      </div>

    </div>

  )}


  <button
    type="button"
    disabled={!selectedEvacuationAlert}
    onClick={() => setEvacuationMode(true)}
    className="mt-4 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
  >

    🚨 Generate Evacuation Plan

  </button>

</div>


    {/* GENERATED PLAN */}

    {evacuationMode && selectedEvacuationAlert && (

      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">

        <h3 className="text-lg font-semibold text-white">
          🧠 Emergency Response Plan
        </h3>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

          <div className="bg-slate-800 rounded-xl p-5">

            <p className="text-xs text-gray-400">
              Affected Area
            </p>

            <p className="text-lg font-bold text-red-400 mt-2">
              {selectedEvacuationAlert.location}
            </p>

          </div>


          <div className="bg-slate-800 rounded-xl p-5">

            <p className="text-xs text-gray-400">
              Hazard
            </p>

            <p className="text-lg font-bold text-orange-400 mt-2">
              {selectedEvacuationAlert.hazard}
            </p>

          </div>


          <div className="bg-slate-800 rounded-xl p-5">

            <p className="text-xs text-gray-400">
              Alert Severity
            </p>

            <p className="text-lg font-bold text-yellow-400 mt-2">
              {selectedEvacuationAlert.severity}
            </p>

          </div>

        </div>


        <div className="mt-5 bg-slate-800 rounded-xl p-5">

          <h4 className="font-semibold text-cyan-400">
            🛣️ Response Actions
          </h4>

          <div className="mt-4 space-y-3 text-sm text-gray-300">

            <p>📍 Identify civilians inside the affected zone.</p>

            <p>🚑 Deploy emergency medical support.</p>

            <p>🚒 Move rescue teams toward the affected area.</p>

            <p>🏠 Direct civilians toward safe shelters.</p>

            <p>🚧 Keep emergency access routes clear.</p>

          </div>

        </div>


        <div className="mt-5 border border-green-500/30 bg-green-500/5 rounded-xl p-5">

          <p className="text-green-400 font-semibold">
            ✓ Evacuation plan generated
          </p>

          <p className="text-sm text-gray-400 mt-2">
            This is a Disaster-X simulation/response plan based
            on the selected alert. It is not an official evacuation order.
          </p>

        </div>

      </div>

    )}
    {/* EVACUATION MAP */}

{evacuationMode && selectedEvacuationAlert && (
  <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">

    <div className="mb-4">
      <h3 className="text-lg font-semibold text-white">
        🗺️ Evacuation Zone Map
      </h3>

      <p className="text-sm text-gray-400 mt-1">
        Simulated affected zone and safe evacuation area
      </p>
    </div>

    <div className="h-[450px] rounded-xl overflow-hidden">

      <MapContainer
        center={[
          Number(selectedEvacuationAlert.latitude),
          Number(selectedEvacuationAlert.longitude)
        ]}
        zoom={9}
        className="w-full h-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* AFFECTED ZONE */}

        <Circle
          center={[
            Number(selectedEvacuationAlert.latitude),
            Number(selectedEvacuationAlert.longitude)
          ]}
          radius={10000}
          pathOptions={{
            color: "red",
            fillColor: "red",
            fillOpacity: 0.20,
            weight: 3
          }}
        >

          <Popup>
            🚨 Affected Disaster Zone
          </Popup>

        </Circle>


        {/* ALERT LOCATION */}

        <Marker
          position={[
            Number(selectedEvacuationAlert.latitude),
            Number(selectedEvacuationAlert.longitude)
          ]}
        >

          <Popup>

            <strong>
              🚨 {selectedEvacuationAlert.hazard}
            </strong>

            <br />

            📍 {selectedEvacuationAlert.location}

            <br />

            ⚠️ {selectedEvacuationAlert.severity}

          </Popup>

        </Marker>


        {/* SIMULATED SAFE ZONE */}

        <Circle
          center={[
            Number(selectedEvacuationAlert.latitude) + 0.12,
            Number(selectedEvacuationAlert.longitude) + 0.12
          ]}
          radius={5000}
          pathOptions={{
            color: "green",
            fillColor: "green",
            fillOpacity: 0.18,
            weight: 3
          }}
        >

          <Popup>
            🟢 Simulated Safe Zone
          </Popup>

        </Circle>


        {/* EVACUATION ROUTE */}

    <EvacuationRoute
    alert={selectedEvacuationAlert}
    resources={resources}
    />

      </MapContainer>

    </div>


    {/* LEGEND */}

    <div className="flex flex-wrap gap-5 mt-4 text-sm">

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        Affected Zone
      </div>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        Safe Zone
      </div>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
        Evacuation Route
      </div>

    </div>

  </div>
)}

  </div>
)}

   
  {activePage === "risk" && (
  <RiskCommandCenter
    risk={risk}
    resources={resources}
    setActivePage={setActivePage}
  />
)}

{activePage === "map" && (() => {
  const validDisasters = disasters.filter(
    (item) =>
      item.latitude !== null &&
      item.longitude !== null &&
      !isNaN(Number(item.latitude)) &&
      !isNaN(Number(item.longitude))
  );



  const filteredDisasters = validDisasters.filter((item) => {
    const severity = item.severity?.toLowerCase();

    if (mapFilter === "all") return true;
    return severity === mapFilter;
  });

  const getRiskScore = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return 95;
      case "high":
        return 85;
      case "medium":
        return 65;
      case "low":
        return 30;
      default:
        return 50;
    }
  };

  const getMarkerStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return {
          dot: "bg-red-500",
          ring: "border-red-500/40",
          text: "text-red-400",
        };

      case "high":
        return {
          dot: "bg-orange-400",
          ring: "border-orange-400/40",
          text: "text-orange-400",
        };

      case "medium":
        return {
          dot: "bg-yellow-400",
          ring: "border-yellow-400/40",
          text: "text-yellow-400",
        };

      default:
        return {
          dot: "bg-green-400",
          ring: "border-green-400/40",
          text: "text-green-400",
        };
    }
  };

  /*
    Convert real latitude/longitude into our command-map canvas.

    India approximate bounds:
    longitude: 68 → 98
    latitude: 8 → 37
  */
  const getMapPosition = (lat, lon) => {
    const minLon = 68;
    const maxLon = 98;
    const minLat = 8;
    const maxLat = 37;

    let left =
      ((Number(lon) - minLon) / (maxLon - minLon)) * 100;

    let top =
      ((maxLat - Number(lat)) / (maxLat - minLat)) * 100;

    left = Math.max(2, Math.min(96, left));
    top = Math.max(3, Math.min(94, top));

    return {
      left: `${left}%`,
      top: `${top}%`,
    };
  };

  const criticalCount = validDisasters.filter(
    (d) => d.severity?.toLowerCase() === "critical"
  ).length;

  const highCount = validDisasters.filter(
    (d) => d.severity?.toLowerCase() === "high"
  ).length;

  const mediumCount = validDisasters.filter(
    (d) => d.severity?.toLowerCase() === "medium"
  ).length;

  return (
    <section className="space-y-5">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>

            <span className="text-cyan-400 text-xs font-bold tracking-[0.25em]">
              DISASTER-X / GEOSPATIAL COMMAND
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            National Disaster Map
          </h2>

          <p className="text-slate-400 mt-2 max-w-2xl">
            Real-time spatial intelligence derived from active
            disaster reports and geographic coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="px-4 py-3 rounded-xl bg-[#091525] border border-slate-800">
            <p className="text-[9px] text-slate-500 tracking-widest">
              GEO DATA
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400">
                LIVE
              </span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-[#091525] border border-slate-800">
            <p className="text-[9px] text-slate-500 tracking-widest">
              INCIDENTS
            </p>

            <p className="text-lg font-black mt-0.5">
              {validDisasters.length}
            </p>
          </div>

        </div>
      </div>


      {/* =====================================================
          COMMAND MAP
      ====================================================== */}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_330px] gap-5">

        {/* MAP */}
        <div className="relative h-[650px] rounded-3xl overflow-hidden border border-slate-800 bg-[#050d18] shadow-2xl">

          {/* TOP BAR */}
          <div className="absolute top-0 left-0 right-0 z-30 h-16 px-5 flex items-center justify-between bg-[#071321]/90 backdrop-blur-xl border-b border-slate-800">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <MapPin size={18} className="text-cyan-400" />
              </div>

              <div>
                <p className="text-sm font-bold">
                  NATIONAL OPERATIONS GRID
                </p>

                <p className="text-[10px] text-slate-500">
                  Spatial incident intelligence
                </p>
              </div>

            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500">
              <span>LAT 08°—37° N</span>
              <span className="text-slate-700">|</span>
              <span>LNG 68°—98° E</span>
            </div>

          </div>


          {/* MAP CANVAS */}
          <div className="absolute inset-0 pt-16 overflow-hidden">

            {/* DARK RADAR BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(6,182,212,0.10),transparent_38%),linear-gradient(135deg,#06111d,#030914)]" />

            {/* GRID */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(56,189,248,0.18) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(56,189,248,0.18) 1px, transparent 1px)
                `,
                backgroundSize: "45px 45px",
              }}
            />

            {/* RADAR */}
            <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">

              <div className="w-[460px] h-[460px] rounded-full border border-cyan-400/10" />

              <div className="absolute inset-[55px] rounded-full border border-cyan-400/10" />

              <div className="absolute inset-[110px] rounded-full border border-cyan-400/10" />

              <div className="absolute inset-[165px] rounded-full border border-cyan-400/10" />

              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/10 -translate-x-1/2" />

              <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/10 -translate-y-1/2" />

            </div>


            {/* INDIA-LIKE GEOGRAPHIC FRAME
                Not a fake country silhouette.
                It is a spatial reference frame for plotting
                real coordinates.
            */}
            

              <div className="absolute left-[8%] right-[8%] top-[10%] bottom-[10%] border border-cyan-400/10 rounded-[42%_58%_48%_52%]" />

              <div className="absolute left-[18%] right-[18%] top-[24%] border-t border-cyan-400/10" />

              <div className="absolute left-[28%] right-[28%] top-[50%] border-t border-cyan-400/10" />

              <div className="absolute left-[38%] right-[38%] top-[72%] border-t border-cyan-400/10" />

            


            {/* COORDINATE LABELS */}
            <div className="absolute left-4 top-20 text-[9px] text-slate-600 space-y-14">
              <p>37°N</p>
              <p>30°N</p>
              <p>23°N</p>
              <p>16°N</p>
              <p>08°N</p>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-20 text-[9px] text-slate-600">
              <span>68°E</span>
              <span>75°E</span>
              <span>82°E</span>
              <span>90°E</span>
              <span>98°E</span>
            </div>


            {/* CENTER SCAN */}
            

              <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,1)]" />

              <div className="absolute -inset-5 rounded-full border border-cyan-400/20 animate-ping" />

            


            {/* =================================================
                REAL DISASTER MARKERS
            ================================================== */}
            {filteredDisasters.map((item) => {

              const position = getMapPosition(
                item.latitude,
                item.longitude
              );

              const style = getMarkerStyle(item.severity);
              const score = getRiskScore(item.severity);

              const isSelected =
                selectedMapAlert?._id === item._id;

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedMapAlert(item)}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                  style={position}
                  title={`${item.location || "Unknown"} - ${item.type || "Disaster"}`}
                >

                  {/* OUTER RISK AREA */}
                  <span
                    className={`absolute -inset-7 rounded-full border ${style.ring} opacity-30 group-hover:opacity-80 transition`}
                  />

                  {/* PULSE */}
                  <span
                    className={`absolute -inset-4 rounded-full ${style.dot} opacity-20 animate-ping`}
                  />

                  {/* MARKER */}
                  <span
                    className={`
                      relative flex items-center justify-center
                      w-5 h-5 rounded-full
                      ${style.dot}
                      border-2 border-white/80
                      shadow-[0_0_22px_rgba(34,211,238,0.55)]
                      transition duration-200
                      group-hover:scale-150
                      ${isSelected ? "scale-150 ring-4 ring-cyan-400/30" : ""}
                    `}
                  />

                  {/* LABEL */}
                  <span
                    className={`
                      absolute left-7 top-1/2 -translate-y-1/2
                      whitespace-nowrap
                      px-3 py-2
                      rounded-lg
                      bg-[#071321]/95
                      border
                      ${isSelected ? "border-cyan-400/50" : "border-slate-700"}
                      backdrop-blur-xl
                      text-left
                      opacity-0
                      group-hover:opacity-100
                      ${isSelected ? "opacity-100" : ""}
                      transition
                      pointer-events-none
                    `}
                  >

                    <span className="block text-xs font-bold text-white">
                      {item.location || "Unknown Location"}
                    </span>

                    <span className={`block text-[10px] mt-1 ${style.text}`}>
                      {item.type || "Disaster"} • {score}% risk
                    </span>

                  </span>

                </button>
              );
            })}


            {/* EMPTY STATE */}
            {filteredDisasters.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">

                <div className="text-center bg-[#071321]/90 border border-slate-800 rounded-2xl px-8 py-7 backdrop-blur-xl">

                  <MapPin
                    size={30}
                    className="mx-auto text-slate-600 mb-3"
                  />

                  <p className="font-bold">
                    No mapped incidents
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    No disaster report with valid coordinates
                    matches this filter.
                  </p>

                </div>

              </div>
            )}


            {/* MAP STATUS */}
            <div className="absolute left-5 top-5 z-30">

              <div className="px-4 py-3 rounded-xl bg-[#071321]/90 backdrop-blur-xl border border-slate-800">

                <div className="flex items-center gap-2">

                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

                  <span className="text-[10px] font-bold text-green-400 tracking-widest">
                    SYSTEM OPERATIONAL
                  </span>

                </div>

                <p className="text-[9px] text-slate-600 mt-1">
                  Coordinates synchronized
                </p>

              </div>

            </div>


            {/* LEGEND */}
            <div className="absolute bottom-6 left-5 z-30">

              <div className="bg-[#071321]/90 backdrop-blur-xl border border-slate-800 rounded-xl px-4 py-3">

                <p className="text-[9px] text-slate-500 tracking-widest mb-2">
                  THREAT LEVEL
                </p>

                <div className="flex gap-4 text-[10px]">

                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Critical
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    High
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    Medium
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Low
                  </span>

                </div>

              </div>

            </div>

          </div>
        </div>


        {/* =====================================================
            RIGHT COMMAND PANEL
        ====================================================== */}
        <div className="space-y-4">

          {/* THREAT SUMMARY */}
          <div className="bg-[#0a1625] border border-slate-800 rounded-2xl p-5">

            <div className="flex items-center justify-between mb-5">

              <div>
                <p className="text-[10px] text-slate-500 tracking-widest">
                  THREAT MATRIX
                </p>

                <h3 className="text-xl font-black mt-1">
                  Live Incidents
                </h3>
              </div>

              <Activity
                size={20}
                className="text-cyan-400"
              />

            </div>


            <div className="grid grid-cols-3 gap-2">

              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                <p className="text-xl font-black text-red-400">
                  {criticalCount}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  CRITICAL
                </p>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3">
                <p className="text-xl font-black text-orange-400">
                  {highCount}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  HIGH
                </p>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
                <p className="text-xl font-black text-yellow-400">
                  {mediumCount}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  MEDIUM
                </p>
              </div>

            </div>

          </div>


          {/* FILTER */}
          <div className="bg-[#0a1625] border border-slate-800 rounded-2xl p-4">

            <p className="text-[10px] text-slate-500 tracking-widest mb-3">
              FILTER INCIDENTS
            </p>

            <div className="grid grid-cols-2 gap-2">

              {[
                ["all", "ALL"],
                ["critical", "CRITICAL"],
                ["high", "HIGH"],
                ["medium", "MEDIUM"],
                ["low", "LOW"],
              ].map(([value, label]) => (

                <button
                  key={value}
                  type="button"
                  onClick={() => setMapFilter(value)}
                  className={`
                    px-3 py-2 rounded-lg text-[10px] font-bold
                    border transition
                    ${
                      mapFilter === value
                        ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300"
                        : "bg-[#071321] border-slate-800 text-slate-500 hover:text-white"
                    }
                  `}
                >
                  {label}
                </button>

              ))}

            </div>

          </div>



<div className="bg-[#0a1625] border border-slate-800 rounded-2xl p-5">

  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-[9px] text-cyan-400 tracking-[0.2em]">
        LIVE ALERT INTELLIGENCE
      </p>

      <h3 className="text-lg font-black mt-1">
        Active Disaster Alerts
      </h3>
    </div>

    <span className="px-2.5 py-1 rounded-full bg-red-500/10
      border border-red-500/20 text-[9px] text-red-400">
      {filteredDisasters.length} ACTIVE
    </span>
  </div>

  <div className="space-y-2 max-h-[430px] overflow-y-auto">

    {filteredDisasters.length === 0 ? (

      <div className="py-10 text-center">
        <MapPin
          size={26}
          className="mx-auto text-slate-700 mb-2"
        />

        <p className="text-sm font-bold">
          No Active Alerts
        </p>

        <p className="text-[10px] text-slate-600 mt-1">
          No mapped disaster matches this filter.
        </p>
      </div>

    ) : (

      filteredDisasters.map((alert) => {

        const score = getRiskScore(alert.severity);
        const style = getMarkerStyle(alert.severity);

        return (
          <div
            key={alert._id}
            className="p-4 rounded-xl bg-[#071321]
              border border-slate-800
              hover:border-cyan-400/30 transition"
          >

            {/* TOP */}
            <div className="flex items-start justify-between gap-3">

              <div className="flex items-start gap-3">

                <div className="relative mt-1">

                  <span
                    className={`block w-3 h-3 rounded-full ${style.dot}`}
                  />

                  <span
                    className={`absolute -inset-1.5 rounded-full
                      ${style.dot} opacity-20 animate-ping`}
                  />

                </div>

                <div>
                  <p className="text-sm font-bold">
                    {alert.location || "Unknown Location"}
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1">
                    {alert.type || alert.hazard || "Disaster"}
                  </p>
                </div>

              </div>

              <div className="text-right">

                <p className={`text-sm font-black ${style.text}`}>
                  {score}%
                </p>

                <p className="text-[8px] text-slate-600">
                  RISK
                </p>

              </div>

            </div>


            {/* DETAILS */}
            <div className="grid grid-cols-2 gap-2 mt-3">

              <div className="bg-[#0a1625] rounded-lg p-2.5">

                <p className="text-[8px] text-slate-600">
                  SEVERITY
                </p>

                <p className={`text-[10px] font-bold mt-1 ${style.text}`}>
                  {alert.severity || "UNKNOWN"}
                </p>

              </div>

              <div className="bg-[#0a1625] rounded-lg p-2.5">

                <p className="text-[8px] text-slate-600">
                  COORDINATES
                </p>

                <p className="text-[9px] font-mono text-cyan-300 mt-1">
                  {Number(alert.latitude).toFixed(3)},
                  {" "}
                  {Number(alert.longitude).toFixed(3)}
                </p>

              </div>

            </div>


            {/* RISK BAR */}
            <div className="mt-3">

              <div className="flex justify-between mb-1">

                <span className="text-[8px] text-slate-600">
                  THREAT LEVEL
                </span>

                <span className={`text-[8px] font-bold ${style.text}`}>
                  {score}%
                </span>

              </div>

              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className={`h-full ${style.dot} rounded-full`}
                  style={{
                    width: `${score}%`,
                  }}
                />

              </div>

            </div>


            {/* RESOURCE SCAN */}
            <button
              type="button"
              onClick={() => {
                setSelectedMapAlert(alert);

                fetchNearbyResources(
                  Number(alert.latitude),
                  Number(alert.longitude),
                  resourceRadius
                );
              }}
              className="w-full mt-3 py-2 rounded-lg
                bg-cyan-500/10
                border border-cyan-400/20
                text-cyan-300
                text-[9px] font-bold
                hover:bg-cyan-500/20 transition"
            >
              SCAN NEARBY RESPONSE RESOURCES
            </button>

          </div>
        );
      })

    )}

  </div>

</div>

          {/* SYSTEM */}
          <div className="bg-[#0a1625] border border-slate-800 rounded-2xl p-4">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/10 flex items-center justify-center">

                <ShieldCheck
                  size={18}
                  className="text-green-400"
                />

              </div>

              <div>

                <p className="text-xs font-bold">
                  Geospatial Engine
                </p>

                <p className="text-[9px] text-green-400 mt-1">
                  OPERATIONAL
                </p>

              </div>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">

              <div className="bg-[#071321] rounded-lg p-3">

                <p className="text-lg font-black">
                  {validDisasters.length}
                </p>

                <p className="text-[9px] text-slate-500">
                  MAPPED REPORTS
                </p>

              </div>

              <div className="bg-[#071321] rounded-lg p-3">

                <p className="text-lg font-black">
                  {filteredDisasters.length}
                </p>

                <p className="text-[9px] text-slate-500">
                  VISIBLE
                </p>

              </div>

            </div>

          </div> 

        </div>
      </div>

    </section>
  );
})()}

{activePage === "resources" && (
  <section className="space-y-6">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.25em] text-green-400">
          EMERGENCY RESPONSE NETWORK
        </p>

        <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
          Emergency Resources
        </h1>

        <p className="text-sm text-gray-400 mt-2">
          Monitor, locate and deploy emergency resources during disasters.
        </p>
      </div>

      <button
        onClick={fetchResources}
        className="px-5 py-3 rounded-xl border border-green-500/30
        bg-green-500/10 text-green-400 font-bold text-sm
        hover:bg-green-500/20 transition"
      >
        ↻ Refresh Resources
      </button>
    </div>


    {/* RESOURCE SUMMARY */}
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

      {[
        {
          title: "Rescue Teams",
          value: resourceStats?.rescueTeams ?? 0,
          icon: "🚑"
        },
        {
          title: "Ambulances",
          value: resourceStats?.ambulances ?? 0,
          icon: "🚨"
        },
        {
          title: "Hospitals",
          value: resourceStats?.hospitals ?? 0,
          icon: "🏥"
        },
        {
          title: "Shelters",
          value: resourceStats?.shelters ?? 0,
          icon: "🏠"
        },
        {
          title: "Fire Stations",
          value: resourceStats?.fireStations ?? 0,
          icon: "🔥"
        },
        {
          title: "Rescue Vehicles",
          value: resourceStats?.rescueVehicles ?? 0,
          icon: "🚒"
        }
      ].map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-white/10 bg-white/[0.03]
          p-5 hover:border-green-500/30 transition"
        >
          <div className="text-2xl">{item.icon}</div>

          <p className="text-xs text-gray-500 mt-4">
            {item.title}
          </p>

          <p className="text-2xl font-black text-white mt-1">
            {item.value}
          </p>
        </div>
      ))}

    </div>


    {/* PRIORITY RESPONSE */}
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-red-400">
            PRIORITY RESPONSE ZONE
          </p>

          <h2 className="text-xl font-black text-white mt-1">
            {resourceTargetAlert
              ? resourceTargetAlert.hazard || "Official Alert"
              : resourceTargetReport
              ? resourceTargetReport.type || "User Report"
              : "No disaster selected"}
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            {resourceTargetAlert?.location ||
              resourceTargetReport?.location ||
              "Select an alert or report to calculate deployment."}
          </p>
        </div>
        


        {(resourceTargetAlert || resourceTargetReport) && (
          
          <button
          type="button"
            onClick={handleGenerateDeployment}
            disabled={deploymentLoading}
            className="px-5 py-3 rounded-xl bg-green-500 text-black
            font-black text-sm hover:bg-green-400 transition
            disabled:opacity-50"
          >
            {deploymentLoading
              ? "Generating..."
              : "⚡ Generate Deployment Plan"}
              
          </button>
          
        
        )}
        </div>

        {(resourceTargetAlert || resourceTargetReport) && (
  <div className="mt-5 flex flex-wrap gap-3">

    <button
      type="button"
      onClick={findNearestAvailableResource}
      className="px-5 py-3 rounded-xl
      border border-blue-500/30
      bg-blue-500/10
      text-blue-400
      font-bold text-sm
      hover:bg-blue-500/20 transition"
    >
      📍 Find Nearest Available
    </button>

  </div>
)}

{nearestResource && (
  <div className="mt-4 rounded-2xl border border-blue-500/20
  bg-blue-500/[0.04] p-5">

    <div className="flex flex-col md:flex-row
    md:items-center md:justify-between gap-4">

      <div>

        <p className="text-[10px] tracking-[0.2em]
        font-bold text-blue-400">
          NEAREST AVAILABLE RESOURCE
        </p>

        <h3 className="text-lg font-black text-white mt-1">
          {nearestResource.name ||
            "Emergency Resource"}
        </h3>

        <p className="text-xs text-gray-500 mt-1">
          {nearestResource.type ||
            "Emergency Unit"}
        </p>

      </div>

      <div className="text-left md:text-right">

        <p className="text-2xl font-black text-blue-400">
          {nearestResource.calculatedDistance.toFixed(1)} km
        </p>

        <p className="text-[10px] text-gray-500">
          FROM DISASTER LOCATION
        </p>

      </div>

    </div>


    <div className="grid sm:grid-cols-3 gap-3 mt-5">

      <div className="rounded-xl bg-black/20
      border border-white/10 p-3">

        <p className="text-[10px] text-gray-500">
          LOCATION
        </p>

        <p className="text-xs text-gray-300 mt-1">
          {nearestResource.location ||
            nearestResource.city ||
            "Not available"}
        </p>

      </div>


      <div className="rounded-xl bg-black/20
      border border-white/10 p-3">

        <p className="text-[10px] text-gray-500">
          STATUS
        </p>

        <p className="text-xs text-green-400
        font-bold mt-1">
          {nearestResource.status}
        </p>

      </div>


      <div className="rounded-xl bg-black/20
      border border-white/10 p-3">

        <p className="text-[10px] text-gray-500">
          CONTACT
        </p>

        <p className="text-xs text-gray-300 mt-1">
          {nearestResource.contact ||
            nearestResource.phone ||
            "Not available"}
        </p>

      </div>

    </div>


    <div className="grid grid-cols-2 gap-2 mt-4">

      <button
        type="button"
        onClick={() =>
          callResource(nearestResource)
        }
        className="py-2.5 rounded-xl
        border border-green-500/20
        text-green-400 text-xs font-bold
        hover:bg-green-500/10 transition"
      >
        📞 Contact
      </button>
      


      <button
        type="button"
        onClick={() =>
          openResourceRoute(nearestResource)
        }
        className="py-2.5 rounded-xl
        border border-blue-500/20
        text-blue-400 text-xs font-bold
        hover:bg-blue-500/10 transition"
      >
        📍 Route
      </button>

    </div>

  </div>
)}
        
        {deploymentPlan && (
  <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6 mt-6">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

      <div>
        <p className="text-[10px] tracking-[0.2em] font-bold text-green-400">
          AI RESOURCE DEPLOYMENT
        </p>

        <h2 className="text-xl font-black text-white mt-1">
          Recommended Response
        </h2>

        <p className="text-xs text-gray-500 mt-2">
          Automated deployment plan generated from the selected disaster alert.
        </p>
      </div>

      <div className="text-right">
        <span className="inline-flex px-3 py-1 rounded-full
        bg-red-500/10 border border-red-500/20
        text-red-400 text-xs font-bold">
          {deploymentPlan.priority || "NORMAL"}
        </span>

        <p className="text-[11px] text-gray-500 mt-2">
          {deploymentPlan.target?.severity || "NORMAL"} ALERT
        </p>
      </div>

    </div>


    {/* TARGET INFORMATION */}
    {deploymentPlan.target && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
          <p className="text-[10px] text-gray-500">
            HAZARD
          </p>

          <p className="text-sm font-bold text-white mt-1">
            {deploymentPlan.target.hazard || "Disaster"}
          </p>
        </div>


        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
          <p className="text-[10px] text-gray-500">
            LOCATION
          </p>

          <p className="text-sm font-bold text-white mt-1">
            {deploymentPlan.target.location || "Unknown"}
          </p>
        </div>


        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
          <p className="text-[10px] text-gray-500">
            SOURCE
          </p>

          <p className="text-sm font-bold text-green-400 mt-1">
            {deploymentPlan.target.source || "Unknown"}
          </p>
        </div>

      </div>
    )}


    {/* RECOMMENDATION */}
    {deploymentPlan.recommendation && (
      <div className="mt-5 p-4 rounded-xl border border-green-500/20
      bg-green-500/5">

        <p className="text-[10px] tracking-wider text-green-400 font-bold">
          AI RECOMMENDATION
        </p>

        <p className="text-sm text-gray-300 mt-2">
          🤖 {deploymentPlan.recommendation}
        </p>

      </div>
    )}

    {/* DEPLOYMENT SUMMARY */}
{deploymentPlan &&
  Array.isArray(deploymentPlan.resources) &&
  deploymentPlan.resources.length > 0 && (

    <div className="mt-6">

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-[0.2em]
          font-bold text-blue-400">
            RESPONSE STATUS
          </p>

          <h3 className="text-sm font-bold text-white mt-1">
            Deployment Summary
          </h3>
        </div>

        <span className="text-xs text-gray-500">
          Live status
        </span>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* TOTAL */}

        <div className="rounded-xl border border-white/10
        bg-black/20 p-4">

          <p className="text-[10px] text-gray-500">
            TOTAL RESOURCES
          </p>

          <p className="text-2xl font-black text-white mt-1">
            {deploymentPlan.resources.length}
          </p>

        </div>


        {/* AVAILABLE */}

        <div className="rounded-xl border border-green-500/20
        bg-green-500/[0.04] p-4">

          <p className="text-[10px] text-gray-500">
            AVAILABLE
          </p>

          <p className="text-2xl font-black text-green-400 mt-1">
            {
              deploymentPlan.resources.filter(
                (resource) =>
                  (
                    deploymentStatuses[
                      resource?._id ||
                      resource?.id ||
                      resource?.name
                    ] ||
                    resource?.status
                  ) === "Available"
              ).length
            }
          </p>

        </div>


        {/* DISPATCHED */}

        <div className="rounded-xl border border-yellow-500/20
        bg-yellow-500/[0.04] p-4">

          <p className="text-[10px] text-gray-500">
            DISPATCHED
          </p>

          <p className="text-2xl font-black text-yellow-400 mt-1">
            {
              deploymentPlan.resources.filter(
                (resource) =>
                  deploymentStatuses[
                    resource?._id ||
                    resource?.id ||
                    resource?.name
                  ] === "Dispatched"
              ).length
            }
          </p>

        </div>


        {/* EN ROUTE */}

        <div className="rounded-xl border border-blue-500/20
        bg-blue-500/[0.04] p-4">

          <p className="text-[10px] text-gray-500">
            EN ROUTE
          </p>

          <p className="text-2xl font-black text-blue-400 mt-1">
            {
              deploymentPlan.resources.filter(
                (resource) =>
                  deploymentStatuses[
                    resource?._id ||
                    resource?.id ||
                    resource?.name
                  ] === "En Route"
              ).length
            }
          </p>

        </div>

      </div>

    </div>
  )}

  {/* COMPLETED */}

<div className="rounded-xl border border-purple-500/20
bg-purple-500/[0.04] p-4">

  <p className="text-[10px] text-gray-500">
    COMPLETED
  </p>

  <p className="text-2xl font-black text-purple-400 mt-1">
    {
      deploymentPlan.resources.filter(
        (resource) =>
          deploymentStatuses[
            resource?._id ||
            resource?.id ||
            resource?.name
          ] === "Completed"
      ).length
    }
  </p>

</div>

{/* RESPONSE PROGRESS */}

{(() => {

  const total =
    deploymentPlan.resources.length;

  const completed =
    deploymentPlan.resources.filter(
      (resource) =>
        deploymentStatuses[
          resource?._id ||
          resource?.id ||
          resource?.name
        ] === "Completed"
    ).length;

  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  return (
    <div className="mt-4 rounded-xl
    border border-white/10
    bg-black/20 p-4">

      <div className="flex items-center
      justify-between mb-2">

        <div>
          <p className="text-[10px] text-gray-500">
            RESPONSE PROGRESS
          </p>

          <p className="text-sm font-bold text-white mt-1">
            {completed} of {total} resources completed
          </p>
        </div>

        <span className="text-sm font-black text-green-400">
          {progress}%
        </span>

      </div>


      <div className="w-full h-2 rounded-full
      bg-white/10 overflow-hidden">

        <div
          className="h-full rounded-full
          bg-green-500 transition-all duration-500"
          style={{
            width: `${progress}%`
          }}
        />

      </div>

    </div>
  );

})()}


    {/* DEPLOYMENT RESOURCES */}
    <div className="mt-6">

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">
          🚑 Assigned Emergency Resources
        </h3>

        <span className="text-xs text-gray-500">
          {Array.isArray(deploymentPlan.resources)
            ? deploymentPlan.resources.length
            : 0} units
        </span>
      </div>


      {Array.isArray(deploymentPlan.resources) &&
      deploymentPlan.resources.length > 0 ? (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {deploymentPlan.resources.map((resource) => (

            <div
              key={
                resource?.id ||
                resource?._id ||
                resource?.name
              }
              className="rounded-2xl border border-white/10
              bg-black/20 p-5 hover:border-green-500/30 transition"
            >

              {/* RESOURCE HEADER */}
              <div className="flex items-start justify-between gap-3">

                <div>
                  <h3 className="font-bold text-white">
                    {resource?.name || "Emergency Resource"}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {resource?.type || "Emergency Unit"}
                  </p>
                </div>

                <span className="text-xs font-bold text-green-400 whitespace-nowrap">
                  {resource?.distanceKm != null
                    ? `${Number(resource.distanceKm).toFixed(1)} km`
                    : "Distance N/A"}
                </span>

              </div>


              {/* DETAILS */}
              <div className="mt-4 space-y-2">

                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-gray-500">
                    Location
                  </span>

                  <span className="text-gray-300 text-right">
                    {resource?.location || "Not available"}
                  </span>
                </div>


               <div className="mt-4">

  <div className="flex items-center justify-between gap-3">

    <span className="text-gray-500 text-xs">
      Deployment Status
    </span>

    <span
      className={`text-xs font-bold ${
        (
          deploymentStatuses[
            resource?._id ||
            resource?.id ||
            resource?.name
          ] ||
          resource?.status
        ) === "Available"
          ? "text-green-400"
          : (
              deploymentStatuses[
                resource?._id ||
                resource?.id ||
                resource?.name
              ] ||
              resource?.status
            ) === "Dispatched"
          ? "text-yellow-400"
          : (
              deploymentStatuses[
                resource?._id ||
                resource?.id ||
                resource?.name
              ] ||
              resource?.status
            ) === "En Route"
          ? "text-blue-400"
          : (
              deploymentStatuses[
                resource?._id ||
                resource?.id ||
                resource?.name
              ] ||
              resource?.status
            ) === "Completed"
          ? "text-purple-400"
          : "text-gray-400"
      }`}
    >
      {deploymentStatuses[
        resource?._id ||
        resource?.id ||
        resource?.name
      ] || resource?.status || "Unknown"}
    </span>

  </div>


  <select
    value={
      deploymentStatuses[
        resource?._id ||
        resource?.id ||
        resource?.name
      ] || resource?.status || "Available"
    }
    onChange={(e) =>
      updateDeploymentStatus(
        resource,
        e.target.value
      )
    }
    className="w-full mt-2 px-3 py-2 rounded-lg
    bg-black/30 border border-white/10
    text-white text-xs outline-none
    focus:border-green-500/40"
  >

    <option value="Available">
      🟢 Available
    </option>

    <option value="Dispatched">
      🟡 Dispatched
    </option>

    <option value="En Route">
      🔵 En Route
    </option>

    <option value="Completed">
      🟣 Completed
    </option>

  </select>

</div>


                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-gray-500">
                    Contact
                  </span>

                  <span className="text-gray-300">
                    {resource?.contact || "Not available"}
                  </span>
                </div>

              </div>
              


              {/* ROUTE */}
          <div className="grid grid-cols-2 gap-2 mt-5">

            {contactMessage && (
  <p className="col-span-2 text-xs text-green-400 text-center mt-1">
    ✓ {contactMessage}
  </p>
)}

  {/* CONTACT */}
  <button
    type="button"
    onClick={() => callResource(resource)}
    className="py-2.5 rounded-xl
    border border-green-500/20
    text-green-400 text-xs font-bold
    hover:bg-green-500/10 transition"
  >
    📞 Contact
  </button>
  

  {/* ROUTE */}
  <button
    type="button"
    onClick={() => openResourceRoute(resource)}
    className="py-2.5 rounded-xl
    border border-blue-500/20
    text-blue-400 text-xs font-bold
    hover:bg-blue-500/10 transition"
  >
    📍 Route
  </button>

</div>
              

            </div>

          ))}

        </div>
      

      ) : (

        <div className="rounded-xl border border-dashed border-white/10
        p-6 text-center text-sm text-gray-500">
          No deployable resources were found for this alert.
        </div>
    
      
      )}

    </div>

  </div>
)}

    
      



      {/* SELECTED TARGET */}
      {(resourceTargetAlert || resourceTargetReport) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">

          <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <p className="text-[10px] text-gray-500">SOURCE</p>
            <p className="text-sm font-bold text-white mt-1">
              {resourceTargetAlert ? "OFFICIAL ALERT" : "USER REPORT"}
            </p>
          </div>

          <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <p className="text-[10px] text-gray-500">SEVERITY</p>
            <p className="text-sm font-bold text-yellow-400 mt-1">
              {resourceTargetAlert?.severity ||
                resourceTargetReport?.severity ||
                "N/A"}
            </p>
          </div>

          <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <p className="text-[10px] text-gray-500">LATITUDE</p>
            <p className="text-sm font-bold text-white mt-1">
              {resourceTargetAlert?.latitude ??
                resourceTargetReport?.latitude ??
                "N/A"}
            </p>
          </div>

          <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <p className="text-[10px] text-gray-500">LONGITUDE</p>
            <p className="text-sm font-bold text-white mt-1">
              {resourceTargetAlert?.longitude ??
                resourceTargetReport?.longitude ??
                "N/A"}
            </p>
          </div>

        </div>
      )}

    </div>

{/* RESOURCE MAP */}
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

  <div className="flex flex-col md:flex-row md:items-center
  md:justify-between gap-4">

    <div>
      <p className="text-[10px] tracking-[0.2em]
      font-bold text-blue-400">
        LIVE RESOURCE LOCATION
      </p>

      <h2 className="text-xl font-black text-white mt-1">
        Disaster Resource Map
      </h2>

      <p className="text-xs text-gray-500 mt-2">
        View the disaster location and nearby emergency resources.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setShowResourceMap(!showResourceMap)}
      className="px-5 py-3 rounded-xl
      border border-blue-500/30
      bg-blue-500/10
      text-blue-400
      font-bold text-sm
      hover:bg-blue-500/20 transition"
    >
      {showResourceMap
        ? "✕ Hide Map"
        : "🗺️ Open Resource Map"}
    </button>

  </div>


  {showResourceMap && (
    <div className="mt-5 rounded-2xl overflow-hidden
    border border-white/10">

      {(() => {

        const target =
          resourceTargetAlert ||
          resourceTargetReport;

        const targetLat = Number(target?.latitude);
        const targetLng = Number(target?.longitude);

        const mapResources = resources.filter(
          (resource) =>
            resource?.latitude != null &&
            resource?.longitude != null
        );

        if (
          !Number.isFinite(targetLat) ||
          !Number.isFinite(targetLng)
        ) {
          return (
            <div className="p-10 text-center text-gray-500">
              <div className="text-3xl">📍</div>

              <p className="text-sm mt-3">
                Disaster location coordinates are not available.
              </p>
            </div>
          );
        }

        return (
          <MapContainer
            center={[targetLat, targetLng]}
            zoom={7}
            scrollWheelZoom={true}
            style={{
              height: "480px",
              width: "100%"
            }}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* DISASTER LOCATION */}

            <CircleMarker
              center={[targetLat, targetLng]}
              radius={12}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.85
              }}
            >

              <Popup>

                <div className="text-sm">

                  <strong>
                    🚨 Disaster Location
                  </strong>

                  <br />

                  {target?.hazard ||
                    target?.type ||
                    "Disaster"}

                  <br />

                  {target?.location ||
                    "Unknown location"}

                  <br />

                  <b>
                    Severity:{" "}
                    {target?.severity || "N/A"}
                  </b>

                </div>

              </Popup>

            </CircleMarker>


            {/* RESOURCE LOCATIONS */}

            {mapResources.map((resource) => {

              const lat = Number(resource.latitude);
              const lng = Number(resource.longitude);

              if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
              ) {
                return null;
              }

              const status =
                resource?.status || "Unknown";

              const markerColor =
                status === "Available"
                  ? "#22c55e"
                  : status === "Busy"
                  ? "#eab308"
                  : "#ef4444";

              return (
                <CircleMarker
                  key={
                    resource?._id ||
                    resource?.id ||
                    `${lat}-${lng}-${resource?.name}`
                  }
                  center={[lat, lng]}
                  radius={9}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.9
                  }}
                >

                  <Popup>

                    <div className="text-sm">

                      <strong>
                        {resource?.name ||
                          "Emergency Resource"}
                      </strong>

                      <br />

                      Type:{" "}
                      {resource?.type ||
                        "Emergency Unit"}

                      <br />

                      Location:{" "}
                      {resource?.city ||
                        resource?.location ||
                        "N/A"}

                      <br />

                      Status:{" "}
                      <b>
                        {status}
                      </b>

                      <br />

                      Contact:{" "}
                      {resource?.contact ||
                        resource?.phone ||
                        "N/A"}

                    </div>

                  </Popup>

                </CircleMarker>
              );

            })}


            {/* DEPLOYMENT ROUTES */}

            {deploymentPlan?.resources
              ?.filter(
                (resource) =>
                  resource?.latitude != null &&
                  resource?.longitude != null
              )
              .map((resource) => {

                const lat =
                  Number(resource.latitude);

                const lng =
                  Number(resource.longitude);

                if (
                  !Number.isFinite(lat) ||
                  !Number.isFinite(lng)
                ) {
                  return null;
                }

                return (
                  <Polyline
                    key={`route-${resource?._id || resource?.id || resource?.name}`}
                    positions={[
                      [targetLat, targetLng],
                      [lat, lng]
                    ]}
                    pathOptions={{
                      color: "#22c55e",
                      weight: 2,
                      dashArray: "8 8"
                    }}
                  />
                );

              })}

          </MapContainer>
        );

      })()}

    </div>
  )}


  {/* MAP LEGEND */}

  {showResourceMap && (
    <div className="flex flex-wrap gap-4 mt-4 text-xs">

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        <span className="text-gray-400">
          Disaster
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        <span className="text-gray-400">
          Available
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
        <span className="text-gray-400">
          Busy
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        <span className="text-gray-400">
          Unavailable
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-green-400">
          ┄┄┄
        </span>
        <span className="text-gray-400">
          Deployment connection
        </span>
      </div>

    </div>
  )}

</div>


    {/* RESOURCE SEARCH */}
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="flex flex-col lg:flex-row gap-3">

        <input
          value={resourceSearch}
          onChange={(e) => setResourceSearch(e.target.value)}
          placeholder="Search resource, city or location..."
          className="flex-1 px-4 py-3 rounded-xl bg-black/30
          border border-white/10 text-white text-sm outline-none
          focus:border-green-500/50"
        />

        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="px-4 py-3 rounded-xl bg-black/30
          border border-white/10 text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="rescue team">Rescue Team</option>
          <option value="ambulance">Ambulance</option>
          <option value="hospital">Hospital</option>
          <option value="shelter">Shelter</option>
          <option value="fire station">Fire Station</option>
          <option value="rescue vehicle">Rescue Vehicle</option>
        </select>

        <select
          value={resourceStatus}
          onChange={(e) => setResourceStatus(e.target.value)}
          className="px-4 py-3 rounded-xl bg-black/30
          border border-white/10 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
          <option value="Unavailable">Unavailable</option>
        </select>

      </div>

<div className="flex flex-wrap gap-3 mt-4">

  <button
    type="button"
    onClick={() => setResourceSearched(true)}
    className="px-5 py-3 rounded-xl bg-green-500
    text-black font-black text-sm
    hover:bg-green-400 transition"
  >
    🔎 Search Resources
  </button>

  <button
    type="button"
    onClick={() => {
      setResourceSearch("");
      setResourceType("all");
      setResourceStatus("all");
      setResourceSearched(false);
      setFilteredResourceCount(0);
    }}
    className="px-5 py-3 rounded-xl
    border border-white/10
    bg-white/[0.03]
    text-gray-300
    font-bold text-sm
    hover:bg-white/[0.06] transition"
  >
    ↻ Clear Filters
  </button>

</div>

{resourceSearched && (
  <div className="flex flex-wrap items-center justify-between gap-3 mt-4">

    <p className="text-xs text-gray-400">
      Showing{" "}
      <span className="text-green-400 font-bold">
        {filteredResourceCount}
      </span>{" "}
      matching resources
    </p>

    {(resourceSearch ||
      resourceType !== "all" ||
      resourceStatus !== "all") && (
      <p className="text-[10px] text-gray-500">
        Filters applied
      </p>
    )}

  </div>
)}

     {/* RESOURCE LIST */}
{resourceSearched && (
  <>
    {(() => {

      const filteredResources = resources.filter((resource) => {

        const text = `${resource.name || ""} ${
          resource.city || ""
        } ${resource.location || ""} ${
          resource.type || ""
        }`.toLowerCase();

        const searchValue =
          resourceSearch.trim().toLowerCase();

        const matchesSearch =
          !searchValue ||
          text.includes(searchValue);

        const matchesType =
          resourceType === "all" ||
          (resource.type || "").toLowerCase() ===
            resourceType.toLowerCase();

        const matchesStatus =
          resourceStatus === "all" ||
          resource.status === resourceStatus;

        return (
          matchesSearch &&
          matchesType &&
          matchesStatus
        );
      });

      return (
        <>
          {/* RESULT COUNT */}
          <p className="text-xs text-gray-400 mt-4">
            Showing{" "}
            <span className="text-green-400 font-bold">
              {filteredResources.length}
            </span>{" "}
            matching resources
          </p>

          {/* RESOURCE CARDS */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">

            {filteredResources.map((resource) => (

              <div
                key={resource._id}
                className="rounded-2xl border border-white/10
                bg-black/20 p-5 hover:border-green-500/30 transition"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <h3 className="font-bold text-white">
                      {resource.name || "Unnamed Resource"}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {resource.type || "Emergency Resource"}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      resource.status === "Available"
                        ? "bg-green-500/10 text-green-400"
                        : resource.status === "Busy"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {resource.status || "Unknown"}
                  </span>

                </div>

                <div className="mt-5 space-y-2 text-xs">

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Location
                    </span>

                    <span className="text-gray-300 text-right">
                      {resource.city ||
                        resource.location ||
                        "Not available"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Contact
                    </span>

                    <span className="text-gray-300">
                      {resource.contact ||
                        "Not available"}
                    </span>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-2 mt-5">

                  <button
                    type="button"
                    onClick={() => callResource(resource)}
                    className="py-2.5 rounded-lg
                    border border-green-500/20
                    text-green-400 text-xs font-bold
                    hover:bg-green-500/10 transition"
                  >
                    📞 Contact
                  </button>

                  <button
                    type="button"
                    onClick={() => openResourceRoute(resource)}
                    className="py-2.5 rounded-xl
                    border border-blue-500/20
                    text-blue-400 text-xs font-bold
                    hover:bg-blue-500/10 transition"
                  >
                    📍 Route
                  </button>

                </div>

              </div>

            ))}

          </div>

          {/* NO MATCH */}
          {filteredResources.length === 0 && (
            <div className="rounded-xl border border-dashed
            border-white/10 p-8 text-center mt-5">

              <div className="text-3xl">🔍</div>

              <p className="text-sm text-gray-300 font-bold mt-3">
                No matching resources
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Try changing the search text or filters.
              </p>

            </div>
          )}

        </>
      );

    })()}
  </>
)}


      {resourceSearched && resources.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No resources found in database.
        </div>
      )}

    </div>


   

    {/* EMPTY DEPLOYMENT STATE */}
    {!deploymentPlan &&
      !resourceTargetAlert &&
      !resourceTargetReport && (
        <div className="rounded-2xl border border-dashed
        border-white/10 p-10 text-center">

          <div className="text-4xl">🚨</div>

          <h3 className="text-lg font-bold text-white mt-3">
            Ready for Emergency Deployment
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            Open an official alert from Dashboard or select a disaster
            report and choose Resources to calculate the nearest
            emergency response units.
          </p>

        </div>
      )}

  </section>
)}

{activePage === "sos" && (
  <section className="mt-6">

    {/* HEADER */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          🚨 All SOS Alerts
        </h1>

        <p className="text-sm text-gray-400 mt-1">
          Emergency requests received by Disaster-X
        </p>
      </div>

      <button
        type="button"
        onClick={() => setActivePage("dashboard")}
        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10"
      >
        ← Dashboard
      </button>
    </div>


    {/* SOS RECORDS */}
    {sosReports.length === 0 ? (

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-4xl mb-3">🛡️</div>

        <h2 className="text-white font-black">
          No SOS Alerts
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          No emergency requests have been received.
        </p>
      </div>

    ) : (

      <div className="space-y-4">

        {sosReports.map((sos, index) => {

          const mapUrl =
            sos.latitude != null &&
            sos.longitude != null
              ? `https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`
              : null;

          return (
            <div
              key={sos._id}
              className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    🚨
                  </div>

                  <div>
                    <h3 className="text-white font-black">
                      SOS ALERT #{sosReports.length - index}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Priority:{" "}
                      <span className="text-red-400 font-bold">
                        {sos.priority}
                      </span>
                    </p>
                  </div>

                </div>

                <span className="text-xs text-gray-400">
                  {new Date(sos.createdAt).toLocaleString()}
                </span>

              </div>


              {/* LOCATION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-[10px] text-gray-500 font-bold">
                    LATITUDE
                  </p>

                  <p className="text-sm text-white font-bold mt-1">
                    {sos.latitude ?? "Unavailable"}
                  </p>
                </div>


                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-[10px] text-gray-500 font-bold">
                    LONGITUDE
                  </p>

                  <p className="text-sm text-white font-bold mt-1">
                    {sos.longitude ?? "Unavailable"}
                  </p>
                </div>


                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-[10px] text-gray-500 font-bold">
                    GPS ACCURACY
                  </p>

                  <p className="text-sm text-white font-bold mt-1">
                    {sos.locationAccuracy != null
                      ? `${Math.round(sos.locationAccuracy)} m`
                      : "Unavailable"}
                  </p>
                </div>

              </div>


              {/* VIEW LOCATION */}
              {mapUrl && (
                <div className="mt-4 flex justify-end">

                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black hover:bg-cyan-500/20"
                  >
                    📍 VIEW LOCATION
                  </a>

                </div>
              )}

            </div>
          );
        })}

      </div>
    )}

  </section>
)}
       
{activePage === "reports" && (
  <section>

    {/* HEADER */}
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="text-red-400" size={25} />
            </div>
          </div>

          <span className="text-red-400 text-xs font-bold tracking-[0.2em]">
            INCIDENT INTELLIGENCE
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Disaster Report Center
        </h2>

        <p className="text-slate-400 mt-2 max-w-2xl">
          Centralized monitoring of reported disasters, affected
          locations and incident severity.
        </p>
      </div>


      {/* LIVE STATUS */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/5 border border-green-500/20">

        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
        </span>

        <div>
          <p className="text-xs text-green-400 font-semibold">
            SYSTEM ONLINE
          </p>

          <p className="text-[11px] text-slate-500">
            Live monitoring active
          </p>
        </div>

      </div>

    </div>


    {/* TOP ANALYTICS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">

      {/* TOTAL */}
      <div className="group bg-gradient-to-br from-[#101f34] to-[#091525] border border-cyan-500/10 rounded-2xl p-5 hover:border-cyan-400/30 transition">

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">
            Total Incidents
          </span>

          <div className="p-2 rounded-xl bg-cyan-500/10">
            <Activity className="text-cyan-400" size={19} />
          </div>
        </div>

        <h3 className="text-3xl font-bold mt-4">
          {disasters.length}
        </h3>

        <p className="text-xs text-cyan-400 mt-2">
          Reports received
        </p>

      </div>

{/* CRITICAL */}
<div className="group bg-gradient-to-br from-[#241522] to-[#0d1726] border border-red-500/10 rounded-2xl p-5 hover:border-red-400/30 transition">

  <div className="flex items-center justify-between">
    <span className="text-slate-400 text-sm">
      Critical Incidents
    </span>

    <div className="p-2 rounded-xl bg-red-500/10">
      <AlertTriangle className="text-red-400" size={19} />
    </div>
  </div>

  <h3 className="text-3xl font-bold text-red-400 mt-4">
    {
      disasters.filter(
        item => item.severity?.toLowerCase() === "critical"
      ).length
    }
  </h3>

  <p className="text-xs text-red-300 mt-2">
    Requires immediate attention
  </p>

</div>
      

      {/* LOCATIONS */}
      <div className="group bg-gradient-to-br from-[#202015] to-[#0d1726] border border-yellow-500/10 rounded-2xl p-5 hover:border-yellow-400/30 transition">

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">
            Affected Zones
          </span>

          <div className="p-2 rounded-xl bg-yellow-500/10">
            <MapPin className="text-yellow-400" size={19} />
          </div>
        </div>

        <h3 className="text-3xl font-bold text-yellow-400 mt-4">
          {
            new Set(
              disasters.map(item => item.location)
            ).size
          }
        </h3>

        <p className="text-xs text-yellow-300 mt-2">
          Unique locations
        </p>

      </div>


      {/* DATABASE */}
      <div className="group bg-gradient-to-br from-[#10231e] to-[#091525] border border-green-500/10 rounded-2xl p-5 hover:border-green-400/30 transition">

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">
            Data Connection
          </span>

          <div className="p-2 rounded-xl bg-green-500/10">
            <ShieldCheck className="text-green-400" size={19} />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-green-400 mt-4">
          CONNECTED
        </h3>

        <p className="text-xs text-green-300 mt-2">
          MongoDB operational
        </p>

      </div>

    </div>

{/* REPORT CONTROL BAR */}
<div className="bg-[#0b182a] border border-slate-800 rounded-2xl p-4 mb-5">

  <div className="flex flex-col xl:flex-row gap-4">

    {/* TITLE */}
    <div className="xl:w-1/4">
      <h3 className="font-bold text-lg">
        Incident Feed
      </h3>

      <p className="text-xs text-slate-500 mt-1">
        Search and filter reported incidents
      </p>
    </div>


    {/* SEARCH */}
    <div className="relative flex-1">

      <Activity
        size={17}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
      />

      <input
        type="text"
        placeholder="Search disaster, location or description..."
        value={reportSearch}
        onChange={(e) => setReportSearch(e.target.value)}
        className="w-full bg-[#081423] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/40"
      />

    </div>


    {/* FILTER */}
    <select
      value={reportFilter}
      onChange={(e) => setReportFilter(e.target.value)}
      className="bg-[#081423] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-500/40"
    >
      <option value="all">All Severity</option>
      <option value="critical">Critical</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>


    {/* REFRESH */}
    <button
      onClick={fetchDisasterData}
      className="px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition"
    >
      ↻ Refresh
    </button>

  </div>



    {/* REPORTS */}
    {disasters.length === 0 ? (

      <div className="relative overflow-hidden bg-[#0b182a] border border-slate-800 rounded-2xl p-12 text-center">

        <div className="absolute inset-0 bg-cyan-500/[0.02]"></div>

        <div className="relative">

          <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-800/50">
            <AlertTriangle
              size={38}
              className="text-slate-500"
            />
          </div>

          <h3 className="text-xl font-bold mt-5">
            No Incidents Detected
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Disaster reports will appear here when submitted.
          </p>

        </div>

      </div>

    ) : (

      <div className="space-y-4">

  {disasters
    .filter((item) => {

      const search = reportSearch.toLowerCase();

      return (
        item.type?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );

    })
    .filter((item) => {

      if (reportFilter === "all") return true;

      return (
        item.severity?.toLowerCase() === reportFilter
      );

    })
    .map((item, index) => {

          const severity =
            item.severity?.toLowerCase();

          const isCritical = severity === "critical";
          const isHigh = severity === "high";
          const isMedium = severity === "medium";

          const badgeClass = isCritical
  ? "bg-red-600/20 text-red-300 border-red-500/30"
  : isHigh
  ? "bg-red-500/10 text-red-400 border-red-500/20"
  : isMedium
  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  : "bg-green-500/10 text-green-400 border-green-500/20";

          return (

            <div
              key={item._id}
              className="group relative overflow-hidden bg-[#0b182a] border border-slate-800 rounded-2xl hover:border-cyan-500/30 transition duration-300"
            >

              {/* SIDE STATUS LINE */}
              <div
  className={`absolute left-0 top-0 bottom-0 w-1 ${
    isCritical
      ? "bg-red-600"
      : isHigh
      ? "bg-red-500"
      : isMedium
      ? "bg-yellow-400"
      : "bg-green-400"
  }`}
>
 </div>



              <div className="p-5 md:p-6">

                {/* TOP */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                  <div className="flex items-start gap-4">

                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/10">
                      <AlertTriangle
                        className="text-red-400"
                        size={23}
                      />
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-xl font-bold">
                          {item.type || "Unknown Disaster"}
                        </h3>

                        <span
                          className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider ${badgeClass}`}
                        >
                          {(item.severity || "UNKNOWN").toUpperCase()}
                        </span>

                      </div>


                      <div className="flex flex-wrap items-center gap-4 mt-2">

                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin size={15} className="text-cyan-400" />
                          {item.location || "Location unavailable"}
                        </div>

                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>

                        <span className="text-xs text-slate-500">
                          Incident #{String(index + 1).padStart(3, "0")}
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* DATE */}
                  <div className="text-left lg:text-right">

                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Reported At
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Unknown"}
                    </p>

                  </div>

                </div>


                {/* DESCRIPTION */}
                <div className="mt-5 ml-0 md:ml-[58px]">

                  <div className="bg-[#081423] border border-slate-800/80 rounded-xl p-4">

                    <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">
                      Incident Description
                    </p>

                    <p className="text-sm text-slate-400 leading-6">
                      {item.description ||
                        "No additional information provided."}
                    </p>

                  </div>

                </div>


                {/* BOTTOM */}
                <div className="mt-4 ml-0 md:ml-[58px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <span className="w-2 h-2 rounded-full bg-green-400"></span>

                    <span className="text-xs text-green-400">
                      REPORT RECEIVED
                    </span>

                  </div>

                <div className="flex flex-wrap items-center gap-2">

  <span className="text-[10px] text-slate-600 font-mono mr-2">
    ID: {item._id}
  </span>

  {/* VIEW DETAILS */}
  <button
    onClick={() => setSelectedReport(item)}
    className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition"
  >
    View Details
  </button>

  {/* VIEW MAP */}
  <button
    onClick={() => {
      setSelectedReport(null);
      setSelectedMapAlert(item);
      setActivePage("map");
    }}
    className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/10 transition"
  >
    📍 Map
  </button>

  {/* FIND RESOURCES */}
  <button
    onClick={() => {
      setResourceTargetReport(item);
      setSelectedReport(null);
      setActivePage("resources");
    }}
    className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/10 transition"
  >
    🚑 Resources
  </button>

</div>

                </div>

              </div>

            </div>

          );
        })}

      </div>

    )}


    {/* FOOTER INTELLIGENCE PANEL */}
    <div className="mt-7 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 border border-cyan-500/10 rounded-2xl p-5">

      <div className="flex flex-col md:flex-row md:items-center gap-4">

        <div className="p-3 rounded-xl bg-cyan-500/10 w-fit">
          <Brain className="text-cyan-400" size={22} />
        </div>

        <div>
          <h3 className="font-semibold">
            Disaster-X Intelligence Pipeline
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Incoming reports can later be processed by the AI
            engine for risk scoring, prediction and automated
            response recommendations.
          </p>
        </div>

        <div className="md:ml-auto flex items-center gap-2 text-xs text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          MONITORING
        </div>

      
</div>
</div>
</div>
  

    {/* REPORT DETAILS MODAL */}

{/* {selectedReport && (
  <div
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => setSelectedReport(null)}
  >

    <div
      className="w-full max-w-2xl bg-[#0b182a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >

      {/* MODAL HEADER */}
      {/* <div className="flex items-center justify-between p-6 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-red-500/10">
            <AlertTriangle
              className="text-red-400"
              size={22}
            />
            </div>
          

          <div>
            <p className="text-xs text-red-400 tracking-wider font-semibold">
              INCIDENT DETAILS
            </p>

            <h3 className="text-xl font-bold mt-1">
              {selectedReport.type}
            </h3>
          </div>

        </div>

        <button
          onClick={() => setSelectedReport(null)}
          className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          ✕
        </button>

      </div>


      {/* MODAL BODY */}
      {/* <div className="p-6 space-y-5">

        {/* STATUS */}
        {/* <div className="flex items-center justify-between bg-[#081423] border border-slate-800 rounded-xl p-4">

          <div>
            <p className="text-xs text-slate-500">
              SEVERITY
            </p>

            <p className="font-semibold mt-1">
              {selectedReport.severity?.toUpperCase()}
            </p>
          </div> */}

          {/* <span className="px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
            ACTIVE REPORT
          </span>

        </div>


        {/* LOCATION */}
        {/* <div className="bg-[#081423] border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <MapPin size={16} />
            LOCATION
          </div>

          <p className="text-slate-200 mt-2">
            {selectedReport.location || "Location unavailable"}
          </p>

        </div>
  */}

        {/* DESCRIPTION */}
        {/* <div className="bg-[#081423] border border-slate-800 rounded-xl p-4">

          <p className="text-xs text-slate-500 font-semibold">
            INCIDENT DESCRIPTION
          </p>

          <p className="text-sm text-slate-300 leading-6 mt-2">
            {selectedReport.description ||
              "No description provided."}
          </p>

        </div> */}


        {/* TIME */}
         {/* <div className="grid sm:grid-cols-2 gap-4">

          <div className="bg-[#081423] border border-slate-800 rounded-xl p-4">

            <p className="text-xs text-slate-500">
              REPORTED AT
            </p>

            <p className="text-sm text-slate-300 mt-2">
              {selectedReport.createdAt
                ? new Date(
                    selectedReport.createdAt
                  ).toLocaleString()
                : "Unknown"}
            </p>

          </div>


          <div className="bg-[#081423] border border-slate-800 rounded-xl p-4">

            <p className="text-xs text-slate-500">
              DATABASE ID
            </p>

            <p className="text-xs text-cyan-400 mt-2 break-all font-mono">
              {selectedReport._id}
            </p>

          </div>

        </div> 

      </div> */}


      {/* MODAL FOOTER */}
      {/* <div className="p-5 border-t border-slate-800 flex justify-end">

        <button
          onClick={() => setSelectedReport(null)}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}   */}

{selectedReport && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5">
    
    <div className="w-full max-w-lg bg-[#0c1a2c] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-cyan-400 font-semibold">
            DISASTER REPORT
          </p>

          <h3 className="text-2xl font-bold mt-1">
            {selectedReport.type || "Unknown Disaster"}
          </h3>
        </div>

        <button
          onClick={() => setSelectedReport(null)}
          className="text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">

        <div>
          <p className="text-xs text-slate-500">Location</p>
          <p className="text-sm font-semibold flex items-center gap-2">
            📍 {selectedReport.location}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Severity</p>
          <p className="text-sm font-semibold">
            ⚠️ {selectedReport.severity}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Risk Level</p>
          <p className="text-sm font-semibold text-red-400">
            {selectedReport.severity?.toLowerCase() === "critical"
              ? "95%"
              : selectedReport.severity?.toLowerCase() === "high"
              ? "85%"
              : selectedReport.severity?.toLowerCase() === "medium"
              ? "60%"
              : "30%"}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Description</p>
          <p className="text-sm text-slate-300">
            {selectedReport.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Latitude</p>
            <p className="text-sm">{selectedReport.latitude}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Longitude</p>
            <p className="text-sm">{selectedReport.longitude}</p>
          </div>
        </div>

      </div>
      <button
  onClick={() => {
    setSelectedReport(null);
    setActivePage("map");
  }}
  className="w-full py-3 rounded-xl border border-cyan-400 text-cyan-400 font-bold hover:bg-cyan-400/10"
>
  📍 View on Map
</button>

      <button
        onClick={() => setSelectedReport(null)}
        className="w-full mt-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
      >
        Close
      </button>

    </div>
  </div>
)}

  </section>
)}


            
        
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 mt-10">
        <div className="max-w-7xl mx-auto px-5 py-5 text-xs text-slate-500 flex justify-between">
          <span>DISASTER-X • AI Disaster Intelligence Platform</span>
          <span>Prototype MVP</span>
        </div>
      </footer>

       <DisasterForm /> 

    </div>
  );
}

export default App;