const palette = document.querySelector(".palette");
const buttons = Array.from(palette.querySelectorAll("button"));

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    // debugger;
    palette.querySelector(".selected").classList.remove("selected");
    button.classList.add("selected");
  });
});

