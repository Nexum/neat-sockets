"use strict";

// @IMPORTS
var Application = require("neat-base").Application;
var Module = require("neat-base").Module;
var socketIo = require("socket.io");
var Promise = require("bluebird");

module.exports = class Sockets extends Module {

    static defaultConfig() {
        return {
            webserverName: "webserver"
        }
    }

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Starting...");
            this.io = socketIo(Application.modules[this.config.webserverName].httpServer);
            resolve(this);
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.log.debug("Stopping...");
            resolve(this);
        });
    }

}