"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { ChristmasConfig } from "@/types/config";

interface ChristmasTreeProps {
  config: ChristmasConfig;
  onOrnamentClick: (imageUrl: string, index: number) => void;
}

export default function ChristmasTree({ config, onOrnamentClick }: ChristmasTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    treeGroup: THREE.Group;
    treeParticles: THREE.Points | null;
    starParticles: THREE.Points | null;
    snowParticles: THREE.Points | null;
    particlePositions: THREE.Vector3[];
    clock: THREE.Clock;
    targetZoom: number;
    currentZoom: number;
    isDragging: boolean;
    dragStartPosition: { x: number; y: number };
    previousMousePosition: { x: number; y: number };
    rotationY: number;
    rotationX: number;
    autoRotate: boolean;
    lastInteractionTime: number;
    cameraTarget: THREE.Vector3;
    targetCameraTarget: THREE.Vector3;
  } | null>(null);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!sceneRef.current) return;
    sceneRef.current.isDragging = true;
    sceneRef.current.autoRotate = false;
    sceneRef.current.lastInteractionTime = Date.now();
    sceneRef.current.dragStartPosition = { x: event.clientX, y: event.clientY };
    sceneRef.current.previousMousePosition = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!sceneRef.current || !containerRef.current) return;
    const s = sceneRef.current;

    // Check if it was a click (not drag)
    const dx = event.clientX - s.dragStartPosition.x;
    const dy = event.clientY - s.dragStartPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // It's a click
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), s.camera);

      // First check for letter clicks (they are actual meshes)
      const letterMeshes = s.treeGroup.children.filter((child) => {
        const mesh = child as THREE.Mesh & { isLetter?: boolean };
        return mesh.isLetter;
      });

      const intersects = raycaster.intersectObjects(letterMeshes);
      if (intersects.length > 0) {
        const clickedLetter = intersects[0].object as THREE.Mesh & { letterIndex: number };
        const imageIndex = (clickedLetter.letterIndex % 5) + 1;
        onOrnamentClick(`/ornaments/${imageIndex}.jpg`, clickedLetter.letterIndex);
        s.isDragging = false;
        return;
      }
    }

    s.isDragging = false;
  }, [onOrnamentClick]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!sceneRef.current) return;
    const s = sceneRef.current;

    if (s.isDragging) {
      const deltaX = event.clientX - s.previousMousePosition.x;
      const deltaY = event.clientY - s.previousMousePosition.y;

      s.rotationY += deltaX * 0.005;
      s.rotationX += deltaY * 0.003;
      s.rotationX = Math.max(-0.5, Math.min(0.5, s.rotationX));

      s.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;
    camera.position.y = 0.3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Tree group for rotation
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      treeGroup,
      treeParticles: null,
      starParticles: null,
      snowParticles: null,
      particlePositions: [],
      clock: new THREE.Clock(),
      targetZoom: 6,
      currentZoom: 6,
      isDragging: false,
      dragStartPosition: { x: 0, y: 0 },
      previousMousePosition: { x: 0, y: 0 },
      rotationY: 0,
      rotationX: 0,
      autoRotate: true,
      lastInteractionTime: Date.now(),
      cameraTarget: new THREE.Vector3(0, 0.3, 0),
      targetCameraTarget: new THREE.Vector3(0, 0.3, 0),
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    // Handle zoom toward mouse position
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!sceneRef.current || !containerRef.current) return;
      const s = sceneRef.current;

      // Update interaction time
      s.lastInteractionTime = Date.now();
      s.autoRotate = false;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Calculate zoom amount
      const zoomDelta = e.deltaY * 0.005;
      const newZoom = Math.max(1.5, Math.min(15, s.targetZoom + zoomDelta));
      const zoomChange = newZoom - s.targetZoom;

      if (Math.abs(zoomChange) > 0.001) {
        // Create ray from mouse position
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), s.camera);

        // Calculate point on the focal plane (where we want to zoom toward)
        const focalDistance = s.currentZoom;
        const focalPoint = raycaster.ray.origin.clone().add(
          raycaster.ray.direction.clone().multiplyScalar(focalDistance)
        );

        // Move target toward mouse position when zooming in
        if (zoomChange < 0) {
          // Zooming in - move target toward focal point
          const moveAmount = Math.abs(zoomChange) * 0.3;
          s.targetCameraTarget.lerp(focalPoint, moveAmount);
          // Clamp target to reasonable bounds
          s.targetCameraTarget.x = Math.max(-2, Math.min(2, s.targetCameraTarget.x));
          s.targetCameraTarget.y = Math.max(-1, Math.min(3, s.targetCameraTarget.y));
          s.targetCameraTarget.z = Math.max(-2, Math.min(2, s.targetCameraTarget.z));
        } else {
          // Zooming out - gradually return to center
          s.targetCameraTarget.lerp(new THREE.Vector3(0, 0.3, 0), 0.1);
        }

        s.targetZoom = newZoom;
      }
    };

    window.addEventListener("resize", handleResize);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", () => {
      if (sceneRef.current) sceneRef.current.isDragging = false;
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove]);

  // Create/update scene when config changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const s = sceneRef.current;

    // Clear existing
    if (s.treeParticles) {
      s.treeGroup.remove(s.treeParticles);
      s.treeParticles.geometry.dispose();
      (s.treeParticles.material as THREE.Material).dispose();
    }
    // Remove star, glow, and letter meshes
    const toRemove: THREE.Object3D[] = [];
    s.treeGroup.children.forEach((child) => {
      const mesh = child as THREE.Mesh & { isStar?: boolean; isStarGlow?: boolean; isLetter?: boolean };
      if (mesh.isStar || mesh.isStarGlow || mesh.isLetter) {
        toRemove.push(mesh);
        mesh.geometry?.dispose();
        (mesh.material as THREE.Material)?.dispose();
      }
    });
    toRemove.forEach((obj) => s.treeGroup.remove(obj));
    if (s.snowParticles) {
      s.scene.remove(s.snowParticles);
      s.snowParticles.geometry.dispose();
      (s.snowParticles.material as THREE.Material).dispose();
    }
    s.particlePositions = [];

    // Set background color
    s.scene.background = new THREE.Color(config.backgroundColor);

    const scale = config.treeScale;

    // Create tree particles
    const positions = new Float32Array(config.particleCount * 3);
    const colors = new Float32Array(config.particleCount * 3);
    const sizes = new Float32Array(config.particleCount);
    const randoms = new Float32Array(config.particleCount);

    const colorPalette = [
      new THREE.Color(0xffd700), // Gold
      new THREE.Color(0xff6b6b), // Red
      new THREE.Color(0x4ecdc4), // Cyan
      new THREE.Color(0xff69b4), // Pink
      new THREE.Color(0xffa500), // Orange
      new THREE.Color(0xffff00), // Yellow
      new THREE.Color(0xffffff), // White
    ];

    for (let i = 0; i < config.particleCount; i++) {
      const y = (Math.random() * 4.5 - 2) * scale;
      const normalizedY = (y / scale + 2) / 4.5;
      const radius = ((1 - normalizedY) * 1.8 + 0.08) * scale;

      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Store positions for raycasting
      s.particlePositions.push(new THREE.Vector3(x, y, z));

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * config.particleSize + config.particleSize * 0.5;
      randoms[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("random", new THREE.BufferAttribute(randoms, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: s.renderer.getPixelRatio() },
        twinkleSpeed: { value: config.twinkleSpeed },
        blur: { value: config.blur },
        twinkleBlur: { value: config.twinkleBlur },
        twinkleSize: { value: config.twinkleSize },
      },
      vertexShader: `
        attribute float size;
        attribute float random;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float time;
        uniform float pixelRatio;
        uniform float twinkleSpeed;
        uniform float twinkleSize;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Twinkle effect
          vTwinkle = sin(time * twinkleSpeed + random * 10.0) * 0.5 + 0.5;

          // Size changes based on twinkle and twinkleSize setting
          float sizeMultiplier = 1.0 + vTwinkle * twinkleSize;
          gl_PointSize = size * pixelRatio * (100.0 / -mvPosition.z) * sizeMultiplier;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float blur;
        uniform float twinkleBlur;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Combined blur from base blur + twinkle blur
          float currentBlur = blur + vTwinkle * twinkleBlur;
          currentBlur = clamp(currentBlur, 0.0, 1.0);

          // Sharp edge when blur = 0, soft when blur = 1
          // blur = 0: hard circle (step function)
          // blur = 1: very soft glow
          float alpha;
          if (currentBlur < 0.01) {
            // Very sharp - almost hard edge
            alpha = dist < 0.4 ? 1.0 : 0.0;
          } else {
            float innerEdge = 0.4 * (1.0 - currentBlur);
            alpha = 1.0 - smoothstep(innerEdge, 0.5, dist);
          }

          // Glow effect - only when there's blur
          float glow = currentBlur > 0.01 ? exp(-dist * (5.0 - currentBlur * 3.0)) * currentBlur : 0.0;

          // Brightness
          float brightness = 1.0 + vTwinkle * 0.3;

          vec3 finalColor = vColor * brightness + vec3(glow * 0.3);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    s.treeParticles = new THREE.Points(geometry, material);
    s.treeGroup.add(s.treeParticles);

    // Create 5-pointed star on top
    const starShape = new THREE.Shape();
    const outerRadius = 0.3 * config.starSize * scale;
    const innerRadius = 0.12 * config.starSize * scale;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    starShape.closePath();

    const extrudeSettings = {
      depth: 0.08 * config.starSize * scale,
      bevelEnabled: true,
      bevelThickness: 0.02 * config.starSize * scale,
      bevelSize: 0.02 * config.starSize * scale,
      bevelSegments: 2,
    };

    const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeometry.center();

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        brightness: { value: config.starBrightness },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float brightness;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Twinkle effect
          float twinkle = sin(time * 4.0) * 0.3 + 0.7;
          float twinkle2 = sin(time * 7.0 + 1.5) * 0.2 + 0.8;

          // Base gold color
          vec3 goldColor = vec3(1.0, 0.85, 0.2);

          // Lighting
          vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
          float diff = max(dot(vNormal, lightDir), 0.0);

          // Glow from edges
          float edgeGlow = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          edgeGlow = pow(edgeGlow, 2.0);

          vec3 color = goldColor * (0.5 + diff * 0.5);
          color += goldColor * edgeGlow * 0.5;
          color *= twinkle * twinkle2 * brightness;

          // Add white highlight
          color += vec3(1.0) * pow(diff, 8.0) * 0.5 * twinkle;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.y = 2.6 * scale;
    starMesh.rotation.x = 0.1;
    (starMesh as THREE.Mesh & { isStar: boolean }).isStar = true;
    s.treeGroup.add(starMesh);

    // Store reference for animation
    s.starParticles = starMesh as unknown as THREE.Points;

    // Add glow effect behind the star
    const glowGeometry = new THREE.PlaneGeometry(outerRadius * 3, outerRadius * 3);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        brightness: { value: config.starBrightness },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float brightness;
        varying vec2 vUv;

        void main() {
          vec2 center = vUv - vec2(0.5);
          float dist = length(center);

          float twinkle = sin(time * 5.0) * 0.3 + 0.7;

          // Soft circular glow
          float glow = exp(-dist * 4.0) * 0.6;
          glow *= twinkle * brightness;

          vec3 color = vec3(1.0, 0.9, 0.4) * glow;

          gl_FragColor = vec4(color, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.y = 2.6 * scale;
    glowMesh.position.z = -0.05;
    (glowMesh as THREE.Mesh & { isStarGlow: boolean }).isStarGlow = true;
    s.treeGroup.add(glowMesh);

    // Helper function to create 3D shape geometries
    const create3DShape = (shapeType: number, size: number): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      const s = 0.4; // Base scale

      switch (shapeType) {
        case 0: // Square/Gift box
          shape.moveTo(-s, -s);
          shape.lineTo(s, -s);
          shape.lineTo(s, s);
          shape.lineTo(-s, s);
          shape.closePath();
          break;

        case 1: // Heart
          shape.moveTo(0, -s * 0.7);
          shape.bezierCurveTo(0, -s * 0.9, -s * 0.6, -s, -s * 0.8, -s * 0.5);
          shape.bezierCurveTo(-s, 0, -s * 0.6, s * 0.5, 0, s * 0.9);
          shape.bezierCurveTo(s * 0.6, s * 0.5, s, 0, s * 0.8, -s * 0.5);
          shape.bezierCurveTo(s * 0.6, -s, 0, -s * 0.9, 0, -s * 0.7);
          break;

        case 2: // Circle/Ornament ball
          const segments = 32;
          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const px = Math.cos(theta) * s;
            const py = Math.sin(theta) * s;
            if (i === 0) shape.moveTo(px, py);
            else shape.lineTo(px, py);
          }
          break;

        case 3: // Star 5 points
          const points5 = 5;
          const outerR = s;
          const innerR = s * 0.4;
          for (let i = 0; i < points5 * 2; i++) {
            const radius = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points5 - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(px, py);
            else shape.lineTo(px, py);
          }
          shape.closePath();
          break;

        case 4: // Bell
          shape.moveTo(-s * 0.15, s * 0.9);
          shape.lineTo(s * 0.15, s * 0.9);
          shape.lineTo(s * 0.15, s * 0.7);
          shape.quadraticCurveTo(s * 0.5, s * 0.6, s * 0.6, s * 0.2);
          shape.quadraticCurveTo(s * 0.7, -s * 0.3, s * 0.8, -s * 0.6);
          shape.lineTo(s * 0.85, -s * 0.75);
          shape.quadraticCurveTo(s * 0.4, -s * 0.9, 0, -s * 0.95);
          shape.quadraticCurveTo(-s * 0.4, -s * 0.9, -s * 0.85, -s * 0.75);
          shape.lineTo(-s * 0.8, -s * 0.6);
          shape.quadraticCurveTo(-s * 0.7, -s * 0.3, -s * 0.6, s * 0.2);
          shape.quadraticCurveTo(-s * 0.5, s * 0.6, -s * 0.15, s * 0.7);
          shape.closePath();
          break;

        case 5: // Snowflake (6 points)
          const points6 = 6;
          const outerR6 = s;
          const innerR6 = s * 0.35;
          for (let i = 0; i < points6 * 2; i++) {
            const radius = i % 2 === 0 ? outerR6 : innerR6;
            const angle = (i * Math.PI) / points6;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(px, py);
            else shape.lineTo(px, py);
          }
          shape.closePath();
          break;

        case 6: // Diamond
          shape.moveTo(0, s);
          shape.lineTo(s * 0.6, 0);
          shape.lineTo(0, -s);
          shape.lineTo(-s * 0.6, 0);
          shape.closePath();
          break;

        default:
          shape.absarc(0, 0, s, 0, Math.PI * 2, false);
      }

      const bevelAmount = config.letterBevel * 0.15; // Scale bevel amount
      const extrudeSettings = {
        depth: size * (0.1 + config.letterBevel * 0.05),
        bevelEnabled: config.letterBevel > 0,
        bevelThickness: size * bevelAmount,
        bevelSize: size * bevelAmount,
        bevelSegments: Math.max(1, Math.floor(config.letterBevel * 10)),
        curveSegments: 16,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.scale(size, size, 1);
      geometry.center();
      return geometry;
    };

    // Create glowing 3D ornaments with various shapes
    const shapeTypes = 7;
    const placedPositions: THREE.Vector3[] = [];
    const minDistance = config.letterSize * scale * 2.5; // Minimum distance between ornaments

    for (let i = 0; i < config.letterCount; i++) {
      // Try to find a position that doesn't overlap with existing ornaments
      let x = 0, y = 0, z = 0;
      let validPosition = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!validPosition && attempts < maxAttempts) {
        attempts++;

        // Generate random position on tree cone shape
        y = (Math.random() * 3.5 - 1.5) * scale;
        const normalizedY = (y / scale + 1.5) / 3.5;
        const maxRadius = ((1 - normalizedY) * 1.5 + 0.1) * scale;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * maxRadius * 0.8;

        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;

        // Check distance from all placed ornaments
        validPosition = true;
        for (const pos of placedPositions) {
          const dist = Math.sqrt(
            Math.pow(x - pos.x, 2) +
            Math.pow(y - pos.y, 2) +
            Math.pow(z - pos.z, 2)
          );
          if (dist < minDistance) {
            validPosition = false;
            break;
          }
        }
      }

      // Store the position
      placedPositions.push(new THREE.Vector3(x, y, z));
      const placementAngle = Math.atan2(z, x); // Calculate angle for rotation

      const ornamentSize = config.letterSize * scale;
      const shapeType = Math.floor(Math.random() * shapeTypes);
      const ornamentGeometry = create3DShape(shapeType, ornamentSize);

      const basePhase = Math.random() * Math.PI * 2;
      const letterMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          basePhase: { value: basePhase },
          brightness: { value: config.letterBrightness },
          ornamentIndex: { value: i },
          totalOrnaments: { value: config.letterCount },
          flowSpeed: { value: 2.0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float basePhase;
          uniform float brightness;
          uniform float ornamentIndex;
          uniform float totalOrnaments;
          uniform float flowSpeed;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            // Golden colors
            vec3 goldColor = vec3(1.0, 0.8, 0.2);
            vec3 brightGold = vec3(1.0, 0.95, 0.5);
            vec3 whiteGold = vec3(1.0, 1.0, 0.9);

            // Base twinkle effect
            float twinkle = sin(time * 3.0 + basePhase) * 0.25 + 0.75;
            float twinkle2 = sin(time * 5.0 + basePhase * 2.0) * 0.15 + 0.85;

            // Sequential flash effect - each ornament takes a turn to flash bright
            float cyclePosition = mod(time * flowSpeed, totalOrnaments);
            float distFromFlash = abs(ornamentIndex - cyclePosition);
            // Handle wrap-around
            distFromFlash = min(distFromFlash, totalOrnaments - distFromFlash);
            // Create smooth flash pulse
            float flashIntensity = exp(-distFromFlash * distFromFlash * 0.5) * 1.5;

            // Lighting
            vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
            float diff = max(dot(vNormal, lightDir), 0.0);

            // Fresnel/edge glow
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);

            // Base color with lighting
            vec3 color = goldColor * (0.4 + diff * 0.6);

            // Add fresnel glow
            color += brightGold * fresnel * 0.6;

            // Apply base twinkle
            color *= twinkle * twinkle2;

            // Add specular highlight
            vec3 halfDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
            color += vec3(1.0) * spec * 0.5 * twinkle;

            // Apply sequential flash - makes it much brighter and whiter
            color += whiteGold * flashIntensity * 0.8;
            color *= (1.0 + flashIntensity * 0.5);

            // Apply brightness
            color *= brightness;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const letterMesh = new THREE.Mesh(ornamentGeometry, letterMaterial);
      letterMesh.position.set(x, y, z);
      letterMesh.rotation.y = placementAngle;

      // Store metadata for click detection and animation
      const letterData = letterMesh as THREE.Mesh & {
        isLetter: boolean;
        letterIndex: number;
        spinPhase: number;
      };
      letterData.isLetter = true;
      letterData.letterIndex = i;
      letterData.spinPhase = Math.random() * Math.PI * 2;

      s.treeGroup.add(letterMesh);
    }

    // Create snow
    if (config.snowEnabled) {
      const snowPositions = new Float32Array(config.snowCount * 3);
      const snowSizes = new Float32Array(config.snowCount);

      for (let i = 0; i < config.snowCount; i++) {
        snowPositions[i * 3] = (Math.random() - 0.5) * 25;
        snowPositions[i * 3 + 1] = Math.random() * 20 - 5;
        snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;
        snowSizes[i] = Math.random() * config.snowSize + 0.3;
      }

      const snowGeometry = new THREE.BufferGeometry();
      snowGeometry.setAttribute("position", new THREE.BufferAttribute(snowPositions, 3));
      snowGeometry.setAttribute("size", new THREE.BufferAttribute(snowSizes, 1));

      const snowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          pixelRatio: { value: s.renderer.getPixelRatio() },
        },
        vertexShader: `
          attribute float size;
          uniform float pixelRatio;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * pixelRatio * (60.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.7);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      s.snowParticles = new THREE.Points(snowGeometry, snowMaterial);
      s.scene.add(s.snowParticles);
    }
  }, [config]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current) return;

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const s = sceneRef.current;
      if (!s) return;

      const time = s.clock.getElapsedTime();

      // Update background color
      s.scene.background = new THREE.Color(config.backgroundColor);

      // Update uniforms
      if (s.treeParticles) {
        const mat = s.treeParticles.material as THREE.ShaderMaterial;
        mat.uniforms.time.value = time;
        mat.uniforms.twinkleSpeed.value = config.twinkleSpeed;
        mat.uniforms.blur.value = config.blur;
        mat.uniforms.twinkleBlur.value = config.twinkleBlur;
        mat.uniforms.twinkleSize.value = config.twinkleSize;
      }
      // Update star, glow, and letters
      s.treeGroup.children.forEach((child) => {
        const mesh = child as THREE.Mesh & {
          isStar?: boolean;
          isStarGlow?: boolean;
          isLetter?: boolean;
          spinPhase?: number;
        };
        if (mesh.isStar || mesh.isStarGlow) {
          const mat = mesh.material as THREE.ShaderMaterial;
          mat.uniforms.time.value = time;
          mat.uniforms.brightness.value = config.starBrightness;
        }
        if (mesh.isLetter) {
          const mat = mesh.material as THREE.ShaderMaterial;
          mat.uniforms.time.value = time;
          mat.uniforms.brightness.value = config.letterBrightness;
          mat.uniforms.flowSpeed.value = config.letterFlowSpeed;
          mat.uniforms.totalOrnaments.value = config.letterCount;
          // Spin on own Y axis
          mesh.rotation.y += config.letterSpinSpeed * 0.02;
        }
      });

      // Animate snow
      if (s.snowParticles && config.snowEnabled) {
        const snowPos = s.snowParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < snowPos.length / 3; i++) {
          snowPos[i * 3 + 1] -= config.snowSpeed + Math.random() * 0.003;
          snowPos[i * 3] += Math.sin(time * 0.3 + i * 0.1) * 0.002 + config.windDirection * 0.005;
          snowPos[i * 3 + 2] += Math.cos(time * 0.2 + i * 0.05) * 0.002;

          if (snowPos[i * 3 + 1] < -5) {
            snowPos[i * 3 + 1] = 15;
            snowPos[i * 3] = (Math.random() - 0.5) * 25;
            snowPos[i * 3 + 2] = (Math.random() - 0.5) * 25;
          }
        }
        s.snowParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Check for 3 seconds of inactivity to resume auto-rotate
      const now = Date.now();
      if (!s.autoRotate && !s.isDragging && now - s.lastInteractionTime > 3000) {
        s.autoRotate = true;
        // Gradually return camera target to center when auto-rotating
        s.targetCameraTarget.set(0, 0.3, 0);
      }

      // Auto rotate or manual rotation
      if (s.autoRotate && !s.isDragging) {
        s.rotationY += config.rotationSpeed * 0.016;
      }

      s.treeGroup.rotation.y = s.rotationY;
      s.treeGroup.rotation.x = s.rotationX;

      // Smooth zoom
      s.currentZoom += (s.targetZoom - s.currentZoom) * 0.08;
      s.camera.position.z = s.currentZoom;

      // Smooth camera target interpolation
      s.cameraTarget.lerp(s.targetCameraTarget, 0.05);

      // Update camera position to orbit around target
      const cameraOffset = new THREE.Vector3(0, 0, s.currentZoom);
      s.camera.position.copy(s.cameraTarget).add(cameraOffset);
      s.camera.lookAt(s.cameraTarget);

      s.renderer.render(s.scene, s.camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [config]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}
