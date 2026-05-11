const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const toast = $("#toast");
let toastTimer = null;
let currentMode = "select";
let dirty = false;
let markers = [];
let routeLayer = null;
let areaLayer = null;
let currentBaseLayer = null;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setSavedState(saved) {
  dirty = !saved;
  $("#savedBadge").textContent = saved ? "저장됨" : "편집중";
  $("#savedBadge").style.background = saved ? "#e6f9fa" : "#fff7e6";
  $("#savedBadge").style.color = saved ? "#07c5d2" : "#d99000";
  $("#savedBadge").style.borderColor = saved ? "#07c5d2" : "#ffc266";
}

function setMode(mode, fromHelp = false) {
  currentMode = mode;

  $$(".help-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  $$(".tool-button").forEach((button) => button.classList.remove("active"));

  const toolByMode = {
    move: "#moveButton",
    pin: "#pinButton",
    route: "#routeButton"
  };

  if (toolByMode[mode]) {
    $(toolByMode[mode]).classList.add("active");
  }

  const modeLabels = {
    select: "선택 모드입니다. 지도의 마커를 클릭해 선택할 수 있습니다.",
    area: "구역 설정 모드입니다. 지도를 클릭하면 예시 구역이 표시됩니다.",
    multi: "멀티 선택 모드입니다.",
    range: "범위 선택 모드입니다.",
    move: "지도 이동 모드입니다.",
    pin: "핀 추가 모드입니다. 지도를 클릭하면 핀이 추가됩니다.",
    route: "경로/링크 편집 모드입니다. 지도를 클릭하면 예시 링크가 표시됩니다."
  };

  if (!fromHelp) showToast(modeLabels[mode] || "모드가 변경되었습니다.");
}

const map = L.map("map", {
  zoomControl: false,
  attributionControl: true,
  preferCanvas: true,
  fadeAnimation: false,
  zoomAnimation: true,
  markerZoomAnimation: false,
  inertia: false,
  minZoom: 11,
  maxZoom: 18,
  maxBoundsViscosity: 0.5
}).setView([37.541, 126.879], 13);

const tileLayers = {
  street: L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    crossOrigin: true,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }),
  gray: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    crossOrigin: true,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }),
  satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    crossOrigin: true,
    attribution: "Tiles &copy; Esri"
  }),
  fallback: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    subdomains: "abc",
    maxZoom: 19,
    crossOrigin: true,
    attribution: '&copy; OpenStreetMap contributors'
  })
};

let tileErrorCount = 0;

function setBaseLayer(style, silent = false) {
  tileErrorCount = 0;

  if (currentBaseLayer) {
    currentBaseLayer.off("tileerror");
    map.removeLayer(currentBaseLayer);
  }

  currentBaseLayer = tileLayers[style] || tileLayers.street;
  currentBaseLayer.on("tileerror", () => {
    tileErrorCount += 1;
    if (tileErrorCount >= 4 && style !== "fallback") {
      setBaseLayer("fallback", true);
      showToast("지도 타일 로딩이 불안정해 기본 지도로 전환했습니다.");
    }
  });

  currentBaseLayer.addTo(map);

  $$(".map-style-popover button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.style === style);
  });

  if (!silent) {
    const label = style === "satellite" ? "위성 지도" : style === "gray" ? "그레이 지도" : "일반 지도";
    showToast(`${label}로 변경했습니다.`);
  }
}

setBaseLayer("street", true);

const southWest = L.latLng(37.33, 126.58);
const northEast = L.latLng(37.72, 127.17);
map.setMaxBounds(L.latLngBounds(southWest, northEast));

const samplePoints = [
  { name: "목동 감시 지점", lat: 37.5356, lng: 126.8782 },
  { name: "양천구청 인근", lat: 37.5169, lng: 126.8664 },
  { name: "영등포구청 인근", lat: 37.5244, lng: 126.8962 }
];

samplePoints.forEach((point) => {
  const marker = L.marker([point.lat, point.lng]).addTo(map).bindPopup(point.name);
  marker.on("click", () => {
    marker.getElement()?.classList.toggle("selected-marker");
    showToast(`${point.name}을 선택했습니다.`);
  });
  markers.push(marker);
});

function addMarker(latlng, label = "새 핀") {
  const marker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup(label);
  marker.openPopup();
  markers.push(marker);
  setSavedState(false);
  showToast("지도에 핀을 추가했습니다.");
}

function drawSampleArea(center) {
  if (areaLayer) map.removeLayer(areaLayer);

  const lat = center.lat;
  const lng = center.lng;
  const polygon = [
    [lat + 0.006, lng - 0.01],
    [lat + 0.008, lng + 0.008],
    [lat - 0.004, lng + 0.012],
    [lat - 0.008, lng - 0.004]
  ];

  areaLayer = L.polygon(polygon, {
    color: "#07c5d2",
    weight: 2,
    dashArray: "4 4",
    fillColor: "#07c5d2",
    fillOpacity: 0.14
  }).addTo(map);

  setSavedState(false);
  showToast("예시 구역을 생성했습니다.");
}

function drawSampleRoute(center) {
  if (routeLayer) map.removeLayer(routeLayer);

  const lat = center.lat;
  const lng = center.lng;
  const route = [
    [lat - 0.012, lng - 0.018],
    [lat - 0.006, lng - 0.006],
    [lat + 0.003, lng + 0.006],
    [lat + 0.012, lng + 0.018]
  ];

  routeLayer = L.polyline(route, {
    color: "#07c5d2",
    weight: 4,
    opacity: 0.9
  }).addTo(map);

  setSavedState(false);
  showToast("예시 링크/경로를 생성했습니다.");
}

map.on("click", (event) => {
  $("#stylePopover").classList.remove("show");

  if (currentMode === "pin") return addMarker(event.latlng);
  if (currentMode === "area") return drawSampleArea(event.latlng);
  if (currentMode === "route") return drawSampleRoute(event.latlng);

  if (currentMode === "select") showToast("지도 위치를 선택했습니다.");
});

$("#zoomIn").addEventListener("click", () => { map.zoomIn(); showToast("지도를 확대했습니다."); });
$("#zoomOut").addEventListener("click", () => { map.zoomOut(); showToast("지도를 축소했습니다."); });

$("#layerButton").addEventListener("click", (event) => {
  event.stopPropagation();
  const popover = $("#stylePopover");
  popover.classList.toggle("show");
  popover.setAttribute("aria-hidden", popover.classList.contains("show") ? "false" : "true");
});

$$(".map-style-popover button").forEach((button) => {
  button.addEventListener("click", () => {
    setBaseLayer(button.dataset.style);
    $("#stylePopover").classList.remove("show");
    $("#stylePopover").setAttribute("aria-hidden", "true");
  });
});

$("#panelToggle").addEventListener("click", () => {
  $("#planPanel").classList.toggle("collapsed");
  $("#sideHandle").classList.toggle("collapsed");
});

$("#sideHandle").addEventListener("click", () => {
  $("#planPanel").classList.toggle("collapsed");
  $("#sideHandle").classList.toggle("collapsed");
});

$("#searchButton").addEventListener("click", () => {
  const keyword = $("#searchInput").value.trim();
  showToast(keyword ? `"${keyword}" 검색을 실행했습니다.` : "검색어를 입력하세요.");
});

$("#searchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") $("#searchButton").click();
});

$$(".help-item").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    if (mode === "clear") {
      markers.forEach((marker) => marker.getElement()?.classList.remove("selected-marker"));
      setMode("select", true);
      showToast("선택을 해제했습니다.");
      return;
    }
    setMode(mode, true);
    const labels = {
      select: "선택 모드입니다.",
      area: "구역 설정 모드입니다.",
      multi: "멀티 선택 모드입니다.",
      range: "범위 선택 모드입니다."
    };
    showToast(labels[mode] || "모드가 변경되었습니다.");
  });
});

$("#closeHelp").addEventListener("click", () => {
  $(".mode-help").classList.add("hidden");
  showToast("조작 가이드를 숨겼습니다.");
});

$("#openButton").addEventListener("click", () => showToast("구역 계획 파일 열기 동작입니다."));
$("#saveDraftButton").addEventListener("click", () => { setSavedState(true); showToast("임시 저장했습니다."); });

$("#deleteButton").addEventListener("click", () => {
  $("#deleteDialog").classList.add("show");
  $("#deleteDialog").setAttribute("aria-hidden", "false");
});

$("#cancelDelete").addEventListener("click", () => {
  $("#deleteDialog").classList.remove("show");
  $("#deleteDialog").setAttribute("aria-hidden", "true");
});

$("#confirmDelete").addEventListener("click", () => {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  if (areaLayer) { map.removeLayer(areaLayer); areaLayer = null; }

  $("#deleteDialog").classList.remove("show");
  $("#deleteDialog").setAttribute("aria-hidden", "true");
  setSavedState(false);
  showToast("선택 항목을 삭제했습니다.");
});

$("#undoButton").addEventListener("click", () => showToast("실행 취소했습니다."));
$("#redoButton").addEventListener("click", () => showToast("다시 실행했습니다."));
$("#moveButton").addEventListener("click", () => setMode("move"));
$("#pinButton").addEventListener("click", () => setMode("pin"));
$("#routeButton").addEventListener("click", () => setMode("route"));

$("#confirmButton").addEventListener("click", () => {
  setSavedState(true);
  showToast("확인 처리되었습니다.");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".map-style-popover") && !event.target.closest("#layerButton")) {
    $("#stylePopover").classList.remove("show");
    $("#stylePopover").setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("keydown", (event) => {
  const isMod = event.ctrlKey || event.metaKey;

  if (event.key === "Escape") {
    setMode("select", true);
    markers.forEach((marker) => marker.getElement()?.classList.remove("selected-marker"));
    $("#deleteDialog").classList.remove("show");
    $("#deleteDialog").setAttribute("aria-hidden", "true");
    $("#stylePopover").classList.remove("show");
    showToast("선택과 임시 모드를 해제했습니다.");
  }

  if (isMod && event.key.toLowerCase() === "s") {
    event.preventDefault();
    setSavedState(true);
    showToast("저장했습니다.");
  }

  if (isMod && event.key.toLowerCase() === "z") {
    event.preventDefault();
    showToast(event.shiftKey ? "다시 실행했습니다." : "실행 취소했습니다.");
  }
});

setMode("select", true);
