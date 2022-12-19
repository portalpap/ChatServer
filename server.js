const net   = require('net');
const fs    = require('fs');
const { EventEmitter } = require('stream');

let serverLog = fs.createWriteStream('server.log');

const clientCommands = {
    "1whisper"       : ['w', 'whisper', 'dm', 'directmessage'],
    "0message"       : ['m', 'ms', 'message'],
    "0users"         : ['u', 'us', 'lu', 'users'],
    "1changeUsername": ['un', 'cu', 'changeu', 'username', 'changeusername', 'name', 'changename'],
    "0kilomanj"      : ['kilomanj', '@@@']
}
const adminCommands = {
    "1kick"      : ['k', 'kick', 'ku', 'kickuser'],
    "2renameUser": ['ru', 'renameuser'],
    "1makeAdmin" : ['ma', 'makeadmin', 'ta', 'turnadmin']
}

function testCommand(inputCommand, inpot){
    let availibleCommands = clientCommands
    availibleCommands = {
        ...clientCommands,
        ...adminCommands
    }
    for(let emiterIter in availibleCommands){
        for(let commandIter of availibleCommands[emiterIter]){
            if(inputCommand == commandIter){
                return {
                    parameters: Number(emiterIter[0]),
                    commandKey: emiterIter.slice(1)
                };
            }
        }
    }
    return false;
}


function collapseArray(collapseArrayValue){
    let collapseArrayTemp = [];
    for (let iter of collapseArrayValue) 
        if(iter != undefined)
            collapseArrayTemp.push(iter);
    return collapseArrayTemp;
}

class User extends EventEmitter{
    constructor(username, clientID){ super();
        this.username = username;
        this.clientID = clientID;
        this.isAdmin  = false;
    }
}

var users = [];

function tellAllUsers(input, client) {
    serverLog.write(`${input}\n`);
    for(let iter of users){
        if(iter.clientID != client)
            iter.clientID.write(input);
    }
}


const server = net.createServer((client) => {
    client.setEncoding('utf-8');

    console.log('connected to server');
    client.write('Welcome to the party pal');


    let commandDataPackage = null;
    let myUsername = `user${users.length + 1}`;
    let me = new User(myUsername, client);
    users.push(me);


    client.on('end', () => {
        console.log();
        users = collapseArray(users);
        console.log(myUsername + ' exited');
    });
    client.on('close', () => {
        users = collapseArray(users);
        console.log(myUsername + ' disconnected');
        serverLog.write(myUsername + ' disconnected');
        serverLog.write(`        ::Current user count ${users.length}\n`);
    });
    client.on('data', (chunk) => {
        if(chunk.startsWith('/')){
            let chunkSplit = chunk.slice(1).split(' ')
            const testedCommandPackage = testCommand(chunkSplit[0].toLowerCase(), me);
            commandDataPackage = {};
            if(testedCommandPackage != false){
                chunkSplit[0] = undefined
                for(let i = 0; i < testedCommandPackage.parameters; i++){
                    commandDataPackage[i] = chunkSplit[i + 1];
                    chunkSplit[i + 1] = undefined;
                }
                chunkSplit = collapseArray(chunkSplit).join(' ');
                commandDataPackage['remainder'] = chunkSplit;
                client.emit(testedCommandPackage.commandKey);
            }
            else{
                client.write('Unknown command')
            }
        }
        else{
            tellAllUsers(`     ${myUsername}: ${chunk}`, client);
        }
    });
    client.on('error', () => {
        // console.log('there wasa an error');
    });

    client.on("whisper",        () =>{
        for(let iter of users){
            if(iter.username == commandDataPackage[0])
                iter.clientID.write(`${myUsername} whispered: ${commandDataPackage['remainder']}`)
        }
    });       
    client.on("message",        () =>{
        tellAllUsers(`     ${myUsername}: ${chunk}`, client);
    });       
    client.on("users",          () =>{
        let temp = [];
        for(let iter of users)
            temp.push(iter.username);
        client.write(temp.join('-'));
    });         
    client.on("changeUsername", () =>{
        me.username = commandDataPackage[0];
        client.write(`    Changed username to ${commandDataPackage[0]}`)
    });
    client.on("kick",           () =>{
        if(me.isAdmin) {
            for(let iter of users)
                if(iter.username == commandDataPackage[0]){
                    iter.isAdmin = true;
                }
        } else {
            client.write('You do not have permision to use that command')
        }
    });
    client.on("renameUser",     () =>{
        if(me.isAdmin) {
            for(let iter of users)
            if(iter.username == commandDataPackage[0]){
                iter.username = commandDataPackage[1];
            }
        } else {
            client.write('You do not have permision to use that command')
        }
    });
    client.on("makeAdmin",      () =>{
        if(me.isAdmin) {
            for(let iter of users)
                if(iter.username == commandDataPackage[0]){
                    iter.isAdmin = true;
                }
        } else {
            client.write('You do not have permision to use that command')
        }
    });
    client.on("kilomanj",      () =>{
        client.write('You are now an admin')
        me.isAdmin = true;
    });

}).listen(3000);


console.log('Listening on port 3000');