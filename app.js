const app = require("express")();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors')
// let wrtc = require('electron-webrtc')({ headless: true });
let wrtc = require('wrtc');
const unifi = require('node-unifiapi')

app.use(cors())

http.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

//Whenever someone connects this gets executed
io.of('/pty').on('connect', function (socket) {
    console.log('A user connected');

    let UniFi = new unifi({
        baseUrl: "https://103.107.183.58:8443",
        username: "trisdv",
        password: "123456",
        site: "default",
        debug: true,
        debugNet: true
    })

    let ssh = UniFi.connectSSH(
        "74:ac:b9:96:cd:65",
        "",
        "",
        "",
        "",
        "",
        "default",
        86400,
        wrtc
    );

    console.log('Trying to connect to', "74:ac:b9:96:cd:65", '...');

    let sshData = null;

    let write = setInterval(() => {
        socket.emit("pty-output", {"output": sshData ? sshData.recv() : ''});
    }, 30);

    let readableSSH = (data) => {
        let chunk = data['input'];
        if (chunk != null && sshData) sshData.send(chunk);
        socket.emit("pty-output", {"output": sshData ? sshData.recv() : ''});
    };

    let closeSSH = () => {
        console.log('INPUT closed. Closing session');
        sshData && sshData.close().catch(err => {
            console.log('ERROR', err);
        })
    };

    socket.emit("pty-output", {"output": "Device AP-VCB-TX: Connecting"})

    ssh.connect(100000, closeSSH)
        .then((data) => {
            console.log('Connection is Open!');
            socket.emit("pty-output", {"output": " Device AP-VCB-TX: Connected"})
            sshData = data;
            socket.emit("pty-output", {"output": data.recv()})
        })
        .catch(err => {
            console.log('ERROR', err);
            socket.emit("pty-output", {"output": " Device AP-VCB-TX: Connect error"})
            socket.disconnect(true)
        })

    socket.on('pty-input', function (data) {
        readableSSH(data)
    });

    socket.on('resize', function () {
        console.log('Resizing windows');
    });

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('A user disconnected');
        closeSSH()
    });
});
