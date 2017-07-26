"use strict";

//TODO Dodać dobre kolory dla kafelków
//TODO Refactor: podział na komponenty
//TODO TopScore oddzielnie dla każdego trybu gry

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

var tiles;
var currentScore = 0;
var currentGameState = GAME_STATES.CAN_MOVE;
var NoAvailableSpaceException = "Brak miejsca na mapie!";

var modal = document.getElementById('gameOverModal');

initialize();

function initialize() {

    tiles = generateMap(5, 5);

    document.getElementById("RowsSettings").onchange = function (event) {
        tiles.currentMapHeight = event.srcElement.value;
        console.log("new Height: " + tiles.currentMapHeight);
        restartGame();
    };

    document.getElementById("ColumnsSettings").onchange = function (event) {
        tiles.currentMapWidth = event.srcElement.value;
        console.log("new Width: " + tiles.currentMapWidth);
        restartGame();
    };

    document.getElementById("saveScoreButton").onclick = closeModalAndSaveData;

    bindArrows();

    renderTopScores(getMapTypeKey(tiles));
    document.getElementById("saveScoreForm").onsubmit = closeModalAndSaveData;
}

function restartGame() {
    currentScore = 0;
    tiles = generateMap(tiles.currentMapHeight, tiles.currentMapWidth);
    document.getElementById("GameTable").focus();
    renderTopScores(getMapTypeKey(tiles));
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

function ColumnOrRow(length) {
    this.values = new Array(length);
}

function TilesArray(height, width) {
    this.columns = [];
    this.rows = [];
    this.makeColumnsAndRows = function () {
        for (var i = 0; i < width; i++) {
            this.columns[i] = new ColumnOrRow(height);
        }
        for (var j = 0; j < height; j++) {
            this.rows[j] = new ColumnOrRow(width);
        }
    };

    this.init = function () {
        this.columns = [];
        this.rows = [];
        this.makeColumnsAndRows();
        for (var rowIndex = 0; rowIndex < height; rowIndex++) {
            for (var columnIndex = 0; columnIndex < width; columnIndex++) {
                var tile = new Tile("");
                this.columns[columnIndex].values[rowIndex] = tile;
                this.rows[rowIndex].values[columnIndex] = tile;
            }
        }
    };
    this.currentMapHeight = height;
    this.currentMapWidth = width;
}

function generateHtmlTable(height, width) {
    var table = document.getElementById("GameTable");

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

    tiles = new TilesArray(newHeight, newWidth);
    tiles.init();

    generateTiles(tiles.columns, 3);
    renderMap(tiles.rows);

    currentGameState = GAME_STATES.CAN_MOVE;
    return tiles;
}

function generateTiles(columns, tilesToGenerateCount) {
    var availablePositions = getAvailablePositions(columns);
    if (availablePositions === -1) {
        throw NoAvailableSpaceException;
    }

    for (var i = 0; i < tilesToGenerateCount; i++) {
        var tilePositions = getRandomObjectFromArray(availablePositions);
        var rowIndex = tilePositions.rowIndex;
        var columnIndex = tilePositions.columnIndex;
        columns[columnIndex].values[rowIndex].value = (Math.floor((Math.random() * 2))) ? 2 : 2; // Losuje 2 albo 4
    }
}

function getAvailablePositions(columns) {
    var availablePositions = [];
    for (var i = 0; i < columns.length; i++) {

        var currentColumn = columns[i];
        for (var j = 0; j < currentColumn.values.length; j++) {

            if (currentColumn.values[j].value === "") {
                availablePositions.push({rowIndex: j, columnIndex: i});
            }
        }
    }
    return availablePositions.length ? availablePositions : -1;
}

function getRandomObjectFromArray(inputArray) {
    var minIndex = 0;
    var maxIndex = inputArray.length;
    return inputArray[Math.floor(Math.random() * maxIndex) + minIndex];
}


//VIEW
function renderMap(rows) {
    var tableCells = document.getElementById("GameTable").getElementsByTagName("td");

    for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var currentRow = rows[rowIndex];

        for (var columnIndex = 0; columnIndex < currentRow.values.length; columnIndex++) {
            var tileValue = currentRow.values[columnIndex].value;
            var cell = tableCells[rowIndex * rows[0].values.length + columnIndex];
            cell.innerText = (tileValue);
            cell.classList = [];
            cell.classList.add('tile' + tileValue);
        }
    }
    var currentScoreElements = document.getElementsByClassName("currentScore");
    for (var i = 0; i < currentScoreElements.length; i++) {
        currentScoreElements[i].innerText = currentScore;
    }

}

function displayGameOverModal(modal) {
    modal.style.display = "block";

    document.getElementById("nicknameInput").focus();

    unbindArrows();
}

function closeModalAndSaveData(e) {
    e.preventDefault(); // Prevent refresh page.

    var nickName = document.getElementById("nicknameInput").value;
    var scoreTypeKey = getMapTypeKey(tiles);
    saveScore(currentScore, nickName, scoreTypeKey);
    renderTopScores(scoreTypeKey);
    modal.style.display = "none";
    bindArrows();
    restartGame();

    return false;
}

function getMapTypeKey(tiles) {
    return tiles.currentMapWidth + "x" + tiles.currentMapHeight;
}

function renderTopScores(mapTypeKey) {
    var sortedInputArray = localStorage.getObj(mapTypeKey);
    document.getElementById("ScoreTypeHeader").innerText = mapTypeKey;

    if (typeof sortedInputArray !== "undefined") {
        var topScoresDiv = document.getElementById("TopScoresContainer");
        topScoresDiv.innerHTML = "";

        if (sortedInputArray === null) {
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

    event.preventDefault(); // prevent the default action (scroll / move caret)

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
            return; // exit this handler for other keys
    }

    currentGameState = canMove(direction, tiles);

    switch (currentGameState) {
        case GAME_STATES.CAN_MOVE:
            directionFunction(tiles);
            try {
                generateTiles(tiles.columns, 1);
            }
            catch (exception) {
            }
            renderMap(tiles.rows);
            break;

        case GAME_STATES.MOVE_OTHER_DIRECTION:
            console.log("RUSZ SIĘ W INNYM KIERUNKU!");
            break;

        case GAME_STATES.GAME_OVER:
            displayGameOverModal(modal);
    }
}

function canMove(direction, tilesArray) {
    var stateLeft;
    var stateRight;
    var stateUp;
    var stateDown;


    for (var rowIndex = 0; rowIndex < tilesArray.currentMapHeight; rowIndex++) {
        if (stateRight) {
            break;
        }
        stateRight = canRowMove(true, tilesArray.rows[rowIndex].values);
    }

    for (var rowIndex1 = 0; rowIndex1 < tilesArray.currentMapHeight; rowIndex1++) {
        if (stateLeft) {
            break;
        }
        stateLeft = canRowMove(false, tilesArray.rows[rowIndex1].values);
    }

    for (var columnIndex = 0; columnIndex < tilesArray.currentMapWidth; columnIndex++) {
        if (stateUp) {
            break;
        }
        stateUp = canRowMove(false, tilesArray.columns[columnIndex].values);
    }

    for (var columnIndex1 = 0; columnIndex1 < tilesArray.currentMapWidth; columnIndex1++) {
        if (stateDown) {
            break;
        }
        stateDown = canRowMove(true, tilesArray.columns[columnIndex1].values);
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

function moveUp(input) {
    var columns = input.columns;
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        columns[columnIndex] = doSingleMove(columns[columnIndex]);
    }
}

function moveDown(input) {
    var columns = input.columns;
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        columns[columnIndex] = doSingleMoveReverse(columns[columnIndex]);
    }
}

function moveLeft(input) {
    var rows = input.rows;
    for (var indexRow = 0; indexRow < rows.length; indexRow++) {
        rows[indexRow] = doSingleMove(rows[indexRow]);
    }
}

function moveRight(input) {
    var rows = input.rows;
    for (var indexRow = 0; indexRow < rows.length; indexRow++) {
        rows[indexRow] = doSingleMoveReverse(rows[indexRow]);
    }
}

function doSingleMove(inputColumn) {
    var n = inputColumn.values.length;
    var sortedLastIndex = 0;
    do {
        var indexRow;
        for (indexRow = sortedLastIndex; indexRow < inputColumn.values.length - 1; indexRow++) {
            var currentElement = inputColumn.values[indexRow];
            var nextElement = inputColumn.values[indexRow + 1];
            inputColumn.changed = true;
            if (currentElement.value === "") {
                currentElement.value = nextElement.value;
                nextElement.value = "";

            } else if ((currentElement.value === nextElement.value)) {
                sortedLastIndex = indexRow + 1;

                currentElement.value = nextElement.value * 2;
                nextElement.value = "";

                currentScore += currentElement.value;
            } else {
                inputColumn.changed = false;
            }
        }
        n--;
    } while (n > 1);
    return inputColumn;
}

function doSingleMoveReverse(inputColumn) {
    var n = inputColumn.values.length;
    var sortedLastIndex = n - 1;
    do {
        var indexRow;
        for (indexRow = sortedLastIndex; indexRow > 0; indexRow--) {
            var currentElement = inputColumn.values[indexRow];
            var prevElement = inputColumn.values[indexRow - 1];

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
                inputColumn.changed = false;
            }
        }
        n--;
    } while (n > 1);
    return inputColumn;
}