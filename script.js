console.info("[AI LiveMap] OSM embed version loaded");

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const mapViews = {
  default: {
    label: "OSM 기본",
    layer: "mapnik",
    bbox: "126.731%2C37.437%2C127.020%2C37.610",
    marker: "37.541%2C126.879"
  },
  hot: {
    label: "OSM HOT",
    layer: "hot",
    bbox: "126.731%2C37.437%2C127.020%2C37.610",
    marker: "37.541%2C126.879"
  },
  wide: {
    label: "넓은 보기",
    layer: "mapnik",
    bbox: "126.610%2C37.360%2C127.140%2C37.700",
    marker: "37.541%2C126.879"
  }
};

const toast = $("#toast");
let toastTimer = null;
let currentMode = "select";
let dirty = false;
let pinCount = 0;
let selectedPlanName = "";

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

function setPlanName(name) {
  selectedPlanName = name.trim();
  const hasPlanName = selectedPlanName.length > 0;
  $("#planTitle").textContent = hasPlanName ? selectedPlanName : "구역 계획을 선택하세요";
  $("#planSelector").classList.toggle("is-empty", !hasPlanName);
}

function openCreatePlanDialog() {
  $("#createPlanDialog").classList.add("show");
  $("#createPlanDialog").setAttribute("aria-hidden", "false");
  $("#planNameInput").value = selectedPlanName;
  setTimeout(() => $("#planNameInput").focus(), 0);
}

function closeCreatePlanDialog() {
  $("#createPlanDialog").classList.remove("show");
  $("#createPlanDialog").setAttribute("aria-hidden", "true");
}

function saveCreatePlan() {
  const planName = $("#planNameInput").value.trim();

  if (!planName) {
    showToast("구역 계획 이름을 입력하세요.");
    return;
  }

  setPlanName(planName);
  setSavedState(true);
  closeCreatePlanDialog();
  showToast("구역 계획을 저장했습니다.");
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
    select: "선택 모드입니다.",
    area: "구역 설정 모드입니다. OSM 임베드 지도 위에 구역 설정 모드를 표시합니다.",
    multi: "멀티 선택 모드입니다.",
    range: "범위 선택 모드입니다.",
    move: "지도 이동 모드입니다. 지도 영역을 직접 드래그해 이동할 수 있습니다.",
    pin: "핀 추가 모드입니다. 현재 버전은 OSM 임베드 방식이라 실제 핀 저장은 다음 단계에서 연결합니다.",
    route: "경로/링크 편집 모드입니다."
  };

  if (!fromHelp) showToast(modeLabels[mode] || "모드가 변경되었습니다.");
}

function buildMapUrl(view) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${view.bbox}&layer=${view.layer}&marker=${view.marker}`;
}

function setOsmLayer(styleName) {
  const view = mapViews[styleName] || mapViews.default;
  const iframe = $("#osmFrame");
  $("#map").classList.add("is-loading");
  iframe.src = buildMapUrl(view);
  showToast(`${view.label}로 변경했습니다.`);

  $$(".map-style-popover button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.style === styleName);
  });
}

$("#osmFrame").addEventListener("load", () => {
  $("#map").classList.remove("is-loading");
});

$("#planSelector").addEventListener("click", openCreatePlanDialog);

$("#cancelCreatePlan").addEventListener("click", () => {
  closeCreatePlanDialog();
  setPlanName(selectedPlanName);
});

$("#saveCreatePlan").addEventListener("click", saveCreatePlan);

$("#planNameInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveCreatePlan();
});

$("#zoomIn").addEventListener("click", () => {
  showToast("OSM 임베드 지도에서는 지도 내부의 + 버튼으로 확대하세요.");
});

$("#zoomOut").addEventListener("click", () => {
  showToast("OSM 임베드 지도에서는 지도 내부의 - 버튼으로 축소하세요.");
});

$("#layerButton").addEventListener("click", (event) => {
  event.stopPropagation();
  const popover = $("#stylePopover");
  popover.classList.toggle("show");
  popover.setAttribute("aria-hidden", popover.classList.contains("show") ? "false" : "true");
});

$$(".map-style-popover button").forEach((button) => {
  button.addEventListener("click", () => {
    setOsmLayer(button.dataset.style);
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
$("#saveDraftButton").addEventListener("click", () => {
  setSavedState(true);
  showToast("임시 저장했습니다.");
});

$("#deleteButton").addEventListener("click", () => {
  $("#deleteDialog").classList.add("show");
  $("#deleteDialog").setAttribute("aria-hidden", "false");
});

$("#cancelDelete").addEventListener("click", () => {
  $("#deleteDialog").classList.remove("show");
  $("#deleteDialog").setAttribute("aria-hidden", "true");
});

$("#confirmDelete").addEventListener("click", () => {
  $("#deleteDialog").classList.remove("show");
  $("#deleteDialog").setAttribute("aria-hidden", "true");
  setSavedState(false);
  showToast("선택 항목을 삭제했습니다.");
});

$("#undoButton").addEventListener("click", () => showToast("실행 취소했습니다."));
$("#redoButton").addEventListener("click", () => showToast("다시 실행했습니다."));
$("#moveButton").addEventListener("click", () => setMode("move"));
$("#pinButton").addEventListener("click", () => {
  pinCount += 1;
  setMode("pin");
  setSavedState(false);
  showToast(`핀 추가 모드입니다. 예시 핀 ${pinCount}개가 추가된 것으로 처리했습니다.`);
});
$("#routeButton").addEventListener("click", () => {
  setMode("route");
  setSavedState(false);
});

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
    $("#deleteDialog").classList.remove("show");
    $("#deleteDialog").setAttribute("aria-hidden", "true");
    $("#stylePopover").classList.remove("show");
    $("#stylePopover").setAttribute("aria-hidden", "true");
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

setPlanName("");
setMode("select", true);
setTimeout(() => $("#planNameInput").focus(), 0);
