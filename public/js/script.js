document.addEventListener("DOMContentLoaded", () => {
  const araBtn = document.querySelectorAll(".searchBtn");
  const araBar = document.querySelector(".searchBar");
  const araInput = document.getElementById("searchInput");
  const kapatBtn = document.getElementById("searchClose");

  for (let i = 0; i < araBtn.length; i++) {
    araBtn[i].addEventListener("click", () => {
      araBar.style.visibility = "visible";
      araBar.classList.add("open");
      this.setAttribute("aria-expended", true);
      araInput.focus();
    });
  }

  kapatBtn.addEventListener("click", () => {
    araBar.style.visibility = "hidden";
    araBar.classList.remove("open");
    this.setAttribute("aria-expended", false);
  });
});
