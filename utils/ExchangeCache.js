// ==UserScript==
// @name     Galactic Tyocoons Exchange Cookie test
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==

//--- Settings --
const cookieNameExchangeData = "exchange-data"
const maxLifetimeSeconds = 60
// all values in ms
const checkIntervalOffsetMin = 1 * 1000
const checkIntervalOffsetMax = 10 * 1000
//--- Settings end ---

let exchangePrices = []

var show = document.createElement("input");
show.type = "button";
show.value = "Print Exchange Data";
show.className = "btn btn-sm btn-secondary"
show.onclick = showData;

document.body.insertBefore(show, document.body.firstChild);

var update = document.createElement("input");
update.type = "button";
update.value = "Update Exchange Data";
update.className = "btn btn-sm btn-secondary"
update.onclick = updateExchangeData;

document.body.insertBefore(update, document.body.firstChild);

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
        return
    }
    
    const exchangeResponse = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices', {
        method: 'GET'
    });

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
    return new Date(sessionData.timeStamp);
}
