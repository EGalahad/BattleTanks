import * as THREE from "three";


const gravity = new THREE.Vector3(0, 0, -100);

class TankConfig {
  // geometry
  readonly bboxParameter = {
    width: 30,
    height: 50,
    depth: 20
  };
  readonly color: string | number = "purple";

  // movement
  readonly proceedSpeed: number = 100;
  readonly rotationSpeed: number = 1;
  // tank attributes
  readonly health: number = 100;
  readonly attack: number = 10;
  readonly defense: number = 10;
  // bullet config
  readonly bulletLocalPos: THREE.Vector3 = new THREE.Vector3(0, 40, 20);
  readonly bulletLocalDir: THREE.Vector3 = new THREE.Vector3(0, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
  readonly bulletSpeed: number = 150;
  // key bindings
  readonly proceedUpKey: string = "ArrowUp";
  readonly proceedDownKey: string = "ArrowDown";
  readonly rotateLeftKey: string = "ArrowLeft";
  readonly rotateRightKey: string = "ArrowRight";
  readonly firingKey: string = "Space";

  constructor(options: Partial<TankConfig> = {}) {
    Object.assign(this, options);
  }
}


export { gravity, TankConfig }