"use strict";

// @IMPORTS
const Application = require("neat-base").Application;
const Module = require("neat-base").Module;
const socketIo = require("socket.io");
const socketRedis = require("socket.io-redis");
const sharedsession = require("express-socket.io-session");
const Promise = require("bluebird");
const redis = require('redis');
const apeStatus = require('ape-status');

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
                this.config.store.retry_strategy = function (options) {
                    self.log.debug("Reconnecting to session redis in 1 second");
                    return 1000;
                };

                if (this.config.store.password) {
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

                    this.socketRedis = socketRedis({
                        pubClient: pub,
                        subClient: sub
                    });
                    this.io.adapter(this.socketRedis);
                } else {
                    delete this.config.store.password; // just to make sure its not null or anything
                    this.socketRedis = socketRedis(this.config.store);
                    this.io.adapter(this.socketRedis);
                }

                apeStatus.redis(this.socketRedis.pubClient, "session-pub");
                apeStatus.redis(this.socketRedis.subClient, "session-sub");
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