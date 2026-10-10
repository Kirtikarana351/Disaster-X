import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function RealDigitalTwin({
  alerts = [],
  disasterLat,
  disasterLng,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const alertsRef = useRef(alerts);

  useEffect(() => {
    alertsRef.current = alerts;

    const map = mapRef.current;
    if (!map) return;

    const updateAlerts = () => {
      if (!map.getSource("disaster-alerts")) return;

      map.getSource("disaster-alerts").setData({
        type: "FeatureCollection",
        features: alertsRef.current
          .filter((alert) => {
            const lat = Number(alert.latitude);
            const lng = Number(alert.longitude);

            return (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              Math.abs(lat) <= 90 &&
              Math.abs(lng) <= 180
            );
          })
          .map((alert, index) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                Number(alert.longitude),
                Number(alert.latitude),
              ],
            },
            properties: {
              id: String(alert._id || alert.id || index),
              title: alert.title || alert.disasterType || "Disaster Alert",
              severity: alert.severity || "HIGH",
              description: alert.description || "Disaster reported",
            },
          })),
      });
    };

    updateAlerts();
  }, [alerts]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const validLat =
      Number.isFinite(Number(disasterLat)) &&
      Math.abs(Number(disasterLat)) <= 90;

    const validLng =
      Number.isFinite(Number(disasterLng)) &&
      Math.abs(Number(disasterLng)) <= 180;

    const center = [
      validLng && validLat ? Number(disasterLng) : 77.209,
      validLng && validLat ? Number(disasterLat) : 28.6139,
    ];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center,
      zoom: 15,
      pitch: 60,
      bearing: -20,
      minZoom: 3,
      maxZoom: 21,
      maxPitch: 85,
      canvasContextAttributes: {
        antialias: true,
      },
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(
      new maplibregl.FullscreenControl(),
      "top-right"
    );

    map.on("load", () => {
      const styleLayers = map.getStyle().layers || [];

      const buildingLayer = styleLayers.find(
        (layer) => layer["source-layer"] === "building"
      );

      if (buildingLayer) {
        const sourceId = buildingLayer.source;
        const sourceLayer = buildingLayer["source-layer"];

        map.addLayer(
          {
            id: "disaster-3d-buildings",
            source: sourceId,
            "source-layer": sourceLayer,
            type: "fill-extrusion",
            minzoom: 14,
            filter: ["!=", ["get", "hide_3d"], true],
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "render_height"], 10],
                0,
                "#64748b",
                50,
                "#94a3b8",
                150,
                "#cbd5e1",
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                15,
                ["coalesce", ["get", "render_height"], 10],
              ],
              "fill-extrusion-base": [
                "coalesce",
                ["get", "render_min_height"],
                0,
              ],
              "fill-extrusion-opacity": 0.9,
            },
          },
          styleLayers.find(
            (layer) =>
              layer.type === "symbol" &&
              layer.layout?.["text-field"]
          )?.id
        );
      }

      map.addSource("disaster-alerts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "disaster-alert-glow",
        type: "circle",
        source: "disaster-alerts",
        paint: {
          "circle-radius": 19,
          "circle-color": "#ef4444",
          "circle-opacity": 0.2,
          "circle-blur": 0.8,
        },
      });

      map.addLayer({
        id: "disaster-alert-points",
        type: "circle",
        source: "disaster-alerts",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 5,
            15, 9,
            20, 13,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "CRITICAL", "#ff1744",
            "HIGH", "#ff5722",
            "MEDIUM", "#ffb300",
            "#ef4444",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", "disaster-alert-points", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const coordinates = feature.geometry.coordinates.slice();
        const properties = feature.properties || {};

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="color:#111827;min-width:180px">
              <strong>${String(properties.title || "Disaster Alert")}</strong>
              <p>Severity: ${String(properties.severity || "HIGH")}</p>
              <p>${String(properties.description || "")}</p>
              <small>
                ${coordinates[1].toFixed(5)},
                ${coordinates[0].toFixed(5)}
              </small>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "disaster-alert-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "disaster-alert-points", () => {
        map.getCanvas().style.cursor = "";
      });

      const features = alertsRef.current
        .filter((alert) => {
          const lat = Number(alert.latitude);
          const lng = Number(alert.longitude);

          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180
          );
        })
        .map((alert, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              Number(alert.longitude),
              Number(alert.latitude),
            ],
          },
          properties: {
            id: String(alert._id || alert.id || index),
            title: alert.title || alert.disasterType || "Disaster Alert",
            severity: alert.severity || "HIGH",
            description: alert.description || "Disaster reported",
          },
        }));

      map.getSource("disaster-alerts").setData({
        type: "FeatureCollection",
        features,
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-[600px] w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950">
      <div
        ref={mapContainer}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-cyan-400/30 bg-slate-950/85 px-4 py-3 text-white shadow-xl">
        <div className="text-xs font-bold tracking-[0.2em] text-cyan-300">
          DISASTER-X
        </div>
        <div className="mt-1 text-lg font-black">
          REAL-WORLD DIGITAL TWIN
        </div>
        <div className="mt-1 text-xs text-slate-300">
          3D Buildings · Roads · Disaster Alerts
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-slate-200">
        Scroll to zoom · Drag to rotate · Click an alert for details
      </div>
    </div>
  );
}