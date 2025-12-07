/***********************************************************
 * CONFIGURABLE CONSTANTS – tweak these for your own model *
 ***********************************************************/

// Storage sizing defaults
const STORAGE_DEFAULTS = {
  machines: 4,
  tagsPerMachine: 150,
  updatesPerMinPerTag: 60, // average updates per minute per tag
  retentionMonths: 12,
  rowSizeBytes: 4, // bytes per row (timestamp + value + tag id + overhead)
  compressionRatio: 0.6, // compressed_size = raw_size * compressionRatio
  daysPerMonth: 30, // coarse approximation
}

// Compute sizing base values (for "Core MES" only)
const COMPUTE_BASE = {
  baseCores: 8, // cores for Core MES baseline
  baseRamGB: 16, // RAM for Core MES baseline
  perMachineCore: 0.05, // extra cores per machine
  perMachineRamGB: 0.1, // extra GB RAM per machine
  processDataRetentionMonths: 6, // 10 years
  processDataBaseRequirementsInMB: 100, // IN MB
}

// Module factors – tune these based on your experience/benchmarking.
// multiplier = 1 + sum(module.coreFactor) etc.
const MES_MODULES = [
  {
    id: "core_mes",
    name: "Core MES (mandatory)",
    description:
      "Base functionality: User Management & Auth, Notifications & Alerts, Shift Scheduling, Master Data Management, OEE monitoring",
    coreFactor: 0, // already in base
    ramFactor: 0,
    mandatory: true,
    addedStoragePerAsset: 100,
  },
  {
    id: "opcua_connector",
    name: "OPCUA Connector using Kepware",
    description: "Real-time data collecting using Kepware -> OPCUA -> DPS",
    coreFactor: 0.1,
    ramFactor: 0.05,
    addedStoragePerAsset: 10,
  },
  {
    id: "recipe_mgmt",
    name: "Recipe / Parameter Management",
    description: "Masters, Versioning, approvals, downloads to machines.",
    coreFactor: 0.1,
    ramFactor: 0.1,
    addedStoragePerAsset: 100,
  },
  {
    id: "digital_batchcard",
    name: "Digital Batchcard / Work Instructions",
    description: "Operator guidance, checklists, attachments.",
    coreFactor: 0.1,
    ramFactor: 0.1,
    addedStoragePerAsset: 200,
  },
  {
    id: "traceability",
    name: "Traceability / Genealogy",
    description: "Serial/batch tracking, where-used, reports.",
    coreFactor: 0.15,
    ramFactor: 0.15,
    addedStoragePerAsset: 100,
  },
  {
    id: "production_planning",
    name: "Production Planning / Scheduling",
    description: "Finite capacity planning, dispatching.",
    coreFactor: 0.1,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "downtime",
    name: "Downtime Tracking",
    description: "Loss models, analytics, dashboards.",
    coreFactor: 0.12,
    ramFactor: 0.1,
    addedStoragePerAsset: 50,
  },
  {
    id: "maintenance",
    name: "Maintenance / CMMS Lite",
    description: "Work orders, PM, asset registry.",
    coreFactor: 0.08,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "capa_nc",
    name: "CAPA / Non-Conformance",
    description: "Issues, workflows, approvals.",
    coreFactor: 0.07,
    ramFactor: 0.07,
    addedStoragePerAsset: 50,
  },
  {
    id: "data_connectors",
    name: "Data Connectors / APIs",
    description: "External systems, data exports/imports.",
    coreFactor: 0.08,
    ramFactor: 0.06,
    addedStoragePerAsset: 10,
  },
  {
    id: "external_connectors",
    name: "ERP Connectors",
    description: "SAP, Oracle, Microsoft D365, etc..",
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
 * Storage sizing JS  *
 **********************/
function resetStorageForm() {
  document.getElementById("stAssets").value = STORAGE_DEFAULTS.machines
  document.getElementById("stTagsPerAsset").value =
    STORAGE_DEFAULTS.tagsPerMachine
  document.getElementById("stUpdatesPerMinPerTag").value =
    STORAGE_DEFAULTS.updatesPerMinPerTag
  document.getElementById("stRetentionMonths").value =
    STORAGE_DEFAULTS.retentionMonths
  document.getElementById("stRowSizeBytes").value =
    STORAGE_DEFAULTS.rowSizeBytes
  document.getElementById("stCompressionRatio").value =
    STORAGE_DEFAULTS.compressionRatio
}

function calculateStorage() {
  const machines = Number(document.getElementById("stAssets").value) || 0
  const tagsPerMachine =
    Number(document.getElementById("stTagsPerAsset").value) || 0
  const updatesPerMinPerTag =
    Number(document.getElementById("stUpdatesPerMinPerTag").value) || 0
  const retentionMonths =
    Number(document.getElementById("stRetentionMonths").value) || 0
  const rowSizeBytes =
    Number(document.getElementById("stRowSizeBytes").value) || 0
  const compressionRatio =
    Number(document.getElementById("stCompressionRatio").value) || 1

  const totalTags = machines * tagsPerMachine
  const updatesPerMin = totalTags * updatesPerMinPerTag
  const eventsPerDay = updatesPerMin * 60 * 24
  const totalDays = retentionMonths * STORAGE_DEFAULTS.daysPerMonth
  const totalRows = eventsPerDay * totalDays

  const totalBytes = totalRows * rowSizeBytes
  const totalGB = totalBytes / 1024 / 1024 / 1024
  const totalTB = totalGB / 1024

  const compressedBytes = totalBytes * compressionRatio
  const compressedGB = compressedBytes / 1024 / 1024 / 1024
  const compressedTB = compressedGB / 1024

  // Update UI
  const summaryLine = `For ${machines} machines × ${tagsPerMachine} tags (≈ ${formatNumber(
    totalTags,
  )} tags total) at ${updatesPerMinPerTag} updates/min/tag over ${retentionMonths} months:`
  document.getElementById("stSummaryLine").textContent = summaryLine
  document.getElementById("stTotalTags").textContent = formatNumber(totalTags)
  document.getElementById("stEventsPerDay").textContent =
    formatNumber(eventsPerDay)
  document.getElementById("stTotalRows").textContent = formatNumber(totalRows)

  document.getElementById("stUncompressedGB").textContent = formatFloat(
    totalGB,
    2,
  )
  document.getElementById("stUncompressedTB").textContent =
    "~ " + formatFloat(totalTB, 2) + " TB"

  document.getElementById("stCompressedGB").textContent = formatFloat(
    compressedGB,
    2,
  )
  document.getElementById("stCompressedTB").textContent =
    "~ " + formatFloat(compressedTB, 2) + " TB"
}

/**********************
 * Compute sizing JS  *
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
    input.dataset.coreFactor = mod.coreFactor
    input.dataset.ramFactor = mod.ramFactor
    input.dataset.addedStoragePerAsset = mod.addedStoragePerAsset
    if (mod.mandatory) {
      input.checked = true
      input.disabled = true
    } else {
      input.checked = false // default: enable most modules
    }

    const label = document.createElement("label")
    label.className = "form-check-label"
    label.setAttribute("for", input.id)
    label.innerHTML =
      "<strong>" +
      mod.name +
      "</strong>" +
      (mod.description
        ? ' <span class="text-muted d-block small">' +
          mod.description +
          "</span>"
        : "")

    wrapper.appendChild(input)
    wrapper.appendChild(label)
    container.appendChild(wrapper)
  })
}

function resetComputeForm() {
  document.getElementById("cpRetention").value =
    COMPUTE_BASE.processDataRetentionMonths
  document.getElementById("cpEnvironment").value = "1"
  renderModules() // resets module checkboxes to default
}

function calculateCompute() {
  const machines = Number(document.getElementById("stAssets").value) || 0
  const retentionMonths = Number(document.getElementById("cpRetention").value)
  const envFactor = Number(document.getElementById("cpEnvironment").value) || 1

  let coreFactorSum = 0
  let ramFactorSum = 0
  let addedStoragePerAssetSum = 0

  MES_MODULES.forEach((mod) => {
    const checkbox = document.getElementById("mod_" + mod.id)
    if (checkbox && checkbox.checked) {
      coreFactorSum += mod.coreFactor
      ramFactorSum += mod.ramFactor
      addedStoragePerAssetSum += mod.addedStoragePerAsset || 0
    }
  })

  const baseCores =
    COMPUTE_BASE.baseCores + machines * COMPUTE_BASE.perMachineCore
  const baseRamGB =
    COMPUTE_BASE.baseRamGB + machines * COMPUTE_BASE.perMachineRamGB

  const coreMultiplier = 1 + coreFactorSum
  const ramMultiplier = 1 + ramFactorSum
  const totalStorage =
    COMPUTE_BASE.processDataBaseRequirementsInMB +
    addedStoragePerAssetSum * machines * retentionMonths

  let cores = baseCores * coreMultiplier * envFactor
  let ramGB = baseRamGB * ramMultiplier * envFactor
  let processStorageGB = (totalStorage / 1024) * envFactor

  // Nice ceil to half-steps: 0.5, 1, 1.5...
  const niceRound = (value) => {
    return Math.ceil(value * 2) / 2
  }

  cores = niceRound(cores)
  ramGB = niceRound(ramGB)
  processStorageGB = niceRound(processStorageGB)
  console.log("nice", processStorageGB)

  const summaryLine = `For ${machines} machines in ${
    document.getElementById("cpEnvironment").selectedOptions[0].text
  } with selected modules enabled:`

  document.getElementById("cpSummaryLine").textContent = summaryLine
  document.getElementById("cpCores").textContent = cores
  document.getElementById("cpRamGB").textContent = ramGB
  document.getElementById("cpStorageGB").textContent = processStorageGB

  document.getElementById("cpBaseCores").textContent = formatFloat(baseCores, 2)
  document.getElementById("cpBaseRamGB").textContent = formatFloat(baseRamGB, 2)
  document.getElementById("cpBaseStorageGB").textContent = formatFloat(
    processStorageGB,
    2,
  )
  document.getElementById("cpCoreMultiplier").textContent = formatFloat(
    coreMultiplier * envFactor,
    2,
  )
  document.getElementById("cpRamMultiplier").textContent = formatFloat(
    ramMultiplier * envFactor,
    2,
  )
}

/**********************
 * Init on page load  *
 **********************/
window.addEventListener("DOMContentLoaded", () => {
  // Initial form defaults
  resetStorageForm()
  renderModules()
  resetComputeForm()

  // Wire up buttons
  document
    .getElementById("stCalculateBtn")
    .addEventListener("click", calculateStorage)
  document.getElementById("stResetBtn").addEventListener("click", () => {
    resetStorageForm()
    calculateStorage()
  })

  document
    .getElementById("cpCalculateBtn")
    .addEventListener("click", calculateCompute)
  document.getElementById("cpResetBtn").addEventListener("click", () => {
    resetComputeForm()
    calculateCompute()
  })

  // Run once with defaults
  calculateStorage()
  calculateCompute()
})
