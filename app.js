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
    let shipNameWithLastId = draggedShip.lastChild.id; //shipname + id : 'destroyer-01'
    let shipClass = shipNameWithLastId.slice(0, -2); //shipname by itself : 'destroyer'
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1)); //ship length in array notation : 1 (for destroyer)
    let shipLastIdHorizontal = lastShipIndex + parseInt(this.dataset.id); //ship length in array notation + userSquare index
    let shipLastIdVertical = parseInt(this.dataset.id) + width * lastShipIndex;
    let shipFirstIdVertical = parseInt(this.dataset.id) - width * lastShipIndex;

    let notAllowedHorizontal = [];

    //define horizontal boundaries
    for (let i = 0; i < 4; i++) {
      notAllowedHorizontal.push(i);
      for (let j = 10; j < 110; j = j + 10) {
        notAllowedHorizontal.push(j + i);
      }
    }
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(
      0,
      20 * lastShipIndex
    );

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1)); //where the user clicks on the ship (at the beginning, middle, end of the ship)
    shipLastIdHorizontal = shipLastIdHorizontal - selectedShipIndex; //ship length + userSquare index - where the user clicked on the ship...gives consistent last id number
    shipLastIdVertical = shipLastIdVertical - selectedShipIndex * width; //get the bottom id of the vertical ships

    let shipLengthMinusOne = draggedShipLength - 1;
    shipFirstIdVertical = shipLastIdVertical - shipLengthMinusOne * width; //from the bottom id, get the top id of the vertical ships

    //error checking for horizontal ship placement
    if (
      isHorizontal &&
      !newNotAllowedHorizontal.includes(shipLastIdHorizontal)
    ) {
      let horizontalCheck;
      for (let i = 0; i < draggedShipLength; i++) {
        horizontalCheck = parseInt(this.dataset.id) - selectedShipIndex + i;
        //check if any of the projected squares are taken
        if (userSquares[horizontalCheck].classList.contains("taken")) return;
      }
      //reach this loop if none of the squares are taken or out of bounds
      for (let i = 0; i < draggedShipLength; i++) {
        horizontalCheck = parseInt(this.dataset.id) - selectedShipIndex + i;
        userSquares[horizontalCheck].classList.add("taken", shipClass);
      }
    }
    //error checking for vertical ship placement
    else if (
      !isHorizontal &&
      shipLastIdVertical < 100 &&
      shipFirstIdVertical > -1
    ) {
      //check if any of the projected squares are taken
      let verticalCheck;
      for (let i = 0; i < draggedShipLength; i++) {
        verticalCheck =
          parseInt(this.dataset.id) - selectedShipIndex * width + i * width;
        if (userSquares[verticalCheck].classList.contains("taken")) {
          return;
        }
      }
      //reach this loop if none of the squares are taken
      for (let i = 0; i < draggedShipLength; i++) {
        verticalCheck =
          parseInt(this.dataset.id) - selectedShipIndex * width + i * width;
        userSquares[verticalCheck].classList.add("taken", shipClass);
      }
    } else return;
    //if the ship placement passes all the error checking, remove it from the display grid
    displayGrid.removeChild(draggedShip);
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
