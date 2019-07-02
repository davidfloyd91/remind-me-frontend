const url: string = "http://localhost:8000";
let user_id: number = 1;

class ScheduledEvent {
  id: number;
  userId: number;
  name: string;
  description: string;
  scheduled: string;
  created: string;
  updated: string;
  deleted: string;

  constructor(res: any) {
    this.id = res.ID;
    this.userId = res.user_id;
    this.name = res.name;
    this.description = res.description;
    this.scheduled = res.scheduled;
    this.created = res.CreatedAt; // include this?
    this.updated = res.UpdatedAt; // include this?
    this.deleted = res.DeletedAt; // create some kind of trash?
  }
}

class User {
  id: number;
  username: string;
  email: string;
  created: string;
  updated: string;
  deleted: string;

  constructor(res: any) {
    this.id = res.ID;
    this.username = res.username;
    this.email = res.email;
    this.created = res.CreatedAt; // include this?
    this.updated = res.UpdatedAt; // this?
    this.deleted = res.DeletedAt; // this?
  }
}

class Token {
  token: string;

  constructor(res: any) {
    this.token = res.token;
  }
}

// jwt
let token: Token;

// events arrays
let eventsToday: ScheduledEvent[] = [];

// signup form values
let username: string;
let email: string;
let password: string;

// login form values
let loginUsername: string;
let loginPassword: string;

document.addEventListener("DOMContentLoaded", event => {
  chrome.storage.local.get(["token"], res => {
    if (res["token"]) {
      token = res["token"];
    };
  });

  document.addEventListener("click", e => {
    if (e["target"]["attributes"]["id"]["value"] === "today") {
      getEventsToday()
    };
  });

  document.addEventListener("input", e => {
    // signup fields
    if (e["target"]["attributes"]["id"]["value"] === "username") {
      username = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "email") {
      email = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "password") {
      password = e["target"]["value"];
    };

    // login fields
    if (e["target"]["attributes"]["id"]["value"] === "login-username") {
      loginUsername = e["target"]["value"];
    };

    if (e["target"]["attributes"]["id"]["value"] === "login-password") {
      loginPassword = e["target"]["value"];
    };
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    if (e["target"]["attributes"]["id"]["value"] === "signup") {
      signup();
    };

    if (e["target"]["attributes"]["id"]["value"] === "login") {
      login();
    };
  });

  const parseJwt = (token) => {
    const base64Url = token["Token"].split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));

    return JSON.parse(jsonPayload);
  };

  const signup = () => {
    fetch(url + "/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      })
    })
    .then(res => res.json())
    .then(jwt => {
      chrome.storage.local.set({ token: jwt });
      token = jwt;
    })
  }

  const login = () => {
    fetch(url + "/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
    .then(res => res.json())
    .then(jwt => {
      chrome.storage.local.set({ token: jwt });
      token = jwt;
      console.log(parseJwt(token));
    })
  }

  const getEventsToday = () => {
    fetch(url + "/users/" + user_id + "/events/today", {
      headers: {
        "Token": token["Token"],
      },
    })
    .then(res => res.json())
    .then(eventsArr => {
      // clear eventsToday only if response is parsed
      eventsToday = [];
      for (let scheduledEvent of eventsArr) {
        eventsToday.push(new ScheduledEvent(scheduledEvent));
      }
    })
    .then(() => console.log('eventsToday', eventsToday))
  }
});
