import fs from 'fs';
import path from 'path';

export interface SlicingInput {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  technology: string;
  material: {
    name: string;
    densityGcm3: number;
    ratePerGramInr: number;
  };
  machine: {
    name: string;
    buildVolumeX: number;
    buildVolumeY: number;
    buildVolumeZ: number;
    hourlyRateInr: number;
    minOrderInr: number;
    wastagePercent: number;
    labourFeeInr: number;
    finishingFeeInr: number;
  };
  layerHeightMm: number;
  infillPercent: number;
  supportEnabled: boolean;
  quantity: number;
  finishingOption: string;
  gstPercent?: number;
  shippingInr?: number;
}

export interface SlicingResult {
  fileFormat: string;
  triangleCount: number;
  boundingBoxMm: { x: number; y: number; z: number };
  volumeCm3: number;
  surfaceAreaCm2: number;
  estimatedWeightG: number;
  supportWeightG: number;
  estimatedPrintMinutes: number;
  layerCount: number;
  technicalReviewRequired: boolean;
  slicingStatus: 'Slicing Completed' | 'Technical Review Required';
  warnings: string[];
  pricingBreakdown: {
    materialCostInr: number;
    machineCostInr: number;
    supportCostInr: number;
    wastageCostInr: number;
    labourCostInr: number;
    finishingCostInr: number;
    subtotalInr: number;
    deliveryInr: number;
    gstInr: number;
    discountInr: number;
    totalInr: number;
    technicalReviewRequired: boolean;
    warnings: string[];
  };
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface MeshMetrics {
  triangleCount: number;
  min: Vec3;
  max: Vec3;
  volumeMm3: number;
  surfaceAreaMm2: number;
  overhangAreaMm2: number;
}

function accumulateTriangle(
  v0: Vec3,
  v1: Vec3,
  v2: Vec3,
  metrics: MeshMetrics
) {
  metrics.triangleCount += 1;

  for (const v of [v0, v1, v2]) {
    if (v.x < metrics.min.x) metrics.min.x = v.x;
    if (v.y < metrics.min.y) metrics.min.y = v.y;
    if (v.z < metrics.min.z) metrics.min.z = v.z;
    if (v.x > metrics.max.x) metrics.max.x = v.x;
    if (v.y > metrics.max.y) metrics.max.y = v.y;
    if (v.z > metrics.max.z) metrics.max.z = v.z;
  }

  // Signed tetrahedral volume: v0 . (v1 x v2) / 6
  const cx = v1.y * v2.z - v1.z * v2.y;
  const cy = v1.z * v2.x - v1.x * v2.z;
  const cz = v1.x * v2.y - v1.y * v2.x;
  metrics.volumeMm3 += (v0.x * cx + v0.y * cy + v0.z * cz) / 6;

  // Cross product (v1 - v0) x (v2 - v0) for face area & normal
  const ax = v1.x - v0.x;
  const ay = v1.y - v0.y;
  const az = v1.z - v0.z;
  const bx = v2.x - v0.x;
  const by = v2.y - v0.y;
  const bz = v2.z - v0.z;

  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (normLen > 1e-9) {
    const area = 0.5 * normLen;
    metrics.surfaceAreaMm2 += area;
    const unitZ = nz / normLen;
    if (unitZ < -0.707) {
      metrics.overhangAreaMm2 += area;
    }
  }
}

function parseStlBuffer(buffer: Buffer): MeshMetrics {
  const metrics: MeshMetrics = {
    triangleCount: 0,
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
    volumeMm3: 0,
    surfaceAreaMm2: 0,
    overhangAreaMm2: 0,
  };

  if (buffer.length < 84) {
    throw new Error('Invalid STL file: buffer too small.');
  }

  const headerStr = buffer.subarray(0, 80).toString('utf8').trimStart();
  const declaredTriangles = buffer.readUInt32LE(80);
  const expectedBinarySize = 84 + declaredTriangles * 50;

  // Check if binary STL matches expected byte length (within tolerance)
  const isBinary =
    !headerStr.startsWith('solid') ||
    Math.abs(buffer.length - expectedBinarySize) <= 2;

  if (isBinary && buffer.length >= expectedBinarySize && declaredTriangles > 0) {
    let offset = 84;
    for (let i = 0; i < declaredTriangles; i++) {
      // Skip 12 bytes normal, read 3 vertices (9 floats)
      const v0 = {
        x: buffer.readFloatLE(offset + 12),
        y: buffer.readFloatLE(offset + 16),
        z: buffer.readFloatLE(offset + 20),
      };
      const v1 = {
        x: buffer.readFloatLE(offset + 24),
        y: buffer.readFloatLE(offset + 28),
        z: buffer.readFloatLE(offset + 32),
      };
      const v2 = {
        x: buffer.readFloatLE(offset + 36),
        y: buffer.readFloatLE(offset + 40),
        z: buffer.readFloatLE(offset + 44),
      };
      accumulateTriangle(v0, v1, v2, metrics);
      offset += 50;
    }
    return metrics;
  }

  // ASCII STL fallback
  const text = buffer.toString('utf8');
  const vertexRegex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  const verts: Vec3[] = [];
  let match: RegExpExecArray | null;
  while ((match = vertexRegex.exec(text)) !== null) {
    verts.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      z: parseFloat(match[3]),
    });
    if (verts.length === 3) {
      accumulateTriangle(verts[0], verts[1], verts[2], metrics);
      verts.length = 0;
    }
  }

  if (metrics.triangleCount === 0) {
    throw new Error('Could not parse any valid facets from STL file.');
  }

  return metrics;
}

function parseObjBuffer(buffer: Buffer): MeshMetrics {
  const metrics: MeshMetrics = {
    triangleCount: 0,
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
    volumeMm3: 0,
    surfaceAreaMm2: 0,
    overhangAreaMm2: 0,
  };

  const vertices: Vec3[] = [];
  const lines = buffer.toString('utf8').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        vertices.push({
          x: parseFloat(parts[1]),
          y: parseFloat(parts[2]),
          z: parseFloat(parts[3]),
        });
      }
    } else if (line.startsWith('f ')) {
      const parts = line.slice(2).trim().split(/\s+/);
      const indices: number[] = [];
      for (const p of parts) {
        const idxStr = p.split('/')[0];
        const rawIdx = parseInt(idxStr, 10);
        if (!Number.isNaN(rawIdx)) {
          const resolved = rawIdx > 0 ? rawIdx - 1 : vertices.length + rawIdx;
          if (resolved >= 0 && resolved < vertices.length) {
            indices.push(resolved);
          }
        }
      }
      // Triangulate polygon fan
      for (let i = 1; i + 1 < indices.length; i++) {
        accumulateTriangle(
          vertices[indices[0]],
          vertices[indices[i]],
          vertices[indices[i + 1]],
          metrics
        );
      }
    }
  }

  if (metrics.triangleCount === 0) {
    throw new Error('Could not parse any valid polygon faces from OBJ file.');
  }

  return metrics;
}

export function analyzeAndSliceModel(input: SlicingInput): SlicingResult {
  const ext = path.extname(input.fileName).toLowerCase().replace('.', '').toUpperCase();
  const warnings: string[] = [];

  if (ext === 'STEP' || ext === 'STP' || ext === '3MF') {
    warnings.push(
      `${ext} CAD/archive package uploaded. Geometry conversion and toolpath slicing require engineering inspection.`
    );
    return {
      fileFormat: ext,
      triangleCount: 0,
      boundingBoxMm: { x: 0, y: 0, z: 0 },
      volumeCm3: 0,
      surfaceAreaCm2: 0,
      estimatedWeightG: 0,
      supportWeightG: 0,
      estimatedPrintMinutes: 0,
      layerCount: 0,
      technicalReviewRequired: true,
      slicingStatus: 'Technical Review Required',
      warnings,
      pricingBreakdown: {
        materialCostInr: 0,
        machineCostInr: 0,
        supportCostInr: 0,
        wastageCostInr: 0,
        labourCostInr: 0,
        finishingCostInr: 0,
        subtotalInr: 0,
        deliveryInr: 0,
        gstInr: 0,
        discountInr: 0,
        totalInr: 0,
        technicalReviewRequired: true,
        warnings,
      },
    };
  }

  const buffer = fs.readFileSync(input.filePath);
  let metrics: MeshMetrics;
  try {
    if (ext === 'STL') {
      metrics = parseStlBuffer(buffer);
    } else if (ext === 'OBJ') {
      metrics = parseObjBuffer(buffer);
    } else {
      throw new Error(`Unsupported mesh format: ${ext}`);
    }
  } catch (err: any) {
    warnings.push(err?.message || 'Mesh validation failed; queued for engineering review.');
    return {
      fileFormat: ext || 'UNKNOWN',
      triangleCount: 0,
      boundingBoxMm: { x: 0, y: 0, z: 0 },
      volumeCm3: 0,
      surfaceAreaCm2: 0,
      estimatedWeightG: 0,
      supportWeightG: 0,
      estimatedPrintMinutes: 0,
      layerCount: 0,
      technicalReviewRequired: true,
      slicingStatus: 'Technical Review Required',
      warnings,
      pricingBreakdown: {
        materialCostInr: 0,
        machineCostInr: 0,
        supportCostInr: 0,
        wastageCostInr: 0,
        labourCostInr: 0,
        finishingCostInr: 0,
        subtotalInr: 0,
        deliveryInr: 0,
        gstInr: 0,
        discountInr: 0,
        totalInr: 0,
        technicalReviewRequired: true,
        warnings,
      },
    };
  }

  const dimX = Number(Math.max(0.1, metrics.max.x - metrics.min.x).toFixed(2));
  const dimY = Number(Math.max(0.1, metrics.max.y - metrics.min.y).toFixed(2));
  const dimZ = Number(Math.max(0.1, metrics.max.z - metrics.min.z).toFixed(2));

  let technicalReviewRequired = false;

  if (
    dimX > input.machine.buildVolumeX ||
    dimY > input.machine.buildVolumeY ||
    dimZ > input.machine.buildVolumeZ
  ) {
    technicalReviewRequired = true;
    warnings.push(
      `Model dimensions (${dimX} × ${dimY} × ${dimZ} mm) exceed ${input.machine.name} build volume (${input.machine.buildVolumeX} × ${input.machine.buildVolumeY} × ${input.machine.buildVolumeZ} mm). Multi-part splitting or industrial printer review required.`
    );
  }

  if (dimX < 2 && dimY < 2 && dimZ < 2) {
    warnings.push('Model bounding box is under 2 mm; verify units (mm vs meters) before production.');
  }

  const absVolumeCm3 = Math.max(0.05, Math.abs(metrics.volumeMm3) / 1000);
  const surfaceAreaCm2 = Math.max(0.1, metrics.surfaceAreaMm2 / 100);
  const overhangAreaCm2 = Math.max(0, metrics.overhangAreaMm2 / 100);

  // Wall shell thickness ~1.2 mm (0.12 cm) for FDM/SLA perimeter shells
  const shellThicknessCm = input.technology === 'SLA' ? 0.14 : 0.12;
  const maxShellVolumeCm3 = Math.min(absVolumeCm3, surfaceAreaCm2 * shellThicknessCm);
  const interiorVolumeCm3 = Math.max(0, absVolumeCm3 - maxShellVolumeCm3);
  const effectiveInfillRatio =
    input.technology === 'SLA' ? 1.0 : Math.max(0.1, Math.min(1, input.infillPercent / 100));

  const partPolymerCm3 = maxShellVolumeCm3 + interiorVolumeCm3 * effectiveInfillRatio;

  // Support filament volume proportional to downward overhang surface area & average Z height
  const supportVolumeCm3 = input.supportEnabled
    ? overhangAreaCm2 * Math.min(dimZ / 10, 4.0) * 0.14
    : 0;

  const partWeightPerUnitG = Number((partPolymerCm3 * input.material.densityGcm3).toFixed(2));
  const supportWeightPerUnitG = Number((supportVolumeCm3 * input.material.densityGcm3).toFixed(2));

  const totalWeightG = Number(((partWeightPerUnitG + supportWeightPerUnitG) * input.quantity).toFixed(2));
  const layerCount = Math.max(1, Math.ceil(dimZ / input.layerHeightMm));

  // Volumetric extrusion rate (cm3/hr) scaled by layer height & technology
  const baseVolumetricRateCm3PerHr =
    input.technology === 'SLA'
      ? 22 * (input.layerHeightMm / 0.05) * 0.35
      : 14 * (input.layerHeightMm / 0.2);
  const effectiveFlowCm3PerHr = Math.max(4, baseVolumetricRateCm3PerHr);
  const extrusionHours = ((partPolymerCm3 + supportVolumeCm3) * input.quantity) / effectiveFlowCm3PerHr;
  const layerTransitionOverheadHours = (layerCount * 1.4 * input.quantity) / 3600;
  const warmupHours = 0.12;
  const estimatedPrintMinutes = Math.max(
    12,
    Math.round((extrusionHours + layerTransitionOverheadHours + warmupHours) * 60)
  );

  // Pricing breakdown per Part 7 formula:
  // Material cost = Material consumption × Material price per unit
  // Machine cost = Estimated printing time × Machine hourly rate
  // Additional costs = Support material + Wastage + Labour + Finishing
  const materialCostInr = Math.round(partWeightPerUnitG * input.quantity * input.material.ratePerGramInr);
  const supportCostInr = Math.round(supportWeightPerUnitG * input.quantity * input.material.ratePerGramInr);
  const machineCostInr = Math.round((estimatedPrintMinutes / 60) * input.machine.hourlyRateInr);
  const wastageCostInr = Math.round(
    (materialCostInr + supportCostInr) * (input.machine.wastagePercent / 100)
  );
  const labourCostInr = input.machine.labourFeeInr;
  const finishingCostInr =
    input.finishingOption && input.finishingOption !== 'Standard As-Printed'
      ? input.machine.finishingFeeInr * input.quantity
      : 0;

  const rawSubtotal =
    materialCostInr +
    machineCostInr +
    supportCostInr +
    wastageCostInr +
    labourCostInr +
    finishingCostInr;
  const subtotalInr = Math.max(input.machine.minOrderInr, rawSubtotal);
  const deliveryInr = input.shippingInr ?? 99;
  const gstPercent = input.gstPercent ?? 18;
  const gstInr = Math.round((subtotalInr * gstPercent) / 100);
  const discountInr = 0;
  const totalInr = subtotalInr + deliveryInr + gstInr - discountInr;

  return {
    fileFormat: ext,
    triangleCount: metrics.triangleCount,
    boundingBoxMm: { x: dimX, y: dimY, z: dimZ },
    volumeCm3: Number(absVolumeCm3.toFixed(2)),
    surfaceAreaCm2: Number(surfaceAreaCm2.toFixed(2)),
    estimatedWeightG: totalWeightG,
    supportWeightG: Number((supportWeightPerUnitG * input.quantity).toFixed(2)),
    estimatedPrintMinutes,
    layerCount,
    technicalReviewRequired,
    slicingStatus: technicalReviewRequired ? 'Technical Review Required' : 'Slicing Completed',
    warnings,
    pricingBreakdown: {
      materialCostInr,
      machineCostInr,
      supportCostInr,
      wastageCostInr,
      labourCostInr,
      finishingCostInr,
      subtotalInr,
      deliveryInr,
      gstInr,
      discountInr,
      totalInr,
      technicalReviewRequired,
      warnings,
    },
  };
}
