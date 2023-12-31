import { OBB } from "./OBB";
import * as THREE from "three";

import { Tank } from "../object/impl/Tank";
import { Wall } from "../object/impl/Wall";
import { Bullet } from "../object/impl/Bullet";
import { Powerup } from "../object/impl/powerups";

function checkCollisionTankWithWall(tank: Tank, wall: Wall) {
  const { width, height, depth } = tank.bboxParameter;
  const obb = new OBB(
    tank.mesh.position,
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Matrix3().setFromMatrix4(tank.mesh.matrix)
  );
  const box3 = new THREE.Box3().setFromObject(wall.mesh);
  return obb.intersectsBox3(box3);
}

function checkCollisionTankWithTank(tank1: Tank, tank2: Tank) {
  const { width, height, depth } = tank1.bboxParameter;
  const obb1 = new OBB(
    tank1.mesh.position,
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Matrix3().setFromMatrix4(tank1.mesh.matrix)
  );
  const obb2 = new OBB(
    tank2.mesh.position,
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Matrix3().setFromMatrix4(tank2.mesh.matrix)
  );
  return obb1.intersectsOBB(obb2);
}

function checkCollisionBulletWithTank(bullet: Bullet, tank: Tank) {
  const { width, height, depth } = tank.bboxParameter;
  const obb = new OBB(
    tank.mesh.position,
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Matrix3().setFromMatrix4(tank.mesh.matrix)
  );
  const box3 = new THREE.Box3().setFromObject(bullet.mesh);
  return obb.intersectsBox3(box3);
}

function checkCollisionBulletWithWall(bullet: Bullet, wall: Wall) {
  const box3 = new THREE.Box3().setFromObject(bullet.mesh);
  const box3Wall = new THREE.Box3().setFromObject(wall.mesh);
  return box3.intersectsBox(box3Wall);
}

function checkCollisionPowerupWithTank(powerup: Powerup, tank: Tank) {
  const box3 = new THREE.Box3().setFromObject(powerup.mesh);
  const { width, height, depth } = tank.bboxParameter;
  const obb = new OBB(
    tank.mesh.position,
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Matrix3().setFromMatrix4(tank.mesh.matrix)
  );
  return obb.intersectsBox3(box3);
}


function checkCollisionPowerupWithWall(powerup: Powerup, wall: Wall) {
  const powerup_box = new THREE.Box3().setFromObject(powerup.mesh);
  const wall_box = new THREE.Box3().setFromObject(wall.mesh);
  return powerup_box.intersectsBox(wall_box);
}

export { checkCollisionTankWithWall, checkCollisionTankWithTank, checkCollisionBulletWithTank, checkCollisionBulletWithWall, checkCollisionPowerupWithTank, checkCollisionPowerupWithWall }
