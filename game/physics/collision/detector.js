// detector.js - AABB collision detection between ball and wall

export class CollisionDetector {

  // Check if a ball (sphere) overlaps with an AABB wall.
  // Returns collision data { wall, axis, depth } or null if no collision.
  detectBallWall(ballPos, ballRadius, wall) {
    const r = ballRadius;
    const { minX, maxX, minZ, maxZ } = wall;

    // Expand wall bounds by ball radius
    const eminX = minX - r;
    const emaxX = maxX + r;
    const eminZ = minZ - r;
    const emaxZ = maxZ + r;

    const overlapX = ballPos.x > eminX && ballPos.x < emaxX;
    const overlapZ = ballPos.z > eminZ && ballPos.z < emaxZ;
    if (!overlapX || !overlapZ) return null;

    // Penetration depth on each side
    const overlaps = [
      { axis: 'left',   depth: ballPos.x - eminX },
      { axis: 'right',  depth: emaxX - ballPos.x },
      { axis: 'top',    depth: ballPos.z - eminZ },
      { axis: 'bottom', depth: emaxZ - ballPos.z },
    ];

    // Resolve along the axis with minimum penetration
    const minOverlap = overlaps.reduce((a, b) => a.depth < b.depth ? a : b);

    return { wall, axis: minOverlap.axis, depth: minOverlap.depth };
  }

}