"use strict";

window.onload = function () {
    Storage.prototype.setObj = function (key, obj) {
        return this.setItem(key, JSON.stringify(obj));
    };

    Storage.prototype.getObj = function (key) {
        return JSON.parse(this.getItem(key));
    };

    var DIRECTIONS = Object.freeze({
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    });

    var GAME_STATES = Object.freeze({
        CAN_MOVE: 0,
        MOVE_OTHER_DIRECTION: 1,
        GAME_OVER: 2
    });

    var myTiles;
    var currentScore = 0;
    var currentGameState = GAME_STATES.CAN_MOVE;
    var gameOverModal = document.getElementById("game-over-modal");
    var noAvailableSpaceException = "No available space for new tile!";

    initialize();

    function initialize() {

        myTiles = generateMap(4, 4);

        document.getElementById("restart-button").onclick = restartGame;

        document.getElementById("rows-settings").onchange = function (event) {
            myTiles.mapHeight = event.target.value;
            document.getElementById("game-table-container").focus();
            restartGame();
        };

        document.getElementById("columns-settings").onchange = function (event) {
            myTiles.mapWidth = event.target.value;
            document.getElementById("game-table-container").focus();
            restartGame();
        };
        document.getElementById("save-score-button").onclick = closeModalAndSaveData;
        document.getElementById("save-score-form").onsubmit = closeModalAndSaveData;

        bindArrows();
        renderTopScores(getMapTypeKey(myTiles));
    }

    function restartGame() {
        currentScore = 0;
        myTiles = generateMap(myTiles.mapHeight, myTiles.mapWidth);
        document.getElementById("game-table").focus();
        renderCurrentScore();
        renderTopScores(getMapTypeKey(myTiles));
    }

    function bindArrows() {
        document.addEventListener("keydown", moveAndGenerate);
    }

    function unbindArrows() {
        document.removeEventListener("keydown", moveAndGenerate);
    }

    /**
     * Classes
     */
    function Tile(value) {
        this.value = value;
    }

    function TilesArray(height, width) {

        this.tilesArray = [];

        this.mapHeight = height;
        this.mapWidth = width;

        this.init = function () {
            for (var rowIndex = 0; rowIndex < this.mapHeight; rowIndex++) {
                this.tilesArray[rowIndex] = [];
                for (var columnIndex = 0; columnIndex < this.mapWidth; columnIndex++) {
                    this.tilesArray[rowIndex].push(new Tile(""));
                }
            }
        };

        this.getRow = function (rowIndex) {
            return this.tilesArray[rowIndex];
        };

        this.getColumn = function (columnIndex) {
            var column = [];

            for (var i = 0; i < this.mapHeight; i++) {
                column.push(this.tilesArray[i][columnIndex]);
            }

            return column;
        };

        this.setRow = function (rowIndex, newRow) {
            this.tilesArray[rowIndex] = newRow;
        };

        this.setColumn = function (columnIndex, newColumn) {

            for (var i = 0; i < this.mapHeight; i++) {
                this.tilesArray[i][columnIndex] = newColumn[i];
            }
        };

        this.getElement = function (rowIndex, columnIndex) {
            return this.tilesArray[rowIndex][columnIndex];
        };
    }

    function generateHtmlTable(height, width) {
        var table = document.getElementById("game-table");
        table.innerHTML = "";

        for (var i = 0; i < height; i++) {
            var row = document.createElement("tr");
            table.appendChild(row);
            for (var j = 0; j < width; j++) {
                row.appendChild(document.createElement("td"));
            }
        }
    }

    function generateMap(newHeight, newWidth) {
        generateHtmlTable(newHeight, newWidth);

        myTiles = new TilesArray(newHeight, newWidth);
        myTiles.init();

        addNewRandomTile(myTiles, 3);
        renderMap(myTiles);

        currentGameState = GAME_STATES.CAN_MOVE;

        return myTiles;
    }

    function addNewRandomTile(tiles, tilesToGenerateCount) {
        var availablePositions = getAvailablePositions(tiles);

        if (availablePositions.length === 0) {
            throw noAvailableSpaceException;
        }

        for (var i = 0; i < tilesToGenerateCount; i++) {
            var randomTile = getRandomObjectFromArray(availablePositions);

            // Add's new tile to the map
            // 2 to 4 : 80 % to 20%
            tiles.tilesArray[randomTile.rowIndex][randomTile.columnIndex].value = (Math.random() > 0.2) ? 2 : 4;
        }
    }

    function getAvailablePositions(tiles) {
        var availablePositions = [];

        for (var i = 0; i < tiles.mapHeight; i++) {

            var currentRow = tiles.tilesArray[i];

            for (var j = 0; j < tiles.mapWidth; j++) {
                if (currentRow[j].value === "") {
                    availablePositions.push({rowIndex: i, columnIndex: j});
                }
            }
        }

        return availablePositions;
    }

    function getRandomObjectFromArray(inputArray) {
        var maxIndex = inputArray.length;

        return inputArray[Math.floor(Math.random() * maxIndex)];
    }


//VIEW
    function renderMap(tiles) {
        var documentCells = document.getElementById("game-table").getElementsByTagName("td");

        for (var rowIndex = 0; rowIndex < tiles.mapHeight; rowIndex++) {

            var currentRow = tiles.tilesArray[rowIndex];

            for (var columnIndex = 0; columnIndex < tiles.mapWidth; columnIndex++) {

                var tileValue = currentRow[columnIndex].value;
                var documentCell = documentCells[rowIndex * tiles.mapWidth + columnIndex];

                documentCell.innerText = (tileValue);
                documentCell.className = "";
                documentCell.classList.add('tile' + tileValue);
            }
        }
    }

    function renderCurrentScore() {
        var currentScoreElements = document.getElementsByClassName("current-score");

        for (var i = 0; i < currentScoreElements.length; i++) {
            currentScoreElements[i].innerText = currentScore;
        }
    }

    function displayGameOverModal(modal) {
        modal.style.display = "block";
        document.getElementById("nickname-input").focus();
        unbindArrows();
    }

    function closeModalAndSaveData(e) {
        e.preventDefault(); // Prevent refresh page.

        var nickName = document.getElementById("nickname-input").value;
        if (nickName === "") {
            return;
        }
        var scoreTypeKey = getMapTypeKey(myTiles);

        saveScore(currentScore, nickName, scoreTypeKey);
        renderTopScores(scoreTypeKey);
        gameOverModal.style.display = "none";
        bindArrows();
        restartGame();

        return false;
    }

    function getMapTypeKey(tiles) {
        return tiles.mapWidth + "x" + tiles.mapHeight;
    }

    function renderTopScores(mapTypeKey) {
        var sortedInputArray = localStorage.getObj(mapTypeKey);
        var noScoreDiv = document.getElementById("no-scores");
        document.getElementById("score-type-header").innerText = mapTypeKey;

        noScoreDiv.style.display = "none";
        if (typeof sortedInputArray !== "undefined") {
            var topScoresDiv = document.getElementById("top-scores-container");

            topScoresDiv.innerHTML = "";

            if (sortedInputArray === null) {
                noScoreDiv.style.display = "block";
                return;
            }


            for (var i = 0; i < 10; i++) {
                var scoreRow = document.createElement("div");

                var idCell = document.createElement("span");
                var nicknameCell = document.createElement("span");
                var scoreCell = document.createElement("span");

                var playerElement = sortedInputArray[i];


                if (playerElement === undefined) {
                    return;
                }

                scoreRow.className = "score-row";
                idCell.className = "score-row-id";
                nicknameCell.className = "score-row-nickname";
                scoreCell.className = "score-row-score";

                idCell.innerText = (i + 1) + ".";
                nicknameCell.innerText = playerElement.nickName;
                scoreCell.innerText = playerElement.score;

                scoreRow.appendChild(idCell);
                scoreRow.appendChild(nicknameCell);
                scoreRow.appendChild(scoreCell);
                topScoresDiv.appendChild(scoreRow);
            }
        } else {
            noScoreDiv.style.display = "block";
        }
    }


//Score logic
    function saveScore(score, currentNickname, mapTypeKey) {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getObj(mapTypeKey) !== null) {

                var scoreTable = localStorage.getObj(mapTypeKey);
                scoreTable.push({
                    nickName: currentNickname,
                    score: score,
                    date: new Date()
                });
                sortTop10Scores(scoreTable);
                localStorage.setObj(mapTypeKey, scoreTable);

            } else {
                localStorage.setObj(mapTypeKey, [{
                        nickName: currentNickname,
                        score: score,
                        date: new Date()
                    }]
                );
            }
        } else {
            console.warn("No storage support!");
        }
    }

    function sortTop10Scores(input) {
        input.sort(function (a, b) {
            if (a.score === b.score) {
                return a.date - b.date;
            }
            return b.score - a.score;
        });
    }


//Logic
    function moveAndGenerate(event) {

        event.preventDefault();

        var directionFunction;
        var direction = event.which;

        switch (direction) {
            case DIRECTIONS.LEFT:
                directionFunction = moveLeft;
                break;
            case DIRECTIONS.UP:
                directionFunction = moveUp;
                break;
            case DIRECTIONS.RIGHT:
                directionFunction = moveRight;
                break;
            case DIRECTIONS.DOWN:
                directionFunction = moveDown;
                break;
            default:
                return;
        }

        currentGameState = canMove(direction, myTiles);

        switch (currentGameState) {
            case GAME_STATES.CAN_MOVE:
                directionFunction(myTiles);
                try {
                    addNewRandomTile(myTiles, 1);
                }
                catch (exception) {
                    console.error(exception);
                }
                renderMap(myTiles);
                renderCurrentScore();
                break;

            case GAME_STATES.MOVE_OTHER_DIRECTION:
                console.log("RUSZ SIĘ W INNYM KIERUNKU!");
                break;

            case GAME_STATES.GAME_OVER:
                displayGameOverModal(gameOverModal);
        }
    }

    function canMove(direction, tiles) {
        var stateLeft;
        var stateRight;
        var stateUp;
        var stateDown;

        for (var rowIndex = 0; rowIndex < tiles.mapHeight; rowIndex++) {
            if (stateRight) {
                break;
            }
            stateRight = canRowMove(true, tiles.getRow(rowIndex));
        }

        for (var rowIndex1 = 0; rowIndex1 < tiles.mapHeight; rowIndex1++) {
            if (stateLeft) {
                break;
            }
            stateLeft = canRowMove(false, tiles.getRow(rowIndex1));
        }

        for (var columnIndex = 0; columnIndex < tiles.mapWidth; columnIndex++) {
            if (stateUp) {
                break;
            }
            stateUp = canRowMove(false, tiles.getColumn(columnIndex));
        }

        for (var columnIndex1 = 0; columnIndex1 < tiles.mapWidth; columnIndex1++) {
            if (stateDown) {
                break;
            }
            stateDown = canRowMove(true, tiles.getColumn(columnIndex1));
        }

        if (stateLeft === false && stateRight === false && stateDown === false && stateUp === false) {
            return GAME_STATES.GAME_OVER;
        }

        if (direction === DIRECTIONS.LEFT && stateLeft) {
            return GAME_STATES.CAN_MOVE;
        }
        if (direction === DIRECTIONS.RIGHT && stateRight) {
            return GAME_STATES.CAN_MOVE;
        }
        if (direction === DIRECTIONS.UP && stateUp) {
            return GAME_STATES.CAN_MOVE;
        }
        if (direction === DIRECTIONS.DOWN && stateDown) {
            return GAME_STATES.CAN_MOVE;
        }

        return GAME_STATES.MOVE_OTHER_DIRECTION;
    }

    function canRowMove(horizontally, row) {

        var currentElement, numberElement, nextElement;
        var allCurrentCellsAreNumber = false;

        if (horizontally) {
            for (var i = 0; i < row.length - 1; i++) {
                currentElement = row[i].value;
                nextElement = row[i + 1].value;

                if (currentElement !== "" && nextElement === "") {
                    return true;
                }
                if (currentElement !== "" || nextElement !== "") {
                    allCurrentCellsAreNumber = true;
                }

                if ((numberElement === nextElement) || ( currentElement !== "" && currentElement === nextElement)) {
                    return true;
                } else {
                    currentElement = nextElement;
                }

                if (i === row.length - 2 && (currentElement !== "" && !allCurrentCellsAreNumber)) {
                    return true;
                }

                if (currentElement !== "") {
                    numberElement = currentElement;
                    allCurrentCellsAreNumber = true;
                }


            }
        } else {
            for (var j = row.length - 1; j > 0; j--) {
                currentElement = row[j].value;
                nextElement = row[j - 1].value;

                if (currentElement !== "" && nextElement === "") {
                    return true;
                }
                if (currentElement !== "" || nextElement !== "") {
                    allCurrentCellsAreNumber = true;
                }

                if ((numberElement === nextElement) || ( currentElement !== "" && currentElement === nextElement)) {
                    return true;
                } else {
                    currentElement = nextElement;
                }

                if (j === 1 && (currentElement !== "" && !allCurrentCellsAreNumber)) {
                    return true;
                }

                if (currentElement !== "") {
                    numberElement = currentElement;
                    allCurrentCellsAreNumber = true;
                }

            }
        }

        return false;
    }

    function moveUp(tiles) {
        for (var columnIndex = 0; columnIndex < tiles.mapWidth; columnIndex++) {
            tiles.setColumn(columnIndex, doSingleMove(tiles.getColumn(columnIndex)));
        }
    }

    function moveDown(tiles) {
        for (var columnIndex = 0; columnIndex < tiles.mapWidth; columnIndex++) {
            tiles.setColumn(columnIndex, doSingleMoveReverse(tiles.getColumn(columnIndex)));
        }
    }

    function moveLeft(tiles) {
        for (var rowIndex = 0; rowIndex < tiles.mapHeight; rowIndex++) {
            tiles.setRow(rowIndex, doSingleMove(tiles.getRow(rowIndex)));
        }
    }

    function moveRight(tiles) {
        for (var rowIndex = 0; rowIndex < tiles.mapHeight; rowIndex++) {
            tiles.setRow(rowIndex, doSingleMoveReverse(tiles.getRow(rowIndex)));
        }
    }

    function doSingleMove(input) {
        var elementCount = input.length;
        var sortedLastIndex = 0;

        do {
            var indexRow;
            for (indexRow = sortedLastIndex; indexRow < input.length - 1; indexRow++) {

                var currentElement = input[indexRow];
                var nextElement = input[indexRow + 1];
                input.changed = true;

                if (currentElement.value === "") {
                    currentElement.value = nextElement.value;
                    nextElement.value = "";

                } else if ((currentElement.value === nextElement.value)) {
                    sortedLastIndex = indexRow + 1;

                    currentElement.value = nextElement.value * 2;
                    nextElement.value = "";

                    currentScore += currentElement.value;
                } else {
                    input.changed = false;
                }
            }
            elementCount--;
        } while (elementCount > 1);

        return input;
    }

    function doSingleMoveReverse(input) {
        var n = input.length;
        var sortedLastIndex = n - 1;

        do {
            var indexRow;
            for (indexRow = sortedLastIndex; indexRow > 0; indexRow--) {
                var currentElement = input[indexRow];
                var prevElement = input[indexRow - 1];

                if (currentElement.value === "") {
                    currentElement.value = prevElement.value;
                    prevElement.value = "";
                }
                else if ((currentElement.value === prevElement.value)) {
                    sortedLastIndex = indexRow - 1;
                    currentElement.value = prevElement.value * 2;
                    prevElement.value = "";
                    currentScore += currentElement.value;
                } else {
                    input.changed = false;
                }
            }
            n--;
        } while (n > 1);

        return input;
    }
};