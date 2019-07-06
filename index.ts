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
let rawToken: RawToken;
let parsedToken: ParsedToken;
let userId: number;

// events array
let events: ScheduledEvent[] = [];

// signup form values
let signupUsername: string;
let signupEmail: string;
let signupPassword: string;

// login form values
let loginUsername: string;
let loginPassword: string;

// event form values
let eventName: string;
let eventDescription: string;
let eventDate: string;
let eventTime: string;

document.addEventListener("DOMContentLoaded", (event) => {
  const signupDiv = <HTMLDivElement>document.querySelector("#signup-div");
  const loginDiv = <HTMLDivElement>document.querySelector("#login-div");
  const eventDiv = <HTMLDivElement>document.querySelector("#event-div");
  const logoutButton = <HTMLButtonElement>document.querySelector("#logout-button");
  const signupButton = <HTMLButtonElement>document.querySelector("#signup-button");
  const loginButton = <HTMLButtonElement>document.querySelector("#login-button");
  const loginForm = <HTMLFormElement>document.querySelector("#login-form");
  const signupForm = <HTMLFormElement>document.querySelector("#signup-form");
  const getEventsDiv = <HTMLDivElement>document.querySelector("#get-events-div");
  const eventsContainer = <HTMLDivElement>document.querySelector("#events-container");

  // get token from local storage
  chrome.storage.local.get(["token"], (res) => {
    // if user is logged in
    if (res["token"]) {
      // hide signup and login forms
      signupDiv["style"]["display"] = "none";
      signupButton["style"]["display"] = "none";
      loginButton["style"]["display"] = "none";
      loginDiv["style"]["display"] = "none";

      handleToken(res["token"], true); // local is true
    };
  });

  document.addEventListener("click", (e) => {
    if (e["target"]["attributes"]["id"]["value"] === "logout-button") {
      logout();
    };

    if (e["target"]["attributes"]["id"]["value"] === "signup-button") {
      signupDiv["style"]["display"] = "block";
      loginButton["style"]["display"] = "block";
      loginDiv["style"]["display"] = "none";
      signupButton["style"]["display"] = "none";
    };

    if (e["target"]["attributes"]["id"]["value"] === "login-button") {
      signupDiv["style"]["display"] = "none";
      loginButton["style"]["display"] = "none";
      loginDiv["style"]["display"] = "block";
      signupButton["style"]["display"] = "block";
    };

    if (e["target"]["attributes"]["id"]["value"] === "today") {
      getEvents("today");
    };

    if (e["target"]["attributes"]["id"]["value"] === "tomorrow") {
      getEvents("tomorrow");
    };

    if (e["target"]["attributes"]["id"]["value"] === "week") {
      getEvents("week");
    };
  });

  document.addEventListener("input", (e) => {
    // signup fields
    if (e["target"]["attributes"]["id"]["value"] === "signup-username") {
      signupUsername = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "signup-email") {
      signupEmail = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "signup-password") {
      signupPassword = e["target"]["value"];
    };

    // login fields
    if (e["target"]["attributes"]["id"]["value"] === "login-username") {
      loginUsername = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "login-password") {
      loginPassword = e["target"]["value"];
    };

    // event fields
    if (e["target"]["attributes"]["id"]["value"] === "event-name") {
      eventName = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "event-description") {
      eventDescription = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "event-date") {
      eventDate = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "event-time") {
      eventTime = e["target"]["value"];
    };
  });

  document.addEventListener("submit", (e) => {
    e.preventDefault();

    if (e["target"]["attributes"]["id"]["value"] === "signup-form") {
      signup();
    };

    if (e["target"]["attributes"]["id"]["value"] === "login-form") {
      login();
    };

    if (e["target"]["attributes"]["id"]["value"] === "event-form") {
      createEvent();
    };
  });

  const appendEvents = (events: ScheduledEvent[]) => {
    eventsContainer.innerHTML = "";

    events.forEach((evt) => {
      eventsContainer.innerHTML += `
        <div class="event-container">
          <div class="event-name">${evt.name}</div>
          <div class="event-description">${evt.description}</div>
          <div class="event-scheduled">${evt.scheduled}</div>
        </div>
      `;
    });
  };

  // local is false by default -- true only if token is fetched from Chrome local storage
  const handleToken = (jwt: object, local=false) => {
    if (!local) {
      // set to local storage before initializing as RawToken so format matches fetch response
      chrome.storage.local.remove(["token"]);
      chrome.storage.local.set({ token: jwt });
    };

    // user is logged in -- change display
    eventDiv["style"]["display"] = "block";
    getEventsDiv["style"]["display"] = "block";
    logoutButton["style"]["display"] = "block";
    loginButton["style"]["display"] = "none";
    signupButton["style"]["display"] = "none";
    loginDiv["style"]["display"] = "none";
    signupDiv["style"]["display"] = "none";

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
  };

  const signup = () => {
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
    .then(res => res.json())
    .then(jwt => {
      handleToken(jwt, false);
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
    .then(res => res.json())
    .then(jwt => {
      handleToken(jwt, false);
    });
  };

  const logout = () => {
    chrome.storage.local.remove(["token"]);

    loginDiv["style"]["display"] = "block";
    logoutButton["style"]["display"] = "none";
    loginButton["style"]["display"] = "none";
    signupButton["style"]["display"] = "block";
    signupDiv["style"]["display"] = "none";
    eventDiv["style"]["display"] = "none";
  };

  const createEvent= () => {
    // timezone is hardcoded don't keep it that way
    const eventDateTime = eventDate + "T" + eventTime + ":00-04:00";

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
    .then(res => res.json())
    .then(console.log)
  };

  const getEvents = (timeframe: string) => {
    // turn into real error handling
    if (!userId) {
      console.log("no userId");
      return
    };

    // turn into real error handling
    if (!rawToken) {
      console.log("no rawToken");
      return
    };

    fetch(url + "/users/" + userId + "/events/" + timeframe, {
      headers: {
        "Token": rawToken.token,
      },
    })
    .then(res => res.json())
    .then(eventsArr => {
      // clear events only if response is parsed
      events = [];
      for (let scheduledEvent of eventsArr) {
        events.push(new ScheduledEvent(scheduledEvent));
      }
    })
    .then(() => {
      appendEvents(events);
    });
  };
});
