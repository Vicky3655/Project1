const readBtn = [
  document.getElementById("min-btn-desktop"),
  document.getElementById("min-read-mobile"),
];

const certificate = [
  document.getElementById("view-certiticate-desktop"),
  document.getElementById("view-certiticate-mobile"),
];

const learningDashboard = [
  document.getElementById("learning-dashboard-desktop"),
  document.getElementById("learning-dashboard-mobile"),
];

const markCompleteBtn = [
  document.getElementById("mark-complete-module-1-btn-desktop"),
  document.getElementById("mark-complete-module-1-btn-mobile"),
];

const downloadPdf = [
  document.getElementById("download-pdf-btn-desktop"),
  document.getElementById("download-pdf-mobile-btn"),
];

const module3Btn = [
  document.getElementById("mark-complete-module-3-desktop-btn"),
  document.getElementById("mark-complete-module-3-mobile-btn"),
];

addClickEvent(readBtn, () => {
  alert("This lesson takes approximately 7 minutes to complete");
});

addClickEvent(certificate, () => {
  alert("Your Certificate is ready. Opening now...");
});

addClickEvent(learningDashboard, () => {
  // alert("Returing to your dashboard...");
  const conformDashboard = confirm(
    "Are you sure you want to return to your dashboard?",
  );

  if (conformDashboard) {
    window.location.href = "index.html";
  }
});

addClickEvent(markCompleteBtn, () => {

  const confirmed = confirm(
    "Are you sure you want to mark this module as complete?",
  );

  if (confirmed) {
    alert("Module Completed Successfully 🎉");
    window.location.href = "pages/project-module-2.html";
  }
});

addClickEvent(downloadPdf, () => {
  const confirmed = confirm("Are you sure you want to download the PDF file?");

  if (confirmed) {
    alert("File Downloaded 🎉.");
    window.location.href = "pages/project-module-3.html";
  }
});

addClickEvent(module3Btn, () => {
  const confirmed = confirm(
    "Are you sure you want to mark this module as complete?",
  );

  if (confirmed) {
    alert("Module Completed Successfully 🎉");
    window.location.href = "pages/project-module-4.html";
  }

  window.location.href = "pages/project-module-2.html";
});

addClickEvent(downloadPdf, () => {
  window.location.href = "pages/project-module-3.html";
});

addClickEvent(module3Btn, () => {
  window.location.href = "pages/project-module-4.html";

});

function addClickEvent(elements, callback) {
  elements.forEach((el) => {
    if (el) el.addEventListener("click", callback);
  });
}
