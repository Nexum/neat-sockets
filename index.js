"use strict";

// @IMPORTS
const Application = require("neat-base").Application;
const Module = require("neat-base").Module;
const socketIo = require("socket.io");
const socketRedis = require("socket.io-redis");
const sharedsession = require("express-socket.io-session");
const Promise = require("bluebird");
const redis = require('redis');

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
            let self = this;

            if (this.config.store) {

                if (this.config.store.password) {
                    this.config.store.retry_strategy = function (options) {
                        self.log.debug("Reconnecting to session redis in 1 second");
                        return 1000;
                    };

                    let pub = redis.createClient(this.config.store);
                    let sub = redis.createClient(this.config.store);


                    pub.on('error', function (err) {
                        self.log.error("ERROR in socket redis");
                        self.log.error(err);
                    });
                    sub.on('error', function (err) {
                        self.log.error("ERROR in socket redis");
                        self.log.error(err);
                    });

                    this.io.adapter(socketRedis({
                        pubClient: pub,
                        subClient: sub
                    }));
                } else {
                    this.io.adapter(socketRedis(this.config.store));
                }
            }
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