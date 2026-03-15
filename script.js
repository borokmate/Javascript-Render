const FOREGROUND = "#4a914a";
const BACKGROUND = "#555555"
console.log(game);
game.width = 800;
game.height = 800;
const far = 100;
const near = 0.01;
const player_height = 0.5
const ctx = game.getContext("2d");
function clear() {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, game.width, game.height);
}

function point({ x, y }) {
    ctx.fillStyle = FOREGROUND;
    const size = 20;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

// -1..0 -> 0..width/height
function to_screen(p) {
    if (p == null) return null;
    return {
        x: (p.x + 1) / 2 * game.width,
        y: (1 - (p.y + 1) / 2) * game.height,
    }
}

function to_normal({x, y, z}){
    return{
        x: x / game.width - 1,
        y: y / game.height - 1,
        z: z / far - 1,
    }
}

function project({ x, y, z }) {
    if (z <= near) return null;
    return {
        x: x / z,
        y: y / z,
    }
}

const vs = [
    { x: 0.25, y: 0.25, z: 0.25 },
    { x: -0.25, y: 0.25, z: 0.25 },
    { x: -0.25, y: -0.25, z: 0.25 },
    { x: 0.25, y: -0.25, z: 0.25 },

    { x: 0.25, y: 0.25, z: -0.25 },
    { x: -0.25, y: 0.25, z: -0.25 },
    { x: -0.25, y: -0.25, z: -0.25 },
    { x: 0.25, y: -0.25, z: -0.25 },
]

const ns = [
    {x:  0, y:  0, z:  1}, // front
    {x:  0, y:  0, z: -1}, // back
    {x:  1, y:  0, z:  0}, // right
    {x: -1, y:  0, z:  0}, // left
    {x:  0, y:  1, z:  0}, // top
    {x:  0, y: -1, z:  0}, // bottom
];

const fs = [
    [0, 1, 2, 3], // front
    [4, 5, 6, 7], // back
    [0, 3, 7, 4], // right
    [1, 2, 6, 5], // left
    [0, 1, 5, 4], // top
    [3, 2, 6, 7], // bottom
];

function translate_z({ x, y, z }, dz) {
    return { x, y, z: z + dz };
}

function translate({ x, y, z }, dx, dy, dz) {
    return { x: x + dx, y: y + dy, z: z + dz };
}

function rotate_xz({ x, y, z }, angle) {
    const cs = Math.cos(angle);
    const si = Math.sin(angle);
    return {
        x: x * cs - z * si,
        y,
        z: x * si + z * cs,
    }
}

function rotate_yz({x, y, z}, angle){
    const cs = Math.cos(angle);
    const si = Math.sin(angle);
    return {
        x,
        y: y * cs - z * si,
        z: y * si + z * cs,
    };
}

function line(p1, p2) {
    if (p1 == null || p2 == null) return;
    ctx.strokeStyle = FOREGROUND;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

const FPS = 320;
let dz = 1;
let angle = 0

let playerX = 0;
let playerY = 0;
let playerZ = 2;
let player_speed = 5;
let player_yaw = Math.PI;
let player_pitch = 0;
let player_sens = 0.002;
let keyW = false;
let keyA = false;
let keyS = false;
let keyD = false;
let keyLeft = false;
let keyRight = false;
let upKey = false;
let downKey = false;
let shift = false;
let ctrl = false;
let space = false;
window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);

function keyDown(event) {
    let keyCode = event.keyCode;
    switch (keyCode) {
        case 68: //d
            keyD = true;
            break;
        case 83: //s
            keyS = true;
            break;
        case 65: //a
            keyA = true;
            break;
        case 87: //w
            keyW = true;
            break;
        case 39: //right
            keyRight = true;
            break;
        case 37: //left
            keyLeft = true;
            break;
        case 40: //down
            downKey = true;
            break;  
        case 38: //up
            upKey = true;
            break;
        case 17: //ctrl
            ctrl = true;
            break;
        case 16: //shift
            shift = true;
            break;
        case 32: //space
            space = true;
            break;
    }
}

game.addEventListener("click", () => {
    game.requestPointerLock();
});

document.addEventListener("mousemove", onMouseMove);

function onMouseMove(event){
    if (document.pointerLockElement !== game) return;
    const dx = event.movementX;
    const dy = event.movementY;
    
    player_yaw -= dx * player_sens;
    player_pitch -= dy * player_sens;
}

function keyUp(event) {
    var keyCode = event.keyCode;
    switch (keyCode) {
        case 68: //d
            keyD = false;
            break;
        case 83: //s
            keyS = false;
            break;
        case 65: //a
            keyA = false;
            break;
        case 87: //w
            keyW = false;
            break;
        case 39: //right
            keyRight = false;
            break;
        case 37: //left
            keyLeft = false;
            break;
        case 40: //down
            downKey = false;
            break;  
        case 38: //up
            upKey = false;
            break;
        case 17: //ctrl
            ctrl = false;
            break;
        case 16: //shift
            shift = false;
            break;
        case 32: //space
            space = false;
            break;
    }
}

function dot(a, b){
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b){
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

function sub(a, b){
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
    };
}

function handle_movement(dt){
    const move = player_speed * dt;
    const turn = player_sens * (Math.PI / 180) * dt;

    const forward = rotate_xz({x: 0, y: 0, z: 1}, player_yaw);
    const right   = rotate_xz({x: 1, y: 0, z: 0}, player_yaw);

    if (keyW){
        playerX += forward.x * move;
        playerZ += forward.z * move;
    }
    if (keyS){
        playerX -= forward.x * move;
        playerZ -= forward.z * move;
    }
    if (keyA){
        playerX -= right.x * move;
        playerZ -= right.z * move;
    }
    if (keyD){
        playerX += right.x * move;
        playerZ += right.z * move;
    }
    if (space){
        playerY += move;
    }
    if (shift){
        playerY -= move;
    }

    // if (keyLeft)  player_yaw   += turn;
    // if (keyRight) player_yaw   -= turn;
    // if (upKey)    player_pitch += turn;
    // if (downKey)  player_pitch -= turn;
}

function world_to_camera(p, cube, row){
    return rotate_yz(rotate_xz(translate(rotate_xz(p, angle), -playerX - 0.5 * cube, -playerY - player_height, -playerZ - 0.5 * row), -player_yaw), player_pitch);
}

function draw_faces(vertices, faces, normals){
    for (let fi = 0; fi < faces.length; fi++){
        const f = faces[fi];
        const n = normals[fi];

        const camVerts = f.map(i => world_to_camera(vertices[i], 0, 0));
        if (camVerts.some(v => v.z <= 0)) continue;

        const camNormal = rotate_yz(rotate_xz(n, -player_yaw + angle), player_pitch);

        if (dot(camNormal, camVerts[0]) >= 0) continue;

        for (let i = 0; i < f.length; i++){
            const a = camVerts[i];
            const b = camVerts[(i + 1) % f.length];

            line(
                to_screen(project(a)),
                to_screen(project(b))
            );
        }
    }
}

function frame() {
    const dt = 1 / FPS;
    dz += 1 * dt;
    angle += 5 * dt;
    clear();
    handle_movement(dt);
    draw_faces(vs, fs, ns)

    setTimeout(frame, 1000 / FPS);
}

setTimeout(frame, 1000 / FPS);