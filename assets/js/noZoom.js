document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener(
    "wheel",
    function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener("keydown", function(e) {
    if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) {
      e.preventDefault();
    }
  });

  window.addEventListener("gesturestart", function(e) {
    e.preventDefault();
  });
});
