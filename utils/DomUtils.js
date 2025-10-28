let tooltipDiv
document.addEventListener('DOMContentLoaded', (event) => {
    var div = document.createElement('div');
    div.innerHTML = `<div class="tooltip bs-tooltip-auto fade show" role="tooltip" style="position: absolute; inset: auto auto 0px 0px; margin: 0px;" data-popper-placement="top">` +
        '<div class="tooltip-arrow" style="position: absolute; left: 0px; transform: translate(25px);">' +
        `</div><div class="tooltip-inner">tooltip</div></div>`.trim();

    tooltipDiv = div.firstChild;
    tooltipDiv.style.display = "none";
})

function CreateTooltip(text, posX, posY) {
    tooltipDiv.style.transform = `translate(${posX}px, ${posY}px)`
    tooltipDiv.querySelector('.tooltip-inner').textContent = text
    tooltipDiv.style.display = "block";
}

function HideTooltip() {
    tooltipDiv.style.display = "none";
}