/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** Make chat user: store connection-device, room.
   *
   * @param send {function} callback to send message to this user
   * @param room {Room} room user will be in
   * */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** Send msgs to this client using underlying connection-send-function.
   *
   * @param data {string} message to send
   * */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** Handle joining: add to room members, announce join.
   *
   * @param name {string} name to use in room
   * */

  handleJoin(name) {
    TODO: filter existing names here

    for (let m of this.room.members) {
      if (m.name === name) {
        this.reply({
          name: m.name,
          type: "dupName",
          text: "is already taken, please choose something else."
        });
        console.log('stopped dup from being added')
        break;
      }
    }

    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} joined "${this.room.name}".`,
    });
  }

  /** Handle a chat: broadcast to room.
   *
   * @param text {string} message to send
   * */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: "chat",
      text: text,
    });
  }

  /** Handle a command for joke: broadcast to user.
   *
   * @param text {string} message to send
   * */
  handleJoke() {
    this.room.reply({
      name: this.name,
      type: "joke",
      text: "What do you call a bear with no teeth? A gummy bear!"
    });
  }
  
  /** Handle a command for list of members: broadcast to user.
   *
   * @param text {string} message to send
   * */
  handleMembers() {
    let members = [...this.room.members];
    members = members.map(m => m.name);
    members = members.join(', ');
    this.room.reply({
      name: this.name,
      type: "members",
      text: `${members}`
    });
  }

  /** Handle messages from client:
   *
   * @param jsonData {string} raw message data
   *
   * @example<code>
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   * </code>
   */

  handleMessage(jsonData) {
    console.log(jsonData, "json data");
    let msg = JSON.parse(jsonData);

    if (msg.type === "join") this.handleJoin(msg.name);
    else if (msg.type === "joke") this.handleJoke();
    // else if (msg.type === "members") this.handleMembers(); 
    else if (msg.type === "chat") this.handleChat(msg.text);
    else throw new Error(`bad message: ${msg.type}`);
  }

  /** Connection was closed: leave room, announce exit to others. */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} left ${this.room.name}.`,
    });
  }
}

module.exports = ChatUser;
