export interface ChristmasConfig {
  // Tree particles
  particleCount: number;
  particleSize: number;
  treeScale: number;
  blur: number; // 0 = sharp, 1 = very blurry
  twinkleBlur: number; // 0 = no blur when twinkle, 1 = blur when twinkle
  twinkleSize: number; // 0 = no size change, 1 = big size change when twinkle

  // Star on top
  starSize: number;
  starBrightness: number;

  // Letters/Ornaments
  letterCount: number;
  letterSize: number;
  letterSpinSpeed: number;
  letterBrightness: number;
  letterFlowSpeed: number; // Speed of sequential flash
  letterBevel: number; // Bevel/rounding amount for 3D shapes

  // Background
  backgroundColor: string;

  // Music
  musicTrack: string;

  // Ornaments
  ornamentCount: number;
  ornamentImages: string[];

  // Animation
  twinkleSpeed: number;
  rotationSpeed: number;

  // Snow
  snowEnabled: boolean;
  snowCount: number;
  snowSpeed: number;
  snowSize: number;
  windDirection: number; // -1 to 1

  // Visual
  bloomIntensity: number;
}

export const defaultConfig: ChristmasConfig = {
  particleCount: 3000,
  particleSize: 0.1,
  treeScale: 1,
  blur: 0,
  twinkleBlur: 0.3,
  twinkleSize: 0.3,
  starSize: 0.5,
  starBrightness: 1.0,
  letterCount: 15,
  letterSize: 0.1,
  letterSpinSpeed: 1.0,
  letterBrightness: 1.0,
  letterFlowSpeed: 3.0,
  letterBevel: 0.5,
  backgroundColor: "#2a0a0a",
  musicTrack: "/music/jingle-bells.mp3",
  ornamentCount: 25,
  ornamentImages: [
    "/ornaments/1.jpg",
    "/ornaments/2.jpg",
    "/ornaments/3.jpg",
    "/ornaments/4.jpg",
    "/ornaments/5.jpg",
  ],
  twinkleSpeed: 4,
  rotationSpeed: 0.15,
  snowEnabled: true,
  snowCount: 1000,
  snowSpeed: 0.015,
  snowSize: 1,
  windDirection: 0,
  bloomIntensity: 0.5,
};
