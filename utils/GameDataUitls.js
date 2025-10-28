// ==UserScript==
// @name     Galactic Tyocoons Game Data Utils
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==
// 

var show = document.createElement("input");
show.type = "button";
show.value = "Test Utils";
show.className = "btn btn-sm btn-secondary"
show.onclick = showData;

document.body.insertBefore(show, document.body.firstChild);

let gameData
setTimeout(async ()=> {    
    const gameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });

    gameData = await gameDataResponse.json()
},10)

function findBuildingFromName(name)
{
   const exactEntry = gameData.buildings.find((element) => element.name == name )

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
