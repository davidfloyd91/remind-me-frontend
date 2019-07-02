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
let username: string;
let email: string;
let password: string;

// login form values
let loginUsername: string;
let loginPassword: string;

document.addEventListener("DOMContentLoaded", (event) => {
  // get token from local storage
  chrome.storage.local.get(["token"], (res) => {
    if (res["token"]) {
      handleToken(res["token"], true);
    };
  });

  document.addEventListener("click", (e) => {
    if (e["target"]["attributes"]["id"]["value"] === "today") {
      getEvents("today");
    };

    if (e["target"]["attributes"]["id"]["value"] === "tomorrow") {
      getEvents("tomorrow");
    };
  });

  document.addEventListener("input", (e) => {
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

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e["target"]["attributes"]["id"]["value"] === "signup") {
      signup();
    };

    if (e["target"]["attributes"]["id"]["value"] === "login") {
      login();
    };
  });

  const handleToken = (jwt: object, local=false) => {
    if (!local) {
      // set to local storage before initializing as RawToken so format matches fetch response
      chrome.storage.local.remove(["token"]);
      chrome.storage.local.set({ token: jwt });
    };

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
        username: username,
        email: email,
        password: password
      })
    })
    .then(res => res.json())
    .then(jwt => {
      handleToken(jwt, false);
    })
  }

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
    })
  }

  const getEvents = (timeframe: string) => {
    // turn into real error handling
    if (!userId) {
      console.log("no userId");
      return
    };

    if (!rawToken) {
      console.log("no rawToken");
      return
    };

    console.log(userId)
    fetch(url + "/users/" + userId + "/events/" + timeframe, {
      headers: {
        "Token": rawToken.token,
      },
    })
    .then(res => res.json())
    .then(eventsArr => {
      // clear eventsToday only if response is parsed
      events = [];
      for (let scheduledEvent of eventsArr) {
        events.push(new ScheduledEvent(scheduledEvent));
      }
    })
    .then(() => console.log('events', timeframe, events))
  }
});
