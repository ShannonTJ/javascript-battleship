// const { info } = require("console");

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
  const singlePlayerButton = document.querySelector("#singlePlayerButton");
  const multiplayerButton = document.querySelector("#multiplayerButton");

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

  //SERVER VARIABLES (multiplayer only)
  let gameMode = "";
  let playerNum = 0;
  let ready = false;
  let enemyReady = false;
  let allShipsPlaced = false;
  let shotFired = -1;

  //EVENT LISTENERS
  rotateBtn.addEventListener("click", rotate);
  ships.forEach((ship) => ship.addEventListener("dragstart", dragStart));
  singlePlayerButton.addEventListener("click", startSinglePlayer);
  multiplayerButton.addEventListener("click", startMultiplayer);

  //MULTIPLAYER FUNCTION
  function startMultiplayer() {
    gameMode = "multiplayer";

    //Get player number
    const socket = io();
    socket.on("player-number", (num) => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry the server is full"; //only 2 players allowed at a time
      } else {
        playerNum = parseInt(num);
        if (playerNum === 1) currentPlayer = "enemy";

        console.log(playerNum);

        //Get other player status
        socket.emit("check-players");
      }
    });

    //Another player has connected or disconnected
    socket.on("player-connection", (num) => {
      console.log(`Player number ${num} has connected or disconnected`);
      playerConnectedOrDisconnected(num);
    });

    //On enemy ready
    socket.on("enemy-ready", (num) => {
      enemyReady = true; //set local variable
      playerReady(num); //pass player number to playerReady (toggle red to green)
      if (ready) playGameMulti(socket); //start game if we are ready
    });

    //Check player status
    socket.on("check-players", (players) => {
      players.forEach((p, i) => {
        if (p.connected) playerConnectedOrDisconnected(i); //pass index of player to change visual status of player
        if (p.ready) {
          playerReady(i);
          if (i !== playerNum) enemyReady = true; //if the ready player isn't us, it must be the enemy
        }
      });
    });

    //On timeout
    socket.on("timeout", () => {
      infoDisplay.innerHTML = "You have reached the 10 minute limit";
    });

    //Ready button click for multiplayer
    startBtn.addEventListener("click", () => {
      if (allShipsPlaced) playGameMulti(socket);
      else {
        infoDisplay.innerHTML =
          "Please place all ships, then press start to begin";
        setTimeout(function () {
          infoDisplay.innerHTML = " ";
        }, 3000);
      }
    });

    //FIRING SHOTS IN MULTIPLAYER
    computerSquares.forEach((square) => {
      square.addEventListener("click", () => {
        if (currentPlayer === "user" && ready && enemyReady) {
          shotFired = square.dataset.id; //pass the clicked square number to the other player
          socket.emit("fire", shotFired); //pass data to server
        }
      });
    });

    //RECEIVING SHOTS IN MULTIPLAYER
    socket.on("fire", (id) => {
      enemyTurn(id);
      const square = userSquares[id]; //get the square from our grid
      socket.emit("fire-reply", square.classList); //send square class info to the other player
      playGameMulti(socket); //change whose turn it is
    });

    //RECEIVING SHOT REPLIES IN MULTIPLAYER
    socket.on("fire-reply", (classList) => {
      revealSquare(classList);
      playGameMulti(socket); //switch current user
    });

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`; //get p1 or p2
      document
        .querySelector(`${player} .connected span`)
        .classList.toggle("green");
      if (parseInt(num) === playerNum)
        document.querySelector(player).style.fontWeight = "bold"; //indicates which player we are by making the font bold
    }
  }

  //SINGLE PLAYER FUNCTION
  function startSinglePlayer() {
    gameMode = "singlePlayer";

    //CREATE THE COMPUTER SHIPS (singlePlayer mode ONLY)
    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);

    startBtn.addEventListener("click", () => {
      if (allShipsPlaced) playGameSingle();
      else {
        infoDisplay.innerHTML =
          "Please place all ships, then press start to begin";
        setTimeout(function () {
          infoDisplay.innerHTML = " ";
        }, 3000);
      }
    });
  }

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
    //check if all ships have been placed
    if (!displayGrid.querySelector(".ship")) allShipsPlaced = true;
  }

  function dragEnd() {
    console.log("dragend");
  }

  //GAME LOGIC FOR MULTIPLAYER
  function playGameMulti(socket) {
    if (isGameOver) return;
    if (!ready) {
      socket.emit("player-ready");
      ready = true;
      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer === "user") {
        turn.innerHTML = "Your Turn";
      }
      if (currentPlayer === "enemy") {
        turn.innerHTML = "Enemy's Turn";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }

  //GAME LOGIC FOR SINGLE PLAYER
  function playGameSingle() {
    //don't start the game when there is a game over
    if (isGameOver) return;

    //player logic
    if (currentPlayer === "user") {
      computerSquares.forEach((square) =>
        square.addEventListener("click", function (e) {
          //check if the user already clicked on the square
          if (
            !square.classList.contains("kaboom") &&
            !square.classList.contains("sploosh")
          ) {
            shotFired = square.dataset.id;
            revealSquare(square.classList);
          }
          //display an error message to the user
          else {
            infoDisplay.innerHTML = "You've already clicked this square";
            setTimeout(function () {
              infoDisplay.innerHTML = " ";
            }, 3000);
          }
        })
      );
    } else {
      //computer logic
      setTimeout(enemyTurn, 700);
    }
  }

  function revealSquare(classList) {
    //look for the div with the data-id of shotFired
    const enemySquare = computerGrid.querySelector(
      `div[data-id='${shotFired}']`
    );
    //turn classList into an object to search values more easily
    const obj = Object.values(classList);

    //game logic for user clicking on computer area
    //when there's a hit, update a counter
    if (
      (!enemySquare.classList.contains("kaboom") ||
        !enemySquare.classList.contains("sploosh")) &&
      currentPlayer === "user" &&
      !isGameOver
    ) {
      if (obj.includes("destroyer")) destroyerCount++;
      if (obj.includes("submarine")) submarineCount++;
      if (obj.includes("cruiser")) cruiserCount++;
      if (obj.includes("battleship")) battleshipCount++;
      if (obj.includes("carrier")) carrierCount++;
    }

    //change square color when the user hits
    if (obj.includes("taken")) {
      enemySquare.classList.add("kaboom");
    }
    //change square color when the user misses
    else {
      enemySquare.classList.add("sploosh");
    }

    checkForWins();

    currentPlayer = "enemy";
    turn.innerHTML = "Enemy's Turn";

    //computer turn begins
    if (gameMode === "singlePlayer") {
      currentPlayer = "computer";
      turn.innerHTML = "Computer's Turn";
      playGameSingle();
    }
  }

  function enemyTurn(square) {
    //generate a random square to hit in single player mode
    if (gameMode === "singlePlayer") {
      //get a random index to hit
      square = Math.floor(Math.random() * userSquares.length);

      //computer should always choose a new square index
      while (
        userSquares[square].classList.contains("kaboom") ||
        userSquares[square].classList.contains("sploosh")
      ) {
        square = Math.floor(Math.random() * userSquares.length);
      }
    }

    //if there is a hit on any boat, update the counters
    if (userSquares[square].classList.contains("destroyer"))
      cpuDestroyerCount++;
    if (userSquares[square].classList.contains("submarine"))
      cpuSubmarineCount++;
    if (userSquares[square].classList.contains("battleship"))
      cpuBattleshipCount++;
    if (userSquares[square].classList.contains("cruiser")) cpuCruiserCount++;
    if (userSquares[square].classList.contains("carrier")) cpuCarrierCount++;

    //change square color when the computer hits
    if (userSquares[square].classList.contains("taken")) {
      userSquares[square].classList.add("kaboom");
    }
    //change square color when the computer misses
    else {
      userSquares[square].classList.add("sploosh");
    }

    checkForWins();

    currentPlayer = "user";
    turn.innerHTML = "Your Turn";
  }

  function checkForWins() {
    let enemy = "computer";
    let message = infoDisplay.innerHTML;

    if (gameMode === "multiplayer") enemy = "enemy";

    if (destroyerCount === 2) {
      //display destroyer messages
      message = `You sank the ${enemy}'s destroyer`;
      destroyerCount = 10;
    }
    if (cpuDestroyerCount === 2) {
      message = `The ${enemy} sank your destroyer`;
      cpuDestroyerCount = 10;
    }

    //display submarine messages
    if (submarineCount === 3) {
      message = `You sank the ${enemy}'s submarine`;
      submarineCount = 10;
    }
    if (cpuSubmarineCount === 3) {
      message = `The ${enemy} sank your submarine`;
      cpuSubmarineCount = 10;
    }

    //display cruiser messages
    if (cruiserCount === 3) {
      message = `You sank the ${enemy}'s cruiser`;
      cruiserCount = 10;
    }
    if (cpuCruiserCount === 3) {
      message = `The ${enemy} sank your cruiser`;
      cpuCruiserCount = 10;
    }

    //display battleship messages
    if (battleshipCount === 4) {
      message = `You sank the ${enemy}'s battleship`;
      battleshipCount = 10;
    }
    if (cpuBattleshipCount === 4) {
      message = `The ${enemy} sank your battleship`;
      cpuBattleshipCount = 10;
    }

    //display carrier messages
    if (carrierCount === 5) {
      message = `You sank the ${enemy}'s carrier`;
      carrierCount = 10;
    }
    if (cpuCarrierCount === 5) {
      message = `The ${enemy} sank your carrier`;
      cpuCarrierCount = 10;
    }

    infoDisplay.innerHTML = message;

    if (
      destroyerCount +
        submarineCount +
        cruiserCount +
        battleshipCount +
        carrierCount ===
      50
    ) {
      infoDisplay.innerHTML = "YOU WIN! Press start to play again";
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
      infoDisplay.innerHTML = "YOU LOSE. Press start to play again";
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    startBtn.removeEventListener("click", playGameSingle);
    startBtn.addEventListener("click", function () {
      location.reload();
    });
  }

  //INVOKE FUNCTIONS////////////////////////////////////////////////////////////////////////

  //CREATE USER AND COMPUTER GAME AREAS
  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

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
});
