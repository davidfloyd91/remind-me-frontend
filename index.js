var url = "http://localhost:8000";
var user_id = 1;
var ScheduledEvent = /** @class */ (function () {
    function ScheduledEvent(res) {
        this.id = res.ID;
        this.userId = res.user_id;
        this.name = res.name;
        this.description = res.description;
        this.scheduled = res.scheduled;
        this.created = res.CreatedAt; // include this?
        this.updated = res.UpdatedAt; // include this?
        this.deleted = res.DeletedAt; // create some kind of trash?
    }
    return ScheduledEvent;
}());
var User = /** @class */ (function () {
    function User(res) {
        this.id = res.ID;
        this.username = res.username;
        this.email = res.email;
        this.created = res.CreatedAt; // include this?
        this.updated = res.UpdatedAt; // this?
        this.deleted = res.DeletedAt; // this?
    }
    return User;
}());
var Token = /** @class */ (function () {
    function Token(res) {
        this.token = res.token;
    }
    return Token;
}());
// jwt
var token;
// events arrays
var eventsToday = [];
// signup form values
var username;
var email;
var password;
// login form values
var loginUsername;
var loginPassword;
document.addEventListener("DOMContentLoaded", function (event) {
    chrome.storage.local.get(["token"], function (res) {
        if (res["token"]) {
            token = res["token"];
        }
        ;
    });
    document.addEventListener("click", function (e) {
        if (e["target"]["attributes"]["id"]["value"] === "today") {
            getEventsToday();
        }
        ;
    });
    document.addEventListener("input", function (e) {
        // signup fields
        if (e["target"]["attributes"]["id"]["value"] === "username") {
            username = e["target"]["value"];
        }
        ;
        if (e["target"]["attributes"]["id"]["value"] === "email") {
            email = e["target"]["value"];
        }
        ;
        if (e["target"]["attributes"]["id"]["value"] === "password") {
            password = e["target"]["value"];
        }
        ;
        // login fields
        if (e["target"]["attributes"]["id"]["value"] === "login-username") {
            loginUsername = e["target"]["value"];
        }
        ;
        if (e["target"]["attributes"]["id"]["value"] === "login-password") {
            loginPassword = e["target"]["value"];
        }
        ;
    });
    document.addEventListener("submit", function (e) {
        e.preventDefault();
        if (e["target"]["attributes"]["id"]["value"] === "signup") {
            signup();
        }
        ;
        if (e["target"]["attributes"]["id"]["value"] === "login") {
            login();
        }
        ;
    });
    var parseJwt = function (token) {
        var base64Url = token["Token"].split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(atob(base64).split("").map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        return JSON.parse(jsonPayload);
    };
    var signup = function () {
        fetch(url + "/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (jwt) {
            chrome.storage.local.set({ token: jwt });
            token = jwt;
        });
    };
    var login = function () {
        fetch(url + "/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (jwt) {
            chrome.storage.local.set({ token: jwt });
            token = jwt;
            console.log(parseJwt(token));
        });
    };
    var getEventsToday = function () {
        fetch(url + "/users/" + user_id + "/events/today", {
            headers: {
                "Token": token["Token"]
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (eventsArr) {
            // clear eventsToday only if response is parsed
            eventsToday = [];
            for (var _i = 0, eventsArr_1 = eventsArr; _i < eventsArr_1.length; _i++) {
                var scheduledEvent = eventsArr_1[_i];
                eventsToday.push(new ScheduledEvent(scheduledEvent));
            }
        })
            .then(function () { return console.log('eventsToday', eventsToday); });
    };
});
