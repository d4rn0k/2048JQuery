"use strict";

var NoAvailableSpaceException = "Brak miejsca na mapie!";
var mapWidth = 4;
var mapHeight = 4;
var tilesArray = [mapHeight[mapWidth]];
var currentScore = 0;

initializeMap();
bindKeys();

Array.prototype.swap = function(x, y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
};

function initializeMap() {
    for (var i = 0; i < mapHeight; i++) {
        tilesArray[i] = [];
        for (var j = 0; j < mapWidth; j++) {
            tilesArray[i][j] = "";
        }
    }
    generateTiles(tilesArray, 3);
    renderMap(tilesArray);
}

function bindKeys() {
    $(document).keydown(function(event) {

        //TODO przenieść do switcha powinno być wywoływane tylko  dla strzałek left right up down, teraz jest dla wszystkich klawiszy
        if (!canMove(tilesArray)) {
            window.alert("Przegrałeś! Wynik:" + currentScore);
        }

        switch (event.which) {
            case 37: // left
                moveLeft(tilesArray);
                break;
            case 38: // up
                moveUp(tilesArray);
                break;
            case 39: // right
                moveRight(tilesArray);
                break;
            case 40: // down
                moveDown(tilesArray);
                break;
            default:
                return; // exit this handler for other keys
        }
        event.preventDefault(); // prevent the default action (scroll / move caret)

        try {
            generateTiles(tilesArray, 1);
        }
        catch (exception) {
        }

        renderMap(tilesArray);
    });
}

function renderMap(tilesArray) {
    var jQTiles = $("table td");
    for (var i = 0; i < mapHeight; i++) {
        for (var j = 0; j < mapWidth; j++) {
            var tileValue = tilesArray[i][j];
            $(jQTiles[i * mapHeight + j]).html(tileValue).attr('class', 'tile' + tileValue);
        }
    }
    $("#Score").html(currentScore);
}

function generateTiles(tilesArray, tilesToGenerateCount) {
    console.log("Wygenerowałem kafelki");

    var availablePositions = getAvailablePositions(tilesArray);
    if (availablePositions === -1) {
        throw NoAvailableSpaceException;
    }

    for (var i = 0; i < tilesToGenerateCount; i++) {
        var tilePositions = getRandomObjectFromArray(availablePositions);
        var indexI = tilePositions.i;
        var indexJ = tilePositions.j;
        tilesArray[indexI][indexJ] = (Math.floor((Math.random() * 2))) ? 2 : 4; // Losuje 2 albo 4
    }
}

function getAvailablePositions(tilesArray) {
    var availablePositions = [];
    for (var i = 0; i < mapHeight; i++) {
        for (var j = 0; j < mapWidth; j++) {
            if (tilesArray[i][j] === "") {
                availablePositions.push({i: i, j: j});
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

function getColumnFromTilesArray(tilesArray, columnIndex) {
    var outputArray = [];
    for (var i = 0; i < mapHeight; i++) {
        outputArray.push(tilesArray[i][columnIndex]);
    }
    return outputArray;
}

function setColumnFromTilesArray(tilesArray, column, columnIndex) {
    for (var i = 0; i < mapHeight; i++) {
        tilesArray[i][columnIndex] = column[i];
    }
}

function canMove(tilesArray) {
    // Left && Right
    for (var rowIndex = 0; rowIndex < mapHeight; rowIndex++) {
        if (checkIfCanRowMove(tilesArray[rowIndex])) {
            return true;
        }
    }

    //Up && Down

    for (var columnIndex = 0; columnIndex < mapWidth; columnIndex++) {
        if (checkIfCanRowMove(getColumnFromTilesArray(tilesArray, columnIndex))) {
            return true;
        }
    }
    return false;
}

function checkIfCanRowMove(row) {
    var canMove = false;

    for (var i = 0; i < row.length - 1; i++) {
        if (row[i] === "" || row[i + 1] === "" || row[i] === row[i + 1]) {
            return true;
        }
    }

    return canMove;
}

function moveUp(tilesArray) {

//    for (var indexCol = 0; indexCol < mapWidth; indexCol++) {
//        var n = mapWidth;
//        var indexJoinLock = 0;
//        do {
//            var indexRow;
//            for (indexRow = indexJoinLock; indexRow < mapHeight - 1; indexRow++) {
//                if (inputArray[indexRow][indexCol] === "") {
//                    inputArray[indexRow][indexCol] = inputArray[indexRow + 1][indexCol];
//                    inputArray[indexRow + 1][indexCol] = "";
//                }
//                else if ((inputArray[indexRow][indexCol] === inputArray[indexRow + 1][indexCol])) {
//                    indexJoinLock = indexRow + 1;
//                    inputArray[indexRow][indexCol] = inputArray[indexRow + 1][indexCol] * 2;
//                    inputArray[indexRow + 1][indexCol] = "";
//                }
//            }
//            n--;
//        } while (n > 1);
//    }

    for (var columnIndex = 0; columnIndex < mapHeight; columnIndex++) {
        var sortedColumn = cleanAndCalculateRow(getColumnFromTilesArray(tilesArray, columnIndex));
        setColumnFromTilesArray(tilesArray, sortedColumn, columnIndex);
        //
    }
}

function moveDown(tilesArray) {
    for (var columnIndex = 0; columnIndex < mapHeight; columnIndex++) {
        var sortedColumn = cleanAndCalculateRowReverse(getColumnFromTilesArray(tilesArray, columnIndex));
        setColumnFromTilesArray(tilesArray, sortedColumn, columnIndex);
    }
}

function moveLeft(tilesArray) {
    for (var indexRow = 0; indexRow < mapHeight; indexRow++) {
        tilesArray[indexRow] = cleanAndCalculateRow(tilesArray[indexRow]);
    }
}

function moveRight(tilesArray) {
    for (var indexRow = 0; indexRow < mapHeight; indexRow++) {
        tilesArray[indexRow] = cleanAndCalculateRowReverse(tilesArray[indexRow]);
    }
}

function cleanAndCalculateRow(inputColumn) {
    var n = inputColumn.length;
    var sortedLastIndex = 0;
    var changesCount = 0;
    do {
        var indexRow;
        for (indexRow = sortedLastIndex; indexRow < inputColumn.length - 1; indexRow++) {
            if (inputColumn[indexRow] === "") {
                inputColumn.swap(indexRow, indexRow + 1);
            } else if ((inputColumn[indexRow] === inputColumn[indexRow + 1])) {
                sortedLastIndex = indexRow + 1;

                inputColumn[indexRow] = inputColumn[indexRow + 1] * 2;
                inputColumn[indexRow + 1] = "";

                currentScore += inputColumn[indexRow];
            } else {
                changesCount++;
            }
        }
        n--;
    } while (n > 1);
    return inputColumn;
}

function cleanAndCalculateRowReverse(inputColumn) {
    var n = inputColumn.length;
    var sortedLastIndex = n - 1;
    var changesCount = 0;
    do {
        var indexRow;
        for (indexRow = sortedLastIndex; indexRow > 0; indexRow--) {
            if (inputColumn[indexRow] === "") {
                inputColumn[indexRow] = inputColumn[indexRow - 1];
                inputColumn[indexRow - 1] = "";
            }
            else if ((inputColumn[indexRow] === inputColumn[indexRow - 1])) {
                sortedLastIndex = indexRow - 1;
                inputColumn[indexRow] = inputColumn[indexRow - 1] * 2;
                inputColumn[indexRow - 1] = "";
                currentScore += inputColumn[indexRow];
            } else {
                changesCount++;
            }
        }
        n--;
    } while (n > 1);
    return inputColumn;
}

//function displayArray(inputArray) {
//    for (var i = 0; i < 4; i++) {
//        var row = i;
//        for (var j = 0; j < 4; j++) {
//            row += "[" + (inputArray[i][j] !== "" ? inputArray[i][j] : " "  ) + "]";
//        }
//        console.log(row);
//    }
//    console.log("\n");
//}