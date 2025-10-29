// ==UserScript==
// @name     Galactic Tyocoons Exchange Cookie test
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==

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
