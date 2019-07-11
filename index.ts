// todo:
// delete event
// edit event

const url: string = "http://localhost:8000";

class ScheduledEvent {
  id: number;
  userId: number;
  name: string;
  description: string;
  scheduled: string;
  created: string;
  updated: string;
  deleted: string;

  constructor(a: any) {
    this.id = a.ID;
    this.userId = a.user_id;
    this.name = a.name;
    this.description = a.description;
    this.scheduled = a.scheduled;
    this.created = a.CreatedAt; // include this?
    this.updated = a.UpdatedAt; // include this?
    this.deleted = a.DeletedAt; // create some kind of trash?
  }
}

class User {
  id: number;
  username: string;
  email: string;
  created: string;
  updated: string;
  deleted: string;

  constructor(a: any) {
    this.id = a.ID;
    this.username = a.username;
    this.email = a.email;
    this.created = a.CreatedAt; // include this?
    this.updated = a.UpdatedAt; // this?
    this.deleted = a.DeletedAt; // this?
  }
}

class RawToken {
  token: string;

  constructor(a: any) {
    this.token = a.Token;
  }
}

class ParsedToken {
  userId: number;
  exp: number;

  constructor(a: any) {
    this.userId = a.UserID;
    this.exp = a.exp;
  }
}

// jwt
let rawToken = <RawToken>{token: ""};
let parsedToken: ParsedToken;
let userId = 0;

// events array
let events: ScheduledEvent[] = [];

// signup form values
let signupUsername: string;
let signupEmail: string;
let signupPassword: string;
let signupPasswordConf: string;

// login form values
let loginUsername: string;
let loginPassword: string;

// event form values
let eventName: string;
let eventDescription: string;
let eventDate: string;
let eventTime: string;

let currentTimeframe: string;

// generic error message
const sorry = "Sorry, something went wrong!";

// https://flatuicolors.com/palette/nl
const colors = [
  "#FFC312",/*sunflower*/
  "#12CBC4",/*blue martina*/
  "#A3CB38",/*android green*/
  "#ED4C67",/*bara red*/
  "#9980FA",/*forgotten purple*/
];

const months = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec"
};

document.addEventListener("DOMContentLoaded", (event) => {
  const signupDiv = <HTMLDivElement>document.querySelector("#signup-div");
  const loginDiv = <HTMLDivElement>document.querySelector("#login-div");
  const eventDiv = <HTMLDivElement>document.querySelector("#event-div");
  const logoutButton = <HTMLButtonElement>document.querySelector("#logout-button");
  const createEventButton = <HTMLButtonElement>document.querySelector("#create-event-button");
  const hideEventButton = <HTMLButtonElement>document.querySelector("#hide-event-button");
  const loginForm = <HTMLFormElement>document.querySelector("#login-form");
  const eventForm = <HTMLFormElement>document.querySelector("#event-form");
  const eventDateInput = <HTMLInputElement>document.querySelector("#event-date");
  const signupForm = <HTMLFormElement>document.querySelector("#signup-form");
  const loggedInDiv = <HTMLDivElement>document.querySelector("#logged-in");
  const feedbackDiv = <HTMLDivElement>document.querySelector("#feedback");
  const eventsContainer = <HTMLDivElement>document.querySelector("#events-container");
  const eventsHeader = <HTMLDivElement>document.querySelector("#events-header");

  // map /events routes to headers
  const timeframeVals = {
    "/today": {
      "header": "Events today",
      "button": (() => document.querySelector("#today"))()
    },
    "/tomorrow": {
      "header": "Events tomorrow",
      "button": (() => document.querySelector("#tomorrow"))()
    },
    "/week": {
      "header": "Events this week",
      "button": (() => document.querySelector("#week"))()
    },
    "": {
      "header": "All events",
      "button": (() => document.querySelector("#all"))()
    },
  };

  // prevents user from picking a date in the past
  const today = new Date();
  let month = String(today.getMonth() + 1);
  if (month.length === 1) {
    month = "0" + month;
  };
  let date = String(today.getDate());
  if (date.length === 1) {
    date = "0" + date;
  };
  const minDate = today.getFullYear() + "-" + month + "-" + date;
  eventDateInput.min = minDate

  // get token from local storage
  chrome.storage.local.get(["token"], (res) => {
    // if user is logged in
    if (res["token"]) {
      // hide signup and login forms
      signupDiv.style.display = "none";
      loginDiv.style.display = "none";

      handleToken(res["token"], true); // local is true
    };
  });

  document.addEventListener("click", (e) => {
    const target = <HTMLButtonElement>e.target;

    if (target.id === "logout-button") {
      logout();
    };

    if (target.id === "signup-button") {
      signupDiv.style.display = "block";
      loginDiv.style.display = "none";
      feedbackDiv.innerHTML = "";
    };

    if (target.id === "login-button") {
      signupDiv.style.display = "none";
      loginDiv.style.display = "block";
      feedbackDiv.innerHTML = "";
    };

    if (target.id === "create-event-button") {
      eventDiv.style.display = "block";
      createEventButton.style.display = "none";
      hideEventButton.style.display = "block";
    };

    if (target.id === "hide-event-button") {
      eventDiv.style.display = "none";
      createEventButton.style.display = "block";
      hideEventButton.style.display = "none";
    };

    if (target.id.split(":")[0] === "delete") {
      deleteEvent(target.id.split(":")[1]);
    };

    if (target.id === "today") {
      getEvents("/today");
    };

    if (target.id === "tomorrow") {
      getEvents("/tomorrow");
    };

    if (target.id === "week") {
      getEvents("/week");
    };

    if (target.id === "all") {
      getEvents("");
    };
  });

  document.addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;

    // signup fields
    if (target.id === "signup-username") {
      signupUsername = target.value;
    };

    if (target.id === "signup-email") {
      signupEmail = target.value;
    };

    if (target.id === "signup-password") {
      signupPassword = target.value;
    };

    if (target.id === "signup-password-conf") {
      signupPasswordConf = target.value;
    };

    // login fields
    if (target.id === "login-username") {
      loginUsername = target.value;
    };

    if (target.id === "login-password") {
      loginPassword = target.value;
    };

    // event fields
    if (target.id === "event-name") {
      eventName = target.value;
    };

    if (target.id === "event-description") {
      eventDescription = target.value;
    };

    if (target.id === "event-date") {
      eventDate = target.value;
    };

    if (target.id === "event-time") {
      eventTime = target.value;
    };
  });

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const target = <Element>e.target;

    if (target.id === "signup-form") {
      signup();
    };

    if (target.id === "login-form") {
      login();
    };

    if (target.id === "event-form") {
      createEvent();
    };
  });

  const parseDateTime = (dateTime: string): string => {
    const dateTimeArr = dateTime.split("-").slice(0, 3);
    const year = dateTimeArr[0];
    const month = months[dateTimeArr[1]];
    const tSplit = dateTimeArr[2].split("T");
    const date = tSplit[0];
    const timeArr = tSplit[1].split(":");
    const hour = parseInt(timeArr[0]) % 12 === 0 ? "12" : `${parseInt(timeArr[0]) % 12}`;
    const minute = timeArr[1];
    const amPm = parseInt(timeArr[0]) >= 12 ? "pm" : "am";

    return month + " " + date + ", " + year + " at " + hour + ":" + minute + amPm;
  };

  const appendEvents = (events: ScheduledEvent[], timeframe: string) => {
    currentTimeframe = timeframe;

    eventsHeader.innerHTML = `<h3>${timeframeVals[timeframe]["header"]}</h3>`;

    eventsContainer.innerHTML = "";

    if (events.length === 0) {
      eventsContainer.innerHTML += `
      <div class="event-container" style="color:#12CBC4;">
        <div>
          Nothing here!
        </div>
      </div>
      `;
    };

    events.sort((a, b) => {
      const eventA = a.scheduled;
      var eventB = b.scheduled;

      if (eventA < eventB) {
        return -1;
      };

      if (eventA > eventB) {
        return 1;
      };

      return 0;
    });

    events.forEach((evt, index) => {
      let color = colors[index % colors.length];

      eventsContainer.innerHTML += `
        <div class="event-container">
          <div class="event-name" style="color:${color};">${evt.name}</div>
          <div class="event-description">${evt.description}</div>
          <div class="event-scheduled">${parseDateTime(evt.scheduled)}</div>
          <button id="delete:${evt.id}">Delete</button>
        </div>
      `;
    });

    const timeframeValsKeys = Object.keys(timeframeVals);
    const timeframeButtons = timeframeValsKeys.map((a) => {
      timeframeVals[a]["button"]
    });

    timeframeValsKeys.forEach((key) => {
      if (timeframeVals[key]["button"] === timeframeVals[timeframe]["button"]) {
        timeframeVals[key]["button"].disabled = true;
        timeframeVals[key]["button"].classList.add("unclickable");
      } else {
        timeframeVals[key]["button"].disabled = false;
        timeframeVals[key]["button"].classList.remove("unclickable");
      };
    });
  };

  // local is false by default -- true only if token is fetched from
  // Chrome local storage (meaning it's just a popup refresh)
  const handleToken = (jwt: object, local=false) => {
    // token was sent from backend
    if (!local) {
      // set to local storage before initializing as RawToken so format
      // matches fetch response
      chrome.storage.local.remove(["token"], () => {
        chrome.storage.local.set({ token: jwt });
      });
    // token was fetched locally
    } else {
      createEventButton.style.display = "block";
    };

    // user is logged in -- change display
    loggedInDiv.style.display = "block";
    logoutButton.style.display = "block";
    loginDiv.style.display = "none";
    signupDiv.style.display = "none";

    signupForm.reset();
    loginForm.reset();

    rawToken = new RawToken(jwt);

    const base64Url: string = rawToken.token.split(".")[1];
    const base64: string = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload: string = decodeURIComponent(atob(base64).split("").map((c) => {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));

    parsedToken = new ParsedToken(JSON.parse(jsonPayload));
    userId = parsedToken.userId;

    // grab the events today if the token was fetched locally
    if (local) {
      getEvents("/today");
    };
  };

  const signup = () => {
    try {
      if (signupPassword !== signupPasswordConf) {
        throw new Error("Sorry, passwords don't match!");
      };
    }
    catch(err) {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
      return
    };

    fetch(url + "/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword
      })
    })
    .then((res) => {
      if (res.ok) {
        feedbackDiv.innerHTML = "";
        return res.json();
      } else {
        if (res.status === 409) {
          throw new Error("Sorry, that username is taken!");
        } else {
          throw new Error(sorry);
        };
      };
    })
    .then(jwt => {
      hideEventButton.style.display = "block";
      eventDiv.style.display = "block";
      handleToken(jwt, false);
    })
    .then(() => {
      appendEvents([], "/today");
    })
    .catch((err) => {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
    });
  };

  const login = () => {
    fetch(url + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword
      })
    })
    .then((res) => {
      if (res.ok) {
        feedbackDiv.innerHTML = "";
        return res.json();
      } else {
        if (res.status === 401) {
          throw new Error("Sorry, that doesn't look right!");
        } else {
          throw new Error(sorry);
        };
      };
    })
    .then((jwt) => {
      createEventButton.style.display = "block";
      handleToken(jwt, false);
    })
    .then(() => {
      getEvents("/today");
    })
    .catch((err) => {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
    });
  };

  const logout = () => {
    userId = 0;
    rawToken.token = "";

    chrome.storage.local.remove(["token"]);

    events = [];

    feedbackDiv.innerHTML = "";

    // user is logged out -- change display
    eventsContainer.innerHTML = "";
    loginDiv.style.display = "block";
    logoutButton.style.display = "none";
    loggedInDiv.style.display = "none";
    signupDiv.style.display = "none";
    eventDiv.style.display = "none";
    createEventButton.style.display = "none";
  };

  const convertPqTimeToJs = (pq: string) => {
    // 2019-07-11T13:45:00-4:00
    // Wed Jul 10 2019 19:23:35 GMT-0400 (Eastern Daylight Time)

    const split = pq.split("-");
    const month = months[split[1]];
    const year = split[0];
    const tSplit = split[2].split("T");
    const date = tSplit[0];
    const time = tSplit[1];

    return month + " " + date + " " + year + " " + time +  " GMT-0400";
  };

  const createAlarm = (alarmName: string, description: string, scheduled: string) => {
    const time = scheduled.slice(11, 16);
    const timeArr = time.split(":");
    let alarmMinute: string;
    let alarmHour: string;
    let alarmDate = scheduled.slice(8, 10);

    if (parseInt(timeArr[1]) < 15) {
      alarmHour = String(parseInt(timeArr[0]) - 1);
      alarmMinute = String(parseInt(timeArr[1]) + 45);
    } else {
      alarmHour = timeArr[0];
      alarmMinute = String(parseInt(timeArr[1]) - 15);
    };

    if (alarmHour === "-1") {
      alarmHour = "23";
      alarmDate = String(parseInt(scheduled.slice(8, 10)) - 1);
    };

    const alarmTime = convertPqTimeToJs(scheduled.slice(0, 8) + alarmDate + "T" + alarmHour + ":" + alarmMinute + ":00-4:00");
    const unixDate = Math.round((new Date(alarmTime)).getTime());

    const when = parseDateTime(scheduled);

    chrome.alarms.create(alarmName, {when: unixDate});
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === alarmName) {
        alert(String(alarmName.split("%%%")[1]) + "\n\n" + description + "\n\n" + when);
        // don't believe this is working
        chrome.alarms.clear(alarmName);
      };
    });
  };

  const createEvent = () => {
    checkForUserIdAndRawToken();

    // timezone is hardcoded don't keep it that way
    const eventDateTime = eventDate + "T" + eventTime + ":00-04:00";

    try {
      if (!eventTime) {
        throw new Error("Please specify a time!");
      };
    }
    catch(err) {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
      return
    };

    fetch(url + "/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Token": rawToken.token,
      },
      body: JSON.stringify({
        name: eventName,
        description: eventDescription,
        scheduled: eventDateTime,
        user_id: userId
      })
    })
    .then((res) => {
      if (res.ok) {
        feedbackDiv.innerHTML = "";
        return res.json();
      } else {
        throw new Error(sorry);
      };
    })
    .then((json) => {
      eventForm.reset();
      feedbackDiv.style.color = "#12CBC4"; // blue martina
      feedbackDiv.innerHTML = "Saved!";

      const alarmName = json["ID"] + "%%%" + json["name"];
      createAlarm(alarmName, json["description"], json["scheduled"]);

      getEvents(currentTimeframe);

      setTimeout(() => {
        feedbackDiv.innerHTML = "";
      }, 2000);
    })
    .catch((err) => {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
    });
  };

  const deleteEvent = (eventId: string) => {
    checkForUserIdAndRawToken();

    fetch(url + "/users/" + userId + "/events/" + eventId, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Token": rawToken.token,
      },
    })
    .then((res) => {
      if (res.ok) {
        feedbackDiv.style.color = "#EA2027"; // red pigment
        feedbackDiv.innerHTML = "Deleted!";
        return res.json();
      } else {
        throw new Error(sorry);
      };
    })
    .then(() => getEvents(currentTimeframe))
    .catch((err) => {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
    });
  };

  const getEvents = (timeframe: string) => {
    checkForUserIdAndRawToken();

    fetch(url + "/users/" + userId + "/events" + timeframe, {
      headers: {
        "Token": rawToken.token,
      },
    })
    .then((res) => {
      if (res.ok) {
        feedbackDiv.innerHTML = "";
        return res.json();
      } else {
        throw new Error(sorry);
      };
    })
    .then(eventsArr => {
      // clear events only if response is parsed
      events = [];
      for (let scheduledEvent of eventsArr) {
        events.push(new ScheduledEvent(scheduledEvent));
      }
    })
    .then(() => {
      appendEvents(events, timeframe);
    })
    .catch((err) => {
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
    });
  };

  const checkForUserIdAndRawToken = () => {
    try {
      if (!userId || userId === 0 || !rawToken || rawToken.token === "") {
        throw new Error(sorry);
      };
    }
    catch(err) {
      logout();
      feedbackDiv.style.color = "#EA2027"; // red pigment
      feedbackDiv.innerHTML = err.message;
      return
    };
  };
});
