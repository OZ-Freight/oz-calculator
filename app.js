/* app.js */
(() => {
  const config = window.OZ_FREIGHT_CONFIG;
  if (!config) {
    console.error("Missing OZ_FREIGHT_CONFIG. Did you load config.js before app.js?");
    return;
  }

  const el = {
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),

    speedHint: document.getElementById("speedHint"),
    accentChip: document.getElementById("accentChip"),

    reqContractTo: document.getElementById("reqContractTo"),
    reqAccept: document.getElementById("reqAccept"),
    reqComplete: document.getElementById("reqComplete"),
    reqVolume: document.getElementById("reqVolume"),
    reqCollateral: document.getElementById("reqCollateral"),
    reqFootnote: document.getElementById("reqFootnote"),

    copyContractTo: document.getElementById("copyContractTo"),
    copyCollateral: document.getElementById("copyCollateral"),

    warningText: document.getElementById("warningText"),

    calcMeta: document.getElementById("calcMeta"),
    routeLabel: document.getElementById("routeLabel"),
    routeInput: document.getElementById("routeInput"),
    routeHelp: document.getElementById("routeHelp"),
    dotlanLink: document.getElementById("dotlanLink"),

    rewardOutput: document.getElementById("rewardOutput"),
    rewardHelp: document.getElementById("rewardHelp"),
    copyReward: document.getElementById("copyReward"),

    discordLink: document.getElementById("discordLink"),
  };

  const nf = new Intl.NumberFormat("en-US"); // reward format (commas)

  const state = {
    location: "high",
    size: "s60",
    speed: "normal",
    jumps: "",
  };

  // ---- Helpers ----
  function hexToRgba(hex, alpha = 0.2) {
    const h = (hex || "").replace("#", "").trim();
    if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function plural(n, singular, pluralWord) {
    return n === 1 ? singular : pluralWord;
  }

  function fmtIsk(n) {
    return `${nf.format(n)} ISK`;
  }

  // For collateral: spaces instead of commas (premium / elegant)
  function fmtIskSpaces(n) {
    return `${nf.format(n).replaceAll(",", " ")} ISK`;
  }

  function fmtVolume(n) {
    return `${nf.format(n)} m³`;
  }

  async function copyText(text) {
    // Prefer modern clipboard API
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch (e) {
        console.warn("Copy failed:", e);
        return false;
      }
    }
  }

  function flashCopied(btn) {
    const old = btn.textContent;
    btn.textContent = "COPIED";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = old;
      btn.disabled = false;
    }, 900);
  }

  // ---- UI updates ----
  function applyServiceStatus() {
    const s = config.serviceStatus || {};
    el.statusText.textContent = s.text || "Active - Normal operations";
    el.statusDot.style.background = s.dotColor || "#39ff88";
    el.statusDot.style.boxShadow =
      `0 0 0 3px ${hexToRgba(s.dotColor || "#39ff88", 0.18)}, 0 0 22px ${hexToRgba(s.dotColor || "#39ff88", 0.25)}`;
  }

  function setAccentByLocation() {
    const loc = config.locations[state.location];
    const accent = loc?.accent || "#39ff88";

    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", hexToRgba(accent, 0.18));

    el.accentChip.textContent = loc?.label || state.location;
  }

  function updateSegmentedButtons() {
    const groups = document.querySelectorAll(".segmented");
    groups.forEach((seg) => {
      const group = seg.dataset.group;
      const selected = state[group];

      seg.querySelectorAll(".seg-btn").forEach((btn) => {
        const isSelected = btn.dataset.value === selected;
        btn.classList.toggle("is-active", isSelected);
        btn.setAttribute("aria-checked", isSelected ? "true" : "false");
      });
    });
  }

  function applyRestrictions() {
    const allowedSizes = config.restrictions.allowedSizes[state.location] || [];
    const allowedSpeeds = config.restrictions.allowedSpeeds[state.location] || [];

    if (!allowedSizes.includes(state.size)) state.size = allowedSizes[0] || "s13";
    if (!allowedSpeeds.includes(state.speed)) state.speed = allowedSpeeds[0] || "normal";

    document.querySelectorAll('.segmented[data-group="size"] .seg-btn').forEach((btn) => {
      const val = btn.dataset.value;
      const ok = allowedSizes.includes(val);
      btn.disabled = !ok;
      btn.title = ok ? "" : "Not available for this location";
    });

    const speedSeg = document.querySelector('.segmented[data-group="speed"]');
    speedSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      const val = btn.dataset.value;
      const ok = allowedSpeeds.includes(val);
      btn.disabled = !ok;

      if (!ok && (state.location === "low" || state.location === "pochven") && val === "rush") {
        btn.title = "Rush speed is not available here for safety reasons";
      } else {
        btn.title = ok ? "" : "Not available for this location";
      }
    });

    if (state.location === "low" || state.location === "pochven") {
      el.speedHint.textContent = "Rush speed is disabled for safety reasons in this location.";
    } else {
      el.speedHint.textContent = "";
    }
  }

  function updateRequirements() {
    el.reqContractTo.textContent = config.brand.corpName || "OZ Freight";

    const speedCfg = config.speedModes[state.speed];
    el.reqAccept.textContent = `${speedCfg.tAcceptDays} ${plural(speedCfg.tAcceptDays, "Day", "Days")}`;
    el.reqComplete.textContent = `${speedCfg.tCompleteDays} ${plural(speedCfg.tCompleteDays, "Day", "Days")}`;

    const sizeCfg = config.serviceSizes[state.size];
    el.reqVolume.textContent = fmtVolume(sizeCfg.volume);
    el.reqCollateral.textContent = fmtIskSpaces(sizeCfg.collateral);

    const locLabel = config.locations[state.location]?.label || state.location;
    const speedLabel = speedCfg.label;
    const sizeLabel = sizeCfg.label;

    el.calcMeta.textContent = `${locLabel} • ${sizeLabel} • ${speedLabel}`;
    el.reqFootnote.textContent = "Values update automatically based on the selected service.";
  }

  function updateWarning() {
    el.warningText.textContent = config.warnings[state.location] || "";
  }

  function updateRouteInputMode() {
    const loc = state.location;

    // reset lock class
    el.routeInput.classList.remove("is-locked");

    if (loc === "high" || loc === "low") {
      el.routeLabel.textContent = "Number of jumps";
      el.routeInput.type = "number";
      el.routeInput.inputMode = "numeric";
      el.routeInput.min = "1";
      el.routeInput.step = "1";
      el.routeInput.disabled = false;
      el.routeInput.placeholder = "Enter jumps (e.g. 14)";
      el.routeInput.value = state.jumps;

      el.dotlanLink.hidden = false;
      el.dotlanLink.href = config.externalLinks.dotlanRoutePlanner;

      el.routeHelp.textContent = "Need the jump count? Use DOTLAN route planner.";
      return;
    }

    // Thera: locked, fixed label
    if (loc === "thera") {
      el.routeLabel.textContent = "Route";
      el.routeInput.type = "text";
      el.routeInput.disabled = true;
      el.routeInput.value = "Thera (NPC Stations)";
      el.routeInput.placeholder = "";
      el.routeInput.classList.add("is-locked");

      el.dotlanLink.hidden = true;
      el.routeHelp.textContent = "";
      return;
    }

    // Pochven: locked, fixed label
    if (loc === "pochven") {
      el.routeLabel.textContent = "Route";
      el.routeInput.type = "text";
      el.routeInput.disabled = true;
      el.routeInput.value = "Pochven (region)";
      el.routeInput.placeholder = "";
      el.routeInput.classList.add("is-locked");

      el.dotlanLink.hidden = true;
      el.routeHelp.textContent = "";
      return;
    }
  }

  function computeReward() {
    const loc = state.location;
    const size = state.size;
    const speed = state.speed;

    // Fixed-rate locations (Thera / Pochven)
    const fixedLoc = config.pricing.fixed[loc];
    if (fixedLoc) {
      const fixed = fixedLoc?.[size]?.[speed];
      if (typeof fixed !== "number") {
        return { reward: null, reason: "Not available for this selection." };
      }
      return { reward: fixed };
    }

    // Per-jump locations (High / Low)
    const perJumpRate = config.pricing.perJump?.[loc]?.[size]?.[speed];
    if (typeof perJumpRate !== "number") {
      return { reward: null, reason: "Not available for this selection." };
    }

    const jumps = parseInt(state.jumps, 10);
    if (!Number.isFinite(jumps) || jumps <= 0) {
      return { reward: null, reason: "Enter a valid jump count." };
    }

    let reward = perJumpRate * jumps;

    // Security minimum (applied silently)
    const minCfg = config.pricing.securityMinimum;
    const minEnabled = (minCfg.enabledLocations || []).includes(loc);
    if (minEnabled && jumps <= minCfg.maxJumps) {
      reward = Math.max(reward, minCfg.minReward);
    }

    return { reward };
  }

  function updateRewardUI() {
    const res = computeReward();

    if (typeof res.reward === "number") {
      el.rewardOutput.value = fmtIsk(res.reward);
      el.rewardHelp.textContent = "";
      el.copyReward.disabled = false;
      return;
    }

    el.rewardOutput.value = "—";
    el.rewardHelp.textContent = res.reason || "";
    el.copyReward.disabled = true;
  }

  function renderAll() {
    applyRestrictions();
    setAccentByLocation();
    updateSegmentedButtons();
    updateRequirements();
    updateWarning();
    updateRouteInputMode();
    updateRewardUI();
  }

  // ---- Events ----
  document.querySelectorAll(".segmented").forEach((seg) => {
    seg.addEventListener("click", (evt) => {
      const btn = evt.target.closest("button[data-value]");
      if (!btn || btn.disabled) return;

      const group = seg.dataset.group;
      state[group] = btn.dataset.value;

      renderAll();
    });
  });

  el.routeInput.addEventListener("input", () => {
    if (state.location === "high" || state.location === "low") {
      state.jumps = el.routeInput.value;
    }
    updateRewardUI();
  });

  el.copyReward.addEventListener("click", async () => {
    const text = el.rewardOutput.value;
    if (!text || text === "—") return;
    const ok = await copyText(text);
    if (ok) flashCopied(el.copyReward);
  });

  el.copyContractTo.addEventListener("click", async () => {
    const text = (el.reqContractTo.textContent || "").trim();
    if (!text) return;
    const ok = await copyText(text);
    if (ok) flashCopied(el.copyContractTo);
  });

  el.copyCollateral.addEventListener("click", async () => {
    const text = (el.reqCollateral.textContent || "").trim();
    if (!text) return;
    const ok = await copyText(text);
    if (ok) flashCopied(el.copyCollateral);
  });

  // Prevent placeholder Discord link from jumping to top (until you set the real href)
  if (el.discordLink) {
    el.discordLink.addEventListener("click", (e) => {
      const href = el.discordLink.getAttribute("href");
      if (!href || href === "#") e.preventDefault();
    });
  }

  // ---- Init ----
  applyServiceStatus();
  renderAll();
})();
