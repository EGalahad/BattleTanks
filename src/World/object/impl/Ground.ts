import { BaseObject } from "../BaseObject";
import * as THREE from "three";

class Ground extends BaseObject {
  mesh: THREE.Mesh;
  planeSize: number;
  constructor(name: string, textures: { [key: string]: THREE.Texture}) {
    super("ground", name);
    function repeat_texture(
      texture: THREE.Texture,
      num_S: number,
      num_T: number
    ) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(num_S, num_T);
    }

    const albedoTexture = textures["albedo"];
    const aoTexture = textures["ao"];
    const heightTexture = textures["height"];
    const metallicTexture = textures["metallic"];
    const normalTexture = textures["normal"];
    const roughnessTexture = textures["roughness"];

    repeat_texture(albedoTexture, 10, 10);
    repeat_texture(aoTexture, 10, 10);
    repeat_texture(heightTexture, 10, 10);
    repeat_texture(metallicTexture, 10, 10);
    repeat_texture(normalTexture, 10, 10);
    repeat_texture(roughnessTexture, 10, 10);

    // Set the textures to your material's properties
    const planeMaterial = new THREE.MeshStandardMaterial();
    planeMaterial.map = albedoTexture;
    planeMaterial.aoMap = aoTexture;
    planeMaterial.displacementMap = heightTexture;
    planeMaterial.metalnessMap = metallicTexture;
    planeMaterial.normalMap = normalTexture;
    planeMaterial.roughnessMap = roughnessTexture;

    // Optionally, you can set other texture-related properties
    planeMaterial.displacementScale = 10; // Adjust this value to control the displacement scale
    planeMaterial.normalScale.set(3, 3); // Adjust this value to control the normal map scale

    this.planeSize = 5000;
    const planeGeometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize);

    // Add your material to a mesh and add it to the scene
    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);

    this.mesh = mesh;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
  }

  inBoundary(pos: THREE.Vector3): boolean {
    return (
      pos.x <= this.mesh.position.x + this.planeSize / 2 &&
      pos.x >= this.mesh.position.x - this.planeSize / 2 &&
      pos.y <= this.mesh.position.y + this.planeSize / 2 &&
      pos.y >= this.mesh.position.y - this.planeSize / 2
    );
  }
}

export { Ground };
