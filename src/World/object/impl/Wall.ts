import { BaseObject } from "../BaseObject";
import * as THREE from "three";

class Wall extends BaseObject {
  mesh: THREE.Mesh;

  constructor(name: string, texture: { [key: string]: THREE.Texture }, size: THREE.Vector3, position: THREE.Vector3, rotation: THREE.Euler) {
    super("wall", name);
    const material = new THREE.MeshStandardMaterial();

    if (texture["albedo"] === undefined) {
      material.color.set(0x808080);
    } else {
      const albedoTexture = texture["albedo"];
      const aoTexture = texture["ao"];
      const heightTexture = texture["height"];
      const metallicTexture = texture["metallic"];
      const normalTexture = texture["normal"];
      const roughnessTexture = texture["roughness"];

      // Set the textures to your material's properties
      material.map = albedoTexture;
      material.aoMap = aoTexture;
      material.displacementMap = heightTexture;
      material.metalnessMap = metallicTexture;
      material.normalMap = normalTexture;
      material.roughnessMap = roughnessTexture;
    }

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      // new THREE.MeshLambertMaterial({ color: "grey" })
      material
    );
    this.mesh.position.copy(position);
    this.mesh.rotation.copy(rotation);
    this.mesh.receiveShadow = true;
  }

  destruct() {
    this.mesh.geometry.dispose();
    this.mesh.parent?.remove(this.mesh);
  }
}

export { Wall };
