import { useRef, useEffect, useCallback, memo } from "react";
import { ROTATION_VALUES, TILT_VALUES } from "./AnglesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitSphereProps {
  rotation: number;
  tilt: number;
  zoom: number;
  onDragEnd: (rotation: number, tilt: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Snap a raw value to the nearest element in an array of allowed values. */
export const snapToNearest = (
  value: number,
  allowedValues: number[],
): number => {
  let closest = allowedValues[0];
  let minDist = Math.abs(value - closest);
  for (const v of allowedValues) {
    const dist = Math.abs(value - v);
    if (dist < minDist) {
      minDist = dist;
      closest = v;
    }
  }
  return closest;
};

// ─── Face descriptor used by the painter's-algorithm renderer ────────────────

interface Face {
  pts: { x: number; y: number; depth: number }[];
  fillColor: string;
  edgeColor: string;
  edgeWidth: number;
  /** Lens front cap — draws concentric glass rings. */
  isFront: boolean;
  /** Camera body back face — draws the LCD screen inset. */
  isBack: boolean;
  /** Camera body front face — draws the red recording dot. */
  isBodyFront: boolean;
  avgDepth: number;
  /** Targeting-laser line from lens tip to sphere centre. */
  isLine?: boolean;
}

// ─── OrbitSphere Component ───────────────────────────────────────────────────

export const OrbitSphere = memo(
  ({ rotation, tilt, onDragEnd }: OrbitSphereProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const liveRotation = useRef(rotation);
    const liveTilt = useRef(tilt);
    const rafId = useRef<number | null>(null);

    // Keep live refs in sync when props change (from sliders / snap)
    useEffect(() => {
      if (!isDragging.current) {
        liveRotation.current = rotation;
        liveTilt.current = tilt;
      }
    }, [rotation, tilt]);

    // ─── Core draw function ──────────────────────────────────────────────────

    const drawSphere = useCallback(
      (renderRotation: number, renderTilt: number, dragging = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // HiDPI setup
        const displayW = canvas.clientWidth;
        const displayH = canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = displayW;
        const h = displayH;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.4;

        ctx.clearRect(0, 0, w, h);

        // Subtle radial outer glow
        const outerGlow = ctx.createRadialGradient(
          cx,
          cy,
          radius * 0.8,
          cx,
          cy,
          radius * 1.3,
        );
        outerGlow.addColorStop(0, "rgba(255, 255, 255, 0.02)");
        outerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, w, h);

        const rotRad = (renderRotation * Math.PI) / 180;
        const tiltRad = (renderTilt * Math.PI) / 180;

        // ── Perspective projection ──────────────────────────────────────────
        const project = (
          x3d: number,
          y3d: number,
          z3d: number,
        ): { x: number; y: number; depth: number } => {
          const perspective = 6;
          const scale = perspective / (perspective - z3d);
          return {
            x: cx + x3d * radius * scale,
            y: cy + y3d * radius * scale,
            depth: z3d,
          };
        };

        // ── Wireframe sphere ────────────────────────────────────────────────
        const wireAlpha = dragging ? 0.12 : 0.06;
        ctx.strokeStyle = `rgba(255, 255, 255, ${wireAlpha})`;
        ctx.lineWidth = 0.7;

        // Meridians
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6 + rotRad;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const phi = (j / 40) * Math.PI * 2;
            const p = project(
              Math.cos(angle) * Math.sin(phi),
              Math.cos(phi),
              Math.sin(angle) * Math.sin(phi),
            );
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // Parallels
        for (let i = 1; i < 6; i++) {
          const phi = (i * Math.PI) / 6;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const angle = (j / 40) * Math.PI * 2 + rotRad;
            const p = project(
              Math.cos(angle) * Math.sin(phi),
              Math.cos(phi),
              Math.sin(angle) * Math.sin(phi),
            );
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // ── 3D camera position & orientation ───────────────────────────────
        const camPosX = Math.sin(rotRad) * Math.cos(tiltRad);
        const camPosY = -Math.sin(tiltRad);
        const camPosZ = Math.cos(rotRad) * Math.cos(tiltRad);

        const centerScreen = project(0, 0, 0);

        // Direction vector pointing from camera towards origin
        const dirX = -camPosX;
        const dirY = -camPosY;
        const dirZ = -camPosZ;

        // Camera-local right axis (world-up crossed with dir)
        let rightX = dirZ;
        const rightY = 0;
        let rightZ = -dirX;
        const rightLen = Math.sqrt(rightX * rightX + rightZ * rightZ) || 1;
        rightX /= rightLen;
        rightZ /= rightLen;

        // Camera-local up axis
        let upX = rightY * dirZ - rightZ * dirY;
        let upY = rightZ * dirX - rightX * dirZ;
        let upZ = rightX * dirY - rightY * dirX;
        const upLen = Math.sqrt(upX * upX + upY * upY + upZ * upZ) || 1;
        upX /= upLen;
        upY /= upLen;
        upZ /= upLen;

        // ── Camera body dimensions ─────────────────────────────────────────
        const bodyW = 0.28;
        const bodyH = 0.19;
        const bodyD = 0.22;

        // ── Geometry helpers ───────────────────────────────────────────────

        /** Build 8 corners of an axis-aligned box in camera-local space. */
        const makeBox = (
          bx: number,
          by: number,
          bz: number,
          hw: number,
          hh: number,
          hd: number,
        ) => [
          {
            x: bx + rightX * hw + upX * hh,
            y: by + rightY * hw + upY * hh,
            z: bz + rightZ * hw + upZ * hh,
          },
          {
            x: bx - rightX * hw + upX * hh,
            y: by - rightY * hw + upY * hh,
            z: bz - rightZ * hw + upZ * hh,
          },
          {
            x: bx - rightX * hw - upX * hh,
            y: by - rightY * hw - upY * hh,
            z: bz - rightZ * hw - upZ * hh,
          },
          {
            x: bx + rightX * hw - upX * hh,
            y: by + rightY * hw - upY * hh,
            z: bz + rightZ * hw - upZ * hh,
          },
          {
            x: bx + dirX * hd + rightX * hw + upX * hh,
            y: by + dirY * hd + rightY * hw + upY * hh,
            z: bz + dirZ * hd + rightZ * hw + upZ * hh,
          },
          {
            x: bx + dirX * hd - rightX * hw + upX * hh,
            y: by + dirY * hd - rightY * hw + upY * hh,
            z: bz + dirZ * hd - rightZ * hw + upZ * hh,
          },
          {
            x: bx + dirX * hd - rightX * hw - upX * hh,
            y: by + dirY * hd - rightY * hw - upY * hh,
            z: bz + dirZ * hd - rightZ * hw - upZ * hh,
          },
          {
            x: bx + dirX * hd + rightX * hw - upX * hh,
            y: by + dirY * hd + rightY * hw - upY * hh,
            z: bz + dirZ * hd + rightZ * hw - upZ * hh,
          },
        ];

        // ── Build camera geometry ──────────────────────────────────────────
        const bodyCorners3D = makeBox(
          camPosX,
          camPosY,
          camPosZ,
          bodyW,
          bodyH,
          bodyD,
        );

        const lensLen = 0.14;
        const lensR = 0.1;
        const lensCx = camPosX + dirX * bodyD;
        const lensCy = camPosY + dirY * bodyD;
        const lensCz = camPosZ + dirZ * bodyD;

        const vfCorners3D = makeBox(
          camPosX + dirX * -0.03 + upX * (bodyH + 0.05),
          camPosY + dirY * -0.03 + upY * (bodyH + 0.05),
          camPosZ + dirZ * -0.03 + upZ * (bodyH + 0.05),
          0.09,
          0.05,
          0.1,
        );
        const gripCorners3D = makeBox(
          camPosX + rightX * (bodyW + 0.03),
          camPosY + rightY * (bodyW + 0.03),
          camPosZ + rightZ * (bodyW + 0.03),
          0.04,
          bodyH * 0.85,
          bodyD * 0.7,
        );

        // Project box corners to screen
        const bodyCorners = bodyCorners3D.map((c) => project(c.x, c.y, c.z));
        const vfCorners = vfCorners3D.map((c) => project(c.x, c.y, c.z));
        const gripCorners = gripCorners3D.map((c) => project(c.x, c.y, c.z));

        // Box face winding: [back, front, top, bottom, left, right]
        const BOX_FACES: [number, number, number, number][] = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 1, 5, 4],
          [3, 2, 6, 7],
          [1, 2, 6, 5],
          [0, 3, 7, 4],
        ];

        // Edge colours
        const edgeGlow = "rgba(180, 200, 255, 0.35)";
        const edgeGlowBright = "rgba(180, 200, 255, 0.55)";

        // ── Face collector ─────────────────────────────────────────────────
        const allFaces: Face[] = [];

        const addBoxFaces = (
          corners: { x: number; y: number; depth: number }[],
          fillBase: string,
          edge: string,
          edgeW: number,
          markBack = false,
          markBodyFront = false,
        ) => {
          for (let i = 0; i < 6; i++) {
            const pts = BOX_FACES[i].map((idx) => corners[idx]);
            allFaces.push({
              pts,
              fillColor: fillBase,
              edgeColor: edge,
              edgeWidth: edgeW,
              isFront: false,
              isBack: markBack && i === 0,
              isBodyFront: markBodyFront && i === 1,
              avgDepth: pts.reduce((s, p) => s + p.depth, 0) / pts.length,
            });
          }
        };

        const addCylinder = (
          bx: number,
          by: number,
          bz: number,
          r: number,
          len: number,
          fillBase: string,
          edge: string,
          edgeW: number,
          markFrontCap: boolean,
        ) => {
          const NUM_SEGS = 20;
          const basePts: { x: number; y: number; z: number }[] = [];
          const frontPts: { x: number; y: number; z: number }[] = [];

          for (let i = 0; i < NUM_SEGS; i++) {
            const a = (i / NUM_SEGS) * Math.PI * 2;
            const lx = Math.cos(a) * r;
            const ly = Math.sin(a) * r;
            basePts.push({
              x: bx + rightX * lx + upX * ly,
              y: by + rightY * lx + upY * ly,
              z: bz + rightZ * lx + upZ * ly,
            });
            frontPts.push({
              x: bx + dirX * len + rightX * lx + upX * ly,
              y: by + dirY * len + rightY * lx + upY * ly,
              z: bz + dirZ * len + rightZ * lx + upZ * ly,
            });
          }

          // Side quads
          for (let i = 0; i < NUM_SEGS; i++) {
            const ni = (i + 1) % NUM_SEGS;
            const pts = [
              basePts[i],
              basePts[ni],
              frontPts[ni],
              frontPts[i],
            ].map((pt) => project(pt.x, pt.y, pt.z));
            allFaces.push({
              pts,
              fillColor: fillBase,
              edgeColor: edge,
              edgeWidth: edgeW,
              isFront: false,
              isBack: false,
              isBodyFront: false,
              avgDepth: pts.reduce((s, p) => s + p.depth, 0) / pts.length,
            });
          }

          // Front cap
          const capPts = frontPts.map((p) => project(p.x, p.y, p.z));
          allFaces.push({
            pts: capPts,
            fillColor: fillBase,
            edgeColor: edge,
            edgeWidth: edgeW,
            isFront: markFrontCap,
            isBack: false,
            isBodyFront: false,
            avgDepth: capPts.reduce((s, p) => s + p.depth, 0) / capPts.length,
          });
        };

        // ── Add all camera parts ───────────────────────────────────────────
        addBoxFaces(
          bodyCorners,
          "rgba(35, 38, 45, 0.92)",
          edgeGlow,
          1.0,
          true,
          true,
        );
        addBoxFaces(
          gripCorners,
          "rgba(30, 33, 40, 0.9)",
          edgeGlow,
          0.7,
          false,
          false,
        );
        addCylinder(
          lensCx,
          lensCy,
          lensCz,
          lensR,
          lensLen,
          "rgba(28, 30, 38, 0.95)",
          edgeGlowBright,
          0.8,
          true,
        );
        addBoxFaces(
          vfCorners,
          "rgba(40, 43, 50, 0.9)",
          edgeGlow,
          0.8,
          false,
          false,
        );

        // Targeting laser from lens tip to sphere centre
        const lensTip = project(
          lensCx + dirX * lensLen,
          lensCy + dirY * lensLen,
          lensCz + dirZ * lensLen,
        );
        allFaces.push({
          pts: [lensTip, centerScreen],
          fillColor: "",
          edgeColor: "",
          edgeWidth: 0,
          isFront: false,
          isBack: false,
          isBodyFront: false,
          avgDepth: (lensTip.depth + centerScreen.depth) / 2,
          isLine: true,
        });

        // ── Painter's sort & draw ─────────────────────────────────────────
        allFaces.sort((a, b) => a.avgDepth - b.avgDepth);
        ctx.lineJoin = "round";

        for (const face of allFaces) {
          // ── Targeting laser ───────────────────────────────────────────
          if (face.isLine) {
            ctx.save();
            ctx.strokeStyle = "rgba(180, 210, 255, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "rgba(160, 200, 255, 0.9)";
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(face.pts[0].x, face.pts[0].y);
            ctx.lineTo(face.pts[1].x, face.pts[1].y);
            ctx.stroke();
            ctx.restore();
            continue;
          }

          // ── Fill + glow edges ─────────────────────────────────────────
          ctx.beginPath();
          ctx.moveTo(face.pts[0].x, face.pts[0].y);
          for (let i = 1; i < face.pts.length; i++)
            ctx.lineTo(face.pts[i].x, face.pts[i].y);
          ctx.closePath();
          ctx.fillStyle = face.fillColor;
          ctx.fill();

          ctx.save();
          ctx.shadowColor = "rgba(160, 190, 255, 0.4)";
          ctx.shadowBlur = 3;
          ctx.strokeStyle = face.edgeColor;
          ctx.lineWidth = face.edgeWidth;
          ctx.stroke();
          ctx.restore();

          ctx.strokeStyle = face.edgeColor;
          ctx.lineWidth = face.edgeWidth * 0.5;
          ctx.stroke();

          // ── Back LCD screen inset ─────────────────────────────────────
          if (face.isBack) {
            const scx =
              (face.pts[0].x + face.pts[1].x + face.pts[2].x + face.pts[3].x) /
              4;
            const scy =
              (face.pts[0].y + face.pts[1].y + face.pts[2].y + face.pts[3].y) /
              4;
            const screenPts = face.pts.map((p) => ({
              x: scx + (p.x - scx) * 0.82,
              y: scy + (p.y - scy) * 0.75,
            }));

            ctx.beginPath();
            ctx.moveTo(screenPts[0].x, screenPts[0].y);
            for (let i = 1; i < screenPts.length; i++)
              ctx.lineTo(screenPts[i].x, screenPts[i].y);
            ctx.closePath();
            ctx.fillStyle = "rgba(18, 20, 26, 0.98)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Subtle specular highlight on top-left corner
            ctx.beginPath();
            ctx.moveTo(screenPts[0].x, screenPts[0].y);
            ctx.lineTo(screenPts[1].x, screenPts[1].y);
            ctx.lineTo(screenPts[2].x, screenPts[2].y);
            ctx.closePath();
            ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
            ctx.fill();
          }

          // ── Lens glass rings & gradient ───────────────────────────────
          if (face.isFront) {
            // Projects a concentric ring of lens-local radius rScale onto the screen.
            const getCirclePts = (rScale: number) => {
              const pts = [];
              for (let i = 0; i < 20; i++) {
                const a = (i / 20) * Math.PI * 2;
                const lx = Math.cos(a) * lensR * rScale;
                const ly = Math.sin(a) * lensR * rScale;
                pts.push(
                  project(
                    lensCx + dirX * lensLen + rightX * lx + upX * ly,
                    lensCy + dirY * lensLen + rightY * lx + upY * ly,
                    lensCz + dirZ * lensLen + rightZ * lx + upZ * ly,
                  ),
                );
              }
              return pts;
            };

            const drawRing = (pts: { x: number; y: number }[]) => {
              ctx.beginPath();
              ctx.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++)
                ctx.lineTo(pts[i].x, pts[i].y);
              ctx.closePath();
            };

            // Mid ring
            ctx.strokeStyle = "rgba(180, 200, 255, 0.45)";
            ctx.lineWidth = 1.0;
            drawRing(getCirclePts(0.7));
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = "rgba(160, 190, 255, 0.3)";
            ctx.lineWidth = 0.6;
            drawRing(getCirclePts(0.4));
            ctx.stroke();

            // Glass gradient fill
            const lfc = project(
              lensCx + dirX * lensLen,
              lensCy + dirY * lensLen,
              lensCz + dirZ * lensLen,
            );
            const lensGrad = ctx.createRadialGradient(
              lfc.x,
              lfc.y,
              0,
              lfc.x,
              lfc.y,
              8,
            );
            lensGrad.addColorStop(0, "rgba(100, 160, 255, 0.4)");
            lensGrad.addColorStop(0.6, "rgba(60,  100, 200, 0.2)");
            lensGrad.addColorStop(1, "rgba(40,   70, 150, 0.05)");
            ctx.fillStyle = lensGrad;
            drawRing(getCirclePts(0.85));
            ctx.fill();

            // Outer glow ring
            ctx.save();
            ctx.shadowColor = "rgba(160, 190, 255, 0.6)";
            ctx.shadowBlur = 6;
            ctx.strokeStyle = "rgba(180, 200, 255, 0.4)";
            ctx.lineWidth = 1.2;
            drawRing(getCirclePts(0.95));
            ctx.stroke();
            ctx.restore();
          }

          // ── Red recording dot on body front ───────────────────────────
          if (face.isBodyFront) {
            const dot3D = {
              x:
                camPosX +
                dirX * bodyD +
                rightX * bodyW * 0.6 +
                upX * bodyH * 0.6,
              y:
                camPosY +
                dirY * bodyD +
                rightY * bodyW * 0.6 +
                upY * bodyH * 0.6,
              z:
                camPosZ +
                dirZ * bodyD +
                rightZ * bodyW * 0.6 +
                upZ * bodyH * 0.6,
            };
            const dot = project(dot3D.x, dot3D.y, dot3D.z);

            const glow = ctx.createRadialGradient(
              dot.x,
              dot.y,
              0,
              dot.x,
              dot.y,
              5,
            );
            glow.addColorStop(0, "rgba(255, 40, 40, 0.8)");
            glow.addColorStop(0.5, "rgba(255, 40, 40, 0.2)");
            glow.addColorStop(1, "rgba(255, 40, 40, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 60, 60, 1)";
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // ── Centre crosshair ─────────────────────────────────────────────
        ctx.lineJoin = "miter";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 0.8;
        const crossSize = 5;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x - crossSize, centerScreen.y);
        ctx.lineTo(centerScreen.x + crossSize, centerScreen.y);
        ctx.moveTo(centerScreen.x, centerScreen.y - crossSize);
        ctx.lineTo(centerScreen.x, centerScreen.y + crossSize);
        ctx.stroke();
      },
      [],
    );

    // Redraw on prop changes (not during drag — drag has its own rAF loop)
    useEffect(() => {
      if (!isDragging.current) drawSphere(rotation, tilt);
    }, [rotation, tilt, drawSphere]);

    // Keep stable refs so mouse handlers are never stale
    const drawSphereRef = useRef(drawSphere);
    drawSphereRef.current = drawSphere;
    const onDragEndRef = useRef(onDragEnd);
    onDragEndRef.current = onDragEnd;

    // Window-level mouse listeners so dragging continues outside the canvas
    useEffect(() => {
      const onMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };

        liveRotation.current += dx * 0.8;
        liveTilt.current = Math.max(
          -30,
          Math.min(60, liveTilt.current - dy * 0.8),
        );

        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          drawSphereRef.current(liveRotation.current, liveTilt.current, true);
          rafId.current = null;
        });
      };

      const onUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        let rawRot = liveRotation.current % 360;
        if (rawRot < 0) rawRot += 360;
        const snappedRot = snapToNearest(rawRot, ROTATION_VALUES);
        const snappedTilt = snapToNearest(liveTilt.current, TILT_VALUES);

        liveRotation.current = snappedRot;
        liveTilt.current = snappedTilt;

        drawSphereRef.current(snappedRot, snappedTilt);
        onDragEndRef.current(snappedRot, snappedTilt);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    return (
      <canvas
        ref={canvasRef}
        className="h-[160px] w-[160px] cursor-grab active:cursor-grabbing"
        style={{ width: "160px", height: "160px" }}
        onMouseDown={handleMouseDown}
      />
    );
  },
);

OrbitSphere.displayName = "OrbitSphere";
