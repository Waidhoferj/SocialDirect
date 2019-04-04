const circle = document.querySelector(".center-circle")
const numInput = document.getElementById("numInput")
const degreeEl = document.querySelector(".degree-label")
const sendCircles = document.querySelectorAll(".send-circle")
const board = document.querySelector(".board")
const toggle = {online: document.querySelector("#online"), local: document.querySelector("#local")}
const animationMenu = {play: document.querySelector(".pause-play"),
                       close: document.querySelector(".cancel"),
                       pinPlacer: document.querySelector(".pin-button"),
                       placingPins: false,
                        el: document.querySelector(".controls")}

//TODO: switch client bounding boxes to computed styles

const user = {
    el: document.querySelector(".user"),
    arrow: document.getElementById("user-arrow"),
    circle: document.querySelector(".user .rotate-circle"),
    heading: 0,
    x: 0,
    y: 0,
    table: {lat: document.getElementById("user-lat"), lon: document.getElementById("user-lon")},
    getGeoPosition,
    setPos,
    waypoints: [],
    walk
}

const match = {
    el: document.querySelector(".match"),
    arrow: document.getElementById("match-arrow"),
    circle: document.querySelector(".match .rotate-circle"),
    heading: 0,
    x: 0,
    y: 0,
    table: {lat: document.getElementById("match-lat"), lon: document.getElementById("match-lon")},
    getGeoPosition,
    setPos,
    waypoints: [],
    walk
}

//Origin is in the top left, extent is in the bottom right. Used to create rectangular bounding box. Rectangle bounds Cal Poly. Ping rate in ms.
const environment = {
    usingServer: false,
    pingRate: 100,
    origin: {
        lat: 35.309301,
        lon: -120.670036,
    },
    extent: {
        lat: 35.297267, 
        lon: -120.652539
    }
}

function pointDistance (p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)
}


function setPos(pxPoint) {
    const offset = board.getClientRects()[0]
    const elementPosition = this.el.getClientRects()[0]
    this.x = 100 * (pxPoint.x - offset.left - elementPosition.width/2) / (offset.right - offset.left)
    this.y = 100 * (pxPoint.y - offset.top - elementPosition.height/2) /(offset.bottom - offset.top)
    this.table.lon.innerText = Math.round(this.x)
    this.table.lat.innerText = Math.round(this.y)
}

function walk (duration) {
    let totalDistance = 0;
    let speed = 0
    let steps = []
    let prevPoint = this.waypoints[0]
    let keyframes = [{duration: 0, destination: {x: 0, y: 0}, }]
    //Find total distance to calculate individual animaiton duration
    for (let i = 1; i< this.waypoints.length; i++) {
        const waypointDist = pointDistance(waypoints[i], prevPoint)
        prevPoint = waypoints[i]
        totalDistance += waypointDist
    }
    speed = totalDistance/duration * 1000
    prevPoint = this.waypoints[0]
    //generate keyframe information CHANGE TO PERCENT
    for (let i = 1; i < this.waypoints.length; i++) {
        keyframes.append({duration:pointDistance(waypoints[i], prevPoint)/speed, destination: waypoints[i]})
    }
    let prevAnimationDuration = 0
    //Create animation stages
    for (let i = 1; i < keyframes.length; i++) {
        const waypoint = new Promise((res, rej) => {
            setTimeout(() => {
                this.el.style.transition = `top ${keyframes[i].duration}s , left ${keyframes[i].duration}s`
                this.el.style.left =  keyframes[i].destination.x + "%"
                this.el.style.top =  keyframes[i].destination.y + "%"
                res()
            }, prevAnimationDuration + 100); //Added slop
        })
        steps.append(waypoint)
    }
    //Start tracking position
    const positionTracker = setInterval(() => {
        const style = window.getComputedStyle(this.el)
        console.log(this.el.getClientRects()[0].top)
        
    }, 10);

    //Set ping interval for online mode
    
    //Start animation



}

// user.walk()


function getGeoPosition() {
    const latRange = environment.extent.lat - environment.origin.lat
    const lonRange = environment.extent.lon - environment.origin.lon
    const lat = latRange*this.x + environment.origin.lat
    const lon = lonRange*this.y + environment.origin.lon
    return {lat, lon}
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
    return -(angleFromOrigin + user.heading) 


}

// console.log("geoposition user", user.getGeoPosition())
// console.log("geoposition user", match.getGeoPosition())
function toggleMode(e) {
    toggle.online.classList.remove("active")
    toggle.local.classList.remove("active")
    e.target.classList.add("active")
    if (e.target.id === "online") {
        environment.usingServer = true
    }
    else {
        environment.usingServer = false
        point(bearingToMatch(user,match))

    }
}


//Toggle waypoint mode
animationMenu.pinPlacer.addEventListener("click", (e) => {
    console.log(document.querySelector(".pin-background"))
    if (!animationMenu.placingPins) {
        document.querySelector(".pin-background").classList.add("active")
        animationMenu.placingPins = true
    }
    else {
        document.querySelector(".pin-background").classList.remove("active")
        animationMenu.placingPins = false
    }
    
})

//Manage Location Toggle
toggle.online.addEventListener("click", (e) => {
    toggleMode(e)
})
toggle.local.addEventListener("click", (e) => {
    toggleMode(e)
})


//Manage Animation Toggle 
animationMenu.play.addEventListener("click", (e) => {
    if (e.target.src.includes("Pause")) {
        e.target.src = "./assets/Play.svg"
    }
    else {
        e.target.src = "./assets/Pause.svg"
    }
})

//Close the animation menu
animationMenu.close.addEventListener("click", (e) => {
    animationMenu.el.style.visibility = "hidden"
})


//Set initial positions
window.addEventListener("load", (e) => {
    const userPos = user.el.getClientRects()[0]
    const matchPos = match.el.getClientRects()[0]
    user.setPos(userPos)
    match.setPos(matchPos)
    point(bearingToMatch(user,match))


})

//draggable
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
    const itemClass = e.dataTransfer.getData("class")
    // const droppedItem =  document.querySelector(itemClass)
    // const {width, height} = droppedItem.getClientRects()[0]
    //Convert pixels into percentage
    if (itemClass === ".user") {
        user.setPos({x: e.x, y:e.y})
        user.el.style.top = user.y +"%"
        user.el.style.left = user.x +"%"
    }
    else {
        match.setPos({x: e.x, y:e.y})
        match.el.style.top = match.y +"%"
        match.el.style.left = match.x +"%"
    }
    //Automatically update pointer if local
    if (!environment.usingServer) {
        point(bearingToMatch(user,match))
    }
    

}


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
