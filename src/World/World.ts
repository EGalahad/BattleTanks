import * as THREE from "three";
import { Scene } from "./system/Scene";
import { ThirdPersonViewCamera } from "./system/Camera";
import { Renderer } from "./system/Renderer";

import { Ground } from "./object/impl/Ground";
import { HemiSphereLight, DirectionalLight } from "./object/impl/lights";

import { Wall } from "./object/impl/Wall";
import { Powerup, HealthPowerup, WeaponPowerup, SpeedPowerup, AttackPowerup, DefensePowerup, PenetrationPowerup, GoalPowerup } from "./object/impl/powerups";
import { Tank } from "./object/impl/Tank";
import { Bullet } from "./object/impl/Bullet";

import { Loop } from "./system/Loop";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { displayElement, fadeElement, fadeBackGround } from "./utils/ui";

class World {
    status: string;

    scene: Scene;
    ground: Ground;
    hemiLight: HemiSphereLight;
    directLight: DirectionalLight;

    walls: Wall[] = [];
    powerups: Powerup[] = [];
    tanks: Tank[] = [];
    bullets: Bullet[] = [];

    containers: HTMLElement[] = [];
    cameras: ThirdPersonViewCamera[] = [];
    renderers: Renderer[] = [];
    loop: Loop;

    meshDict: { [key: string]: THREE.Object3D } = {};
    audioDict: { [key: string]: AudioBuffer } = {};
    textureDict: { [key: string]: { [key: string]: THREE.Texture } } = {};

    listeners: THREE.AudioListener[] = [];

    // HTML elements
    sceneContainer: HTMLElement;
    menu: HTMLElement;
    replay: HTMLElement;
    instructions: HTMLElement;
    player_left_win_banner: HTMLElement;
    player_right_win_banner: HTMLElement;
    player_left_lost_banner: HTMLElement;
    player_right_lost_banner: HTMLElement;

    keyboard: { [key: string]: number } = {};

    constructor() {
        this.init();
    }

    async init() {
        this.sceneContainer = document.getElementById("scene-container") as HTMLElement;
        this.menu = document.getElementById("menu") as HTMLElement;
        this.replay = document.getElementById("replayMessage") as HTMLElement;
        this.instructions = document.getElementById("instructions") as HTMLElement;
        this.player_left_win_banner = document.getElementById("player1-win-banner") as HTMLElement;
        this.player_right_win_banner = document.getElementById("player2-win-banner") as HTMLElement;
        this.player_left_lost_banner = document.getElementById("player1-lose-banner") as HTMLElement;
        this.player_right_lost_banner = document.getElementById("player2-lose-banner") as HTMLElement;

        await this.loadAssets();

        this.scene = new Scene();

        this.ground = new Ground("main", this.textureDict["ground"]);
        this.scene.add(this.ground);

        this.hemiLight = new HemiSphereLight("main");
        this.directLight = new DirectionalLight("main");
        this.scene.add(this.hemiLight);
        this.scene.add(this.directLight);

        this.initializeTanks(this.tanks);
        this.tanks.forEach(tank => this.scene.add(tank));

        for (let i = 0; i < this.tanks.length; i++) {
            const container_sub = this.sceneContainer.getElementsByClassName("sub-container")[i] as HTMLElement;
            this.tanks[i].post_init(container_sub);
            this.containers.push(container_sub);

            // create camera and renderer
            const camera = new ThirdPersonViewCamera(this.tanks[i], window.innerWidth / window.innerHeight / this.tanks.length);
            const renderer = new Renderer();
            renderer.renderer.setSize(window.innerWidth / this.tanks.length, window.innerHeight);
            container_sub.appendChild(renderer.renderer.domElement);

            this.cameras.push(camera);
            this.renderers.push(renderer);

            // add listener to the camera
            const listener = new THREE.AudioListener();
            camera.camera.add(listener);
            this.listeners.push(listener);

        }

        // mix the two listeners

        // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // const audioDestination = audioContext.createMediaStreamDestination();
        // const audioStream = audioDestination.stream;
        // // add listeners to the audio tracks
        // this.listeners.forEach(listener => {
        //     const audioSource = listener.context.createMediaStreamSource(audioStream);
        //     audioSource.connect(listener.context.destination);
        // });

        this.listeners.forEach((listener, index) => {
            const panner = listener.context.createStereoPanner();
            panner.pan.value = index === 0 ? -1 : 1; // -1 for left, 1 for right
            panner.connect(listener.context.destination);
        });

        this.loop = new Loop(this.scene, this.cameras, this.renderers);

        this.reset();
        this.start();

        fadeBackGround(this.menu, 1, 0.7, false, 1500);
        this.status = "paused";
        this.registerEventHandlers();

        // force resize
        window.dispatchEvent(new Event("resize"));
    }

    reset() {
        this.tanks.forEach(tank => tank.reset());

        const powerups_index = this.loop.updatableLists.indexOf(this.powerups);
        if (powerups_index !== -1) this.loop.updatableLists.splice(powerups_index, 1);
        const bullet_index = this.loop.updatableLists.indexOf(this.bullets);
        if (bullet_index !== -1) this.loop.updatableLists.splice(bullet_index, 1);

        this.walls.forEach(wall => wall.destruct());
        this.powerups.forEach(powerup => powerup.destruct());
        this.bullets.forEach(bullet => bullet.destruct());

        this.walls = [];
        this.powerups = [];
        this.bullets = [];

        this.initializeWalls(this.walls);
        this.initializePowerups(this.powerups);
        this.walls.forEach(wall => this.scene.add(wall));
        this.powerups.forEach(powerup => this.scene.add(powerup));

        this.loop.updatableLists.push(this.powerups);
        this.loop.updatableLists.push(this.bullets);

        Tank.onTick = (tank: Tank, delta: number) => {
            tank.update(this.keyboard, this.scene, this.tanks, this.walls, this.bullets, delta);
        }

        Bullet.onTick = (bullet: Bullet, delta: number) => {
            bullet.update(this.ground, this.bullets, this.walls, this.tanks, delta);
        }

        Powerup.onTick = (powerup: Powerup, delta: number) => {
            powerup.update(this.powerups, this.tanks, this.walls);
        }
    }

    start() {
        const startAudio = () => {
        const bgAudio = new THREE.Audio(this.listeners[0]);
        bgAudio.setBuffer(this.audioDict["Bgm"]).setVolume(0.1).setLoop(true).play();
        document.removeEventListener('click', startAudio);
    };

        document.addEventListener('click', startAudio);
        this.loop.start();
    }

    pause() {
        const tanks_index = this.loop.updatableLists.indexOf(this.tanks);
        if (tanks_index !== -1) this.loop.updatableLists.splice(tanks_index, 1);
        const bullet_index = this.loop.updatableLists.indexOf(this.bullets);
        if (bullet_index !== -1) this.loop.updatableLists.splice(bullet_index, 1);
    }

    resume() {
        const tanks_index = this.loop.updatableLists.indexOf(this.tanks);
        if (tanks_index === -1) this.loop.updatableLists.push(this.tanks);
        const bullet_index = this.loop.updatableLists.indexOf(this.bullets);
        if (bullet_index === -1) this.loop.updatableLists.push(this.bullets);
    }

    async loadAssets() {
        let promises: Promise<any>[] = [];

        // load 3d models
        const gltfLoader = new GLTFLoader();
        function gltfPromise(path: string) {
            return new Promise<THREE.Group>(
                (resolve, reject) => {
                    gltfLoader.load(path, (gltf) => {
                        resolve(gltf.scene);
                    });
                }
            );
        }
        promises.push(gltfPromise('assets/tank_model_new/scene.gltf').then((mesh) => {
            this.meshDict["Tank"] = mesh.children[0].clone();
        }));
        promises.push(gltfPromise('assets/bullet_model/scene.gltf').then((mesh) => {
            this.meshDict["Bullet"] = mesh.children[0].children[0].children[0].children[0].children[0].clone();
        }));
        promises.push(gltfPromise('assets/powerup_model/scene.gltf').then((mesh) => {
            this.meshDict["Powerup"] = mesh.children[0].children[0].children[0].clone();
        }));

        // load audios
        const audioLoader = new THREE.AudioLoader();
        function audioPromise(path: string) {
            return new Promise<AudioBuffer>(
                (resolve, reject) => {
                    audioLoader.load(path, (buffer) => {
                        resolve(buffer);
                    });
                }
            );
        }
        promises.push(audioPromise('assets/audio/powerup.mp3').then((buffer) => {
            this.audioDict["Powerup"] = buffer;
        }));
        promises.push(audioPromise('assets/audio/bullet_hit.mp3').then((buffer) => {
            this.audioDict["Bullet_hit"] = buffer;
        }));
        promises.push(audioPromise('assets/audio/explosion.mp3').then((buffer) => {
            this.audioDict["Explosion"] = buffer;
        }));
        promises.push(audioPromise('assets/audio/bgm.mp3').then((buffer) => {
            this.audioDict["Bgm"] = buffer;
        }));

        // load textures
        const textureLoader = new THREE.TextureLoader();
        function texturePromise(path: string) {
            return new Promise<THREE.Texture>(
                (resolve, reject) => {
                    textureLoader.load(path, (texture) => {
                        resolve(texture);
                    });
                }
            );
        }
        this.textureDict["ground"] = {};
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_albedo.png').then((texture) => {
            this.textureDict["ground"]["albedo"] = texture;
        }));
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_ao.png').then((texture) => {
            this.textureDict["ground"]["ao"] = texture;
        }));
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_height.png').then((texture) => {
            this.textureDict["ground"]["height"] = texture;
        }));
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_metallic.png').then((texture) => {
            this.textureDict["ground"]["metallic"] = texture;
        }));
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_normal-ogl.png').then((texture) => {
            this.textureDict["ground"]["normal"] = texture;
        }));
        promises.push(texturePromise('assets/grassy-meadow1-bl/grassy-meadow1_roughness.png').then((texture) => {
            this.textureDict["ground"]["roughness"] = texture;
        }));


        this.textureDict["wall"] = {};
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_albedo.png').then((texture) => {
        //     this.textureDict["wall"]["albedo"] = texture;
        // }));
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_ao.png').then((texture) => {
        //     this.textureDict["wall"]["ao"] = texture;
        // }));
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_height.png').then((texture) => {
        //     this.textureDict["wall"]["height"] = texture;
        // }));
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_metallic.png').then((texture) => {
        //     this.textureDict["wall"]["metallic"] = texture;
        // }));
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_normal-ogl.png').then((texture) => {
        //     this.textureDict["wall"]["normal"] = texture;
        // }));
        // promises.push(texturePromise('assets/eroded-smoothed-rockface-bl/eroded-smoothed-rockface_roughness.png').then((texture) => {
        //     this.textureDict["wall"]["roughness"] = texture;
        // }));
        
        await Promise.all(promises);
    }

    initializeWalls(walls: any) {
        function Maze_Initialize(size: number, margin_size: number, textureDict: { [key: string]: THREE.Texture }) {
            let grid_cnt = size * size;
            let has_wall = new Array(grid_cnt);
            for (let i = 0; i < grid_cnt; i++) {
                has_wall[i] = new Array(grid_cnt).fill(false);
            }
            for (let i = 0; i < grid_cnt; i++) {
                if (i % size != 0)
                    has_wall[i][i - 1] = true;
                if (i % size != size - 1)
                    has_wall[i][i + 1] = true;
                if (i >= size)
                    has_wall[i][i - size] = true;
                if (i < grid_cnt - size)
                    has_wall[i][i + size] = true;
            }
            let visited = new Array(grid_cnt).fill(false);
            let stack = new Array();
            let cur = 0;
            visited[cur] = true;
            while (true) {
                // console.log(cur);
                let flag = false;
                let next = 0;
                let next_option = new Array();
                for (let i = 0; i < grid_cnt; i++)
                    if (has_wall[cur][i] && !visited[i]) {
                        next_option.push(i);
                    }
                if (next_option.length > 0) {
                    let rand = Math.floor(Math.random() * next_option.length);
                    next = next_option[rand];
                    flag = true;
                }
                if (!flag) {
                    if (stack.length == 0)
                        break;
                    cur = stack.pop();
                    continue;
                }
                stack.push(cur);
                visited[next] = true;
                has_wall[cur][next] = false;
                has_wall[next][cur] = false;
                cur = next;
            }
            let grid_size = margin_size / size;
            for (let i = 0; i < grid_cnt; i++)
                for (let j = i + 1; j < grid_cnt; j++)
                    if (has_wall[i][j]) {
                        let position = new THREE.Vector3(0, 0, 0);
                        let rotation = new THREE.Euler(0, 0, 0);
                        if (j == i + 1) {
                            position.x = -margin_size / 2 + grid_size * (j % size);
                            position.y = margin_size / 2 - grid_size * (Math.floor(j / size) + 0.5);
                        }
                        else if (j == i + size) {
                            position.x = -margin_size / 2 + grid_size * (j % size + 0.5);
                            position.y = margin_size / 2 - grid_size * (Math.floor(j / size))
                            rotation.z = Math.PI / 2;
                        }
                        else console.log("Error");
                        let wall = new Wall("main", textureDict, new THREE.Vector3(20, margin_size / size + 20, 50),
                            position, rotation);
                        walls.push(wall);
                        // console.log(i, j)
                    }
        }
        let margin_size = 1500;
        Maze_Initialize(8, margin_size, this.textureDict["wall"]);
        let wall1 = new Wall("main", this.textureDict["wall"], new THREE.Vector3(20, margin_size + 20, 50),
            new THREE.Vector3(margin_size / 2, 0, 0), new THREE.Euler(0, 0, 0));
        let wall2 = new Wall("main", this.textureDict["wall"], new THREE.Vector3(20, margin_size + 20, 50),
            new THREE.Vector3(-margin_size / 2, 0, 0), new THREE.Euler(0, 0, 0));
        let wall3 = new Wall("main", this.textureDict["wall"], new THREE.Vector3(20, margin_size - 200, 50),
            new THREE.Vector3(100, margin_size / 2, 0), new THREE.Euler(0, 0, Math.PI / 2));
        let wall4 = new Wall("main", this.textureDict["wall"], new THREE.Vector3(20, margin_size + 20, 50),
            new THREE.Vector3(0, -margin_size / 2, 0), new THREE.Euler(0, 0, Math.PI / 2));
        walls.push(wall1);
        walls.push(wall2);
        walls.push(wall3);
        walls.push(wall4);
    }

    initializePowerups(powerups: Powerup[]) {
        const healthPowerup = new HealthPowerup("main",
            this.meshDict["Powerup"].children[9], new THREE.Vector3(300, 50, 15),
            this.listeners, this.audioDict["Powerup"]);
        const weaponPowerup = new WeaponPowerup("main",
            this.meshDict["Powerup"].children[1], new THREE.Vector3(-300, 50, 15),
            this.listeners, this.audioDict["Powerup"]);
        const speedPowerup = new SpeedPowerup("main",
            this.meshDict["Powerup"].children[13], new THREE.Vector3(450, -450, 15),
            this.listeners, this.audioDict["Powerup"]);
        const attackPowerup = new AttackPowerup("main",
            this.meshDict["Powerup"].children[2], new THREE.Vector3(50, -100, 15),
            this.listeners, this.audioDict["Powerup"]);
        const defensePowerup = new DefensePowerup("main",
            this.meshDict["Powerup"].children[0], new THREE.Vector3(50, 50, 15),
            this.listeners, this.audioDict["Powerup"]);
        const penetrationPowerup = new PenetrationPowerup("main",
            this.meshDict["Powerup"].children[11], new THREE.Vector3(-300, -300, 15),
            this.listeners, this.audioDict["Powerup"]);
        const goalPowerup = new GoalPowerup("main",
            this.meshDict["Powerup"].children[3], new THREE.Vector3(-750, 800, 15),
            this.listeners, this.audioDict["Powerup"]);

        powerups.push(healthPowerup);
        powerups.push(weaponPowerup);
        powerups.push(speedPowerup);
        powerups.push(attackPowerup);
        powerups.push(defensePowerup);
        powerups.push(penetrationPowerup);
        powerups.push(goalPowerup);
    }

    initializeTanks(tanks: Tank[]) {
        const tank1 = new Tank("player1", this.meshDict["Tank"], this.meshDict["Bullet"], this.listeners, this.audioDict, {
            proceedUpKey: "KeyW",
            proceedDownKey: "KeyS",
            rotateLeftKey: "KeyA",
            rotateRightKey: "KeyD",
            firingKey: "Space",
        });
        const tank2 = new Tank("player2", this.meshDict["Tank"], this.meshDict["Bullet"], this.listeners, this.audioDict);
        tanks.push(tank1);
        tanks.push(tank2);
    }

    registerEventHandlers() {
        window.addEventListener("mousedown", () => {
            if (this.status == "paused") {
                fadeElement(this.menu, 1, 0, true, 500);
                fadeElement(this.replay, 1, 0, true, 500);
                fadeElement(this.instructions, 1, 0, true, 500);
                this.resume();
                this.status = "playing";
            }
            else if (this.status == "playing") {
                displayElement(this.menu, 0, 1, true, 500);
                displayElement(this.replay, 0, 1, true, 500);
                displayElement(this.instructions, 0, 1, true, 500);
                this.pause();
                this.status = "paused";
            } else if (this.status == "gameover") {
                this.status = "paused";
                fadeElement(this.menu, 1, 0, true, 500);
                fadeElement(this.replay, 1, 0, true, 500);
                fadeElement(this.instructions, 1, 0, true, 500);
                for (const element of [this.player_left_win_banner, this.player_right_win_banner, this.player_left_lost_banner, this.player_right_lost_banner]) {
                    if (element.style.display !== 'none') {
                        fadeElement(element, 1, 0, true, 500);
                    }
                }
                this.reset();
                this.resume();
                this.status = "playing";
            }
        })
        document.addEventListener("gameover", (e) => {
            if (!(e instanceof CustomEvent)) return;
            if (e.detail.winner == "player1") {
                displayElement(this.player_left_win_banner, 0, 1, true, 500);
                displayElement(this.player_right_lost_banner, 0, 1, true, 500);
            } else if (e.detail.winner == "player2") {
                displayElement(this.player_left_lost_banner, 0, 1, true, 500);
                displayElement(this.player_right_win_banner, 0, 1, true, 500);
            }
            setTimeout(() => {
                for (const element of [this.player_left_win_banner, this.player_right_win_banner, this.player_left_lost_banner, this.player_right_lost_banner]) {
                    if (element.style.display !== 'none') {
                        fadeElement(element, 1, 0, true, 1000);
                    }
                }
            }, 5000);
            this.pause();
            this.status = "gameover";
            displayElement(this.menu, 0, 1, true, 500);
            displayElement(this.replay, 0, 1, true, 500);
            displayElement(this.instructions, 0, 1, true, 500);
        })

        window.addEventListener("keydown", (event) => {
            this.keyboard[event.code] = 1;
        });
        window.addEventListener("keyup", (event) => {
            this.keyboard[event.code] = 0;
        });
        window.addEventListener("resize", () => {
            this.cameras.forEach(camera => {
                camera.camera.aspect = window.innerWidth / window.innerHeight / this.tanks.length;
                camera.camera.updateProjectionMatrix();
            });
            this.renderers.forEach(renderer => {
                renderer.renderer.setSize(window.innerWidth / this.tanks.length, window.innerHeight);
                renderer.renderer.setPixelRatio(window.devicePixelRatio);
            });
        });
    }
}

export { World };