const circle = document.querySelector(".center-circle")
const numInput = document.getElementById("numInput")
const degreeEl = document.querySelector(".degree-label")
const sendCircles = document.querySelectorAll(".send-circle")
const board = document.querySelector(".board")


const user = {
    el: document.querySelector(".user"),
    arrow: document.getElementById("user-arrow"),
    circle: document.querySelector(".user .rotate-circle"),
    heading: 0,
    x: 0,
    y: 0,
    getPosition: function() {
        return
    }
}

const match = {
    el: document.querySelector(".match"),
    arrow: document.getElementById("match-arrow"),
    circle: document.querySelector(".match .rotate-circle"),
    heading: 0,
    x: 0,
    y: 0
}
//Origin is in the top left, extent is in the bottom right. This maps out the rectangular area of the simulated space in lat, lon
const environment = {
    origin: {
        lat: 1,
        lon: 1,
    },
    extent: {
        lat: 1,
        lon: 2
    }
}

const userArrow = document.querySelector(".user-arrow")
const matchArrow = document.querySelector(".match-arrow")
//TODO: get bearing to match to work
var matchDirection = bearingToMatch(user, match)


function point (degree) {
        if (!isNaN(degree)) {
            const degree = event.target.value
            circle.style.transform = `rotate(${degree}deg)`
            event.target.value = ""
            degreeEl.innerText = degree + "º"
        }
        else {
            degreeEl.innerText = "Only input numbers"
        }
    }

function findInnerAngle(s1,s2, opSide) {
    return Math.acos((s1**2 + s2**2 - opSide**2)/(2*s1*s2)) * 180/Math.PI
}
function bearingToMatch(user, match) {
    const angleFromOrigin = Math.atan((match.x - user.x)/ (match.y - user.y)) * 180/Math.PI + match.x < user.x ? 180 : 0
    return angleFromOrigin - user.heading 


}

window.addEventListener("load", (e) => {
    const userPos = user.el.getClientRects()[0]
    const matchPos = match.el.getClientRects()[0]
    const offset = board.getClientRects()[0]
    user.x = userPos.x - offset.left - userPos.width/2
    user.y = userPos.y - offset.top - userPos.height/2
    match.x = matchPos.x - offset.left - matchPos.width/2
    match.y = matchPos.y - offset.top - matchPos.height/2
})

//draggable
user.arrow.ondragstart =  (e) => {
    e.dataTransfer.setData("class", ".user")
}
match.arrow.ondragstart =  (e) => {
    e.dataTransfer.setData("class", ".match")
}
board.ondragover = function(event) {
        event.preventDefault();
      };
board.ondrop = (e) => {
    e.preventDefault()
    const offset = board.getClientRects()[0]
    const itemClass = e.dataTransfer.getData("class")
    const droppedItem =  document.querySelector(itemClass)
    const {width, height} = droppedItem.getClientRects()[0]
    const x = e.x - offset.left - width/2
    const y = e.y - offset.top - height/2
    droppedItem.style.top = y +"px"
    droppedItem.style.left = x +"px"
    if (itemClass === ".user") {
        user.x = x
        user.y = y
        console.log("user", user)
    }
    else {
        match.x = x
        match.y = y
        console.log("Match x", match.x)
    }

}

//Input degree
numInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        point(e.target.value)
    }
})


//Send position
document.body.addEventListener("keyup", (e) => {
    if (e.key === "s") {
        sendCircles.forEach((val) => {
            val.classList.add("ping")
        })
    }
})

//Cancel send amination
sendCircles.forEach((val) => {
    val.addEventListener("animationend", (e) => {
        e.target.classList.remove("ping")
    })
})

//Rotation logic
user.circle.addEventListener("click", (e) => {
    const pos = user.circle.getClientRects()[0]
    const center = {x: pos.left + pos.width /2, y: pos.top + pos.height / 2}
    const top = {x: pos.left + pos.width /2, y: pos.top}
    const s1 = Math.sqrt((e.x - center.x)**2 + (e.y - center.y)**2)
    const s2 = center.y - top.y
    const opSide = Math.sqrt((e.x - top.x)**2 + (e.y - top.y)**2)
    const angle =  (e.x < center.x ? 180 - findInnerAngle(s1, s2, opSide) + 180 : findInnerAngle(s1, s2, opSide))
    user.el.style.transform = `rotate(${angle}deg)`
    user.heading = angle
})

match.circle.addEventListener("click", (e) => {
    const pos = match.circle.getClientRects()[0]
    const center = {x: pos.left + pos.width /2, y: pos.top + pos.height / 2}
    const top = {x: pos.left + pos.width /2, y: pos.top}
    const s1 = Math.sqrt((e.x - center.x)**2 + (e.y - center.y)**2)
    const s2 = center.y - top.y
    const opSide = Math.sqrt((e.x - top.x)**2 + (e.y - top.y)**2)
    const angle =  (e.x < center.x ? 180 - findInnerAngle(s1, s2, opSide) + 180 : findInnerAngle(s1, s2, opSide))
    match.el.style.transform = `rotate(${angle}deg)`
    match.heading = angle
})

match.circle.addEventListener("mousedown", (e) => {

})
