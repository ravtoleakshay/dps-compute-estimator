/***********************************************************
 * CONFIGURABLE CONSTANTS – tweak these for your own model *
 ***********************************************************/

// Storage sizing defaults
const STORAGE_DEFAULTS = {
  assets: 4,
  tagsPerAsset: 150,
  updatesPerMinPerTag: 60,
  retentionMonths: 12,
  rowSizeBytes: 4,
  compressionRatio: 0.6,
  daysPerMonth: 30,
}

// Compute sizing base values
const COMPUTE_BASE = {
  baseCores: 8,
  baseRamGB: 16,
  perAssetCore: 0.05,
  perAssetRamGB: 0.1,

  // PROCESS DATA STORAGE
  processDataBaseRequirementsInMB: 100, // MB per month (base)
}

// Module factors – tune these based on needs
const MES_MODULES = [
  {
    id: "core_mes",
    name: "Core MES (mandatory)",
    description: "User Mgmt, Auth, Alerts, Scheduling, MDM, OEE",
    coreFactor: 0,
    ramFactor: 0,
    addedStoragePerAsset: 100,
    mandatory: true,
  },
  {
    id: "opcua_connector",
    name: "OPCUA Connector using Kepware",
    description: "Real-time data collection",
    coreFactor: 0.1,
    ramFactor: 0.05,
    addedStoragePerAsset: 10,
  },
  {
    id: "recipe_mgmt",
    name: "Recipe / Parameter Management",
    description: "Versioning, approvals",
    coreFactor: 0.1,
    ramFactor: 0.1,
    addedStoragePerAsset: 100,
  },
  {
    id: "digital_batchcard",
    name: "Digital Batchcard / Work Instructions",
    description: "Checklists, attachments",
    coreFactor: 0.1,
    ramFactor: 0.1,
    addedStoragePerAsset: 200,
  },
  {
    id: "traceability",
    name: "Traceability / Genealogy",
    description: "Where-used, serial tracking",
    coreFactor: 0.15,
    ramFactor: 0.15,
    addedStoragePerAsset: 100,
  },
  {
    id: "production_planning",
    name: "Production Planning",
    description: "Scheduling, dispatching",
    coreFactor: 0.1,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "downtime",
    name: "Downtime Tracking",
    description: "Loss models, analytics",
    coreFactor: 0.12,
    ramFactor: 0.1,
    addedStoragePerAsset: 50,
  },
  {
    id: "maintenance",
    name: "Maintenance / CMMS Lite",
    description: "Work orders, PM, asset registry",
    coreFactor: 0.08,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "capa_nc",
    name: "CAPA / Non-Conformance",
    description: "Issues, workflows, approvals",
    coreFactor: 0.07,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "data_connectors",
    name: "Data Connectors / APIs",
    description: "External systems integration",
    coreFactor: 0.08,
    ramFactor: 0.06,
    addedStoragePerAsset: 10,
  },
  {
    id: "external_connectors",
    name: "ERP Connectors",
    description: "SAP, Oracle, D365",
    coreFactor: 0.08,
    ramFactor: 0.06,
    addedStoragePerAsset: 100,
  },
]

/**********************
 * Utility functions  *
 **********************/
function formatNumber(num) {
  if (!isFinite(num)) return "–"
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
  return num.toFixed(0)
}

function formatFloat(num, decimals) {
  if (!isFinite(num)) return "–"
  return num.toFixed(decimals)
}

/**********************
 * Module Rendering   *
 **********************/
function renderModules() {
  const container = document.getElementById("moduleList")
  container.innerHTML = ""

  MES_MODULES.forEach((mod) => {
    const wrapper = document.createElement("div")
    wrapper.className = "form-check mb-2"

    const input = document.createElement("input")
    input.type = "checkbox"
    input.className = "form-check-input"
    input.id = "mod_" + mod.id

    if (mod.mandatory) {
      input.checked = true
      input.disabled = true
    } else {
      input.checked = false
    }

    const label = document.createElement("label")
    label.className = "form-check-label"
    label.setAttribute("for", input.id)
    label.innerHTML = `
      <strong>${mod.name}</strong>
      <div class="text-muted small">${mod.description || ""}</div>
    `

    wrapper.appendChild(input)
    wrapper.appendChild(label)
    container.appendChild(wrapper)
  })
}

/**********************
 * STORAGE CALC LOGIC *
 **********************/
function calculateStorage() {
  const assets = Number(document.getElementById("stAssets").value)
  const tagsPerAsset = Number(document.getElementById("stTagsPerAsset").value)
  const updatesPerMinPerTag = Number(
    document.getElementById("stUpdatesPerMinPerTag").value,
  )
  const retentionMonths = Number(
    document.getElementById("stRetentionMonths").value,
  )
  const rowSizeBytes = Number(document.getElementById("stRowSizeBytes").value)
  const compressionRatio = Number(
    document.getElementById("stCompressionRatio").value,
  )

  const totalTags = assets * tagsPerAsset
  const updatesPerMin = totalTags * updatesPerMinPerTag
  const eventsPerDay = updatesPerMin * 60 * 24
  const totalDays = retentionMonths * STORAGE_DEFAULTS.daysPerMonth
  const totalRows = eventsPerDay * totalDays

  const totalBytes = totalRows * rowSizeBytes
  const totalGB = totalBytes / 1024 / 1024 / 1024
  const totalTB = totalGB / 1024

  const compressedGB = totalGB * compressionRatio
  const compressedTB = compressedGB / 1024

  // UPDATE SUMMARY PANEL UI
  document.getElementById("sumTotalTags").textContent = formatNumber(totalTags)
  document.getElementById("sumEventsPerDay").textContent =
    formatNumber(eventsPerDay)
  document.getElementById("sumUncompressedGB").textContent = formatFloat(
    totalGB,
    2,
  )
  document.getElementById("sumUncompressedTB").textContent =
    "~" + formatFloat(totalTB, 2) + " TB"
  document.getElementById("sumCompressedGB").textContent = formatFloat(
    compressedGB,
    2,
  )
  document.getElementById("sumCompressedTB").textContent =
    "~" + formatFloat(compressedTB, 2) + " TB"

  return { totalGB, compressedGB }
}

/**********************
 * COMPUTE CALC LOGIC *
 **********************/
function calculateCompute() {
  const assets = Number(document.getElementById("stAssets").value)
  const retentionMonths = Number(document.getElementById("cpRetention").value)
  const envFactor = Number(document.getElementById("cpEnvironment").value)

  let coreFactorSum = 0,
    ramFactorSum = 0,
    addedStoragePerAssetSum = 0

  const enabledModules = []

  MES_MODULES.forEach((mod) => {
    const cb = document.getElementById("mod_" + mod.id)
    if (cb && cb.checked) {
      enabledModules.push(mod.name)
      coreFactorSum += mod.coreFactor
      ramFactorSum += mod.ramFactor
      addedStoragePerAssetSum += mod.addedStoragePerAsset || 0
    }
  })

  // UPDATE MODULE SUMMARY UI
  document.getElementById("summaryModules").innerHTML = enabledModules
    .map((m) => `• ${m}`)
    .join("<br>")

  // COMPUTE CORE/RAM
  const baseCores = COMPUTE_BASE.baseCores + assets * COMPUTE_BASE.perAssetCore
  const baseRamGB = COMPUTE_BASE.baseRamGB + assets * COMPUTE_BASE.perAssetRamGB

  const cores = Math.ceil(baseCores * (1 + coreFactorSum) * envFactor * 2) / 2
  const ramGB = Math.ceil(baseRamGB * (1 + ramFactorSum) * envFactor * 2) / 2

  // PROCESS DATA STORAGE
  const baseStorageMB =
    COMPUTE_BASE.processDataBaseRequirementsInMB * retentionMonths
  const moduleStorageMB = addedStoragePerAssetSum * assets * retentionMonths

  const totalProcessStorageGB =
    Math.ceil(((baseStorageMB + moduleStorageMB) / 1024) * envFactor * 2) / 2

  // UPDATE UI
  document.getElementById("sumCores").textContent = cores
  document.getElementById("sumRamGB").textContent = ramGB
  document.getElementById("sumProcessStorageGB").textContent =
    totalProcessStorageGB
  document.getElementById("sumIntelCPU").textContent = recommendIntelCPU(cores)

  return { cores, ramGB, totalProcessStorageGB }
}

/**********************
 * RESET FORM VALUES  *
 **********************/
function resetInputs() {
  document.getElementById("stAssets").value = STORAGE_DEFAULTS.assets
  document.getElementById("stTagsPerAsset").value =
    STORAGE_DEFAULTS.tagsPerAsset
  document.getElementById("stUpdatesPerMinPerTag").value =
    STORAGE_DEFAULTS.updatesPerMinPerTag
  document.getElementById("stRetentionMonths").value =
    STORAGE_DEFAULTS.retentionMonths
  document.getElementById("stRowSizeBytes").value =
    STORAGE_DEFAULTS.rowSizeBytes
  document.getElementById("stCompressionRatio").value =
    STORAGE_DEFAULTS.compressionRatio

  document.getElementById("cpRetention").value = 6
  document.getElementById("cpEnvironment").value = 1

  renderModules()
}

function recommendIntelCPU(cores) {
  if (cores <= 4) return "Intel Core i3-13100 (4 Cores)"
  if (cores <= 8) return "Intel Core i5-13500 (14 Cores / 20 Threads)"
  if (cores <= 16) return "Intel Core i7-13700 (24 Threads)"
  if (cores <= 24) return "Intel Core i9-13900 (32 Threads)"
  return "Intel Xeon Silver 4410Y (Multi-Socket Server)"
}

/**********************
 * INIT + EVENT BIND  *
 **********************/
window.addEventListener("DOMContentLoaded", () => {
  renderModules()
  resetInputs()

  // Combined Calculate Button
  document.getElementById("calculateBtn").addEventListener("click", () => {
    calculateStorage()
    calculateCompute()
  })

  // Reset
  document.getElementById("resetBtn").addEventListener("click", () => {
    resetInputs()
    calculateStorage()
    calculateCompute()
  })

  // Initial calculation
  calculateStorage()
  calculateCompute()
})
