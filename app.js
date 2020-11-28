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
  let isGameOver = false;
  let currentPlayer = "user";

  let destroyerCount = 0;
  let submarineCount = 0;
  let cruiserCount = 0;
  let battleshipCount = 0;
  let carrierCount = 0;

  let cpuDestroyerCount = 0;
  let cpuSubmarineCount = 0;
  let cpuCruiserCount = 0;
  let cpuBattleshipCount = 0;
  let cpuCarrierCount = 0;

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
      for (let j = 10; j < 100; j = j + 10) {
        notAllowedHorizontal.push(j + i);
      }
    }
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(
      0,
      10 * lastShipIndex
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
        //check if any of the projected squares are taken or out of bounds
        if (userSquares[horizontalCheck] > 99) return;
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

  function dragEnd() {
    console.log("dragend");
  }

  //GAME LOGIC
  function playGame() {
    //don't start the game when there is a game over
    if (isGameOver) return;
    //don't start the game when all ships have not been placed
    if (displayGrid.childNodes.length > 6) {
      infoDisplay.innerHTML =
        "Place all of your ships, then press start to begin.";
      return;
    }

    infoDisplay.innerHTML = " ";

    if (currentPlayer === "user") {
      computerSquares.forEach((square) =>
        square.addEventListener("click", function (e) {
          revealSquare(square);
        })
      );
    } else {
      //computer logic
      setTimeout(computerTurn, 1000);
    }
  }

  function revealSquare(square) {
    //game logic for user clicking on computer area
    //check if a hit square was clicked again
    if (!square.classList.contains("kaboom")) {
      //if this is the first hit, update a counter
      if (square.classList.contains("destroyer")) destroyerCount++;
      if (square.classList.contains("submarine")) submarineCount++;
      if (square.classList.contains("cruiser")) cruiserCount++;
      if (square.classList.contains("battleship")) battleshipCount++;
      if (square.classList.contains("carrier")) carrierCount++;
    }
    //change square color when the user hits
    if (square.classList.contains("taken")) {
      square.classList.add("kaboom");
    }
    //change square color when the user misses
    else {
      square.classList.add("sploosh");
    }

    checkForWins();
    //computer turn begins
    currentPlayer = "computer";
    turn.innerHTML = "Computer's Turn";

    playGame();
  }

  function computerTurn() {
    let random = Math.floor(Math.random() * userSquares.length);

    console.log(userSquares[random]);

    if (!userSquares[random].classList.contains("kaboom")) {
      if (userSquares[random].classList.contains("destroyer"))
        cpuDestroyerCount++;
      if (userSquares[random].classList.contains("submarine"))
        cpuSubmarineCount++;
      if (userSquares[random].classList.contains("battleship"))
        cpuBattleshipCount++;
      if (userSquares[random].classList.contains("cruiser")) cpuCruiserCount++;
      if (userSquares[random].classList.contains("carrier")) cpuCarrierCount++;
    }

    //change square color when the computer hits
    if (userSquares[random].classList.contains("taken")) {
      userSquares[random].classList.add("kaboom");
    }
    //change square color when the computer misses
    else {
      userSquares[random].classList.add("sploosh");
    }

    checkForWins();

    currentPlayer = "user";
    turn.innerHTML = "Your Turn";
  }

  function checkForWins() {
    if (destroyerCount === 2 || cpuDestroyerCount === 2) {
      currentPlayer === "user"
        ? (infoDisplay.innerHTML = "You sank the computer's destroyer")
        : (infoDisplay.innerHTML = "The computer sank your destroyer");
      currentPlayer === "user"
        ? (destroyerCount = 10)
        : (cpuDestroyerCount = 10);
    }
    if (submarineCount === 3 || cpuSubmarineCount === 3) {
      currentPlayer === "user"
        ? (infoDisplay.innerHTML = "You sank the computer's submarine")
        : (infoDisplay.innerHTML = "The computer sank your submarine");
      currentPlayer === "user"
        ? (submarineCount = 10)
        : (cpuSubmarineCount = 10);
    }
    if (cruiserCount === 3 || cpuCruiserCount === 3) {
      currentPlayer === "user"
        ? (infoDisplay.innerHTML = "You sank the computer's cruiser")
        : (infoDisplay.innerHTML = "The computer sank your cruiser");
      currentPlayer === "user" ? (cruiserCount = 10) : (cpuCruiserCount = 10);
    }
    if (battleshipCount === 4 || cpuBattleshipCount === 4) {
      currentPlayer === "user"
        ? (infoDisplay.innerHTML = "You sank the computer's battleship")
        : (infoDisplay.innerHTML = "The computer sank your battleship");
      currentPlayer === "user"
        ? (battleshipCount = 10)
        : (cpuBattleshipCount = 10);
    }
    if (carrierCount === 5 || cpuCarrierCount === 5) {
      currentPlayer === "user"
        ? (infoDisplay.innerHTML = "You sank the computer's carrier")
        : (infoDisplay.innerHTML = "The computer sank your carrier");
      currentPlayer === "user" ? (carrierCount = 10) : (cpuCarrierCount = 10);
    }

    if (
      destroyerCount +
        submarineCount +
        cruiserCount +
        battleshipCount +
        carrierCount ===
      50
    ) {
      infoDisplay.innerHTML = "YOU WIN";
      setTimeout(3000);
      gameOver();
    }

    if (
      cpuDestroyerCount +
        cpuSubmarineCount +
        cpuCruiserCount +
        cpuBattleshipCount +
        cpuCarrierCount ===
      50
    ) {
      infoDisplay.innerHTML = "YOU LOSE";
      setTimeout(3000);
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    startBtn.removeEventListener("click", playGame);
    startBtn.addEventListener("click", function () {
      location.reload();
    });
  }

  //CREATE USER AND COMPUTER GAME AREAS
  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

  //CREATE THE COMPUTER SHIPS
  generate(shipArray[0]);
  generate(shipArray[1]);
  generate(shipArray[2]);
  generate(shipArray[3]);
  generate(shipArray[4]);

  //DRAG AND DROP LOGIC
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

  startBtn.addEventListener("click", playGame);
});
