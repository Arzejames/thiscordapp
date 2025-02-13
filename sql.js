
export const execute = async (db, sql, params = []) => {
  if (params && params.length > 0) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

import sqlite3 from 'sqlite3';

const RAILWAY_VOLUME_MOUNT_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH;

let userdb;
if (typeof RAILWAY_VOLUME_MOUNT_PATH !== 'undefined') {
  userdb = new sqlite3.Database('/data/thiscord.db');
} else {
  userdb = new sqlite3.Database('thiscord.db');
}

const makeDB = async () => {
  try {
    await execute(
      userdb,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        token TEXT NOT NULL)`
    );
    await execute(
      userdb,
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        server TEXT NOT NULL,
        channel TEXT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timeSent TEXT NOT NULL)`
    );
  } catch (error) {
    console.error('Error creating table:', error);
  }
};
makeDB();

//await execute(userdb, `ALTER TABLE users ADD token TEXT`, []);

import { createHash } from 'crypto';
const sha256Token = "thisC0rdIsTHeBestReallycoolButIamIsBadAtCodingit";

function hashUser(username) {
  return createHash('sha256').update((username + sha256Token)).digest('hex');
}

function escapeHTML(unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

//check with the checkUsername to see if username exists, then it adds username and password to DataBase
const saveData = async (username, password, socket) => {
  console.log("Trying to Save Data");
  try {
    const isValid = await checkUsername(username);
    if (isValid) {
      socket.emit('signin message', "User Already Registered.");
      console.log("User Already Registered:", username);
    } else {
      const sql = `INSERT INTO users(username, password, token) VALUES(?, ?, ?)`;
      await execute(userdb, sql, [username, password,hashUser(username)]);//Pulling a Vtech and storing the password in plaintext
      socket.emit('signin message', "Signup successful!", hashUser(username));
      console.log(`User ${username} signed up successfully`);
    }
  } catch (err) {
    console.error('Error saving user data:', err);
    socket.emit('signin message', "Error occurred during signup.");
  }
};

//Save messages when sent
const saveMessage = async (server, channel, username, message, timeSent, socket) => {
  try {
    const sql = `INSERT INTO messages(server, channel, username, message, timeSent) VALUES(?, ?, ?, ?, ?)`;
    await execute(userdb, sql, [server, channel, username, message, timeSent]);
    console.log(`User ${username} said ${message} at ${timeSent} in ${channel} on ${server}`);
  } catch (err) {
    console.error('Error saving message data:', err);
  }
};

const loadMessagesViaChannelServerName = async (server, channel, socket) => {
  return new Promise((resolve, reject) => {
    const usernamesql = `SELECT COUNT(*) FROM messages WHERE server = ? AND channel = ?;`;
    userdb.get(usernamesql, [server, channel], async (err, countResult) => {
      if (err) {
        return reject(err);
      } else {
        const count = countResult['COUNT(*)'];
        const sql = `SELECT * FROM messages WHERE server = ? AND channel = ? ORDER BY id DESC LIMIT 10;`;

        userdb.all(sql, [server, channel], (err, rows) => {
          if (err) {
            return reject(err);
          } else {
            rows.reverse().forEach(row => {
              socket.emit("loadMessage", row.username, row.server, row.channel, escapeHTML(row.message), row.timeSent, "originalLoad");
            });
            resolve();
          }
        });
      }
    });
  });
};

let loadMoreBool = false;
const loadMoreMessagesToUser = async (server, channel, amount, socket) => {
  loadMoreBool = true;
  return new Promise((resolve, reject) => {
    const usernamesql = `SELECT COUNT(*) FROM messages WHERE server = ? AND channel = ?;`;
    userdb.get(usernamesql, [server, channel], async (err, countResult) => {
      if (err) {
        return reject(err);
      } else {
        const count = countResult['COUNT(*)'];
        const sql = `SELECT * FROM messages WHERE server = ? AND channel = ? ORDER BY id DESC LIMIT ?;`;

        userdb.all(sql, [server, channel, (amount + 10)], (err, rows) => {
          if (err) {
            return reject(err);
          } else {
            rows.reverse().forEach(row => {
              if (loadMoreBool) {
                socket.emit("loadMessage", row.username, row.server, row.channel, escapeHTML(row.message), row.timeSent, "startmore");
                loadMoreBool = false;
              } else {
                socket.emit("loadMessage", row.username, row.server, row.channel, escapeHTML(row.message), row.timeSent, "more");
              }

            });
            resolve();
          }
        });
      }
    });
  });
};

//load messages
const loadMessageToUser = async (socket) => {
  return new Promise((resolve, reject) => {
    const usernamesql = `SELECT COUNT(*) FROM messages;`;
    userdb.get(usernamesql, [], async (err, countResult) => {
      if (err) {
        return reject(err);
      } else {
        const count = countResult['COUNT(*)'];
        const sql = `SELECT * FROM messages WHERE ID = ?;`;
        const startIndex = count - 9;

        for (let i = startIndex; i < count + 1; i++) {
          await new Promise((res) => {
            userdb.get(sql, [i], (err, row) => {
              if (err) {
                console.error(err);
                res();
              } else if (row) {
                socket.emit("loadMessage", row.username, row.server, row.channel, escapeHTML(row.message), row.timeSent, "nothing");
                res();
              } else {
                console.log(`No message found for ID: ${i}`);
                res();
              }
            });
          });
        }
        resolve();
      }
    });
  });
}


//print out results of the checkCred function
const checkLogin = async (username, inputPassword, socket) => {
  try {
    const isValid = await checkCred(username, inputPassword);
    if (isValid) {
      socket.emit('signin message', "Login successful!", hashUser(username));
      console.log("Login successful for user:", username,);
    } else {
      socket.emit('signin message', "Invalid username or password.");
      console.log("Invalid username or password for user:", username);
    }
  } catch (err) {
    console.error('Error during signin:', err);
    socket.emit('signin message', "Error occurred during signin.");
  }
};
//return 1 if username is correct
const checkUsername = async (username) => {
  const usernamesql = `SELECT 1 FROM users WHERE username = ?`;
  return new Promise((resolve, reject) => {
    userdb.get(usernamesql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
};

//check credantials if they are corrent or not
const checkCred = async (username, password) => {
  const usernamesql = `SELECT password FROM users WHERE username = ?`;
  return new Promise((resolve, reject) => {
    userdb.get(usernamesql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row && row.password === password);
        console.log("username and password are correct")
      }
    });
  });
}

export {saveData, checkLogin, saveMessage, loadMessageToUser, loadMessagesViaChannelServerName, loadMoreMessagesToUser };