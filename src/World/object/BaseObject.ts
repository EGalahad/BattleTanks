/* The main character of the game. The tank can move around the map and shoot bullets.

Its interaction with other componenets in the scene are listed below:
1. The type of ground can affect the speed, acceleration, and turning speed of the tank.
2. It can collide with walls and other tanks, need collision detection.
3. The tank can shoot bullets that can destroy the walls and hit other tanks.
4. The tank can be hit by bullets from other tanks.
5. The tank can be collect powerups that can change its mobility and firepower, and health.
*/
import * as THREE from "three";
import { disposeMeshes } from "../utils/mesh";

abstract class BaseObject {
  type: string;
  name: string;
  mesh: THREE.Object3D;

  constructor(type: string, name: string) {
    this.type = type;
    this.name = name;
  }

  destruct() {
    this.mesh.parent?.remove(this.mesh);
    disposeMeshes(this.mesh);
  }
}

abstract class MovableObject extends BaseObject {
  constructor(type: string, name: string) {
    super(type, name);
  }

  abstract tick(delta: number): void;
}

export { BaseObject, MovableObject };
