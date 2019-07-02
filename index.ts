const url: string = "http://localhost:8000";
let userId: number;

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

class RawToken {
  token: string;

  constructor(res: any) {
    this.token = res.Token;
  }
}

class ParsedToken {
  userId: number;
  exp: number;

  constructor(payload: any) {
    this.userId = payload.UserID;
    this.exp = payload.exp;
  }
}

// jwt
let rawToken: RawToken;
let parsedToken: ParsedToken;

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
      rawToken = res["token"];
      handleToken(rawToken);
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

  const handleToken = (jwt: object) => {
    rawToken = new RawToken(jwt);
    chrome.storage.local.set({ token: rawToken });

    const base64Url: string = rawToken.token.split(".")[1];
    const base64: string = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload: string = decodeURIComponent(atob(base64).split("").map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));

    if (jsonPayload) {
      parsedToken = new ParsedToken(JSON.parse(jsonPayload));
    };

    if (parsedToken) {
      userId = parsedToken.userId;
    };
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
      handleToken(jwt);
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
      handleToken(jwt);
    })
  }

  const getEventsToday = () => {
    if (!userId) {
      console.log("no user id")
      return
    };

    console.log(rawToken.token)

    fetch(url + "/users/" + userId + "/events/today", {
      headers: {
        "Token": rawToken["token"],
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
