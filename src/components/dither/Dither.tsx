'use client';

import { useEffect, useRef } from 'react';

const vertexShader = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform float mouseStrength;
uniform float mouseRadius;
uniform float colorNum;
uniform float pixelSize;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float weight = 0.57;
  for (int i = 0; i < 3; i++) {
    value += weight * noise(p);
    p = p * 2.03 + 11.7;
    weight *= 0.3;
  }
  return value;
}
float bayer2(vec2 p) { return mod(2.0 * p.x + 3.0 * p.y, 4.0); }
void main() {
  vec2 cell = floor(gl_FragCoord.xy / pixelSize);
  vec2 uv = cell * pixelSize / resolution - 0.5;
  uv.x *= resolution.x / resolution.y;
  vec2 mouse = mousePos - 0.5;
  mouse.x *= resolution.x / resolution.y;
  float drift = time * waveSpeed;
  vec2 p = uv * waveFrequency;
  float warp = fbm(p + vec2(drift, -drift * 0.7));
  float n = fbm(p + vec2(warp, -warp) * waveAmplitude * 4.0 - drift);
  float influence = 1.0 - smoothstep(0.0, max(mouseRadius, 0.001), length(uv - mouse));
  float field = clamp((n - 0.18) * 2.4 - influence * mouseStrength * 0.24, 0.0, 1.0);
  // Ordered 4x4 dithering keeps the original pixel-grain identity in a single pass.
  float threshold = (4.0 * bayer2(mod(cell, 2.0)) + bayer2(floor(mod(cell, 4.0) / 2.0)) + 0.5) / 16.0;
  float levels = max(colorNum - 1.0, 1.0);
  float value = floor(clamp(field + (threshold - 0.5) / levels, 0.0, 1.0) * levels + 0.5) / levels;
  gl_FragColor = vec4(waveColor, value * 0.85);
}
`;

interface DitherProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
}

export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.72, 0.72, 0.72],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.3,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [red, green, blue] = waveColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (() => {
      try {
        return canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: false });
      } catch {
        return null;
      }
    })();
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!program || !buffer) {
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const resolution = uniform('resolution');
    const time = uniform('time');
    const mousePos = uniform('mousePos');
    const mouseStrength = uniform('mouseStrength');
    gl.uniform1f(uniform('waveSpeed'), waveSpeed);
    gl.uniform1f(uniform('waveFrequency'), waveFrequency);
    gl.uniform1f(uniform('waveAmplitude'), waveAmplitude);
    gl.uniform3f(uniform('waveColor'), red, green, blue);
    gl.uniform1f(uniform('mouseRadius'), mouseRadius);
    gl.uniform1f(uniform('colorNum'), colorNum);
    gl.uniform1f(uniform('pixelSize'), Math.max(pixelSize, 1));

    const finePointer = window.matchMedia('(pointer: fine)');
    let visible = false;
    let lost = false;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let targetX = 0.5;
    let targetY = 0.5;
    let x = 0.5;
    let y = 0.5;
    let targetStrength = 0;
    let strength = 0;

    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || lost) return;
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (!disableAnimation) elapsed += delta;
      if (!finePointer.matches) targetStrength = 0;
      const easing = 1 - Math.exp(-delta * 5);
      x += (targetX - x) * easing;
      y += (targetY - y) * easing;
      strength += (targetStrength - strength) * easing;
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolution, width, height);
      gl.uniform1f(time, elapsed);
      gl.uniform2f(mousePos, x, y);
      gl.uniform1f(mouseStrength, strength);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!disableAnimation) frame = requestAnimationFrame(render);
    };
    const updateRunning = () => {
      if (visible && !document.hidden && !lost) {
        if (!frame) frame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        targetStrength = 0;
      }
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateRunning();
    });
    if (observer) observer.observe(canvas);
    else {
      visible = true;
      updateRunning();
    }
    const move = (event: PointerEvent) => {
      if (!enableMouseInteraction || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom || !rect.width || !rect.height) {
        targetStrength = 0;
        return;
      }
      targetX = (event.clientX - rect.left) / rect.width;
      targetY = 1 - (event.clientY - rect.top) / rect.height;
      targetStrength = 1;
    };
    const leave = () => { targetStrength = 0; };
    const pointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) leave();
    };
    const contextLost = () => {
      lost = true;
      canvas.style.visibility = 'hidden';
      updateRunning();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerout', pointerOut);
    window.addEventListener('blur', leave);
    window.addEventListener('scroll', leave, { passive: true });
    document.addEventListener('visibilitychange', updateRunning);
    canvas.addEventListener('webglcontextlost', contextLost);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', pointerOut);
      window.removeEventListener('blur', leave);
      window.removeEventListener('scroll', leave);
      document.removeEventListener('visibilitychange', updateRunning);
      canvas.removeEventListener('webglcontextlost', contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [waveSpeed, waveFrequency, waveAmplitude, red, green, blue, colorNum, pixelSize, disableAnimation, enableMouseInteraction, mouseRadius]);

  return <canvas ref={canvasRef} className="dither-container" />;
}
