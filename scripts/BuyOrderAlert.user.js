// ==UserScript==
// @name     Galactic Tyocoons Buy Order Alert
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==

//--- User Configurable Variables ---
const volume = 0.5
const sound = "/sfx/trade.mp3"

//-----------------------------------

//--- Game Data ---
let MaterialsData
let ExchangePrices;

//--- Variables ---
let BuyOrders = new Map()
let CurrentMatId = undefined;

setTimeout(async () => {
    const GameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });
    MaterialsData = (await GameDataResponse.json()).materials;

    const ExchangeResponse = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices', {
        method: 'GET'
    });

    ExchangePrices = (await ExchangeResponse.json()).prices;


}, 10);

document.addEventListener('click', function () {
    UpdateButtons()
    console.log(BuyOrders)
});

function UpdateButtons(force = false) {
    let OrderPanel = document.querySelector('#exchangeTradeMatCard')

    if (!OrderPanel) {
        return
    }

    let MatTextPanel = OrderPanel.querySelector('div.h5.mb-0.me-1')

    const MatText = MatTextPanel?.textContent
    const CurrentMat = GetMat(MatText)

    if (force == false && CurrentMatId && CurrentMatId == CurrentMat.id) {
        return
    }

    CurrentMatId = CurrentMat.id

    if (CurrentMat == undefined) {
        Alert("Material not found!")
    }

    let OldCardBody = document.querySelector("#OrderCardBody")
    OldCardBody?.remove();

    const MatOrder = BuyOrders.get(CurrentMat.id);

    const CardBody = OrderPanel.querySelector("div.card-body > div.card")

    let OrderCardBody = document.createElement("div")
    OrderCardBody.className = "card-body"
    OrderCardBody.id = "OrderCardBody"

    let OrderRow = document.createElement("div")
    OrderRow.className = "row"

    let OrderLabel = document.createElement("div")
    OrderLabel.className = "col-3 col-xl-2 caption-lr-center"
    OrderLabel.textContent = "Alert Price"

    let OrderTextBoxDiv = document.createElement("div")
    OrderTextBoxDiv.className = "col"

    let OrderTextBox = document.createElement("input")
    OrderTextBox.nodeType = 'number'
    OrderTextBox.setAttribute('min', '0')
    OrderTextBox.setAttribute('max', '10000000')
    OrderTextBox.setAttribute('value', MatOrder ?? 1)
    OrderTextBox.className = 'form-control mb-1'

    CardBody.appendChild(OrderCardBody)
    OrderCardBody.appendChild(OrderRow)
    OrderRow.appendChild(OrderLabel)
    OrderTextBoxDiv.appendChild(OrderTextBox)
    OrderRow.appendChild(OrderTextBoxDiv)

    if (MatOrder) {
        let AlertButton = GetDualButton("/assets/atlas-Du9GNXYr.svg#down-to-bracket", "Update Alert")
        OrderCardBody.appendChild(AlertButton)

        AlertButton.addEventListener("click", async function () {
            const AlertPrice = Number(OrderTextBox.value)
            if (isNaN(AlertPrice) || AlertPrice <= 0) {
                Alert("Please enter a valid alert price!")
                return
            }
            AddBuyOrder(CurrentMat, AlertPrice)
        })

        let DeleteButton = GetDualButton("/assets/atlas-Du9GNXYr.svg#down-to-bracket", "Delete Alert")
        OrderCardBody.appendChild(DeleteButton)

        DeleteButton.addEventListener("click", async function () {
            RemoveBuyOrder(CurrentMat)
             UpdateButtons(true)
        })
    }
    else {
        let AlertButton = GetDualButton("/assets/atlas-Du9GNXYr.svg#down-to-bracket", "Alert")
        OrderCardBody.appendChild(AlertButton)

        AlertButton.addEventListener("click", async function () {
            const AlertPrice = Number(OrderTextBox.value)
            if (isNaN(AlertPrice) || AlertPrice <= 0) {
                Alert("Please enter a valid alert price!")
                return
            }
            AddBuyOrder(CurrentMat, AlertPrice)
             UpdateButtons(true)
        })
    }
}

async function checkBuyOrders() {
    if (MaterialsData.length == 0) {
        return
    }

    const response = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices', {
        method: 'GET'
    });
    ExchangePrices = (await response.json()).prices;

    for (const order of BuyOrders) {
    }
}

function Alert(IngredientName) {
    const a = new Audio(sound)
    a.volume = volume
    a.play().catch(e => { console.error("Error playing sound:", e) })
    alert(IngredientName);
}

function GetMat(MatName) {
    const ExactEntry = MaterialsData.find((element) => element.name == MatName)

    if (ExactEntry)
        return ExactEntry

    return MaterialsData.find((element) => element.name.includes(MatName))
}

function RemoveBuyOrder(Mat) {
    BuyOrders.delete(Mat.id)
}

function AddBuyOrder(Mat, AlertPrice) {
    if (BuyOrders == undefined) {
        BuyOrders = []
    }

    BuyOrders.set(Mat.id, AlertPrice)
}

function GetDualButton(Icon, Text) {
    let AlertButtonDiv = document.createElement("button")
    AlertButtonDiv.type = "button"
    AlertButtonDiv.className = "btn btn-primary btn-icon-split float-end animate-c"

    let IconSpan = document.createElement("span")
    IconSpan.className = "icon"

    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");

    let use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", Icon);

    IconSpan.appendChild(svg);
    svg.appendChild(use);

    AlertButtonDiv.appendChild(IconSpan);

    let TextSpan = document.createElement("span")
    TextSpan.className = "text"
    TextSpan.textContent = Text
    AlertButtonDiv.appendChild(TextSpan);

    return AlertButtonDiv;
}