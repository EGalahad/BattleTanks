import * as THREE from "three";
import { MovableObject } from "../BaseObject.js";
import { Wall } from "./Wall.js";
import { Bullet } from "./Bullet.js";
import { Scene } from "../../system/Scene.js";
import { checkCollisionTankWithTank, checkCollisionTankWithWall } from "../../utils/collision.js";
import { PBar } from "../../utils/PBar.js";

class Tank extends MovableObject {
  mesh: THREE.Group;
  bboxParameter = { width: 30, height: 50, depth: 30, };
  // movement attributes
  proceedSpeed: number = 100;
  rotationSpeed: number = 1;

  // state attributes
  health: number = 100;
  attack: number = 10;
  defense: number = 0;
  bulletUpgraded: boolean = false;
  penetrationUpgraded: boolean = false;
  penetrationPermitted: boolean = false;

  // bullet configuration
  bulletLocalPos: THREE.Vector3 = new THREE.Vector3(0, 40, 20);
  bulletLocalDir: THREE.Vector3 = new THREE.Vector3(0, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
  bulletSpeed: number = 150;

  // key bindings
  proceedUpKey: string = "ArrowUp";
  proceedDownKey: string = "ArrowDown";
  rotateLeftKey: string = "ArrowLeft";
  rotateRightKey: string = "ArrowRight";
  firingKey: string = "Enter";

  // keyboard control variables
  proceed: number = 0;
  rotate: number = 0;
  lastFireTime: number = 0;
  firingKeyPressed: boolean = false;

  // other assets
  bullet_mesh: THREE.Group;
  listeners: THREE.AudioListener[];
  audio: AudioBuffer;

  originalColor: any;

  healthBarFillElement: HTMLElement;
  healthBarValueElement: HTMLElement;

  // poweup is responsible for creating powerup pbar elements and hooks
  // tank tick is responsible for checking if the powerup is expired and remove it
  powerupsContainerElement: HTMLElement;
  powerups: { [key: string]: PBar } = {};
  powerupPostHooks: { [key: string]: (tank: Tank) => void } = {};

  constructor(name: string, tank_mesh: THREE.Group | null,
    bullet_mesh: THREE.Group | null, listeners: THREE.AudioListener[] | null, audio: any | null, config: Partial<Tank> = {}) {
    super("tank", name);
    Object.assign(this, config);

    this.mesh = new THREE.Group();
    if (tank_mesh != null) {
      this.mesh.add(tank_mesh.clone());
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material)
          this.originalColor = child.material.color.clone();
      });
      this.mesh.children[0].scale.set(15, 15, 15);
      this.mesh.children[0].rotation.x = Math.PI / 2;
      this.mesh.children[0].rotation.y = Math.PI;

      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.mesh.position.z = 0;
    }

    if (name == "player2") {
      this.mesh.translateX(40);
    }

    if (listeners != null) {
      this.listeners = listeners;
    }
    if (audio != null) {
      this.audio = audio;
    }

    if (bullet_mesh != null) {
      this.bullet_mesh = bullet_mesh.clone();
    }
  }

  post_init(container_sub: HTMLElement) {
    this.healthBarFillElement = container_sub.getElementsByClassName("health__bar__fill")[0] as HTMLElement;
    this.healthBarValueElement = container_sub.getElementsByClassName("health__value")[0] as HTMLElement;
    // this.weaponBarFillElement = container_sub.getElementsByClassName("weapon__bar__fill")[0] as HTMLElement;
    // this.weaponBarValueElement = container_sub.getElementsByClassName("weapon__value")[0] as HTMLElement;
    this.powerupsContainerElement = container_sub.getElementsByClassName("powerups")[0] as HTMLElement;
  }

  _updateSpeed(keyboard: { [key: string]: number }, delta: number) {
    this.proceed = ((keyboard[this.proceedUpKey] || 0) - (keyboard[this.proceedDownKey] || 0)) * delta;
    this.rotate = ((keyboard[this.rotateLeftKey] || 0) - (keyboard[this.rotateRightKey] || 0)) * delta;
  }

  _updatePosition(walls: Wall[], tanks: Tank[]) {
    const tank_object_tmp = new Tank("temp", null, null, null, null);
    tank_object_tmp.mesh.applyMatrix4(this.mesh.matrix);
    tank_object_tmp.mesh.translateY(this.proceed * this.proceedSpeed);
    tank_object_tmp.mesh.rotateZ(this.rotate * this.rotationSpeed);
    tank_object_tmp.mesh.updateMatrix();

    if (this.penetrationUpgraded) {
      this.mesh.translateY(this.proceed * this.proceedSpeed);
      this.mesh.rotateZ(this.rotate * this.rotationSpeed);
      return
    }

    const not_collided = (!tanks.some((tank) => (tank.name !== this.name
      && checkCollisionTankWithTank(tank_object_tmp, tank)))
      && !walls.some((wall) => checkCollisionTankWithWall(tank_object_tmp, wall)));
    
    if (this.penetrationPermitted || not_collided) {
      this.mesh.translateY(this.proceed * this.proceedSpeed);
      this.mesh.rotateZ(this.rotate * this.rotationSpeed);

      this.penetrationPermitted = !not_collided;
    }
  }

  _getBulletInitState() {
    // compute the initial position and direction of the bullet
    let localPos = this.bulletLocalPos.clone();
    let localDir = this.bulletLocalDir.clone();
    localPos.applyMatrix4(this.mesh.matrixWorld);
    localDir.applyEuler(this.mesh.rotation);
    return {
      pos: localPos,
      vel: localDir.multiplyScalar(this.bulletSpeed),
    }
  }

  _createBullets(keyboard: { [key: string]: number }, bullets: Bullet[], scene: Scene) {
    // check keyboard, if space is pressed, create a bullet and add it to the scene
    if (keyboard[this.firingKey]) {
      const now = Date.now();
      if (!this.firingKeyPressed && now - this.lastFireTime > 100) {
        const { pos, vel } = this._getBulletInitState();
        if (!this.bulletUpgraded) {
          const bullet = new Bullet("main", pos, vel, this.attack, this.bullet_mesh,
            this.mesh.rotation, this.listeners, this.audio);
          bullets.push(bullet);
          scene.add(bullet);
        } else {
          // TODO: make it more standard
          let vel2 = new THREE.Vector3(-0.2, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)).
            applyEuler(this.mesh.rotation).multiplyScalar(this.bulletSpeed);
          let vel3 = new THREE.Vector3(0.2, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)).
            applyEuler(this.mesh.rotation).multiplyScalar(this.bulletSpeed);
          const bullet1 = new Bullet("main", pos, vel, this.attack, this.bullet_mesh,
            this.mesh.rotation, this.listeners, this.audio);
          const bullet2 = new Bullet("main", pos, vel2, this.attack, this.bullet_mesh,
            new THREE.Euler(this.mesh.rotation.x, this.mesh.rotation.y, this.mesh.rotation.z + Math.PI / 6),
            this.listeners, this.audio);
          const bullet3 = new Bullet("main", pos, vel3, this.attack, this.bullet_mesh,
            new THREE.Euler(this.mesh.rotation.x, this.mesh.rotation.y, this.mesh.rotation.z - Math.PI / 6),
            this.listeners, this.audio);
          bullets.push(bullet1, bullet2, bullet3);
          scene.add(bullet1);
          scene.add(bullet2);
          scene.add(bullet3);
        }

        this.firingKeyPressed = true;
        this.lastFireTime = now;
      }
    } else {
      this.firingKeyPressed = false;
    }
  }

  update(
    keyboard: { [key: string]: number },
    scene: Scene,
    tanks: Tank[],
    walls: Wall[],
    bullets: Bullet[],
    delta: number
  ) {
    this._updateSpeed(keyboard, delta);
    this._updatePosition(walls, tanks);
    this._createBullets(keyboard, bullets, scene);
  }

  GetAttacked(attack: number) {
    this.health -= attack * (1 - this.defense);

    this.mesh.children[0].traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.color.set(0xff0000);

        // Change the color back after 1 second
        setTimeout(() => {
          child.material.color.copy(this.originalColor);
        }, 1000);
        return;
      }
    });
  }

  static onTick(tank: Tank, delta: number) { };

  tick(delta: number): void {
    if (!this.mesh) {
      return;
    }
    this._updateHealthAndPowerups(delta);
    Tank.onTick(this, delta);
  }

  addPowerup(type: string, timeout: number, priorHook: (tank: Tank) => void, postHook: (tank: Tank) => void) {
    if (timeout <= 0) return;
    if (this.powerups[type] === undefined) {
      this.powerups[type] = new PBar(this.powerupsContainerElement, "powerup", type, timeout);
      priorHook(this);
      this.powerupPostHooks[type] = postHook;
    } else {
      this.powerups[type].update(timeout);
    }
  }

  _updateHealthAndPowerups(delta: number) {
    this.healthBarFillElement.style.width = `${this.health}%`;
    this.healthBarValueElement.innerText = `${(this.health).toFixed(0)}`;

    for (const key in this.powerups) {
      let timeout = this.powerups[key].timeout - delta * 1000;
      this.powerups[key].update(timeout);
      if (timeout < 0) {
        delete this.powerups[key];
        this.powerupPostHooks[key](this);
        delete this.powerupPostHooks[key];
      }
    }
  }
}

export { Tank };
