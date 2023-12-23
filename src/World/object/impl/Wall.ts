import { BaseObject } from "../BaseObject";
import * as THREE from "three";

class Wall extends BaseObject {
  mesh: THREE.Mesh;

  constructor(name: string, size: any, position: any, rotation: any){
    super("wall", name);
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshLambertMaterial({ color: "grey" })
    );
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    this.mesh.receiveShadow = true;
  }

  destruct() {
    this.mesh.geometry.dispose();
    this.mesh.parent?.remove(this.mesh);
  }
}

export { Wall };
