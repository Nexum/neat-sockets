"use strict";

// @IMPORTS
var Application = require("neat-base").Application;
var Module = require("neat-base").Module;
var socketIo = require("socket.io");
var sharedsession = require("express-socket.io-session");
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
            this.io = socketIo();
            resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Starting...");

            this.io.on("connection", (socket) => {
                this.log.debug("Websocket :: Connected");
                socket.on('disconnect', function () {
                    console.log('Websocket :: Disconnected');
                });
            });

            this.io.use(sharedsession(
                Application.modules[this.config.webserverName].sessionMiddleware,
                {
                    autoSave: true
                }
            ));
            this.io.listen(Application.modules[this.config.webserverName].httpServer);

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