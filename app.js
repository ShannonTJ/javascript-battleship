document.addEventListener("DOMContentLoaded", () => {
  //QUERY SELECTORS
  const userGrid = document.querySelector(".grid-user");
  const computerGrid = document.querySelector(".grid-computer");
  const displayGrid = document.querySelector(".grid-display");
  const ships = document.querySelectorAll(".ship");
  const destroyer = document.querySelector(".destroyer-container");
  const submarine = document.querySelector(".submarine-container");
  const cruiser = document.querySelector(".cruiser-container");
  const battleship = document.querySelector(".battleship-container");
  const carrier = document.querySelector(".carrier-container");
  const startBtn = document.querySelector("#start");
  const rotateBtn = document.querySelector("#rotate");
  const turn = document.querySelector("#whose-turn");
  const infoDisplay = document.querySelector("#info");

  const width = 10;
  const userSquares = [];
  const computerSquares = [];

  //CREATE BOARD
  function createBoard(grid, squares) {
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement("div");
      squares.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }

  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);
});
