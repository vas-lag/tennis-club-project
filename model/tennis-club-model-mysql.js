'use strict';

const bcrypt = require('bcrypt');

let sql = require('./db.mysql.js');
const fs = require('fs');
const path = require('path');

exports.createAccount = function (name, surname, username, email, phone, birthdate, password) {
    let values = [username, phone, password, birthdate, email, name, surname, null];
    sql.query("INSERT INTO Users VALUES (?)", [values], function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
        }
    });
}

exports.checkUserData = function (username, next) {
    sql.query("SELECT * FROM Users WHERE username = ?", username, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            if (res[0]) {
                next(res[0]);
            }
            else {
                next(null);
            }
        }
    });
}

exports.checkForEmail = function (email, next) {
    sql.query("SELECT * FROM Users WHERE email = ?", email, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            if (res[0]) {
                next(res[0]);
            }
            else {
                next(null);
            }
        }
    });
}

exports.getUserInformation = function (username, next) {
    sql.query("SELECT * FROM Users WHERE username = ?", username, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res[0]);
        }
    });
}

exports.updateUserInformation = function (username, name, surname, phone, birthdate, next) {
    let values = [{ name: name }, { surname: surname }, { phone: phone }, { birthdate: birthdate }, username];
    sql.query("UPDATE Users SET ?, ?, ?, ? WHERE username = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.insertReservation = function (facility, date, time, surname, phone, username, next) {
    let values = [date, time, surname, phone, username, facility];
    sql.query("INSERT INTO reserves VALUES (NULL, ?, ?, ?, ?, (SELECT username FROM Users WHERE username = ?), (SELECT id FROM Facilities WHERE id = ?))", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.removeReservation = function (facility, date, time, next) {
    let values = [date, time, facility];
    sql.query("DELETE FROM reserves WHERE date = ? AND time = ? AND facilityID = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.getTime = function (date, facility, username, next) {
    let values = [date, facility];
    sql.query("SELECT time, username FROM reserves WHERE date = ? AND facilityID = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            for (let item of res) {
                if (item.username == username) {
                    item.username = 1;
                }
                else {
                    item.username = 0;
                }
            }
            next(res);
        }
    })
}

exports.getAdminTime = function (date, facility, next) {
    let values = [date, facility];
    sql.query("SELECT time, username, surname, phone FROM reserves WHERE date = ? AND facilityID = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            let userReservations = [];
            let nonuserReservations = [];
            for (let reservation of res) {
                if (reservation.username) {
                    userReservations.push(reservation);
                }
                else {
                    nonuserReservations.push(reservation);
                }
            }
            if (userReservations.length == 0) {
                next(nonuserReservations);
            }
            else {
                userReservations.forEach(function (reservation, i) {
                    exports.getUserInformation(reservation.username, function (info) {
                        reservation.name = info.name;
                        reservation.surname = info.surname;
                        reservation.phone = info.phone;
                        reservation.email = info.email;
                        if (i == userReservations.length - 1) {
                            next(res);
                        }
                    })
                })
            }
        }
    })
}

exports.checkOtherFacilities = function (date, time, username, next) {
    let values = [date, time, username];
    sql.query("SELECT * FROM reserves WHERE date = ? AND time = ? AND username = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res);
        }
    })
}

exports.getNumOfReservations = function (date, username, next) {
    let values = [date, username];
    sql.query("SELECT * FROM reserves WHERE date = ? AND username = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res);
        }
    })
}

exports.checkAdmin = function (username, next) {
    sql.query("SELECT role FROM Users WHERE username = ?", username, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            let isAdmin = res[0].role == "admin";
            next(isAdmin);
        }
    })
}

exports.saveMessage = function (name, email, message, next) {
    let values = [name, email, message];
    sql.query("INSERT INTO Messages VALUES (?)", [values], function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.getEveryMessage = function (next) {
    sql.query("SELECT * FROM Messages", function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res);
        }
    })
}

exports.saveParticipation = function (username, id, teammate, surname, phone, next) {
    let values = [null, username, null, null, null, surname, phone, id];
    if (teammate) {
        values = [null, username, teammate.name, teammate.email, teammate.phone, surname, phone, id];
    }
    sql.query("INSERT INTO participates VALUES (?)", [values], function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.checkParticipation = function (username, next) {
    sql.query("SELECT tournamentID FROM participates WHERE username = ?", username, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res);
        }
    })
}

exports.checkParticipations = function (next) {
    sql.query("SELECT * FROM participates", function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            let userParticipations = [];
            let nonuserParticipations = [];
            for (let participation of res) {
                if (participation.username) {
                    userParticipations.push(participation);
                }
                else {
                    nonuserParticipations.push(participation);
                }
            }
            if (userParticipations.length == 0) {
                next(nonuserParticipations);
            }
            else {
                userParticipations.forEach(function (participation, i) {
                    exports.getUserInformation(participation.username, function (info) {
                        participation.userName = info.name;
                        participation.userSurname = info.surname;
                        participation.userPhone = info.phone;
                        participation.userEmail = info.email;
                        if (i == userParticipations.length - 1) {
                            next(res);
                        }
                    })
                })
            }
        }
    })
}

exports.removeUserParticipation = function (username, id, next) {
    let values = [username, id];
    sql.query("DELETE FROM participates WHERE username = ? AND tournamentID = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.removeNonUserParticipation = function (surname, phone, id, next) {
    let values = [surname, phone, id];
    sql.query("DELETE FROM participates WHERE surname = ? AND phone = ? AND tournamentID = ?", values, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.removeMess = function (message, next) {
    sql.query("DELETE FROM Messages WHERE message = ?", message, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.getTournaments = function (next) {
    sql.query("SELECT * FROM Tournaments", function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next(res);
        }
    })
}

exports.addTournament = function (name, dates, type, photo, next) {
    let values = [null, name, dates, type, photo];
    sql.query("INSERT INTO Tournaments VALUES (?)", [values], function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            next();
        }
    })
}

exports.removeTournament = function (id, next) {
    sql.query("DELETE FROM participates WHERE tournamentID = ?", id, function (err, res) {
        if (err) {
            console.log("error: ", err);
        }
        else {
            sql.query("SELECT photo FROM Tournaments WHERE id = ?", id, function (err, res) {
                fs.unlink(path.join(__dirname, '../views/images/' + res[0].photo), (err) => {
                    if (err) throw err;
                    sql.query("DELETE FROM Tournaments WHERE id = ?", id, function (err, res) {
                        next();
                    })
                });
            })
        }
    })
}