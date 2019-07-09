var url = "http://localhost:8000";
var ScheduledEvent = /** @class */ (function () {
    function ScheduledEvent(a) {
        this.id = a.ID;
        this.userId = a.user_id;
        this.name = a.name;
        this.description = a.description;
        this.scheduled = a.scheduled;
        this.created = a.CreatedAt; // include this?
        this.updated = a.UpdatedAt; // include this?
        this.deleted = a.DeletedAt; // create some kind of trash?
    }
    return ScheduledEvent;
}());
var User = /** @class */ (function () {
    function User(a) {
        this.id = a.ID;
        this.username = a.username;
        this.email = a.email;
        this.created = a.CreatedAt; // include this?
        this.updated = a.UpdatedAt; // this?
        this.deleted = a.DeletedAt; // this?
    }
    return User;
}());
var RawToken = /** @class */ (function () {
    function RawToken(a) {
        this.token = a.Token;
    }
    return RawToken;
}());
var ParsedToken = /** @class */ (function () {
    function ParsedToken(a) {
        this.userId = a.UserID;
        this.exp = a.exp;
    }
    return ParsedToken;
}());
// jwt
var rawToken;
var parsedToken;
var userId;
// events array
var events = [];
// signup form values
var signupUsername;
var signupEmail;
var signupPassword;
var signupPasswordConf;
// login form values
var loginUsername;
var loginPassword;
// event form values
var eventName;
var eventDescription;
var eventDate;
var eventTime;
// current date values
var month;
var date;
// generic error message
var sorry = "Sorry, something went wrong!";
document.addEventListener("DOMContentLoaded", function (event) {
    var signupDiv = document.querySelector("#signup-div");
    var loginDiv = document.querySelector("#login-div");
    var eventDiv = document.querySelector("#event-div");
    var logoutButton = document.querySelector("#logout-button");
    var createEventButton = document.querySelector("#create-event-button");
    var loginForm = document.querySelector("#login-form");
    var eventForm = document.querySelector("#event-form");
    var eventDateInput = document.querySelector("#event-date");
    var signupForm = document.querySelector("#signup-form");
    var loggedInDiv = document.querySelector("#logged-in");
    var feedbackDiv = document.querySelector("#feedback");
    var eventsContainer = document.querySelector("#events-container");
    // don't let user pick a date in the past
    var today = new Date();
    month = String(today.getMonth() + 1);
    if (month.length === 1) {
        month = "0" + month;
    }
    ;
    date = String(today.getDate());
    if (date.length === 1) {
        date = "0" + date;
    }
    ;
    var minDate = today.getFullYear() + "-" + month + "-" + date;
    eventDateInput.min = minDate;
    // get token from local storage
    chrome.storage.local.get(["token"], function (res) {
        // if user is logged in
        if (res["token"]) {
            // hide signup and login forms
            signupDiv.style.display = "none";
            loginDiv.style.display = "none";
            handleToken(res["token"], true); // local is true
        }
        ;
    });
    document.addEventListener("click", function (e) {
        var target = e.target;
        if (target.id === "logout-button") {
            logout();
        }
        ;
        if (target.id === "signup-button") {
            signupDiv.style.display = "block";
            loginDiv.style.display = "none";
        }
        ;
        if (target.id === "login-button") {
            signupDiv.style.display = "none";
            loginDiv.style.display = "block";
        }
        ;
        if (target.id === "today") {
            getEvents("/today");
        }
        ;
        if (target.id === "tomorrow") {
            getEvents("/tomorrow");
        }
        ;
        if (target.id === "week") {
            getEvents("/week");
        }
        ;
        if (target.id === "all") {
            getEvents("");
        }
        ;
    });
    document.addEventListener("input", function (e) {
        var target = e.target;
        // signup fields
        if (target.id === "signup-username") {
            signupUsername = target.value;
        }
        ;
        if (target.id === "signup-email") {
            signupEmail = target.value;
        }
        ;
        if (target.id === "signup-password") {
            signupPassword = target.value;
        }
        ;
        if (target.id === "signup-password-conf") {
            signupPasswordConf = target.value;
        }
        ;
        // login fields
        if (target.id === "login-username") {
            loginUsername = target.value;
        }
        ;
        if (target.id === "login-password") {
            loginPassword = target.value;
        }
        ;
        // event fields
        if (target.id === "event-name") {
            eventName = target.value;
        }
        ;
        if (target.id === "event-description") {
            eventDescription = target.value;
        }
        ;
        if (target.id === "event-date") {
            eventDate = target.value;
        }
        ;
        if (target.id === "event-time") {
            eventTime = target.value;
        }
        ;
    });
    document.addEventListener("submit", function (e) {
        e.preventDefault();
        var target = e.target;
        if (target.id === "signup-form") {
            signup();
        }
        ;
        if (target.id === "login-form") {
            login();
        }
        ;
        if (target.id === "event-form") {
            createEvent();
        }
        ;
    });
    var appendEvents = function (events) {
        eventsContainer.innerHTML = "";
        events.forEach(function (evt) {
            eventsContainer.innerHTML += "\n        <div class=\"event-container\">\n          <div class=\"event-name\">" + evt.name + "</div>\n          <div class=\"event-description\">" + evt.description + "</div>\n          <div class=\"event-scheduled\">" + evt.scheduled + "</div>\n        </div>\n      ";
        });
    };
    // local is false by default -- true only if token is fetched from Chrome local storage
    var handleToken = function (jwt, local) {
        if (local === void 0) { local = false; }
        if (!local) {
            // set to local storage before initializing as RawToken so format matches fetch response
            chrome.storage.local.remove(["token"]);
            chrome.storage.local.set({ token: jwt });
        }
        ;
        // user is logged in -- change display
        loggedInDiv.style.display = "block";
        logoutButton.style.display = "block";
        loginDiv.style.display = "none";
        signupDiv.style.display = "none";
        signupForm.reset();
        loginForm.reset();
        rawToken = new RawToken(jwt);
        var base64Url = rawToken.token.split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(atob(base64).split("").map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        parsedToken = new ParsedToken(JSON.parse(jsonPayload));
        userId = parsedToken.userId;
    };
    var signup = function () {
        try {
            if (signupPassword !== signupPasswordConf) {
                throw new Error("Sorry, passwords don't match!");
            }
            ;
        }
        catch (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
            return;
        }
        ;
        fetch(url + "/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: signupUsername,
                email: signupEmail,
                password: signupPassword
            })
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.innerHTML = "";
                return res.json();
            }
            else {
                if (res.status === 409) {
                    throw new Error("Sorry, that username is taken!");
                }
                else {
                    throw new Error(sorry);
                }
                ;
            }
            ;
        })
            .then(function (jwt) {
            handleToken(jwt, false);
            eventDiv.style.display = "block";
        })["catch"](function (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
        });
    };
    var login = function () {
        fetch(url + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: loginUsername,
                password: loginPassword
            })
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.innerHTML = "";
                return res.json();
            }
            else {
                throw new Error(sorry);
            }
            ;
        })
            .then(function (jwt) {
            handleToken(jwt, false);
        })["catch"](function (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
        });
    };
    var logout = function () {
        chrome.storage.local.remove(["token"]);
        feedbackDiv.innerHTML = "";
        // user is logged out -- change display
        loginDiv.style.display = "block";
        logoutButton.style.display = "none";
        loggedInDiv.style.display = "none";
        signupDiv.style.display = "none";
        eventDiv.style.display = "none";
    };
    var createEvent = function () {
        // timezone is hardcoded don't keep it that way
        var eventDateTime = eventDate + "T" + eventTime + ":00-04:00";
        try {
            if (!eventTime) {
                throw new Error("Please specify a time!");
            }
            ;
        }
        catch (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
            return;
        }
        ;
        fetch(url + "/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Token": rawToken.token
            },
            body: JSON.stringify({
                name: eventName,
                description: eventDescription,
                scheduled: eventDateTime,
                user_id: userId
            })
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.innerHTML = "";
                return res.json();
            }
            else {
                throw new Error(sorry);
            }
            ;
        })
            .then(function (json) {
            eventForm.reset();
            feedbackDiv.style.color = "blue";
            feedbackDiv.innerHTML = "saved!";
            setTimeout(function () {
                feedbackDiv.innerHTML = "";
            }, 2000);
        })["catch"](function (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
        });
    };
    var getEvents = function (timeframe) {
        // is this try-catch block necessary? won't it fail in the fetch? is logging out the best way to handle?
        try {
            if (!userId || !rawToken) {
                throw new Error(sorry);
            }
            ;
        }
        catch (err) {
            logout();
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
            return;
        }
        ;
        fetch(url + "/users/" + userId + "/events" + timeframe, {
            headers: {
                "Token": rawToken.token
            }
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.innerHTML = "";
                return res.json();
            }
            else {
                throw new Error(sorry);
            }
            ;
        })
            .then(function (eventsArr) {
            // clear events only if response is parsed
            events = [];
            for (var _i = 0, eventsArr_1 = eventsArr; _i < eventsArr_1.length; _i++) {
                var scheduledEvent = eventsArr_1[_i];
                events.push(new ScheduledEvent(scheduledEvent));
            }
        })
            .then(function () {
            appendEvents(events);
        })["catch"](function (err) {
            feedbackDiv.style.color = "red";
            feedbackDiv.innerHTML = err.message;
        });
    };
});
