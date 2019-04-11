//CLASSES
//--------------------------------------------------------------
class Applet {
  constructor(compass, board, locationTable) {
    this.compass = compass;
    this.board = board;
    this.locationTable = locationTable;
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
  /**
   * Sends positions of users to the server.
   */
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
  /**
   * Updates the UI with the inputted position.
   * @param {lat (y), lon(x)} seekerPos position of seeker
   * @param {lat(y), lon(x)} matchPos position of match
   * @return void
   */
  updateLocation(seekerPos, matchPos) {
    if (seekerPos.hasOwnProperty("lat")) {
      seekerPos.y = seekerPos.lat;
      seekerPos.x = seekerPos.lon;
      matchPos.y = matchPos.lat;
      matchPos.x = matchPos.lon;
    }
    this.compass.point(bearingToMatch(app.board.seeker, app.board.match));
    this.board.seeker.setGeoPos(seekerPos);
    this.board.match.setGeoPos(matchPos);
  }

  toggleMode(e) {
    this.toggle.online.classList.remove("active");
    this.toggle.local.classList.remove("active");
    e.target.classList.add("active");
    if (e.target.id === "online") {
      this.usingServer = true;
      this.pingInterval = setInterval(() => {
        console.log("pinging");
        postLocation();
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
  }
}
//TODO: build out gauges class
class Gauges {
  constructor() {
    this.compass = new Compass(
      document.querySelector(".center-circle"),
      document.querySelector(".degree-label")
    );
    this.table = new LocationTable();
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
}

class LocationTable {
  costructor() {
    this.seekerLocation = {
      lat: document.getElementById("seeker-lat"),
      lon: document.getElementById("seeker-lon")
    };

    this.matchLocation = {
      lat: document.getElementById("match-lat"),
      lon: document.getElementById("match-lon")
    };
  }

  update(seekerPos, matchPos) {
    this.seekerLocation.lat.innerText = seekerPos.lat;
    this.seekerLocation.lon.innerText = seekerPos.lon;
    this.matchLocation.lat.innerText = matchPos.lat;
    this.matchLocation.lon.innerText = matchPos.lon;
  }
}

class Board {
  constructor() {
    this.seeker = null;
    this.match = null;
    //TODO: make some uids
    this.uids = [
      "Josh",
      "Courtney",
      "Fred",
      "Amanda",
      "Brittany",
      "Rodger",
      "John",
      "Jess",
      "Kath",
      "Doug"
    ];
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
      username: document.querySelector(".username"),
      pin: document.querySelector("#pinButton"),
      delete: document.querySelector("#deleteButton"),
      seeker: document.querySelector("#seekerButton"),
      match: document.querySelector("#matchButton")
    };
    this.placingPins = false;

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

  initState() {
    const seeker = this.addUser();
    const match = this.addUser();
    this.selectedUser = seeker;
    this.selectSeeker();
    this.selectedUser = match;
    this.selectMatch();
    for (let user of this.users) {
      const userPos = user.el.getClientRects()[0];
      user.setPos(userPos);
    }
  }

  addUser() {
    if (this.numOfUsers > 10) {
      alert("Max number of users reached");
      return;
    }
    const newUser = new Person(this.uids.pop());
    this.users.push(newUser);
    this.numOfUsers++;
    this.el.appendChild(newUser.el);
    const pos = newUser.el.getClientRects()[0];
    newUser.setPos(pos);
    return newUser;
  }

  removeUser() {
    if (this.users.length < 3) {
      alert("You must have two users present.");
      return;
    }
    let removalIndex;
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].id == this.selectedUser.id) {
        removalIndex = i;
        break;
      }
    }
    const userToRemove = this.selectedUser;
    if (userToRemove == this.seeker) {
      if (removalIndex > 0) {
        this.selectedUser = this.users[0];
      } else {
        this.selectedUser = this.users[1];
      }
      this.selectSeeker();
    } else if (userToRemove == this.match) {
      if (removalIndex > 0) {
        this.selectedUser = this.users[0];
      } else {
        this.selectedUser = this.users[1];
      }
      this.selectMatch();
    }

    this.users.splice(removalIndex, 1);
    this.el.removeChild(userToRemove.el);
    this.uids.push(userToRemove.id);
    this.selectedUser = null;
  }

  swapSeekerAndMatch() {
    this.match.arrow.classList.remove("match");
    this.match.arrow.classList.add("seeker");
    this.seeker.arrow.classList.remove("seeker");
    this.seeker.arrow.classList.add("match");
    const temp = this.match;
    this.match = this.seeker;
    this.seeker = temp;
  }

  selectSeeker() {
    if (this.match == this.selectedUser) {
      this.swapSeekerAndMatch();
      return;
    }
    if (this.seeker) {
      this.seeker.arrow.classList.remove("seeker");
    }
    this.seeker = this.selectedUser;
    this.seeker.arrow.classList.add("seeker");
  }

  selectMatch() {
    if (this.seeker == this.selectedUser) {
      this.swapSeekerAndMatch();
      return;
    }
    if (this.match) {
      this.match.arrow.classList.remove("match");
    }

    this.match = this.selectedUser;
    this.match.arrow.classList.add("match");
  }

  _createEvents() {
    //Manage Animation Toggle
    this.menu.play.addEventListener("click", e => {
      if (e.target.src.includes("Pause")) {
        e.target.src = "./assets/Play.svg";
        for (let i = 0; i < this.users.length; i++) {
          this.users[i].isAnimating = false;
        }
      } else {
        for (let user of this.users) {
          user.selected = false;
          user.el.classList.remove("selected");
        }
        this.userOptions.el.style.visibility = "hidden";
        this.selectedUser.waypoints.forEach(waypoint => {
          waypoint.el.style.visibility = "hidden";
        });
        e.target.src = "./assets/Pause.svg";
        for (let i = 0; i < this.users.length; i++) {
          this.users[i].simpleWalk();
        }
      }
    });

    //Adding users
    this.menu.add.addEventListener("click", e => {
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
        app.locationTable.update(
          this.seeker.getGeoPosition(),
          this.match.getGeoPosition()
        );
      }
    };

    //Add Pins and Deselect arrows
    this.el.addEventListener("click", e => {
      if (this.placingPins) {
        this.selectedUser.addWaypoint({ x: e.x, y: e.y });
        this.placingPins = false;
      } else {
        for (let user of this.users) {
          user.selected = false;
          user.el.classList.remove("selected");
        }
        this.userOptions.el.style.visibility = "hidden";
        this.selectedUser.waypoints.forEach(waypoint => {
          waypoint.el.style.visibility = "hidden";
        });
      }
    });

    //Place Pins
    this.userOptions.pin.addEventListener("click", e => {
      this.placingPins = true;
      e.stopImmediatePropagation();
    });

    //Remove User
    this.userOptions.delete.addEventListener("click", e => {
      this.removeUser();
    });

    //Set user as Seeker
    this.userOptions.seeker.addEventListener("click", e => {
      this.selectSeeker();
      app.compass.point(bearingToMatch(app.board.seeker, app.board.match));
      app.locationTable.update(
        this.seeker.getGeoPosition(),
        this.match.getGeoPosition()
      );
    });

    //Set user as Match
    this.userOptions.match.addEventListener("click", e => {
      this.selectMatch();
      app.compass.point(bearingToMatch(app.board.seeker, app.board.match));
      app.locationTable.update(
        this.seeker.getGeoPosition(),
        this.match.getGeoPosition()
      );
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
    this.isAnimating = false;
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
    //converts point to percentage and assigns to Person
    const offset = app.board.el.getClientRects()[0];
    const elementPosition = this.el.getClientRects()[0];
    this.x =
      (100 * (pxPoint.x - offset.left - elementPosition.width / 2)) /
      (offset.right - offset.left);
    this.y =
      (100 * (pxPoint.y - offset.top - elementPosition.height / 2)) /
      (offset.bottom - offset.top);
  }

  setGeoPos(userPos) {
    //convert to percentage
    const { origin, extent } = app.board.geo;
    const x = (userPos.lon - origin.lon) / (extent.lon - origin.lon);
    const y = (userPos.lat - origin.lat) / (extent.lat - origin.lat);
    //set the position
    this.el.style.top = y + "%";
    this.el.style.left = x + "%";
  }

  //Will be adapted to handle multiple waypoints in the future (in order to make walk work)
  addWaypoint(point) {
    //convert to percentage
    const offset = app.board.el.getClientRects()[0];
    const x = (100 * (point.x - offset.left)) / (offset.right - offset.left);
    const y = (100 * (point.y - offset.top)) / (offset.bottom - offset.top);

    let el;
    if (this.waypoints.length > 0) {
      el = this.waypoints[0].el;
      this.waypoints[0].x = x;
      this.waypoints[0].y = y;
      el.style.visibility = "visible";
    } else {
      el = document.createElement("img");
      el.className = "waypoint";
      el.src = "./assets/Pin.svg";
      app.board.el.appendChild(el);
      this.waypoints.push({ el, x, y });
    }

    el.style.top = y - 3 + "%";
    el.style.left = x - 1.5 + "%";
  }

  simpleWalk() {
    if (this.waypoints.length == 0) {
      return;
    }
    this.isAnimating = true;
    const waypointDirection = bearingToPoint(this, this.waypoints[0]);
    this.el.classList.add("walk");
    this.el.style.transform = `rotate(${waypointDirection}deg)`;
    const elOffset = 7.5;
    const updateLocation = setInterval(() => {
      const { x, y } = this.el.getClientRects()[0];
      this.setPos({ x, y });
      if (!this.isAnimating) {
        this.el.style.top = this.y + elOffset + "%";
        this.el.style.left = this.x + elOffset + "%";
        this.el.classList.remove("walk");
        clearTimeout(cleanup);
        clearInterval(updateLocation);
      }
    }, 100);
    const cleanup = setTimeout(() => {
      this.el.classList.remove("walk");
      clearInterval(updateLocation);
      this.isAnimating = false;
      app.board.menu.play.src = "./assets/Play.svg";
      console.log("cleaned up");
    }, 5100);
    this.el.style.top = this.waypoints[0].y - elOffset + "%";
    this.el.style.left = this.waypoints[0].x - elOffset + "%";
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
    userOptions.el.style.top = this.y - 11 + "%";
    userOptions.username.innerText = this.id;
    app.board.selectedUser = this;
  }

  _createEvents() {
    this.arrow.addEventListener("dragstart", e => {
      e.dataTransfer.setData("identifier", this.id);
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
      this.waypoints.forEach(waypoint => {
        waypoint.el.style.visibility = "visible";
      });
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

function bearingToPoint(currentPos, dest) {
  return -(
    (Math.atan((currentPos.x - dest.x) / (currentPos.y - dest.y)) * 180) /
      Math.PI +
    (currentPos.y < dest.y ? 180 : 0)
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
const locationTable = new LocationTable();
const app = new Applet(compass, board, locationTable);

//INITIAL SETUP
//-------------------------------------------------------------------------------------
window.addEventListener("load", e => {
  app.board.initState();
  app.compass.point(bearingToMatch(app.board.seeker, app.board.match));
});
