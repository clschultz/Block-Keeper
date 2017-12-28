// utilities.js
// General global functions for convenience
// Block Keeper
// Created by Dallas McNeil

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

// Stop zooming in
var webFrame = require('electron').webFrame;
webFrame.setZoomLevelLimits(1, 1);

// Disable a specific element so it cannot be interacted with
function disableElement(elem) {
    $(elem).addClass("disabled");
    $(elem).prop("disabled", true);
    if (timer.timerState() === "inspectReady") {
        timer.cancelTimer();
    }
}

// Enable a specific element to be interacted with
function enableElement(elem) {
    $(elem).removeClass("disabled");
    $(elem).prop("disabled", false);
}

// Disable all major elements, with exception
function disableAllElements(exception = "") {
    var elements = $("#content").children().not("#stats");
    elements = elements.add($("#stats").children().not("#sessionContainer"));
    elements = elements.add($("#sessionContainer").children());
    $("#addTimeButton").prop("disabled", true);
    $("#addTimeButton").addClass("disabled");
    $(".closeTool").prop("disabled", true);
    $(".closeTool").addClass("disabled");
    $(".selectable").prop("disabled", true);
    $(".selectable").addClass("disabled");
    for (var e in elements) {
        if (elements[e].id !== exception && elements[e].id !== undefined) {
            disableElement("#"+elements[e].id);
        }
    }
}

// Enable all major elements
function enableAllElements() {
    var elements = $("#content").children().not("#stats");
    elements = elements.add($("#stats").children().not("#sessionContainer"));
    elements = elements.add($("#sessionContainer").children());
    $("#addTimeButton").prop("disabled", false);
    $("#addTimeButton").removeClass("disabled");
    $(".closeTool").prop("disabled", false);
    $(".closeTool").removeClass("disabled");
    $(".selectable").prop("disabled", false);
    $(".selectable").removeClass("disabled");
    for (var e in elements) {
        if (elements[e].id === "previewButton") {
            if (record.hasVideo() && preferences.recordSolve && !record.recording()) {
                enableElement("#"+elements[e].id);
            }
        } else {
            enableElement("#"+elements[e].id);
        }
    }
}

// Take a time and returns a string taking into account minutes and timer detail
function formatTime(time) {
    if (time === "-") {
        return "-";
    } else if (time === -1) {
        return "DNF";
    }
    if (preferences.formatTime && time >= 60) {
        if (time % 60 < 10) {
            return Math.floor(time / 60) + ":0" + (time % 60).toFixed(parseInt(preferences.timerDetail) + 1).slice(0, -1);
        } else {
            return Math.floor(time / 60) + ":" + (time % 60).toFixed(parseInt(preferences.timerDetail) + 1).slice(0, -1);
        }
    } else { 
        return time.toFixed(parseInt(preferences.timerDetail) + 1).slice(0, -1);
    }
}

// Returns the standard deviation of a set of times
function standardDeviation(times) {
    var sum = 0;
    var t = removeDNFs(times);
    if (t.length > 1) {
        var mean = meanTimes(t);
        for (var i = 0; i < t.length; i++) {
            sum += ((t[i] - mean) * (t[i] - mean));
        }
        return Math.sqrt(sum / t.length);
    } else {
        return 0;
    }
}

function medianTimes(t) {
    var times = t.slice();
    if (times.length == 0) {
        return 0;
    }
    var sortedTimes = times.sort();
    var a = sortedTimes[Math.ceil((sortedTimes.length - 1) / 2)];
    var b = sortedTimes[Math.floor((sortedTimes.length - 1) / 2)];
    return (a + b) / 2;
}

// Average all the times, DNF's being -1
function averageTimes(times) {
    var t = times.slice();
    if (times.length > 2) {
        t.sort(function(a, b) {
            if (a === -1) {
                return 1;
            } else if (b === -1) {
                return -1;
            } else {
                return a - b;
            }
        })
        if (t.length < 40) {
            t = t.slice(1, -1);
        } else {
            t = t.slice(Math.floor(t.length * 0.05), -Math.floor(t.length * 0.05));
        }
        if (t[0] == -1) {
            return -1;
        }
    }
    return meanTimes(t);
}

// Get the mean of all times
function meanTimes(times) {
    var sum = 0;
    if (times.length == 0) {
        return 0;
    }
    
    for (var i = 0; i < times.length; i++) {
        sum += times[i];
        if (times[i] === -1) {
            return -1;
        }
    }
    return sum / times.length;
}

// Get the times from records, including +2's and DNF's as -1
function extractTimes(records) {
    var raw = [];
    for (var i = 0; i < records.length; i++) {
        if (records[i].result === "+2") {
            raw.push(records[i].time + 2);
        } else if (records[i].result === "DNF") {
            raw.push(-1);
        } else {
            raw.push(records[i].time);
        }
    }
    return raw;
}

function extractTime(record) {
    if (record.result === "+2") {
        return record.time + 2;
    } else if (record.result === "DNF") {
        return -1;
    } else {
        return record.time;
    }
}

// Format a record, taking into account result
function formatRecord(record) {
    if (record.result === "DNF") {
        return formatTime(-1);
    } else if (record.result === "+2") {
        return formatTime(record.time + 2) + "+";
    } else {
        return formatTime(record.time);
    }
}

// Average the last 'a' records of a list
function averageLastRecords(times, a) {
    if (a > 4) {
        return averageTimes(times.slice(times.length - a));
    } else {
        return meanTimes(times.slice(times.length - a));
    }
}

// Remove DNF's (-1's) from times
function removeDNFs(times) {
    return times.filter(function(a) {return a!=-1;});
}

// Returns the max and min times, the ones removed before an average
function getMinsAndMaxs(times) {
    var t = times.slice();
    t.sort(function(a, b) {
        if (a == -1) {
            return 1;
        } else if (b == -1) {
            return -1;
        } else {
            return a - b;
        }
    });
    if (t.length < 40) {
        return [t[0],t[t.length - 1]];
    } else {
        return t.slice(0, Math.floor(t.length * 0.05)).concat(t.slice(-Math.floor(t.length * 0.05), t.length));
    }
}
