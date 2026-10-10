import axios from "axios";
import { useEffect, useState } from "react";

function DisasterForm() {
  const [formData, setFormData] = useState({
    type: "",
    location: "",
    severity: "",
    description: "",
  });
  const [isOnline, setIsOnline] = useState(
  navigator.onLine
);

const [offlineReports, setOfflineReports] = useState([]);

const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("FORM DATA:", formData);
  if (!navigator.onLine) {
  saveOfflineReport(formData);
  return;
}


  try {
   let latitude = null;
   let longitude = null;

const location = formData.location.trim();

try {
  const geoResponse = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: `${location}, India`,
        format: "json",
        limit: 1,
      },
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  if (geoResponse.data.length > 0) {
    latitude = Number(geoResponse.data[0].lat);
    longitude = Number(geoResponse.data[0].lon);
  }
} catch (geoError) {
  console.error("Location coordinates not found:", geoError);
}


    const response = await axios.post(
      "http://localhost:5000/api/disasters",
      {
      ...formData,
      latitude,
      longitude,
      }
    );

    alert("Disaster report saved successfully!");
    window.location.reload();

    setFormData({
      type: "",
      location: "",
      severity: "",
      description: "",
    });

    console.log(response.data);
 } catch (error) {
  console.error("Backend connection failed:", error);

  saveOfflineReport(formData);

  setSubmitMessage(
    "⚠️ Server unavailable. Report saved offline and will sync automatically."
  );
}
};
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    syncOfflineReports();
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Page load par bhi pending reports check karo
  if (navigator.onLine) {
    syncOfflineReports();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
const saveOfflineReport = (report) => {
  const existingReports = JSON.parse(
    localStorage.getItem("disasterXOfflineReports") || "[]"
  );

  const offlineReport = {
    ...report,
    offlineId: Date.now(),
    savedOffline: true,
    createdAt: new Date().toISOString()
  };

  const updatedReports = [
    ...existingReports,
    offlineReport
  ];

  localStorage.setItem(
    "disasterXOfflineReports",
    JSON.stringify(updatedReports)
  );

  setOfflineReports(updatedReports);

  setSubmitMessage(
    "Report saved offline. It will sync automatically when internet returns."
  );
};

const syncOfflineReports = async () => {
  const savedReports = JSON.parse(
    localStorage.getItem("disasterXOfflineReports") || "[]"
  );

  if (savedReports.length === 0) {
    return;
  }

  const remainingReports = [];

  for (const report of savedReports) {
    try {
      const { offlineId, savedOffline, ...reportData } = report;

      let latitude = null;
      let longitude = null;

      const location = reportData.location?.trim();

      if (location) {
        try {
          const geoResponse = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
              params: {
                q: `${location}, India`,
                format: "json",
                limit: 1,
              },
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (geoResponse.data.length > 0) {
            latitude = Number(geoResponse.data[0].lat);
            longitude = Number(geoResponse.data[0].lon);
          }
        } catch (geoError) {
          console.error(
            "Offline report location lookup failed:",
            geoError
          );
        }
      }

      await axios.post(
        "http://localhost:5000/api/disasters",
        {
          ...reportData,
          latitude,
          longitude,
        }
      );

      console.log(
        "✅ Offline report synced:",
        offlineId
      );

    } catch (error) {
      console.error(
        "❌ Offline report sync failed:",
        error
      );

      remainingReports.push(report);
    }
  }

  localStorage.setItem(
    "disasterXOfflineReports",
    JSON.stringify(remainingReports)
  );

  setOfflineReports(remainingReports);

  if (remainingReports.length === 0) {
    setSubmitMessage(
      "✅ All offline reports synced successfully."
    );
  } else {
    setSubmitMessage(
      `${remainingReports.length} report(s) still waiting to sync.`
    );
  }
};

return (
  
  <div className="max-w-6xl mx-auto px-4 py-6">
    <div
  className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold ${
    isOnline
      ? "bg-green-500/10 text-green-400 border border-green-500/20"
      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
  }`}
>
  {isOnline
    ? "🟢 Online — Reports will be submitted normally"
    : "🟡 Offline — Reports will be saved and synced later"}
</div>

{submitMessage && (
  <div className="mb-4 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold">
    {submitMessage}
  </div>
)}

{/* Submit Report */}

    {/* Submit Report */}
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1728] px-5 py-4">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>

            <h2 className="text-sm font-bold text-white">
              Report a Disaster
            </h2>
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Help Disaster-X detect incidents faster.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const form = document.getElementById("disaster-report-form");
            form?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }}
          className="shrink-0 rounded-lg bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
        >
          + Submit Report
        </button>

      </div>
    </div>


    {/* Actual Form */}
    <div
      id="disaster-report-form"
      className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1728] p-5"
    >

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            name="type"
            placeholder="Disaster Type"
            value={formData.type}
            onChange={handleChange}
            required
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />

        </div>

        <select
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">Select Severity</option>
          <option value="Low">🟢 Low</option>
          <option value="Medium">🟡 Medium</option>
          <option value="High">🟠 High</option>
          <option value="Critical">🔴 Critical</option>
        </select>

        <textarea
          name="description"
          placeholder="Describe the incident..."
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition"
        >
          🚨 Submit Disaster Report
        </button>

      </form>

    </div>


    {/* ================= FOOTER ================= */}
    <footer className="mt-8 border-t border-slate-800">

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5">

        {/* Brand */}
        <div className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 border border-cyan-400/20">
            🛡️
          </div>

          <div>
            <p className="text-xs font-black tracking-[0.18em] text-white">
              DISASTER-X
            </p>

            <p className="text-[8px] tracking-widest text-cyan-400">
              PREDICT • DETECT • RESPOND
            </p>
          </div>

        </div>


        {/* Center */}
        <p className="text-[9px] text-slate-600 text-center">
          AI-powered disaster intelligence platform
        </p>


        {/* Status */}
        <div className="flex items-center gap-2">

          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />

          <span className="text-[9px] font-bold text-green-400">
            SYSTEM ONLINE
          </span>

        </div>

      </div>


      <div className="border-t border-slate-900 py-3 text-center">

        <p className="text-[8px] text-slate-700">
          © 2026 Disaster-X • Built for faster disaster response
        </p>

      </div>

    </footer>

  </div>
);
 
}

export default DisasterForm;