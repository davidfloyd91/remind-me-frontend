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
var JWTToken = /** @class */ (function () {
    function JWTToken() {
    }
    return JWTToken;
}());
// current user
var user;
// events arrays
var eventsToday = [];
// login/signup form values
var username;
var email;
var password;
document.addEventListener("DOMContentLoaded", function (event) {
    document.addEventListener("click", function (e) {
        if (e["target"]["attributes"]["id"]["value"] === "today") {
            getEventsToday();
        }
        ;
    });
    document.addEventListener("input", function (e) {
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
    });
    document.addEventListener("submit", function (e) {
        e.preventDefault();
        if (e["target"]["attributes"]["id"]["value"] === "signup") {
            signup();
        }
        ;
    });
    function signup() {
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
            .then(function (userObj) {
            user = new User(userObj);
        })
            .then(function () { return console.log(user); });
    }
    function getEventsToday() {
        fetch(url + "/users/" + user_id + "/events/today")
            .then(function (res) { return res.json(); })
            .then(function (eventsArr) {
            // clear eventsToday only if response is parsed
            eventsToday = [];
            for (var _i = 0, eventsArr_1 = eventsArr; _i < eventsArr_1.length; _i++) {
                var scheduledEvent = eventsArr_1[_i];
                eventsToday.push(new ScheduledEvent(scheduledEvent));
            }
        })
            .then(function () { return console.log(eventsToday); });
    }
});
