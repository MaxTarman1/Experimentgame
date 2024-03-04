const express = require('express');
const { createServer} = require("http");
const {Server} = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const loadMap=require('./mapLoader');
const SPEED = 5;
const SNOWBALL_SPEED= 10;
const TICK_RATE = 30;
const PLAYER_SIZE = 16;
let snowballs = [];
let players = [];
const inputsMap ={};
function tick(delta){
    for (const player of players){
        const inputs  = inputsMap[player.id];
        if (inputs.up){
            player.y-=SPEED;
        }else if(inputs.down){
            player.y+=SPEED;
        }else if(inputs.right){
            player.x+=SPEED;
        }else if(inputs.left){
            player.x-=SPEED;
        }

    }
    for (const snowball of snowballs){
        snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
        snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
        snowball.timeLeft -= delta;
        for (const player of players) {
            if (player.id === snowball.playerId) continue;
            const distance = Math.sqrt((player.x+PLAYER_SIZE/2-snowball.x)**2+(player.y+PLAYER_SIZE/2-snowball.y)**2);
            if(distance<=PLAYER_SIZE/2){
                player.x=0;
                player.y=0;
                snowball.timeLeft=-1;
                break;
            }
        }
    }

    snowballs = snowballs.filter((snowball)=> snowball.timeLeft > 0);
    io.emit("players",players);
    io.emit("snowballs",snowballs);
}
async function main(){
    
    const {ground2D,decals2D} = await loadMap();
    io.on("connect", (socket) => {
        console.log("user connected",socket.id);
        inputsMap[socket.id] = {
            'up':false,
            'down':false,
            'left':false,
            'right':false
        };
        players.push({
            id: socket.id,
            x:800,
            y:800
        });
        socket.emit('map', {ground : ground2D,
        decals: decals2D})
        socket.on('inputs',(inputs)=>{
            inputsMap[socket.id]=inputs;
        });
        socket.on('snowball',(angle)=>{
            const player = players.find(player=> player.id === socket.id);
            snowballs.push({
                angle,
                x: player.x,
                y:player.y,
                timeLeft :1700,
                playerId: socket.id
            });
        });
        socket.on('disconnect', () =>{
            players = players.filter((player) => player.id !== socket.id);
        });
    });
    app.use(express.static("public"));

    httpServer.listen(5000);
    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate; 
        tick(delta);
        lastUpdate = now;
    }, 1000/TICK_RATE);
}
main();