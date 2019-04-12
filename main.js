//CLASSES
//--------------------------------------------------------------
class Applet {
  constructor() {
    this.dataDisplay = new DataDisplay();
    this.board = new Board();
    this.settingsPopup = new SettingsPopup();
    this.toggle = {
      online: document.querySelector("#online"),
      local: document.querySelector("#local")
    };
    this.settingsButton = document.getElementById("settings-button");
    this.usingServer = false;
    this.pingInterval = null;
    this.pingRate = 500;
    this.sendCircles = document.querySelectorAll(".send-circle");
    this._createEvents();
  }
  /**
   * Sends positions of users to the server. Each post is sent with lat, lon and heading of the user
   *
   */
  postLocations() {
    return; //remove this
    let seekerPos = this.board.seeker.getGeoPosition();
    let matchPos = this.board.match.getGeoPosition();
    axios.post("serverURL", seekerPos);
    axios.post("serverURL", matchPos);
  }

  getLocations() {
    return; //remove this
    const seekerPromise = new Promise((resolve, reject) => {
      axios.get("serverURL").then(res => resolve(res));
    });
    const matchPromise = new Promise((resolve, reject) => {
      axios.get("serverURL").then(res => resolve(res));
    });

    Promise.all([seekerPromise, matchPromise]).then(values =>
      app.updateLocation(values[0], values[1])
    );
  }
  /**
   * Updates the UI with the inputted position.
   * @param {lat (y), lon(x)} seekerPos position of seeker
   * @param {lat(y), lon(x)} matchPos position of match
   * @return void
   */
  //TODO: isolate this to server and local cases
  updateLocation(seekerPos, matchPos, directionToMatch, distanceToMatch) {
    if (this.usingServer && !seekerPos) {
      return;
    }
    seekerPos = seekerPos || this.board.seeker.getGeoPosition();
    matchPos = matchPos || this.board.match.getGeoPosition();
    directionToMatch =
      directionToMatch || bearingToMatch(app.board.seeker, app.board.match);
    distanceToMatch =
      distanceToMatch || Math.round(geoDistance(seekerPos, matchPos));
    this.dataDisplay.compass.point(directionToMatch);
    this.dataDisplay.updateTable(seekerPos, matchPos, distanceToMatch);
  }

  toggleMode(e) {
    this.toggle.online.classList.remove("active");
    this.toggle.local.classList.remove("active");
    e.target.classList.add("active");
    if (e.target.id === "online") {
      this.usingServer = true;
      this.pingInterval = setInterval(() => {
        console.log("pinging");
        this.postLocations();
        this.getLocations();
      }, this.pingRate);
    } else {
      this.usingServer = false;
      clearInterval(this.pingInterval);
      this.updateLocation();
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

    //Open Settings Popup
    this.settingsButton.addEventListener("click", e => {
      this.settingsPopup.backdrop.style.visibility = "visible";
      this.settingsPopup.setPlaceholders();
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
    this.settingsPopup._createEvents();
  }
}

class SettingsPopup {
  constructor() {
    this.animationDuration = document.getElementById("animation-duration");
    this.pingRate = document.getElementById("ping-rate");
    this.geo = {
      left: document.getElementById("l-lon"),
      right: document.getElementById("r-lon"),
      top: document.getElementById("t-lat"),
      bottom: document.getElementById("b-lat")
    };
    this.submitButton = document.querySelector(".set-options");
    this.backdrop = document.querySelector(".backdrop");
  }
  //TODO: get settings to apply individually
  applySettings() {
    console.log("submitted");
    let values = [this.animationDuration.value];
    for (let key in this.geo) {
      values.push(this.geo[key].value);
    }
    //update settings
    app.board.animDuration = Number(this.animationDuration.value) * 1000;
    const { origin, extent } = app.board.geo;
    origin.lat = Number(this.geo.top.value);
    origin.lon = Number(this.geo.left.value);
    extent.lat = Number(this.geo.bottom.value);
    extent.lon = Number(this.geo.right.value);
    console.log(app.board.geo);
    this.animationDuration.value = "";
    this.geo.top.value = "";
    this.geo.left.value = "";
    this.geo.bottom.value = "";
    this.geo.right.value = "";
    this.close();
  }

  setPlaceholders() {
    const { extent, origin } = app.board.geo;
    this.animationDuration.placeholder = app.board.animDuration / 1000 + " sec";
    this.pingRate.placeholder = app.pingRate + " ms";
    this.geo.left.placeholder = origin.lon;
    this.geo.right.placeholder = extent.lon;
    this.geo.top.placeholder = origin.lat;
    this.geo.bottom.placeholder = extent.lat;
  }

  close() {
    this.backdrop.style.visibility = "hidden";
  }

  _createEvents() {
    this.submitButton.addEventListener("click", e => this.applySettings());
    this.backdrop.addEventListener("click", e => this.close());
    document
      .querySelector(".popup")
      .addEventListener("click", e => e.stopImmediatePropagation());
  }
}

class DataDisplay {
  constructor() {
    this.compass = new Compass(
      document.querySelector(".center-circle"),
      document.querySelector(".degree-label")
    );
    this.seekerPos = {
      lat: document.getElementById("seeker-lat"),
      lon: document.getElementById("seeker-lon")
    };
    this.matchPos = {
      lat: document.getElementById("match-lat"),
      lon: document.getElementById("match-lon")
    };
    this.distance = document.getElementById("distance");
  }
  updateTable(seekerPoint, matchPoint, distanceToMatch) {
    const sigFig = 100000;
    this.seekerPos.lat.innerText =
      Math.round(sigFig * seekerPoint.lat) / sigFig;
    this.seekerPos.lon.innerText =
      Math.round(sigFig * seekerPoint.lon) / sigFig;
    this.matchPos.lat.innerText = Math.round(sigFig * matchPoint.lat) / sigFig;
    this.matchPos.lon.innerText = Math.round(sigFig * matchPoint.lon) / sigFig;
    this.distance.innerText = distanceToMatch + " ft";
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
}

class Board {
  constructor() {
    this.seeker = null;
    this.match = null;
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
      origin: { lat: 1.0, lon: 1.0 },
      extent: { lat: 1.0001, lon: 1.0001 }
    };
    this.backgrounds = [
      "rgb(157, 227, 255)",
      "url('./assets/Floorplan.jpg')",
      "url('./assets/shanghaicity.jpg')"
    ];
    this.backgroundIndex = 0;
    this.el.style.background = this.backgrounds[this.backgroundIndex];
    this.animDuration = 5000;
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
    app.updateLocation();
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
          this.users[i].simpleWalk(5000);
          if (!app.usingServer) {
            const bearingCheck = setInterval(() => {
              app.updateLocation();
            }, 10);
            setTimeout(() => {
              clearInterval(bearingCheck);
            }, 5010);
          }
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
        app.updateLocation();
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
      app.updateLocation();
    });

    //Set user as Match
    this.userOptions.match.addEventListener("click", e => {
      this.selectMatch();
      app.updateLocation();
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
    return { lat, lon, heading: this.heading };
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

  hideWaypoints() {}

  removeWaypoints() {
    for (let i = 0; i < this.waypoints.length; i++) {
      const removedWaypoint = this.waypoints.pop();
      app.board.el.removeChild(removedWaypoint.el);
    }
  }

  simpleWalk(duration) {
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
      this.removeWaypoints();
      app.board.menu.play.src = "./assets/Play.svg";
    }, duration + 10);
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
      if (!app.usingServer) {
        app.dataDisplay.compass.point(
          bearingToMatch(app.board.seeker, app.board.match)
        );
      }
    });
    //Select
    this.el.addEventListener("click", e => {
      app.board.selectedUser.waypoints.forEach(waypoint => {
        waypoint.el.style.visibility = "hidden";
      });
      app.board.selectedUser.el.classList.remove("selected");
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
function geoDistance(p1, p2) {
  const ftConversionFactor = (3280.4 * 10000) / 90;
  const ftX = (p1.lon - p2.lon) * ftConversionFactor;
  const ftY = (p1.lat - p2.lat) * ftConversionFactor;
  return Math.sqrt(ftX ** 2 + ftY ** 2);
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

const app = new Applet();

//INITIAL SETUP
//-------------------------------------------------------------------------------------
window.addEventListener("load", e => {
  app.board.initState();
});
