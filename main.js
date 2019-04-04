const circle = document.querySelector(".center-circle")
const numInput = document.getElementById("numInput")
const degreeEl = document.querySelector(".degree-label")
const sendCircles = document.querySelectorAll(".send-circle")
const board = document.querySelector(".board")
const toggle = {online: document.querySelector("#online"), local: document.querySelector("#local")}


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
    usingServer: false,
    origin: {
        lat: 1,
        lon: 1,
    },
    extent: {
        lat: 1,
        lon: 2
    }
}



function point (degree) {
            circle.style.transform = `rotate(${degree}deg)`
            degreeEl.innerText = Math.round(degree) + "º"
    }

function findInnerAngle(s1,s2, opSide) {
    return Math.acos((s1**2 + s2**2 - opSide**2)/(2*s1*s2)) * 180/Math.PI
}
function bearingToMatch(user, match) {
    const angleFromOrigin = Math.atan((user.x - match.x)/ (user.y - match.y)) * 180/Math.PI + (user.y < match.y ? 180 : 0)
    console.log(angleFromOrigin + user.heading)
    return -(angleFromOrigin + user.heading) 


}


function toggleMode(e) {
    toggle.online.classList.remove("active-toggle")
    toggle.local.classList.remove("active-toggle")
    e.target.classList.add("active-toggle")
    if (e.target.id === "online") {
        environment.usingServer = true
    }
    else {
        environment.usingServer = false
    }
}

//Manage Toggle
toggle.online.addEventListener("click", (e) => {
    toggleMode(e)
})
toggle.local.addEventListener("click", (e) => {
    toggleMode(e)
})

//Set initial positions
window.addEventListener("load", (e) => {
    const userPos = user.el.getClientRects()[0]
    const matchPos = match.el.getClientRects()[0]
    const offset = board.getClientRects()[0]
    user.x = 100 * (userPos.x - offset.left - userPos.width/2) / (offset.right - offset.left)
    user.y = 100 * (userPos.y - offset.top - userPos.height/2) /(offset.bottom - offset.top)

    match.x = 100 * (matchPos.x - offset.left - matchPos.width/2) / (offset.right - offset.left)
    match.y = 100 * (matchPos.y - offset.top - matchPos.height/2) /(offset.bottom - offset.top)

    point(bearingToMatch(user,match))
    // console.log(bearingToMatch(user,match))

})

//draggable
console.log(match.arrow)
user.arrow.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("class", ".user")
})
match.arrow.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("class", ".match")
})
board.ondragover = function(event) {
        event.preventDefault();
      };
board.ondrop = (e) => {
    e.preventDefault()
    const offset = board.getClientRects()[0]
    const itemClass = e.dataTransfer.getData("class")
    const droppedItem =  document.querySelector(itemClass)
    const {width, height} = droppedItem.getClientRects()[0]
    //Convert pixels into percentage
    const x = 100 * (e.x - offset.left - width/2) / (offset.right - offset.left)
    const y = 100 * (e.y - offset.top - height/2) /(offset.bottom - offset.top)
    droppedItem.style.top = y +"%"
    droppedItem.style.left = x +"%"
    //Update position in object
    if (itemClass === ".user") {
        user.x = x
        user.y = y
    }
    else {
        match.x = x
        match.y = y
    }
    point(bearingToMatch(user,match))

}

//Input degree
numInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        if (!isNaN(e.target.value)) {
            point(Number(e.target.value))
        }
        
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
    //Set new user heading
    user.el.style.transform = `rotate(${angle}deg)`
    user.heading = angle
    //update compass
    point(bearingToMatch(user, match))
})
