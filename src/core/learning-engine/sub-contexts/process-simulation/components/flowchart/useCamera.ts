import { useCallback, useRef, useState, useEffect, type MutableRefObject } from 'react';
import { animate } from 'animejs';
import type { FlowchartViewNode, TransformState, PinchState } from './types';

/** Footprint used for each node when framing it (a little larger than the card itself). */
const FOCUS_NODE_W = 140;
const FOCUS_NODE_H = 100;
/** Bottom strip assumed covered by the journey dock when the caller does not measure it. */
const DOCK_RESERVE = 200;
const FOCUS_MAX_SCALE = 0.5;
const FOCUS_MIN_SCALE = 0.15;
/** Breathing room inside the free area, above and below the framed content. */
const FOCUS_PAD_Y = 16;
/** Only move the caption beside the nodes when that zooms in noticeably closer. */
const SIDE_PLACEMENT_GAIN = 1.15;

export interface NodesBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Canvas-space box around the given nodes, or null when none of them is positioned. */
export function getNodesBBox(nodes: FlowchartViewNode[], nodeIds: string[]): NodesBBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodeIds.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;
    minX = Math.min(minX, node.x - FOCUS_NODE_W / 2);
    minY = Math.min(minY, node.y - FOCUS_NODE_H / 2);
    maxX = Math.max(maxX, node.x + FOCUS_NODE_W / 2);
    maxY = Math.max(maxY, node.y + FOCUS_NODE_H / 2);
  });
  return minX === Infinity ? null : { minX, minY, maxX, maxY };
}

export interface FocusOptions {
  /** Box to keep next to the nodes (the step caption); the camera picks the side that allows the closest zoom. */
  caption?: { width: number; height: number; gap: number };
  /** Screen pixels covered by floating UI at the top (view switcher) and bottom (journey dock). */
  insets?: { top: number; bottom: number };
  /** Closest zoom allowed; framing a whole small map can go closer than framing one step. */
  maxScale?: number;
}

export type CaptionPlacement = 'below' | 'right';

interface UseCameraOptions {
  positionedNodesRef: MutableRefObject<FlowchartViewNode[]>;
}

interface UseCameraReturn {
  transform: TransformState;
  transformRef: MutableRefObject<TransformState>;
  svgRef: MutableRefObject<SVGSVGElement | null>;
  isPanning: boolean;
  setIsPanning: (v: boolean) => void;
  handlePointerMove: (clientX: number, clientY: number) => void;
  handlePointerUp: () => void;
  onWheelNative: (e: WheelEvent) => void;
  onSvgTouchStartNative: (e: TouchEvent) => void;
  onTouchMoveNative: (e: TouchEvent) => void;
  onSvgMouseDown: (e: React.MouseEvent) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  animateTo: (targetX: number, targetY: number, targetScale: number) => void;
  /** Frames a canvas box and returns where the caption fits, or null when nothing was framed. */
  focusOnBox: (bbox: NodesBBox | null, options?: FocusOptions) => CaptionPlacement | null;
  /** Frames the nodes and returns where the caption fits, or null when nothing was framed. */
  focusOnNodes: (nodeIds: string[], options?: FocusOptions) => CaptionPlacement | null;
  fitToScreen: (minX: number, maxX: number, minY: number, maxY: number) => void;
  resetTransform: () => void;
}

export function useCamera({ positionedNodesRef }: UseCameraOptions): UseCameraReturn {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState<TransformState>({ scale: 0.5, translateX: 50, translateY: 100 });
  const transformRef = useRef(transform);
  useEffectSyncRef(transform, transformRef);

  const panAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const cameraAnimating = useRef(false);

  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 });
  const pinchRef = useRef<PinchState>({ active: false, initialDist: 0, initialScale: 1 });

  const animateTo = useCallback((targetX: number, targetY: number, targetScale: number) => {
    if (panAnimRef.current) panAnimRef.current.pause();
    cameraAnimating.current = true;
    const current = transformRef.current;
    const proxy = { tx: current.translateX, ty: current.translateY, sc: current.scale };

    panAnimRef.current = animate(proxy, {
      tx: targetX,
      ty: targetY,
      sc: targetScale,
      duration: 600,
      easing: 'easeInOutQuad',
      onUpdate: () => {
        setTransform({ scale: proxy.sc, translateX: proxy.tx, translateY: proxy.ty });
      },
      onComplete: () => {
        cameraAnimating.current = false;
      }
    });
  }, []);

  const focusOnBox = useCallback((bbox: NodesBBox | null, options: FocusOptions = {}): CaptionPlacement | null => {
    if (!svgRef.current || !bbox) return null;

    const viewportW = svgRef.current.clientWidth;
    const viewportH = svgRef.current.clientHeight;
    const padX = Math.min(viewportW * 0.1, 80);
    const insetTop = options.insets?.top ?? 0;
    const insetBottom = options.insets?.bottom ?? DOCK_RESERVE;
    // Free area between the floating UI; never squeeze it below 40% of the canvas
    const regionH = Math.max(viewportH - insetTop - insetBottom, viewportH * 0.4);
    const availW = viewportW - padX * 2;
    const availH = regionH - FOCUS_PAD_Y * 2;
    const caption = options.caption;

    const bboxW = Math.max(bbox.maxX - bbox.minX, 1);
    const bboxH = Math.max(bbox.maxY - bbox.minY, 1);
    const maxScale = options.maxScale ?? FOCUS_MAX_SCALE;
    const clampScale = (s: number) => Math.max(FOCUS_MIN_SCALE, Math.min(s, maxScale));

    const belowScale = clampScale(Math.min(
      availW / bboxW,
      (availH - (caption ? caption.height + caption.gap : 0)) / bboxH
    ));
    const rightScale = caption && caption.height <= availH
      ? clampScale(Math.min((availW - caption.width - caption.gap) / bboxW, availH / bboxH))
      : 0;
    const placement: CaptionPlacement = rightScale > belowScale * SIDE_PLACEMENT_GAIN ? 'right' : 'below';
    const scale = placement === 'right' ? rightScale : belowScale;

    const regionTop = insetTop + FOCUS_PAD_Y;
    let targetX: number;
    let targetY: number;
    if (placement === 'right') {
      // Nodes and caption side by side, centered as one row
      const groupW = bboxW * scale + caption!.gap + caption!.width;
      targetX = viewportW / 2 - groupW / 2 - bbox.minX * scale;
      targetY = regionTop + (availH - bboxH * scale) / 2 - bbox.minY * scale;
    } else {
      // Nodes with the caption under them, centered as one column
      const groupH = bboxH * scale + (caption ? caption.gap + caption.height : 0);
      targetX = viewportW / 2 - ((bbox.minX + bbox.maxX) / 2) * scale;
      targetY = regionTop + (availH - groupH) / 2 - bbox.minY * scale;
    }
    animateTo(targetX, targetY, scale);
    return placement;
  }, [animateTo]);

  const focusOnNodes = useCallback((nodeIds: string[], options: FocusOptions = {}): CaptionPlacement | null => {
    if (!nodeIds || nodeIds.length === 0) return null;
    return focusOnBox(getNodesBBox(positionedNodesRef.current, nodeIds), options);
  }, [focusOnBox, positionedNodesRef]);

  const fitToScreen = useCallback((minX: number, maxX: number, minY: number, maxY: number) => {
    if (!svgRef.current) return;
    const W = svgRef.current.clientWidth || 800;
    const H = svgRef.current.clientHeight || 500;
    const nx = minX + (maxX - minX) / 2;
    const ny = minY + (maxY - minY) / 2;
    animateTo(W / 2 - nx * 0.4, H / 2 - ny * 0.4, 0.4);
  }, [animateTo]);

  const resetTransform = useCallback(() => {
    animateTo(50, 100, 0.4);
  }, [animateTo]);

  // Interaction handlers
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (isPanningRef.current) {
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setTransform(() => ({
        scale: transformRef.current.scale,
        translateX: panStartRef.current.baseTranslateX + dx,
        translateY: panStartRef.current.baseTranslateY + dy
      }));
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;
    setIsPanning(false);
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 };
  }, []);

  const onWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof (e as any).stopImmediatePropagation === 'function') {
      (e as any).stopImmediatePropagation();
    }
    const delta = -e.deltaY * 0.0015;
    const currentScale = transformRef.current.scale;
    const currentTx = transformRef.current.translateX;
    const currentTy = transformRef.current.translateY;
    const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)));

    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgMouseX = (mouseX - currentTx) / currentScale;
    const svgMouseY = (mouseY - currentTy) / currentScale;

    setTransform({
      scale: newScale,
      translateX: currentTx - svgMouseX * (newScale - currentScale),
      translateY: currentTy - svgMouseY * (newScale - currentScale)
    });
  }, []);

  const onSvgTouchStartNative = useCallback((e: TouchEvent) => {
    const target = e.target as Element;
    if (target && typeof target.closest === 'function') {
      if (
        target.closest('.flowchart-node-group') ||
        target.closest('foreignObject') ||
        target.closest('.flowchart-edge-group') ||
        target.closest('.flowchart-edge')
      ) {
        return;
      }
    }
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { active: true, initialDist: dist, initialScale: transformRef.current.scale };
      isPanningRef.current = false;
      setIsPanning(false);
      return;
    }
    if (e.touches.length === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanning(true);
      const touch = e.touches[0];
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        baseTranslateX: transformRef.current.translateX,
        baseTranslateY: transformRef.current.translateY
      };
    }
  }, []);

  const onTouchMoveNative = useCallback((e: TouchEvent) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleRatio = dist / pinchRef.current.initialDist;
      const currentScale = transformRef.current.scale;
      const currentTx = transformRef.current.translateX;
      const currentTy = transformRef.current.translateY;
      const newScale = Math.min(3, Math.max(0.15, pinchRef.current.initialScale * scaleRatio));

      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;

      const svgCenterX = (centerX - currentTx) / currentScale;
      const svgCenterY = (centerY - currentTy) / currentScale;

      setTransform({
        scale: newScale,
        translateX: currentTx - svgCenterX * (newScale - currentScale),
        translateY: currentTy - svgCenterY * (newScale - currentScale)
      });
      return;
    }
    if (e.touches.length === 1 && isPanningRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }, [handlePointerMove]);

  const onSvgMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    if (
      target.closest('.flowchart-node-group') ||
      target.closest('foreignObject') ||
      target.closest('.flowchart-edge-group') ||
      target.closest('.flowchart-edge')
    ) {
      return;
    }
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseTranslateX: transformRef.current.translateX,
      baseTranslateY: transformRef.current.translateY
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentScale = transformRef.current.scale;
    const currentTx = transformRef.current.translateX;
    const currentTy = transformRef.current.translateY;
    const newScale = Math.min(3, currentScale + 0.1);

    const svgCenterX = (centerX - currentTx) / currentScale;
    const svgCenterY = (centerY - currentTy) / currentScale;

    setTransform({
      scale: newScale,
      translateX: currentTx - svgCenterX * (newScale - currentScale),
      translateY: currentTy - svgCenterY * (newScale - currentScale)
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentScale = transformRef.current.scale;
    const currentTx = transformRef.current.translateX;
    const currentTy = transformRef.current.translateY;
    const newScale = Math.max(0.15, currentScale - 0.1);

    const svgCenterX = (centerX - currentTx) / currentScale;
    const svgCenterY = (centerY - currentTy) / currentScale;

    setTransform({
      scale: newScale,
      translateX: currentTx - svgCenterX * (newScale - currentScale),
      translateY: currentTy - svgCenterY * (newScale - currentScale)
    });
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    svgEl.addEventListener('wheel', onWheelNative, { passive: false });
    svgEl.addEventListener('touchstart', onSvgTouchStartNative, { passive: false });
    svgEl.addEventListener('touchmove', onTouchMoveNative, { passive: false });

    return () => {
      svgEl.removeEventListener('wheel', onWheelNative);
      svgEl.removeEventListener('touchstart', onSvgTouchStartNative);
      svgEl.removeEventListener('touchmove', onTouchMoveNative);
    };
  }, [onWheelNative, onSvgTouchStartNative, onTouchMoveNative]);

  return {
    transform,
    transformRef,
    svgRef,
    isPanning,
    setIsPanning,
    handlePointerMove,
    handlePointerUp,
    onWheelNative,
    onSvgTouchStartNative,
    onTouchMoveNative,
    onSvgMouseDown,
    handleZoomIn,
    handleZoomOut,
    animateTo,
    focusOnBox,
    focusOnNodes,
    fitToScreen,
    resetTransform
  };
}

function useEffectSyncRef<T>(value: T, ref: MutableRefObject<T>) {
  ref.current = value;
}
