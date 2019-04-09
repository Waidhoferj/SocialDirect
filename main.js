//CLASSES
//--------------------------------------------------------------
class Applet {
  constructor(compass, board) {
    this.compass = compass;
    this.board = board;
    this.toggle = {
      online: document.querySelector("#online"),
      local: document.querySelector("#local")
    };
    this.usingServer = false;
    this.pingInterval = null;
    this.pingRate = 500;
    this.sendCircles = document.querySelectorAll(".send-circle");
    this._createEvents();
  }

  postLocations() {
    let locations = [];
    for (let i = 0; i < this.board.users.length; i++) {
      locations.push(
        new Promise((resolve, reject) => {
          axios.post(
            //url,
            this.board.users[i].getGeoPosition()
          );
        })
      );
    }

    Promise.all(locations);
  }

  toggleMode(e) {
    this.toggle.online.classList.remove("active");
    this.toggle.local.classList.remove("active");
    e.target.classList.add("active");
    if (e.target.id === "online") {
      this.usingServer = true;
      this.pingInterval = setInterval(() => {
        console.log("pinging");
        //postLocation()
      }, this.pingRate);
    } else {
      this.usingServer = false;
      clearInterval(this.pingInterval);
      app.compass.point(bearingToMatch(user, match));
    }
  }

  _createEvents() {
    //Manage Location Toggle
    this.toggle.online.addEventListener("click", e => {
      this.toggleMode(e);
    });
    this.toggle.local.addEventListener("click", e => {
      this.toggleMode(e);
    });

    //Send position
    document.body.addEventListener("keyup", e => {
      if (e.key === "s") {
        this.sendCircles.forEach(val => {
          val.classList.add("ping");
        });
      }
    });

    //Cancel send amination
    this.sendCircles.forEach(val => {
      val.addEventListener("animationend", e => {
        e.target.classList.remove("ping");
      });
    });
    //create events for children
    this.board._createEvents();
    this.compass._createEvents();
  }
}

class Compass {
  constructor(el, label) {
    this.el = el;
    this.label = label;
  }

  point(degree) {
    this.el.style.transform = `rotate(${degree}deg)`;
    this.label.innerText = Math.round(degree) + "º";
  }

  _createEvents() {}
}

class Board {
  constructor() {
    this.seeker = null;
    this.match = null;
    //TODO: make some uids
    this.uids = ["Josh"];
    this.users = [];
    this.numOfUsers = 0;
    this.selectedUser = null;
    this.el = document.querySelector(".board");
    this.menu = {
      play: document.getElementById("playControl"),
      add: document.getElementById("addControl"),
      el: document.querySelector(".controls")
    };
    this.userOptions = {
      el: document.querySelector(".user-menu"),
      target: null,
      pin: document.querySelector("#pinButton"),
      delete: document.querySelector("#deleteButton"),
      seeker: document.querySelector("#seekerButton"),
      match: document.querySelector("#matchButton")
    };

    this.geo = {
      origin: { lat: 35.309301, lon: -120.670036 },
      extent: { lat: 35.297267, lon: -120.652539 }
    };
    this.backgrounds = [
      "rgb(157, 227, 255)",
      "url('./assets/Floorplan.jpg')",
      "url('./assets/shanghaicity.jpg')"
    ];
    this.backgroundIndex = 0;
    this.el.style.background = this.backgrounds[this.backgroundIndex];
  }

  addUser() {
    if (this.numOfUsers > 10) {
      alert("Max number of users reached");
      return;
    }
    const newUser = new Person("user-" + this.numOfUsers);
    console.log("users", this.users);
    this.users.push(newUser);
    this.numOfUsers++;
    this.el.appendChild(newUser.el);
    return newUser;
  }

  selectSeeker(id) {
    for (user of this.users) {
      if (user.id == id) {
      }
    }
    this.seeker.arrow.style.filter = "";
    this.selectedUser.arrow.style.filter = "invert(0.7)";
    this.seeker = selectedUser;
  }

  selectMatch() {
    this.match.arrow.style.filter = "";
    this.selectedUser.arrow.style.filter = "invert(0.3)";
    this.match = selectedUser;
  }

  _createEvents() {
    //Manage Animation Toggle
    this.menu.play.addEventListener("click", e => {
      if (e.target.src.includes("Pause")) {
        e.target.src = "./assets/Play.svg";
      } else {
        e.target.src = "./assets/Pause.svg";
      }
    });

    //Adding users
    this.menu.add.addEventListener("click", e => {
      console.log("add user");
      this.addUser();
    });
    //Background Toggling
    document.getElementById("changeBackground").addEventListener("click", e => {
      this.backgroundIndex++;
      if (this.backgroundIndex === this.backgrounds.length) {
        this.backgroundIndex = 0;
      }
      this.el.style.background = this.backgrounds[this.backgroundIndex];
    });
    //Move arrows on board
    this.el.ondragover = function(event) {
      event.preventDefault();
    };
    this.el.ondrop = e => {
      e.preventDefault();
      const identifier = e.dataTransfer.getData("identifier");
      for (let user of this.users) {
        if (user.id === identifier) {
          user.setPos({ x: e.x, y: e.y });
          user.el.style.top = user.y + "%";
          user.el.style.left = user.x + "%";
          if (user.selected) {
            user.displayMenu();
          }
        }
      }
      //Automatically update pointer if local UPDATE SEEKER
      if (!app.usingServer) {
        app.compass.point(bearingToMatch(this.seeker, this.match));
      }
    };

    //Deselect arrows
    this.el.addEventListener("click", e => {
      for (let user of this.users) {
        user.selected = false;
        user.el.classList.remove("selected");
      }
      this.userOptions.el.style.visibility = "hidden";
    });

    //Place Pins
    this.userOptions.pin.addEventListener("click", e => {
      console.log("Place Pins");
    });

    //Remove User
    this.userOptions.delete.addEventListener("click", e => {
      console.log("Remove User");
    });

    //Set user as Seeker
    this.userOptions.seeker.addEventListener("click", e => {
      console.log("Seeker");
    });

    //Set user as Match
    this.userOptions.match.addEventListener("click", e => {
      console.log("Match");
    });
  }
}

class Person {
  constructor(id) {
    this.id = id;
    this._createElements();
    this.selected = false;
    this.heading = 0;
    this.x = 0;
    this.y = 0;
    this.waypoints = [];
    this._createEvents();
  }

  _createElements() {
    this.el = document.createElement("div");
    this.arrow = document.createElement("img");
    this.el.className = "user";
    this.arrow.className = "arrow";
    this.arrow.id = this.id;
    this.el.style.top = ((30 + Math.random() * 40) >> 0) + "%";
    this.el.style.left = ((30 + Math.random() * 40) >> 0) + "%";
    this.arrow.src = "./assets/arrow.svg";
    this.arrow.alt = this.id;
    this.arrow.draggable = true;
    this.el.appendChild(this.arrow);
  }
  /**
    Calculates the geographic position based on the environments latitude and longitude variables
    @returns An object with latitude and longitude properties 
    */
  getGeoPosition() {
    const latRange = app.board.geo.extent.lat - app.board.geo.origin.lat;
    const lonRange = app.board.geo.extent.lon - app.board.geo.origin.lon;
    const lat = latRange * this.x + app.board.geo.origin.lat;
    const lon = lonRange * this.y + app.board.geo.origin.lon;
    return { lat, lon };
  }

  /**
    Updates the object with the new UI location of the Person. Updates table to display change. Converts location to percent-based value.
    @param {Number} pxPoint the absolute position of the new location in pixels
    @returns An object with latitude and longitude properties 
    */
  setPos(pxPoint) {
    const offset = app.board.el.getClientRects()[0];
    const elementPosition = this.el.getClientRects()[0];
    this.x =
      (100 * (pxPoint.x - offset.left - elementPosition.width / 2)) /
      (offset.right - offset.left);
    this.y =
      (100 * (pxPoint.y - offset.top - elementPosition.height / 2)) /
      (offset.bottom - offset.top);
  }
  /**
    Creates and executes a walking animation to set waypoints on the board
     * @param {Number} duration how long the animation should last in miliseconds
     */
  walk(duration) {
    let totalDistance = 0;
    let speed = 0;
    let steps = [];
    let prevPoint = this.waypoints[0];
    let keyframes = [{ duration: 0, destination: { x: 0, y: 0 } }];
    //Find total distance to calculate individual animaiton duration
    for (let i = 1; i < this.waypoints.length; i++) {
      const waypointDist = pointDistance(this.waypoints[i], prevPoint);
      prevPoint = this.waypoints[i];
      totalDistance += waypointDist;
    }
    speed = totalDistance / (duration * 1000);
    prevPoint = this.waypoints[0];
    //generate keyframe information CHANGE TO PERCENT
    for (let i = 1; i < this.waypoints.length; i++) {
      //TODO returning NaN
      console.log("obj", {
        duration: pointDistance(this.waypoints[i], prevPoint) / speed,
        destination: this.waypoints[i]
      });
      keyframes.push({
        duration: pointDistance(this.waypoints[i], prevPoint) / speed,
        destination: this.waypoints[i]
      });
    }

    //Create animation stages
    for (let i = 1; i < keyframes.length; i++) {
      const waypoint = new Promise(res => {
        this.el.style.transition = `top ${keyframes[i].duration}s , left ${
          keyframes[i].duration
        }s`;
        this.el.style.left = keyframes[i].destination.x + "%";
        this.el.style.top = keyframes[i].destination.y + "%";
        setTimeout(() => {
          res();
        }, keyframes[i].duration);
      });

      steps.push(waypoint);
    }
    //update position
    const positionTracker = setInterval(() => {
      this.setPos(this.el.getClientRects()[0]);
    }, 10);

    setTimeout(() => {
      clearInterval(positionTracker);
    }, duration);

    //Start animation
    this._animateWalk(steps);
  }
  async _animateWalk(path) {
    for (const point of path) {
      await point;
    }
    console.log("Done with walk");
  }
  /**
Provides the location for the user menu
@param el the element which will host the menu
@returns {x: Number, y: Number} and x and y percentage value.
*/
  displayMenu() {
    const { userOptions } = app.board;
    userOptions.el.style.visibility = "visible";
    userOptions.el.style.left = this.x - this.el.style.width + "%";
    userOptions.el.style.top = this.y - 7 + "%";
  }

  _createEvents() {
    this.arrow.addEventListener("dragstart", e => {
      e.dataTransfer.setData("identifier", this.id);
      console.log("identifier:", this.id);
    });
    //Rotation logic
    this.el.addEventListener("click", e => {
      if (!this.selected) {
        return;
      }
      const pos = this.el.getClientRects()[0];
      const center = {
        x: pos.left + pos.width / 2,
        y: pos.top + pos.height / 2
      };
      const top = { x: pos.left + pos.width / 2, y: pos.top };
      const s1 = Math.sqrt((e.x - center.x) ** 2 + (e.y - center.y) ** 2);
      const s2 = center.y - top.y;
      const opSide = Math.sqrt((e.x - top.x) ** 2 + (e.y - top.y) ** 2);
      const angle =
        e.x < center.x
          ? 180 - findInnerAngle(s1, s2, opSide) + 180
          : findInnerAngle(s1, s2, opSide);
      //Set new user heading
      this.el.style.transform = `rotate(${angle}deg)`;
      this.heading = angle;
    });
    //Select
    this.el.addEventListener("click", e => {
      for (let user of app.board.users) {
        user.selected = false;
        user.el.classList.remove("selected");
      }
      this.selected = true;
      this.el.classList.add("selected");
      this.displayMenu();
      e.stopImmediatePropagation();
    });
  }
}

//MATH HELPER FUNCTIONS
//-------------------------------------------------------------------
function pointDistance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function findInnerAngle(s1, s2, opSide) {
  return (
    (Math.acos((s1 ** 2 + s2 ** 2 - opSide ** 2) / (2 * s1 * s2)) * 180) /
    Math.PI
  );
}

function bearingToMatch(user, match) {
  const angleFromOrigin =
    (Math.atan((user.x - match.x) / (user.y - match.y)) * 180) / Math.PI +
    (user.y < match.y ? 180 : 0);
  return -(angleFromOrigin + user.heading);
}

//TOP LEVEL OBJECTS
//--------------------------------------------------------------

//TODO: switch client bounding boxes to computed styles
const compass = new Compass(
  document.querySelector(".center-circle"),
  document.querySelector(".degree-label")
);
const board = new Board();
const app = new Applet(compass, board);

//INITIAL SETUP
//-------------------------------------------------------------------------------------
window.addEventListener("load", e => {
  const seeker = app.board.addUser();
  const match = app.board.addUser();
  app.board.match = match;
  app.board.seeker = seeker;
  for (let user of app.board.users) {
    const userPos = user.el.getClientRects()[0];
    user.setPos(userPos);
  }
  app.compass.point(bearingToMatch(app.board.seeker, app.board.match));
});
