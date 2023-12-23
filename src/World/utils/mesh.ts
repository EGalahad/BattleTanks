import * as THREE from 'three';

function disposeMeshes(obj: THREE.Object3D) {

  if (obj instanceof THREE.Mesh) {
    obj.geometry.dispose();
  }

  if (obj.children) {
    for (let child of obj.children) {
      disposeMeshes(child);
    }
  }

}

export { disposeMeshes }
