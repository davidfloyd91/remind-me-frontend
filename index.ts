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
let signupPasswordConf: string;

// login form values
let loginUsername: string;
let loginPassword: string;

// event form values
let eventName: string;
let eventDescription: string;
let eventDate: string;
let eventTime: string;

// current date values
let month: string;
let date: string;

// generic error message
const sorry = "Sorry, something went wrong!";

document.addEventListener("DOMContentLoaded", (event) => {
  const signupDiv = <HTMLDivElement>document.querySelector("#signup-div");
  const loginDiv = <HTMLDivElement>document.querySelector("#login-div");
  const eventDiv = <HTMLDivElement>document.querySelector("#event-div");
  const logoutButton = <HTMLButtonElement>document.querySelector("#logout-button");
  const createEventButton = <HTMLButtonElement>document.querySelector("#create-event-button");
  const loginForm = <HTMLFormElement>document.querySelector("#login-form");
  const eventForm = <HTMLFormElement>document.querySelector("#event-form");
  const eventDateInput = <HTMLInputElement>document.querySelector("#event-date");
  const signupForm = <HTMLFormElement>document.querySelector("#signup-form");
  const loggedInDiv = <HTMLDivElement>document.querySelector("#logged-in");
  const feedbackDiv = <HTMLDivElement>document.querySelector("#feedback");
  const eventsContainer = <HTMLDivElement>document.querySelector("#events-container");

  // don't let user pick a date in the past
  const today = new Date();
  month = String(today.getMonth() + 1);
  if (month.length === 1) {
    month = "0" + month;
  };
  date = String(today.getDate());
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
    };

    if (target.id === "login-button") {
      signupDiv.style.display = "none";
      loginDiv.style.display = "block";
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
  };

  const signup = () => {
    try {
      if (signupPassword !== signupPasswordConf) {
        throw new Error("Sorry, passwords don't match!");
      };
    }
    catch(err) {
      feedbackDiv.style.color = "red";
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
      handleToken(jwt, false);
      eventDiv.style.display = "block";
    })
    .catch((err) => {
      feedbackDiv.style.color = "red";
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
        throw new Error(sorry);
      };
    })
    .then((jwt) => {
      handleToken(jwt, false);
    })
    .catch((err) => {
      feedbackDiv.style.color = "red";
      feedbackDiv.innerHTML = err.message;
    });
  };

  const logout = () => {
    chrome.storage.local.remove(["token"]);

    feedbackDiv.innerHTML = "";

    // user is logged out -- change display
    loginDiv.style.display = "block";
    logoutButton.style.display = "none";
    loggedInDiv.style.display = "none";
    signupDiv.style.display = "none";
    eventDiv.style.display = "none";
  };

  const createEvent= () => {
    // timezone is hardcoded don't keep it that way
    const eventDateTime = eventDate + "T" + eventTime + ":00-04:00";

    try {
      if (!eventTime) {
        throw new Error("Please specify a time!");
      };
    }
    catch(err) {
      feedbackDiv.style.color = "red";
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
      feedbackDiv.style.color = "blue";
      feedbackDiv.innerHTML = "saved!";

      setTimeout(() => {
        feedbackDiv.innerHTML = "";
      }, 2000);
    })
    .catch((err) => {
      feedbackDiv.style.color = "red";
      feedbackDiv.innerHTML = err.message;
    });
  };

  const getEvents = (timeframe: string) => {
    // is this try-catch block necessary? won't it fail in the fetch? is logging out the best way to handle?
    try {
      if (!userId || !rawToken) {
        throw new Error(sorry);
      };
    }
    catch(err) {
      logout();
      feedbackDiv.style.color = "red";
      feedbackDiv.innerHTML = err.message;
      return
    };

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
      appendEvents(events);
    })
    .catch((err) => {
      feedbackDiv.style.color = "red";
      feedbackDiv.innerHTML = err.message;
    });
  };
});
