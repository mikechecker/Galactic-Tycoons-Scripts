// ==UserScript==
// @name     Galactic Tyocoons Profit Calculator
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==

setInterval(function () {
    if (exchangePrices.length == 0) {
        return
    }

    if (!gameData) {
        return
    }

    updateEncyclpediaInfo()
    updateProductionInfo()
}, 100)

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
    const buildingData = findBuildingFromName(buildingName)
    if (!buildingData) {
        return
    }
    const consumables = buildingData.workersNeeded.reduce((acc, workersAmount, index) => {
        if (workersAmount == 0)
            return acc

        gameData.workers[index].consumables.forEach(consumable => {
            const existing = acc.get(consumable.matId)
            if (existing) {
                existing += consumable.amount * workersAmount / 1000
            } else {
                acc.set(consumable.matId, consumable.amount * workersAmount / 1000)
            }
        })
        return acc
    }, new Map())

    // convert consumables to cost per hour
    let costPerHour = 0
    for (let [key, value] of consumables) {
        costPerHour += exchangePrices.find((element) => element.matId == key)?.avgPrice * value / 24 / 100
    }

    let RecipeSelectionHeader = RecipeTbody.parentElement.querySelector('thead tr')

    if (RecipeSelectionHeader.lastChild.textContent == "Profit") {
        return
    }

    let Cell = RecipeSelectionHeader.insertCell(-1)
    let th = document.createElement('th');
    th.textContent = "Profit"
    Cell.appendChild(th)

    let RecipeRows = RecipeTbody.querySelectorAll('tr.cursor-pointer')

    // get all Ingredients
    for (let i = 0; i < RecipeRows.length; i++) {
        let Row = RecipeRows[i]
        if (Row.children.length < 4) {
            return
        }
        if (RecipeRows[i].children.length != 4) {
            RecipeRows[i].removeChild(RecipeRows[i].children[4])
        }

        const IngredientDiv = RecipeRows[i].cells[0]
        const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

        let TotalCost = 0
        let ingredients = []
        for (var Recipe of ContentDiv) {
            const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
            const price = GetMat(ingredient, exchangePrices).avgPrice
            TotalCost += amount * price

            ingredients.push([ingredient, amount, price])
        }

        const TimeCell = RecipeRows[i].cells[2]
        const Time = ConvertTimeToHours(TimeCell.textContent)
        TotalCost += costPerHour * Time
        const ResultCell = RecipeRows[i].cells[3]
        const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

        const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

        const price =
            GetMat(ingredient, exchangePrices).avgPrice

        // Calculate cost for workforce

        let td = document.createElement('td');
        td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
        RecipeRows[i].appendChild(td);
    }
}

async function updateEncyclpediaInfo() {
    let SourceDiv = document.querySelector('div[class="fw-bold"]')
    if (!SourceDiv || SourceDiv.textContent != "Source") {
        return
    }

    SourceDiv.parentElement.querySelectorAll('thead tr').forEach(tr => {
        if (tr.children.length < 4) {
            return
        }

        if (tr.children.length == 5) {
            let Cell = tr.insertCell(-1)
            let newTh = document.createElement('th');
            newTh.textContent = "Profit"
            Cell.appendChild(newTh)
        }

        let RecipeRows = tr.parentElement.parentElement.querySelectorAll('tbody tr')

        // get all Ingredients
        for (let i = 0; i < RecipeRows.length; i++) {
            let Row = RecipeRows[i]
            if (Row.children.length < 5) {
                return
            }

            if (Row.children.length == 6) {
                Row.removeChild(Row.children[5])
            }

            const titleDiv = Row.cells[0].querySelector('div.btn-caption')
            if (!titleDiv) {
                return
            }

            // Building cost per hour
            const buildingName = titleDiv.textContent
            const buildingData = findBuildingFromName(buildingName)
            if (!buildingData) {
                return
            }
            const consumables = buildingData.workersNeeded.reduce((acc, workersAmount, index) => {
                if (workersAmount == 0)
                    return acc

                gameData.workers[index].consumables.forEach(consumable => {
                    const existing = acc.get(consumable.matId)
                    if (existing) {
                        existing += consumable.amount * workersAmount / 1000
                    } else {
                        acc.set(consumable.matId, consumable.amount * workersAmount / 1000)
                    }
                })
                return acc
            }, new Map())

            // convert consumables to cost per hour
            let costPerHour = 0
            for (let [key, value] of consumables) {
                costPerHour += exchangePrices.find((element) => element.matId == key)?.avgPrice * value / 24 / 100
            }
            const IngredientDiv = Row.cells[1]
            const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

            let TotalCost = 0
            let ingredients = []
            for (var Recipe of ContentDiv) {
                const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
                const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
                const price = GetMat(ingredient).avgPrice
                TotalCost += amount * price

                ingredients.push([ingredient, amount, price])
            }

            const TimeCell = Row.cells[3]
            const Time = ConvertTimeToHours(TimeCell.textContent)
            TotalCost += costPerHour * Time
            const ResultCell = Row.cells[4]
            const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

            const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

            const price =
                GetMat(ingredient).avgPrice

            let td = document.createElement('td');
            td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
            Row.appendChild(td);
        }
    })
}

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

function GetMat(MatName) {
    const ExactEntry = exchangePrices.find((element) => element.matName == MatName)

    if (ExactEntry)
        return ExactEntry
    return exchangePrices.find((element) => element.matName.includes(MatName))
}

//------------------------------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------------------------------
let gameData
setTimeout(async () => {
    const gameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });

    gameData = await gameDataResponse.json()
}, 10)

function findBuildingFromName(name) {
    const exactEntry = gameData.buildings.find((element) => element.name == name)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name))
}

function getMatForName(matName) {
    const name = matName.trim()
    const exactEntry = gameData.materials.find((element) => element.name == name || element.sName == name)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name) || element.sName.includes(name))
}


//------------------------------------------------------------------------------------------------------
// Exchange Cache
//------------------------------------------------------------------------------------------------------
//--- Settings --
const cookieNameExchangeData = "exchange-data"
const maxLifetimeSeconds = 60
// all values in ms
const checkIntervalOffsetMin = 1 * 1000
const checkIntervalOffsetMax = 10 * 1000
//--- Settings end ---

let exchangePrices = []

setTimeout(async function () { await updateExchangeData() }, Math.max(Math.floor(Math.random() * checkIntervalOffsetMax)), checkIntervalOffsetMin)

setInterval(async function () {
    await updateExchangeData()
}, maxLifetimeSeconds + Math.max(Math.floor(Math.random() * checkIntervalOffsetMax)), checkIntervalOffsetMin)

async function showData() {
    var exhangeData = await getData()
    notes = console.log(exhangeData);
}

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
