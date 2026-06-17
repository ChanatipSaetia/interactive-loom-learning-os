import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import { animate } from 'animejs';
import type { FlowchartViewNode, TransformState, PinchState } from './types';

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
  focusOnNodes: (nodeIds: string[]) => void;
  fitToScreen: (minX: number, maxX: number, minY: number, maxY: number) => void;
  resetTransform: () => void;
}

export function useCamera({ positionedNodesRef }: UseCameraOptions): UseCameraReturn {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState<TransformState>({ scale: 0.9, translateX: 50, translateY: 100 });
  const transformRef = useRef(transform);
  useEffectSyncRef(transform, transformRef);

  const panAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const cameraAnimating = useRef(false);

  const [isPanning, setIsPanning] = useState(false);
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

  const focusOnNodes = useCallback((nodeIds: string[]) => {
    if (!svgRef.current || !nodeIds || nodeIds.length === 0) return;
    const nodes = positionedNodesRef.current;
    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeIds.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;
      const nw = 140;
      const nh = 100;
      minX = Math.min(minX, node.x - nw / 2);
      minY = Math.min(minY, node.y - nh / 2);
      maxX = Math.max(maxX, node.x + nw / 2);
      maxY = Math.max(maxY, node.y + nh / 2);
    });
    if (minX === Infinity) return;

    const viewportW = svgRef.current.clientWidth;
    const viewportH = svgRef.current.clientHeight;
    const padding = Math.min(viewportW * 0.1, 80);

    const bboxW = Math.max(maxX - minX, 1);
    const bboxH = Math.max(maxY - minY, 1);
    const targetScale = Math.min(
      (viewportW - padding * 2) / bboxW,
      (viewportH - padding * 2) / bboxH,
      0.8
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetX = viewportW / 2 - centerX * targetScale;
    const targetY = (viewportH / 2 - 100) - centerY * targetScale;
    animateTo(targetX, targetY, targetScale);
  }, [animateTo, positionedNodesRef]);

  const fitToScreen = useCallback((minX: number, maxX: number, minY: number, maxY: number) => {
    if (!svgRef.current) return;
    const W = svgRef.current.clientWidth || 800;
    const H = svgRef.current.clientHeight || 500;
    const nx = minX + (maxX - minX) / 2;
    const ny = minY + (maxY - minY) / 2;
    animateTo(W / 2 - nx * 0.45, H / 2 - ny * 0.45, 0.45);
  }, [animateTo]);

  const resetTransform = useCallback(() => {
    animateTo(50, 100, 0.45);
  }, [animateTo]);

  // Interaction handlers
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (isPanning) {
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setTransform(() => ({
        scale: transformRef.current.scale,
        translateX: panStartRef.current.baseTranslateX + dx,
        translateY: panStartRef.current.baseTranslateY + dy
      }));
    }
  }, [isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 };
  }, []);

  const onWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const currentScale = transformRef.current.scale;
    const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)));
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    const svgMouseX = mouseX / currentScale;
    const svgMouseY = mouseY / currentScale;
    const scaleFactor = newScale / currentScale;
    setTransform(prev => ({
      scale: newScale,
      translateX: prev.translateX + svgMouseX * (1 - scaleFactor),
      translateY: prev.translateY + svgMouseY * (1 - scaleFactor)
    }));
  }, []);

  const onSvgTouchStartNative = useCallback((e: TouchEvent) => {
    const target = e.target as Element;
    if (target && typeof target.closest === 'function') {
      if (target.closest('.flowchart-node-group') || target.closest('foreignObject')) {
        return;
      }
    }
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { active: true, initialDist: dist, initialScale: transformRef.current.scale };
      setIsPanning(false);
      return;
    }
    if (e.touches.length === 1) {
      e.preventDefault();
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
      const newScale = Math.min(3, Math.max(0.15, pinchRef.current.initialScale * scaleRatio));
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
      const svgCenterX = (centerX - rect.width / 2) / currentScale;
      const svgCenterY = (centerY - rect.height / 2) / currentScale;
      const scaleFactor = newScale / currentScale;
      setTransform(prev => ({
        scale: newScale,
        translateX: prev.translateX + svgCenterX * (1 - scaleFactor),
        translateY: prev.translateY + svgCenterY * (1 - scaleFactor)
      }));
      return;
    }
    if (e.touches.length === 1 && isPanning) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }, [handlePointerMove, isPanning]);

  const onSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.flowchart-node-group') || (e.target as Element).closest('foreignObject')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseTranslateX: transformRef.current.translateX,
      baseTranslateY: transformRef.current.translateY
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.15, prev.scale - 0.1) }));
  }, []);

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
    focusOnNodes,
    fitToScreen,
    resetTransform
  };
}

function useEffectSyncRef<T>(value: T, ref: MutableRefObject<T>) {
  ref.current = value;
}
