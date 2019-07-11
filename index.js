// todo:
// delete event
// edit event
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
var rawToken = { token: "" };
var parsedToken;
var userId = 0;
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
// update form values
var updateName;
var updateDescription;
var updateDate;
var updateTime;
var currentTimeframe;
// generic error message
var sorry = "Sorry, something went wrong!";
// https://flatuicolors.com/palette/nl
var colors = [
    "#FFC312",
    "#12CBC4",
    "#A3CB38",
    "#ED4C67",
    "#9980FA",
];
var months = {
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
document.addEventListener("DOMContentLoaded", function (event) {
    var signupDiv = document.querySelector("#signup-div");
    var loginDiv = document.querySelector("#login-div");
    var eventDiv = document.querySelector("#event-div");
    var logoutButton = document.querySelector("#logout-button");
    var createEventButton = document.querySelector("#create-event-button");
    var hideEventButton = document.querySelector("#hide-event-button");
    var loginForm = document.querySelector("#login-form");
    var eventForm = document.querySelector("#event-form");
    var eventDateInput = document.querySelector("#event-date");
    var signupForm = document.querySelector("#signup-form");
    var loggedInDiv = document.querySelector("#logged-in");
    var feedbackDiv = document.querySelector("#feedback");
    var eventsContainer = document.querySelector("#events-container");
    var eventsHeader = document.querySelector("#events-header");
    // map /events routes to headers
    var timeframeVals = {
        "/today": {
            "header": "Events today",
            "button": (function () { return document.querySelector("#today"); })()
        },
        "/tomorrow": {
            "header": "Events tomorrow",
            "button": (function () { return document.querySelector("#tomorrow"); })()
        },
        "/week": {
            "header": "Events this week",
            "button": (function () { return document.querySelector("#week"); })()
        },
        "": {
            "header": "All events",
            "button": (function () { return document.querySelector("#all"); })()
        }
    };
    // prevents user from picking a date in the past
    var today = new Date();
    var month = String(today.getMonth() + 1);
    if (month.length === 1) {
        month = "0" + month;
    }
    ;
    var date = String(today.getDate());
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
            feedbackDiv.innerHTML = "";
        }
        ;
        if (target.id === "login-button") {
            signupDiv.style.display = "none";
            loginDiv.style.display = "block";
            feedbackDiv.innerHTML = "";
        }
        ;
        if (target.id === "create-event-button") {
            eventDiv.style.display = "block";
            createEventButton.style.display = "none";
            hideEventButton.style.display = "block";
        }
        ;
        if (target.id === "hide-event-button") {
            eventDiv.style.display = "none";
            createEventButton.style.display = "block";
            hideEventButton.style.display = "none";
        }
        ;
        if (target.id.split(":")[0] === "delete") {
            deleteEvent(target.id.split(":")[1]);
        }
        ;
        if (target.id.split(":")[0] === "update") {
            editEvent(target.id.split(":")[1]);
        }
        ;
        if (target.id.split(":")[0] === "update-submit") {
            var id = target.id.split(":")[1];
            updateEvent(id);
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
        // update fields
        if (target.id === "update-name") {
            updateName = target.value;
        }
        ;
        if (target.id === "update-description") {
            updateDescription = target.value;
        }
        ;
        if (target.id === "update-date") {
            updateDate = target.value;
        }
        ;
        if (target.id === "update-time") {
            updateTime = target.value;
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
    var parseDateTime = function (dateTime) {
        var dateTimeArr = dateTime.split("-").slice(0, 3);
        var year = dateTimeArr[0];
        var month = months[dateTimeArr[1]];
        var tSplit = dateTimeArr[2].split("T");
        var date = tSplit[0];
        var timeArr = tSplit[1].split(":");
        var hour = parseInt(timeArr[0]) % 12 === 0 ? "12" : "" + parseInt(timeArr[0]) % 12;
        var minute = timeArr[1];
        var amPm = parseInt(timeArr[0]) >= 12 ? "pm" : "am";
        return month + " " + date + ", " + year + " at " + hour + ":" + minute + amPm;
    };
    var appendEvents = function (events, timeframe, editEvent) {
        if (editEvent === void 0) { editEvent = { id: 0, name: "", userId: 0, description: "", scheduled: "", created: "", updated: "", deleted: "" }; }
        currentTimeframe = timeframe;
        eventsHeader.innerHTML = "<h3>" + timeframeVals[timeframe]["header"] + "</h3>";
        eventsContainer.innerHTML = "";
        if (events.length === 0) {
            eventsContainer.innerHTML += "\n      <div class=\"event-container\" style=\"color:#12CBC4;\">\n        <div>\n          Nothing here!\n        </div>\n      </div>\n      ";
        }
        ;
        events.sort(function (a, b) {
            var eventA = a.scheduled;
            var eventB = b.scheduled;
            if (eventA < eventB) {
                return -1;
            }
            ;
            if (eventA > eventB) {
                return 1;
            }
            ;
            return 0;
        });
        events.forEach(function (evt, index) {
            var color = colors[index % colors.length];
            var dateValue;
            var timeValue;
            if (editEvent.scheduled[0]) {
                var dateTimeArr = editEvent.scheduled.split("-").slice(0, 3);
                var year = dateTimeArr[0];
                var month_1 = dateTimeArr[1];
                var tSplit = dateTimeArr[2].split("T");
                var date_1 = tSplit[0];
                var timeArr = tSplit[1].split(":");
                var hour = timeArr[0];
                if (!hour[1]) {
                    hour = "0" + hour;
                }
                ;
                var minute = timeArr[1];
                dateValue = year + "-" + month_1 + "-" + date_1;
                timeValue = hour + ":" + minute;
            }
            ;
            if (editEvent.scheduled[0] && evt === editEvent) {
                eventsContainer.innerHTML += "\n          <div class=\"event-container\">\n            <div style=\"width:80%;margin:0 auto;text-align:left;margin-bottom:3px;\">\n              <form id=\"event-form\">\n                <label for=\"update-name\">Name</label>\n                <input type=\"text\" id=\"update-name\" value=\"" + editEvent.name + "\"></input>\n                <label for=\"update-description\">Description</label>\n                <textarea id=\"update-description\">" + editEvent.description + "</textarea>\n                <label for=\"update-date\">Date</label>\n                <input type=\"date\" id=\"update-date\" value=\"" + dateValue + "\"></input>\n                <br/>\n                <label for=\"update-time\">Time</label>\n                <input type=\"time\" id=\"update-time\" value=\"" + timeValue + "\"></input>\n                <br/>\n                <br/>\n                <button type=\"submit\" class=\"margin-button\" id=\"update-submit:" + editEvent.id + "\">Submit</button>\n              </form>\n            </div>\n          </div>\n        ";
            }
            else {
                eventsContainer.innerHTML += "\n          <div class=\"event-container\">\n            <div>\n              <div class=\"event-name\" style=\"color:" + color + ";\">" + evt.name + "</div>\n              <div class=\"event-description\">" + evt.description + "</div>\n              <div class=\"event-scheduled\">" + parseDateTime(evt.scheduled) + "</div>\n              <button class=\"margin-button\" id=\"update:" + evt.id + "\">Edit</button>\n              <button class=\"margin-button\" id=\"delete:" + evt.id + "\">Delete</button>\n            </div>\n          </div>\n        ";
            }
            ;
        });
        var timeframeValsKeys = Object.keys(timeframeVals);
        var timeframeButtons = timeframeValsKeys.map(function (a) {
            timeframeVals[a]["button"];
        });
        timeframeValsKeys.forEach(function (key) {
            if (timeframeVals[key]["button"] === timeframeVals[timeframe]["button"]) {
                timeframeVals[key]["button"].disabled = true;
                timeframeVals[key]["button"].classList.add("unclickable");
            }
            else {
                timeframeVals[key]["button"].disabled = false;
                timeframeVals[key]["button"].classList.remove("unclickable");
            }
            ;
        });
    };
    // local is false by default -- true only if token is fetched from
    // Chrome local storage (meaning it's just a popup refresh)
    var handleToken = function (jwt, local) {
        if (local === void 0) { local = false; }
        // token was sent from backend
        if (!local) {
            // set to local storage before initializing as RawToken so format
            // matches fetch response
            chrome.storage.local.remove(["token"], function () {
                chrome.storage.local.set({ token: jwt });
            });
            // token was fetched locally
        }
        else {
            createEventButton.style.display = "block";
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
        // grab the events today if the token was fetched locally
        if (local) {
            getEvents("/today");
        }
        ;
    };
    var signup = function () {
        try {
            if (signupPassword !== signupPasswordConf) {
                throw new Error("Sorry, passwords don't match!");
            }
            ;
        }
        catch (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
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
            hideEventButton.style.display = "block";
            eventDiv.style.display = "block";
            handleToken(jwt, false);
        })
            .then(function () {
            appendEvents([], "/today");
        })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
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
                if (res.status === 401) {
                    throw new Error("Sorry, that doesn't look right!");
                }
                else {
                    throw new Error(sorry);
                }
                ;
            }
            ;
        })
            .then(function (jwt) {
            createEventButton.style.display = "block";
            handleToken(jwt, false);
        })
            .then(function () {
            getEvents("/today");
        })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
        });
    };
    var logout = function () {
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
    var convertPqTimeToJs = function (pq) {
        // 2019-07-11T13:45:00-4:00
        // Wed Jul 10 2019 19:23:35 GMT-0400 (Eastern Daylight Time)
        var split = pq.split("-");
        var month = months[split[1]];
        var year = split[0];
        var tSplit = split[2].split("T");
        var date = tSplit[0];
        var time = tSplit[1];
        return month + " " + date + " " + year + " " + time + " GMT-0400";
    };
    var createAlarm = function (alarmName, description, scheduled) {
        var time = scheduled.slice(11, 16);
        var timeArr = time.split(":");
        var alarmMinute;
        var alarmHour;
        var alarmDate = scheduled.slice(8, 10);
        if (parseInt(timeArr[1]) < 15) {
            alarmHour = String(parseInt(timeArr[0]) - 1);
            alarmMinute = String(parseInt(timeArr[1]) + 45);
        }
        else {
            alarmHour = timeArr[0];
            alarmMinute = String(parseInt(timeArr[1]) - 15);
        }
        ;
        if (alarmHour === "-1") {
            alarmHour = "23";
            alarmDate = String(parseInt(scheduled.slice(8, 10)) - 1);
        }
        ;
        var alarmTime = convertPqTimeToJs(scheduled.slice(0, 8) + alarmDate + "T" + alarmHour + ":" + alarmMinute + ":00-4:00");
        var unixDate = Math.round((new Date(alarmTime)).getTime());
        var when = parseDateTime(scheduled);
        chrome.alarms.create(alarmName, { when: unixDate });
        chrome.alarms.onAlarm.addListener(function (alarm) {
            if (alarm.name === alarmName) {
                alert(String(alarmName.split("%%%")[1]) + "\n\n" + description + "\n\n" + when);
                // don't believe this is working
                chrome.alarms.clear(alarmName);
            }
            ;
        });
    };
    var createEvent = function () {
        checkForUserIdAndRawToken();
        // timezone is hardcoded don't keep it that way
        var eventDateTime = eventDate + "T" + eventTime + ":00-04:00";
        try {
            if (!eventTime) {
                throw new Error("Please specify a time!");
            }
            ;
        }
        catch (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
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
            feedbackDiv.style.color = "#12CBC4"; // blue martina
            feedbackDiv.innerHTML = "Saved!";
            var alarmName = json["ID"] + "%%%" + json["name"];
            createAlarm(alarmName, json["description"], json["scheduled"]);
            getEvents(currentTimeframe);
            setTimeout(function () {
                feedbackDiv.innerHTML = "";
            }, 2000);
        })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
        });
    };
    var deleteEvent = function (eventId) {
        checkForUserIdAndRawToken();
        fetch(url + "/users/" + userId + "/events/" + eventId, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Token": rawToken.token
            },
            body: JSON.stringify(event)
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.style.color = "#EA2027"; // red pigment
                feedbackDiv.innerHTML = "Deleted!";
                return res.json();
            }
            else {
                throw new Error(sorry);
            }
            ;
        })
            .then(function () { return getEvents(currentTimeframe); })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
        });
    };
    var editEvent = function (id) {
        var eventArr = events.filter(function (evt) {
            return evt.id === parseInt(id);
        });
        var event = eventArr[0];
        appendEvents(events, currentTimeframe, event);
    };
    var updateEvent = function (id) {
        checkForUserIdAndRawToken();
        var eventArr = events.filter(function (evt) {
            return evt.id === parseInt(id);
        });
        var event = eventArr[0];
        var dateTimeArr = event.scheduled.split("-").slice(0, 3);
        var tSplit = dateTimeArr[2].split("T");
        if (!updateDate) {
            var year = dateTimeArr[0];
            var month_2 = dateTimeArr[1];
            var date_2 = tSplit[0];
            updateDate = year + "-" + month_2 + "-" + date_2;
        }
        ;
        if (!updateTime) {
            var timeArr = tSplit[1].split(":");
            var hour = timeArr[0];
            if (!hour[1]) {
                hour = "0" + hour;
            }
            ;
            var minute = timeArr[1];
            updateTime = hour + ":" + minute;
        }
        ;
        if (!updateName) {
            updateName = event.name;
        }
        ;
        if (!updateDescription) {
            updateDescription = event.description;
        }
        ;
        var updateDateTime = updateDate + "T" + updateTime + ":00-04:00";
        var data = {
            name: updateName,
            description: updateDescription,
            scheduled: updateDateTime
        };
        fetch(url + "/users/" + userId + "/events/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Token": rawToken.token
            },
            body: JSON.stringify(data)
        })
            .then(function (res) {
            if (res.ok) {
                feedbackDiv.style.color = "#12CBC4"; // blue martina
                feedbackDiv.innerHTML = "Updated!";
                return res.json();
            }
            else {
                throw new Error(sorry);
            }
            ;
        })
            .then(function () { return getEvents(currentTimeframe); })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
        });
    };
    var getEvents = function (timeframe) {
        checkForUserIdAndRawToken();
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
            appendEvents(events, timeframe);
        })["catch"](function (err) {
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
        });
    };
    var checkForUserIdAndRawToken = function () {
        try {
            if (!userId || userId === 0 || !rawToken || rawToken.token === "") {
                throw new Error(sorry);
            }
            ;
        }
        catch (err) {
            logout();
            feedbackDiv.style.color = "#EA2027"; // red pigment
            feedbackDiv.innerHTML = err.message;
            return;
        }
        ;
    };
});
