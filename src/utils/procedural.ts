/**
 * Procedural Texture Generator for Eldritch Carapace / Bio-Organic style textures.
 * Generates beautiful custom canvases matching the Base Color, Roughness, Normal, Metalness, and AO maps.
 */

// Helper to convert canvas to File
export function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], filename, { type: 'image/png' }));
      } else {
        // Fallback
        resolve(new File([], filename, { type: 'image/png' }));
      }
    }, 'image/png');
  });
}

/**
 * Generate a procedural noise-based Eldritch Carapace texture set
 */
export function generateEldritchTexturer(width = 512, height = 512) {
  // Let's create the 5 canvases
  const canvases = {
    baseColor: document.createElement('canvas'),
    roughness: document.createElement('canvas'),
    normal: document.createElement('canvas'),
    metalness: document.createElement('canvas'),
    ao: document.createElement('canvas'),
  };

  // Initialize bounds
  Object.values(canvases).forEach((c) => {
    c.width = width;
    c.height = height;
  });

  const ctxBase = canvases.baseColor.getContext('2d')!;
  const ctxRough = canvases.roughness.getContext('2d')!;
  const ctxNorm = canvases.normal.getContext('2d')!;
  const ctxMetal = canvases.metalness.getContext('2d')!;
  const ctxAo = canvases.ao.getContext('2d')!;

  // 1. Generate noise array to keep maps strictly aligned in 3D UV space
  const noise: number[][] = Array.from({ length: width }, () => new Float32Array(height) as any);
  
  // Simple fractal/perlin mock noise
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Scale multiple frequencies
      let value = 0;
      let amplitude = 1;
      let frequency = 0.015;
      for (let i = 0; i < 4; i++) {
        const nx = x * frequency;
        const ny = y * frequency;
        // Simple sin/cos noise sum
        const val = Math.sin(nx * 2 + Math.cos(ny * 3.5)) * Math.cos(ny * 2 + Math.sin(nx * 1.5));
        value += val * amplitude;
        amplitude *= 0.5;
        frequency *= 2.2;
      }
      noise[x][y] = (value + 1.5) / 3.0; // clamp roughly 0-1
    }
  }

  // 2. Base Color: Paint biological Eldritch Carapace (Fleshy red/pink & bony whites)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const n = noise[x][y];
      
      // We want a blend of deep crimson-purple valley, fleshy pink, and bone-white/yellow carapace ridge peaks
      let r = 0, g = 0, b = 0;
      if (n < 0.4) {
        // Deep bloody crimson valleys
        const t = n / 0.4;
        r = Math.floor(75 + t * 50);
        g = Math.floor(25 + t * 25);
        b = Math.floor(35 + t * 20);
      } else if (n < 0.75) {
        // Fleshy pink carapace body
        const t = (n - 0.4) / 0.35;
        r = Math.floor(125 + t * 60);
        g = Math.floor(50 + t * 70);
        b = Math.floor(55 + t * 65);
      } else {
        // Bone white/beige calcified spikes
        const t = (n - 0.75) / 0.25;
        r = Math.floor(185 + t * 50);
        g = Math.floor(120 + t * 110);
        b = Math.floor(120 + t * 105);
      }

      // Add structural fibers (vertical/organic brushstrokes match provided file style)
      const fiber = (Math.sin(x * 0.12) * Math.cos(y * 0.08) + 1) / 2;
      r = Math.min(255, Math.max(0, r + Math.floor((fiber - 0.5) * 15)));
      g = Math.min(255, Math.max(0, g + Math.floor((fiber - 0.5) * 12)));
      b = Math.min(255, Math.max(0, b + Math.floor((fiber - 0.5) * 12)));

      ctxBase.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctxBase.fillRect(x, y, 1, 1);
    }
  }

  // 3. Roughness: Ridges are smooth, wet blood valleys are highly glossy (low roughness)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const n = noise[x][y];
      // Valley (low high) = highly wet shiny (0.1 - 0.25 roughness)
      // High plates = matte bone (0.75 - 0.90 roughness)
      const r = Math.floor((0.15 + n * 0.75) * 255);
      ctxRough.fillStyle = `rgb(${r}, ${r}, ${r})`;
      ctxRough.fillRect(x, y, 1, 1);
    }
  }

  // 4. Metalness: Mostly non-metal except for highlights on wetness/carapace ridges (organic armor)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const n = noise[x][y];
      // Slight cybernetic bio-metal highlights
      const val = Math.floor(Math.pow(n, 4.0) * 80);
      ctxMetal.fillStyle = `rgb(${val}, ${val}, ${val})`;
      ctxMetal.fillRect(x, y, 1, 1);
    }
  }

  // 5. Normal: Recreate full organic depth bumpy slopes via Sobel filter/height matching
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Read adjacent height values
      const xl = x > 0 ? noise[x - 1][y] : noise[x][y];
      const xr = x < width - 1 ? noise[x + 1][y] : noise[x][y];
      const yt = y > 0 ? noise[x][y - 1] : noise[x][y];
      const yb = y < height - 1 ? noise[x][y + 1] : noise[x][y];

      // Calculate slopes
      const dx = (xr - xl) * 2.0; // slope in X
      const dy = (yb - yt) * 2.0; // slope in Y

      // Create normal vector (dx, dy, width) normalized
      const scale = 0.55; // strength modifier
      const nx = -dx * scale;
      const ny = -dy * scale;
      const nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      // Map [-1, 1] to [0, 255]
      const r = Math.floor(((nx / len) + 1.0) * 127.5);
      const g = Math.floor(((ny / len) + 1.0) * 127.5);
      const b = Math.floor(((nz / len) + 1.0) * 127.5);

      ctxNorm.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctxNorm.fillRect(x, y, 1, 1);
    }
  }

  // 6. Ambient Occlusion: Darken the crevices (valleys)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const n = noise[x][y];
      // Deep crevices are dark (0.2), peak ridges are fully lit (1.0)
      const val = Math.floor((0.2 + n * 0.8) * 255);
      ctxAo.fillStyle = `rgb(${val}, ${val}, ${val})`;
      ctxAo.fillRect(x, y, 1, 1);
    }
  }

  return canvases;
}

/**
 * Generate and create Files out of Eldritch procedural textures
 */
export async function createProceduralEldritchFiles(): Promise<any> {
  const canvases = generateEldritchTexturer(512, 512);
  const baseColorFile = await canvasToFile(canvases.baseColor, 'eldritch_albedo.png');
  const normalFile = await canvasToFile(canvases.normal, 'eldritch_normal.png');
  const roughnessFile = await canvasToFile(canvases.roughness, 'eldritch_roughness.png');
  const metalnessFile = await canvasToFile(canvases.metalness, 'eldritch_metalness.png');
  const aoFile = await canvasToFile(canvases.ao, 'eldritch_ao.png');

  return {
    baseColorFile,
    normalFile,
    roughnessFile,
    metalnessFile,
    aoFile,
  };
}
