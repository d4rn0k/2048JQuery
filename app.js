"use strict";

//TODO Przekształcić na MVC
//TODO Dodać restart Button
//TODO Dodać funkcjonalność top Score (korzystający z localstorage)
//TODO Dodać dobre kolory dla kafelków
//TODO Dodać responsywność
//TODO Dodać możliwość zmiany rozmiaru kafelków
//TODO Dodać możliwość contentEditable dla komórki (HACK)

var DIRECTIONS = Object.freeze({
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
});

var GAME_STATES = Object.freeze({
    GAME_OVER: 0,
    MOVE_OTHER_DIRECTION: 1,
    CAN_MOVE: 2
});

var NoAvailableSpaceException = "Brak miejsca na mapie!";

var currentScore = 0;
var tiles;

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

initializeMap();

function generateHtmlTable(height, width) {
    var jQTable = $("#GameTable");

    jQTable.empty();
    for (var i = 0; i < height; i++) {
        var row = $("<tr></tr>").appendTo(jQTable);
        for (var j = 0; j < width; j++) {
            $(row).append("<td></td>");
        }
    }
}

function generateMap(newHeight, newWidth) {
    generateHtmlTable(newHeight, newWidth);

    tiles = new TilesArray(newHeight, newWidth);
    tiles.init();

    generateTiles(tiles.columns, 3);
    renderMap(tiles.rows);

    return tiles;
}

function initializeMap() {
    var tiles;
    tiles = generateMap(3, 7);
    bindKeys(tiles);
}

function bindKeys(tiles) {

    $("#RowsSettings").find("select").change(function () {
        tiles.currentMapHeight = this.value;
        console.log("new Height: " + tiles.currentMapHeight);
        currentScore = 0;
        tiles = generateMap(tiles.currentMapHeight, tiles.currentMapWidth);
    });

    $("#ColumnsSettings").find("select").change(function () {
        tiles.currentMapWidth = this.value;
        console.log("new Width: " + tiles.currentMapWidth);
        currentScore = 0;
        tiles = generateMap(tiles.currentMapHeight, tiles.currentMapWidth);
    });

    $(document).keydown(function (event) {
        moveAndGenerate(event);
    });
}

function renderMap(rows) {
    var jQTiles = $("table td");

    for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var currentRow = rows[rowIndex];

        for (var columnIndex = 0; columnIndex < currentRow.values.length; columnIndex++) {
            var tileValue = currentRow.values[columnIndex].value;
            $(jQTiles[rowIndex * rows[0].values.length + columnIndex]).html(tileValue).attr('class', 'tile' + tileValue);
        }
    }
    $("#Score").html(currentScore);
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


function moveAndGenerate(event) {

    if (makeMoveAndCheck(event.which, tiles) === undefined) {
        return;
    }
    event.preventDefault(); // prevent the default action (scroll / move caret)

    try {
        generateTiles(tiles.columns, 1);
    }
    catch (exception) {
    }

    renderMap(tiles.rows);
}

function makeMoveAndCheck(direction, tiles) {

    var directionFunction;

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


    switch (canMove(direction, tiles)) {
        case GAME_STATES.CAN_MOVE:
            directionFunction(tiles);
            break;
        case GAME_STATES.MOVE_OTHER_DIRECTION:
            console.log("RUSZ SIĘ W INNYM KIERUNKU!");
            return;
        case GAME_STATES.GAME_OVER:
            window.alert("Przegrałeś! Wynik:" + currentScore);
    }

    return "Ok";
}

function canMove(direction, tilesArray) {
    var stateLeftRight;
    var stateUpDown;


    for (var rowIndex = 0; rowIndex < tilesArray.currentMapHeight; rowIndex++) {
        if (checkIfCanRowMove(tilesArray.rows[rowIndex].values)) {
            stateLeftRight = GAME_STATES.CAN_MOVE;
            break;
        } else {
            stateLeftRight = GAME_STATES.MOVE_OTHER_DIRECTION;
        }
    }

    for (var columnIndex = 0; columnIndex < tilesArray.currentMapWidth; columnIndex++) {
        if (checkIfCanRowMove((tilesArray.columns[columnIndex].values))) {
            stateUpDown = GAME_STATES.CAN_MOVE;
            break;
        } else {
            stateUpDown = GAME_STATES.MOVE_OTHER_DIRECTION;
        }
    }

    if (stateLeftRight === GAME_STATES.MOVE_OTHER_DIRECTION && stateUpDown === GAME_STATES.MOVE_OTHER_DIRECTION) {
        return GAME_STATES.GAME_OVER;
    } else if ((direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) && stateLeftRight === GAME_STATES.CAN_MOVE) {
        return GAME_STATES.CAN_MOVE;
    } else if ((direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) && stateUpDown === GAME_STATES.CAN_MOVE) {
        return GAME_STATES.CAN_MOVE;
    }
    else {
        return GAME_STATES.MOVE_OTHER_DIRECTION;
    }
}


//Błąd rozdzielić na dwie funkcję oddzielnie sprawdzające prawo i lewo, górę i dół
function checkIfCanRowMove(row) {
    var canMove = false;

    for (var i = 0; i < row.length - 1; i++) {
        var currentCellValue = row[i].value;
        var nextCellValue = row[i + 1].value;
        if (currentCellValue === "" || nextCellValue === "" || currentCellValue === nextCellValue) {
            return true;
        }
    }

    return canMove;
}

function moveUp(input) {
    var columns = input.columns;
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        columns[columnIndex] = doSingleMoveOnRow(columns[columnIndex]);
    }
}

function moveDown(input) {
    var columns = input.columns;
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        columns[columnIndex] = doSingleMoveOnRowReverse(columns[columnIndex]);
    }
}

function moveLeft(input) {
    var rows = input.rows;
    for (var indexRow = 0; indexRow < rows.length; indexRow++) {
        rows[indexRow] = doSingleMoveOnRow(rows[indexRow]);
    }
}

function moveRight(input) {
    var rows = input.rows;
    for (var indexRow = 0; indexRow < rows.length; indexRow++) {
        rows[indexRow] = doSingleMoveOnRowReverse(rows[indexRow]);
    }
}

function doSingleMoveOnRow(inputColumn) {
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

function doSingleMoveOnRowReverse(inputColumn) {
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