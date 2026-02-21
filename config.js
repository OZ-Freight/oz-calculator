/* config.js */
window.OZ_FREIGHT_CONFIG = {
  brand: {
    corpName: "OZ Freight",
    title: "OZ Freight: Calculator",
  },

  // Edit this quickly when you go on vacation:
  serviceStatus: {
    label: "Service status",
    text: "Active - Normal operations",
    dotColor: "#39ff88",
  },

  locations: {
    high:    { label: "High-sec",  accent: "#39ff88" },
    low:     { label: "Low-sec",   accent: "#d97c2b" },
    thera:   { label: "Thera",     accent: "#3da8ff" },
    pochven: { label: "Pochven",   accent: "#ff3d6e" },
  },

  serviceSizes: {
    s13:  { label: "13,000 m³",  volume: 13000,  collateral: 5_000_000_000 },
    s60:  { label: "60,000 m³",  volume: 60000,  collateral: 5_000_000_000 },
    s900: { label: "800,000 m³", volume: 800000, collateral: 3_000_000_000 },
  },

  speedModes: {
    normal: { label: "Normal Speed", tAcceptDays: 3, tCompleteDays: 3 },
    rush:   { label: "Rush Speed",   tAcceptDays: 1, tCompleteDays: 1 },
  },

  restrictions: {
    allowedSizes: {
      high:   ["s13","s60","s800"],
      low:    ["s13"],
      thera:  ["s13","s60"],
      pochven:["s13","s60"],
    },

    allowedSpeeds: {
      high:   ["normal","rush"],
      low:    ["normal"],
      thera:  ["normal","rush"],
      pochven:["normal"],
    },
  },

  pricing: {
    /**
     * Security Top-Up (smooth base price fade-out)
     * Applies to small routes to avoid underpaying "micro contracts".
     *
     * Formula (High/Low only):
     *   P      = ratePerJump * jumps
     *   factor = 1 - min(jumps, N) / N
     *   TopUp  = BaseBySize[size] * factor
     *   Reward = roundUp(P + TopUp, roundingStep)
     *
     * At jumps >= N, TopUp becomes 0 (pricing becomes pure per-jump).
     */
    securityTopUp: {
      enabledLocations: ["high", "low"],
      fadeOutJumps: 15, // N
      baseBySize: {
        s13:  15_000_000,
        s60:  20_000_000,
        s800: 20_000_000,
      },
      roundingStep: 100_000, // PushX-style: round up to 100k
    },

    perJump: {
      high: {
        s800: { normal: 1_800_000, rush: 2_800_000 },
        s60:  { normal: 1_500_000, rush: 2_500_000 },
        s13:  { normal: 1_200_000, rush: 2_200_000 },
      },
      low: {
        s13:  { normal: 2_000_000 },
      },
    },

    fixed: {
      thera: {
        s13: { normal: 50_000_000, rush: 70_000_000 },
        s60: { normal: 65_000_000, rush: 85_000_000 },
      },
      pochven: {
        s13: { normal: 90_000_000 },
        s60: { normal: 120_000_000 },
      },
    },
  },

  warnings: {
    high:
      "We accept public player-owned structures, but we reserve the right to refuse a contract if a structure is not considered trustworthy. You will receive an in-game mail explaining the reason.",
    low:
      "Player-owned structures are NOT permitted under the Low-sec service. Only NPC stations are accepted. Rush speed is not available for safety reasons.",
    pochven:
      "Public structures belonging to the HOTEL alliance are covered by this service. All other destinations must be NPC stations only. Rush speed is not available for safety reasons.",
    thera:
      "Thera routes are handled with limited logistics. Only 13,000 m³ and 60,000 m³ services are supported.",
  },

  externalLinks: {
    dotlanRoutePlanner: "https://evemaps.dotlan.net/route",
  },
};

