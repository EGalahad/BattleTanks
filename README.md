# BattleTanks

This the the source code for the BattleTanks game. The game is a third-person view, 3D rendered, two-player tank battle game. Unique gameplay elements such as health, speed, penetration and weapon enhancement power-ups. The user need to go through the maze of walls before the opponent to win the game, if the tank is destroyed, it we be reset to the initial position.

The game is developed using [three.js](https://threejs.org). The game is developed as a part of the course project for the course Advanced Computer Graphics at IIIS, Tsinghua.

## RoadMap
0. Change wall texture in `World.loadAssets()`.
1. Audio Issue: backgorund music and sound effects.
2. Choose appropriate powerup meshes.
3. Add dynamically generated powerups, in `Loop.tick()`.
4. Add dynamically generated initial positions for tanks, in `Tank.reset()`.
5. Add larger range attacks, in `Bullet.update()`.
6. Add texture to tanks and walls.


## Bugs
1. Bullet orientation.
2. Tank bounding box tuning.
