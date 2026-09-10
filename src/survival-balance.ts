/** Forgiving survival tuning, shared by existing saves and newly generated worlds. */
export const SURVIVAL_BALANCE={
 harmlessBumpSpeed:5, // HUD speed: 25 km/h.
 occupantInjurySpeed:10, // Only substantial crashes injure the driver.
 hearingRadiusScale:.45,
 indoorLoudNoiseThreshold:24, // Glass breaking and all firearms; footsteps peak at 13.
 indoorSoundLeakScale:.65,
 noiseMemoryScale:.6,
 sightRadius:6,
 sneakingSightRadius:3,
 sightMemorySeconds:12,
 doorDamagePerSecond:2,
 doorCrowdDamagePerSecond:4,
};
