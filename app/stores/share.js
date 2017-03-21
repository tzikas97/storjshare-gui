/**
 * @module storjshare/store
 */

'use strict';
const fs = require('fs');
const path = require('path');
const {homedir} = require('os');
const prettyms = require('pretty-ms');
const storjshare = require('storjshare-daemon');
const storj = require('storj-lib');
const mkdirPSync = require('../lib/mkdirpsync');

const rpc = window.daemonRpc;

class Share {
  constructor() {
    this.errors = [];
    this.actions = {};
    this.config = {};
    this.storageAvailable = 0;

/**
 * Creates a new Share
 */
    this.actions.createShareConfig = () => {
      let returnedPath = false;
      let configFileDescriptor;
      let storPath;
      this.config.networkPrivateKey = storj.KeyPair().getPrivateKey();
      let nodeID = storj.KeyPair(this.config.networkPrivateKey).getNodeID();
      let sharePath = path.join(
        homedir(),
        '.config/storjshare/shares'
      );

      if(this.config.storagePath === undefined || this.config.storagePath === '') {
        storPath = path.join(sharePath, '/', 'nodeID')
      } else {
        storPath = path.join(this.config.storagePath, '/');
      }

      this.config.storagePath = storPath;

      let logPath = path.join(
        homedir(),
        '.config/storjshare/logs'
      );

      let configPath = path.join(
        homedir(),
        '.config/storjshare/configs'
      );

      try {
        mkdirPSync(sharePath);
        mkdirPSync(logPath);
        mkdirPSync(configPath);
      } catch(err) {
        if(err.code !== 'EEXIST') {
          this.errors.push(err);
        }
      }

      this.config.loggerOutputFile = path.join(logPath, '/') + nodeID + '.log';
      configPath = path.join(configPath, '/') + nodeID + '.json';


      let configBuffer = Buffer.from(
        JSON.stringify(this.config, null, 2)
      );

      try {
        storjshare.utils.validate(this.config);
        configFileDescriptor = fs.openSync(configPath, 'w');
        fs.writeFileSync(configFileDescriptor, configBuffer);
        returnedPath = configPath;
      } catch (err) {
        this.errors.push(err);
      } finally {
        if(configFileDescriptor) {
          fs.closeSync(configFileDescriptor);
        }

        if(returnedPath) {
          this.config = {};
        }

        return returnedPath;
      }
    };

    this.actions.clearErrors = () => {
      this.errors = [];
    };

    this.actions.getFreeDiskSpace = (path, callback) => {
      storjshare.utils.getFreeSpace(path, (err, free) => {
        if(err) {
          errors.push(err);
          return callback(err);
        }
        this.storageAvailable = free;
        return callback(null, free);
      });
    };
  }
}

module.exports = Share;
