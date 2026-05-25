import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  })),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    canvas: { width: 800, height: 600 },
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
  })),
});

const MOTION_PASSTHROUGH_PROPS = new Set([
  'whileInView', 'whileHover', 'whileTap', 'whileFocus', 'whileDrag',
  'animate', 'initial', 'exit', 'transition', 'variants',
  'viewport', 'layout', 'layoutId', 'drag', 'dragConstraints',
  'onDragStart', 'onDragEnd', 'onAnimationComplete',
]);

vi.mock('motion/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const { forwardRef, createElement } = React;

  const makeMotionEl = (tag: string) =>
    forwardRef(({ children, ...props }: any, ref: any) => {
      const clean: Record<string, unknown> = {};
      for (const k of Object.keys(props)) {
        if (!MOTION_PASSTHROUGH_PROPS.has(k)) {
          clean[k] = props[k];
        }
      }
      return createElement(tag as any, { ...clean, ref }, children);
    });

  const motion = new Proxy({} as Record<string, ReturnType<typeof makeMotionEl>>, {
    get(cache, tag: string) {
      if (!cache[tag]) cache[tag] = makeMotionEl(tag);
      return cache[tag];
    },
  });

  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: { get: () => 0, onChange: vi.fn() } }),
    useTransform: (_v: any, _i: any, output: any[]) => output?.[0] ?? 0,
    useSpring: (v: any) => v,
    useMotionValue: (initial: any) => ({
      get: () => initial,
      set: vi.fn(),
      onChange: vi.fn(),
    }),
    motionValue: (v: any) => ({ get: () => v, set: vi.fn() }),
    MotionConfig: ({ children }: any) => children,
    animate: vi.fn(() => ({ stop: vi.fn(), play: vi.fn(), pause: vi.fn(), complete: vi.fn(), then: vi.fn(), cancel: vi.fn() })),
    scroll: vi.fn(),
    stagger: vi.fn((delay: number) => delay),
    inView: vi.fn(() => () => {}),
  };
});
