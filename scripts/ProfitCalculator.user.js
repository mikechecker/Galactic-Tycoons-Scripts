// ==UserScript==
// @name     Galactic Tyocoons Profit Calculator
// @version  0.1.2
// @include  https://*.galactictycoons.com/*
// @downloadURL https://github.com/mikechecker/Galactic-Tycoons-Scripts/raw/refs/heads/main/scripts/ProfitCalculator.user.js
// @updateURL https://github.com/mikechecker/Galactic-Tycoons-Scripts/raw/refs/heads/main/scripts/ProfitCalculator.user.js
// @require https://raw.githubusercontent.com/mikechecker/Galactic-Tycoons-Scripts/refs/heads/main/utils/DomUtils.js
// @run-at document-end
// ==/UserScript==

//--- Settings ---

//--- Constants ---
const profitHeader = "Profit"

const config = { attributes: false, childList: true, subtree: true };
const callback = (mutationList, observer) => {
    setTimeout(() => {
        if (exchangePrices.length == 0) {
            return
        }

        if (!gameData) {
            return
        }

        updateEncyclpediaInfo()
        updateProductionInfo()
    }, 100)

};

const observer = new MutationObserver(callback);
observer.observe(document.body, config);

async function updateProductionInfo() {
    let RecipeTbody = document.querySelector('div.modal-body table tbody')
    if (!RecipeTbody) {
        return
    }

    const titleDiv = document.querySelector('h5[class="modal-title"]')
    if (!titleDiv) {
        return
    }

    // Building cost per hour
    const buildingName = titleDiv.textContent.split(" - ")[0]

    let RecipeSelectionHeader = RecipeTbody.parentElement.querySelector('thead tr')

    if (RecipeSelectionHeader.lastChild.textContent == profitHeader) {
        return
    }

    let newTh = document.createElement('th');
    newTh.className = "col"
    newTh.textContent = profitHeader
    RecipeSelectionHeader.appendChild(newTh)

    let recipeRows = RecipeTbody.querySelectorAll('tr.cursor-pointer')

    // get all Ingredients
    for (let i = 0; i < recipeRows.length; i++) {
        let row = recipeRows[i]
        if (row.children.length < 4) {
            return
        }
        if (recipeRows[i].children.length != 4) {
            recipeRows[i].removeChild(recipeRows[i].children[4])
        }

        const IngredientDiv = recipeRows[i].cells[0]
        const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

        let ingredients = []
        for (var Recipe of ContentDiv) {
            const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent

            ingredients.push([ingredient, amount])
        }

        const timeCell = recipeRows[i].cells[2]
        const time = ConvertTimeToHours(timeCell.textContent)
        const resultCell = recipeRows[i].cells[3]
        const resultContentDiv = resultCell.getElementsByClassName("btn btn-material")

        const resultAmount = resultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const resultName = resultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

        recipeRows[i].appendChild(getProfitCell(buildingName, ingredients, time, resultName, resultAmount));
    }
}

async function updateEncyclpediaInfo() {
    const updateEncyclopedia = function () {
        document.querySelectorAll('div.fw-bold').forEach((sourceDiv) => {
            if (!sourceDiv) {
                return
            }

            if (sourceDiv.textContent != "Source"
                && sourceDiv.textContent != "Producing"
                && sourceDiv.textContent != "Used in production"
            ) {
                return
            }

            let header = sourceDiv.nextSibling.querySelector('thead tr')
            if (header.lastChild.textContent != profitHeader) {
                let newTh = document.createElement('th');
                newTh.className = "col"
                newTh.textContent = profitHeader
                header.appendChild(newTh)
            }

            let RecipeRows = header.parentElement.parentElement.querySelectorAll('tbody tr')

            // get all Ingredients
            for (let i = 0; i < RecipeRows.length; i++) {
                let Row = RecipeRows[i]
                updateEnzyclopediaRow(Row)
            }
        })
    }

    let modals = document.querySelectorAll("h5.modal-title")

    for (let i = 0; i < modals.length; i++) {
        let modal = modals[i]
        if (modal.textContent != "Encyclopedia") {
            continue
        }

        addDomObserver(modal, function () {

            updateEncyclopedia()
        })

        updateEncyclopedia()
    }
}

//------------------------------------------------------------------------------------------------------
function updateEnzyclopediaRow(row) {
    if (row.cells.length > 5) {
        return
    }

    const titleDiv = row.cells[0].querySelector('div.btn-caption')
    if (!titleDiv) {
        return
    }

    // Building cost per hour
    const buildingName = titleDiv.textContent

    const ingredientDiv = row.cells[1]
    const contentDiv = ingredientDiv.getElementsByClassName("btn btn-material")

    let ingredients = []
    for (var Recipe of contentDiv) {
        const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
        ingredients.push([ingredient, amount])
    }

    const timeCell = row.cells[3]
    const time = ConvertTimeToHours(timeCell.textContent)

    const resultCell = row.cells[4]
    const resultContentDiv = resultCell.getElementsByClassName("btn btn-material")

    const resultAmount = resultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
    const result = resultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

    row.appendChild(getProfitCell(buildingName, ingredients, time, result, resultAmount));
}

//------------------------------------------------------------------------------------------------------
function getProfitCell(buildingName, ingredients, time, resultName, resultAmount) {
    const getMissingDataContent = () => {
        let td = document.createElement('td');
        td.textContent = "Missing prices"
        return td
    }

    let missingData = false
    let totalCost = ingredients.reduce(function (acc, entry) {
        const price = getExchangeEntryFromName(entry[0])

        if (price == undefined) {
            missingData = true
            return
        }

        return acc + price.currentPrice * parseInt(entry[1]) / 100

    }, 0)

    if (missingData)
        return getMissingDataContent()

    const buildingData = findBuildingFromName(buildingName)
    if (!buildingData) {
        console.log(`Could not find building ${buildingName}`)
        return getMissingDataContent()
    }

    const consumables = buildingData.workersNeeded.reduce((acc, workersAmount, index) => {
        if (workersAmount == 0)
            return acc

        gameData.workers[index].consumables.forEach(consumable => {
            let existing = acc.get(consumable.matId)
            if (existing) {
                existing += consumable.amount * workersAmount
            } else {
                acc.set(consumable.matId, consumable.amount * workersAmount)
            }
        })
        return acc
    }, new Map())

    // convert consumables to cost per hour
    let costPerHour = 0
    for (let [key, value] of consumables) {
        const exchangeEntry = getExchangeEntry(key)

        if (exchangeEntry == undefined) {
            return getMissingDataContent()
        }

        costPerHour += exchangeEntry?.currentPrice * (value/1000) / 24 / 100
    }

    totalCost += costPerHour * time

    const exchangeEntry = getExchangeEntryFromName(resultName)

    if (exchangeEntry == undefined) {
        return getMissingDataContent()
    }

    const price = exchangeEntry.currentPrice / 100

    let td = document.createElement('td');
    td.textContent = Math.round((price * resultAmount - totalCost) / time ).toLocaleString() + "$"
    return td
}

//------------------------------------------------------------------------------------------------------
function ConvertTimeToHours(_time) {
    const Splits = _time.split(' ');
    if (Splits[0].endsWith('h')) {
        const Hours = Splits[0].substring(0, Splits[0].length - 1);
        const Minutes = Splits[1].substring(0, Splits[1].length - 1);
        return Number(Hours) + Minutes / 60;
    }

    const Minutes = Splits[0].substring(0, Splits[0].length - 1);
    return Minutes / 60;
}

//------------------------------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------------------------------
let gameData
setTimeout(async function () {
    const gameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });

    gameData = await gameDataResponse.json()
}, 10)

//----------------------------------------------------------------------------------------------------------
function findBuildingFromName(name) {
    const exactEntry = gameData.buildings.find((element) => element.name == name)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name))
}

//----------------------------------------------------------------------------------------------------------
function getMatForName(matName) {
    const name = matName.trim()
    const exactEntry = gameData.materials.find((element) => element.name == name || element.sName == matName)

    if (exactEntry)
        return exactEntry
    const fuzzyResult = gameData.materials.find((element) => element.name.includes(name) || element.sName.includes(name))

    console.assert(fuzzyResult, `Could not find material: ${matName}`)
    if (fuzzyResult) {
        return fuzzyResult
    }
}

//----------------------------------------------------------------------------------------------------------
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

//----------------------------------------------------------------------------------------------------------
const pageEnum =
{
    Exchange: "Exchange",
    Base: "Base",
}

//----------------------------------------------------------------------------------------------------------
function getSelectedPage() {
    const selectedPage = document.querySelector("a.nav-link.cursor-pointer.py-3.active span.ms-1").textContent
    return selectedPage
}

//------------------------------------------------------------------------------------------------------
// Exchange Cache
//------------------------------------------------------------------------------------------------------
//--- Settings --
const cookieNameExchangeData = "exchange-data"
const maxLifetimeSeconds = 60
// all values in ms
const checkIntervalOffsetMin = 0
const checkIntervalOffsetMax = 500
//--- Settings end ---

let exchangePrices = []

setTimeout(async function () { await updateExchangeData() }, Math.max(Math.floor(Math.random() * checkIntervalOffsetMax)), checkIntervalOffsetMin)

setInterval(async function () {
    await updateExchangeData()
}, maxLifetimeSeconds + Math.max(Math.floor(Math.random() * checkIntervalOffsetMax)), checkIntervalOffsetMin)

async function updateExchangeData() {
    const lastUpdate = getLastUpdateTime()
    if (lastUpdate && new Date(lastUpdate.getTime() + maxLifetimeSeconds * 1000) > Date.now()) {
        exchangePrices = await getData()
        return
    }

    const exchangeResponse = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices', {
        method: 'GET'
    });

    // Fallback if API is down or bugdet is exceeded
    if (exchangeResponse.status != 200) {
        exchangePrices = await getData()
        return
    }

    let exchange = await exchangeResponse.json()

    setData(exchange)
}

function setData(data) {
    exchangePrices = data.prices;
    data.timeStamp = Date.now()
    sessionStorage.setItem(cookieNameExchangeData, JSON.stringify(data));
}

function getData() {
    const sessionData = JSON.parse(sessionStorage.getItem(cookieNameExchangeData))
    return sessionData.prices;
}

function getLastUpdateTime() {
    const sessionData = JSON.parse(sessionStorage.getItem(cookieNameExchangeData))
    return new Date(sessionData?.timeStamp);
}

//------------------------------------------------------------------------------------------------------
function getExchangeEntry(matId) {
    return exchangePrices.find((element) => element.matId == matId)
}

//------------------------------------------------------------------------------------------------------
function getExchangeEntryFromName(matName) {
    const mat = getMatForName(matName)

    if (mat == undefined) {
        return undefined
    }

    return exchangePrices.find((element) => element.matId == mat.id && (element.avgPrice >= 0 || element.currentPrice >= 0))
}

//------------------------------------------------------------------------------------------------------
function addDomObserver(dom, callback, config) {
    if (config == undefined) {
        config = { attributes: false, childList: true, subtree: true }
    }

    const observer = new MutationObserver(callback)
    observer.observe(dom, config)
}