const app = require("express")();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors')
// let wrtc = require('electron-webrtc')({ headless: true });
let wrtc = require('wrtc');
const unifi = require('./node-unifiapi')

app.use(cors())

http.listen(5001, "0.0.0.0", () => {
    console.log("Application started and Listening on port 5001");
});

app.get("/cli", (req, res) => {
    let mac_address = req.query.mac_address
    res.sendFile(__dirname + "/index.html");

    //Whenever someone connects this gets executed
    io.of('/pty').on('connect', function (socket) {
        console.log('A user connected');

        let UniFi = new unifi({
            baseUrl: "test
            username: "test",
            password: "test",
            site: "default",
            debug: false,
            debugNet: false
        })

        let ssh = UniFi.connectSSH(
            mac_address,
            "",
            "",
            "",
            "",
            "",
            "default",
            86400,
            wrtc
        );

        console.log('Trying to connect to', mac_address, '...');

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
});

app.get("/ping", (req, res) => {
    let ip = req.query.ip
    let mac_address = req.query.mac_address
    res.sendFile(__dirname + "/index.html");

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
            mac_address,
            "",
            "",
            "",
            "",
            "",
            "default",
            86400,
            wrtc
        );

        console.log('Trying to connect to', mac_address, '...');

        let sshData = null;

        let write = setInterval(() => {
            socket.emit("pty-output", {"output": sshData ? sshData.recv() : ''});
        }, 30);

        let readableSSH = (data) => {
            let chunk = data['input'];
            if (chunk != null && sshData) sshData.send(chunk);
            if (sshData) {
                let res = {}
                let data = sshData.recv().split(" ")
            }
            socket.emit("pty-output", {"output": sshData ? sshData.recv().split(" ") : ''});
        };

        let closeSSH = () => {
            console.log('INPUT closed. Closing session');
            sshData && sshData.close().catch(err => {
                console.log('ERROR', err);
            })
        };

        ssh.connect(100000, closeSSH)
            .then((data) => {
                console.log('Connection is Open!');
                sshData = data;
                readableSSH({"input": `ping ${ip}\n`})
            })
            .catch(err => {
                console.log('ERROR', err);
                socket.disconnect(true)
            })

        // socket.on('pty-input', function (data) {
        //     readableSSH(data)
        // });

        socket.on('resize', function () {
            console.log('Resizing windows');
        });

        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
            console.log('A user disconnected');
            closeSSH()
        });
    });
});


