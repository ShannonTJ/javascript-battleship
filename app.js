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

  //VARIABLES
  const width = 10;
  const userSquares = [];
  const computerSquares = [];
  let isHorizontal = true;
  let selectedShipNameWithIndex;
  let draggedShip;
  let draggedShipLength;

  //EVENT LISTENERS
  rotateBtn.addEventListener("click", rotate);
  ships.forEach((ship) => ship.addEventListener("dragstart", dragStart));

  //CREATE BOARD
  function createBoard(grid, squares) {
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement("div");
      square.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }

  //SHIP ARRAY
  const shipArray = [
    {
      name: "destroyer",
      directions: [
        [0, 1], //horizontal config
        [0, width], //vertical config
      ],
    },
    {
      name: "submarine",
      directions: [
        [0, 1, 2], //horizontal config
        [0, width, width * 2], //vertical config
      ],
    },
    {
      name: "cruiser",
      directions: [
        [0, 1, 2], //horizontal config
        [0, width, width * 2], //vertical config
      ],
    },
    {
      name: "battleship",
      directions: [
        [0, 1, 2, 3], //horizontal config
        [0, width, width * 2, width * 3], //vertical config
      ],
    },
    {
      name: "carrier",
      directions: [
        [0, 1, 2, 3, 4], //horizontal config
        [0, width, width * 2, width * 3, width * 4], //vertical config
      ],
    },
  ];

  //RANDOMLY GENERATE COMPUTER SHIPS
  function generate(ship) {
    //get horizontal or vertical config
    let randomDirection = Math.floor(Math.random() * ship.directions.length);
    let current = ship.directions[randomDirection];

    if (randomDirection === 0) direction = 1;
    if (randomDirection === 1) direction = width;

    //grid length (100) - (ship length * horizontal/vertical)
    //randomStart is where the ship starts
    //example: for the longest ship, the ship's tip can't be placed past index 50 or it'll go out of bounds
    let random = computerSquares.length - ship.directions[0].length * direction;
    let randomStart = Math.floor(Math.random() * random);

    //check if a ship has already been placed at the generated spot
    //current = a ship's vertical/horizontal configuration
    //current[index] is added to randomStart to check the  indices in computerSquares
    const isTaken = current.some((index) =>
      computerSquares[randomStart + index].classList.contains("taken")
    );

    //check for the right edge
    const atRightEdge = current.some(
      (index) => (randomStart + index) % width === width - 1
    );

    //check for the left edge
    const atLeftEdge = current.some(
      (index) => (randomStart + index) % width === 0
    );

    if (!isTaken && !atRightEdge && !atLeftEdge) {
      current.forEach((index) =>
        computerSquares[randomStart + index].classList.add("taken", ship.name)
      );
    } else {
      generate(ship);
    }
  }

  //ROTATE THE PLAYER SHIPS
  function rotate() {
    destroyer.classList.toggle("destroyer-container-vertical");
    submarine.classList.toggle("submarine-container-vertical");
    cruiser.classList.toggle("cruiser-container-vertical");
    battleship.classList.toggle("battleship-container-vertical");
    carrier.classList.toggle("carrier-container-vertical");
    isHorizontal = !isHorizontal;
    return;
  }

  ships.forEach((ship) =>
    ship.addEventListener("mousedown", (e) => {
      selectedShipNameWithIndex = e.target.id;
    })
  );

  function dragStart() {
    draggedShip = this;
    draggedShipLength = this.childNodes.length;
  }
  function dragOver(e) {
    e.preventDefault();
  }
  function dragEnter(e) {
    e.preventDefault();
  }
  function dragLeave() {
    console.log("drag leave");
  }

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0, -2);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    console.log(shipClass + " " + lastShipIndex);
  }

  function dragEnd() {}

  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

  generate(shipArray[0]);
  generate(shipArray[1]);
  generate(shipArray[2]);
  generate(shipArray[3]);
  generate(shipArray[4]);

  userSquares.forEach((square) =>
    square.addEventListener("dragstart", dragStart)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragover", dragOver)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragenter", dragEnter)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragleave", dragLeave)
  );
  userSquares.forEach((square) => square.addEventListener("drop", dragDrop));
  userSquares.forEach((square) => square.addEventListener("dragend", dragEnd));
});
