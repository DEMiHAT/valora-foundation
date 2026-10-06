"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import type { BufferGeometry, NormalBufferAttributes } from "three";

export type SculptureVariant = "orbit" | "growth" | "bloom" | "assembly";

/** Lazy, locally rendered 3D. No remote model, texture or tracking requests. */
export function SculptureScene({
  variant = "orbit", className = "", seed = 0, controls = true,
}: {variant?: SculptureVariant; className?: string; seed?: number; controls?: boolean}) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const pausedRef = useRef(paused);
  const wake = useRef<(() => void) | undefined>(undefined);
  useEffect(() => { pausedRef.current = paused; wake.current?.(); }, [paused]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false, dispose: (() => void) | undefined, started = false;
    setReady(false);

    const start = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        const THREE = await import("three");
        if (cancelled) return;
        const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: "low-power"});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
        renderer.domElement.setAttribute("aria-hidden", "true");
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
        camera.position.set(0, .1, 7.2);
        const group = new THREE.Group();
        scene.add(group);
        const gold = new THREE.MeshStandardMaterial({color: 0xd9ad62, metalness: .65, roughness: .24});
        const darkGold = new THREE.MeshStandardMaterial({color: 0x86471e, metalness: .5, roughness: .32});
        const ivory = new THREE.MeshStandardMaterial({color: 0xf0dbb6, metalness: .2, roughness: .34});
        const wine = new THREE.MeshStandardMaterial({color: 0x651733, metalness: .25, roughness: .3});
        const leafMaterial = new THREE.MeshStandardMaterial({color: 0x769b58, metalness: .08, roughness: .48, side: THREE.DoubleSide});
        const stemMaterial = new THREE.MeshStandardMaterial({color: 0x49613a, roughness: .7});
        const soilMaterial = new THREE.MeshStandardMaterial({color: 0x35251d, roughness: 1});
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xe4bd79, transparent: true, opacity: .38});
        const geometries: {dispose(): void}[] = [];
        const leafSway: ((time:number)=>void)[] = [];
        const mesh = (geometry: BufferGeometry<NormalBufferAttributes>, material = gold) => {
          geometries.push(geometry);
          const object = new THREE.Mesh(geometry, material);
          group.add(object);
          return object;
        };
        const ambient = new THREE.HemisphereLight(0xffefd8, variant === "growth" ? 0x253425 : 0x521c36, 2.6);
        scene.add(ambient);
        const key = new THREE.DirectionalLight(0xffe5af, 5); key.position.set(-3, 4, 4); scene.add(key);
        const rim = new THREE.DirectionalLight(variant === "growth" ? 0xe5efbc : 0xff768b, 3.5); rim.position.set(4, 1, -2); scene.add(rim);
        const fill = new THREE.DirectionalLight(0xffffff, 2); fill.position.set(2, -2, 3); scene.add(fill);

        if (variant === "orbit") {
          const coreGeometry = new THREE.IcosahedronGeometry(1.06, 2);
          const core = mesh(coreGeometry, darkGold);
          core.rotation.set(.1, .25, .2);
          const wireGeometry = new THREE.WireframeGeometry(coreGeometry); geometries.push(wireGeometry);
          group.add(new THREE.LineSegments(wireGeometry, lineMaterial));
          const bands = [[1.58,.07,.8,.2], [1.86,.026,-.6,-.5], [2.12,.012,.35,1.1]];
          bands.forEach(([radius, tube, x, y]) => { const band = mesh(new THREE.TorusGeometry(radius,tube,12,100)); band.rotation.set(x,y,.3); });
          [[-1.55,.9,.3,.18],[1.7,-.6,.5,.26],[.7,1.6,-.4,.12]].forEach(([x,y,z,r]) => mesh(new THREE.SphereGeometry(r,20,12),ivory).position.set(x,y,z));
        } else if (variant === "growth") {
          // A living sapling: tapered stem, curved leaf surfaces and visible veins.
          mesh(new THREE.CylinderGeometry(.7,.56,.45,48),ivory).position.y = -1.38;
          mesh(new THREE.CylinderGeometry(.66,.66,.025,48),soilMaterial).position.y = -1.14;
          const stem = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0,-1.13,0),new THREE.Vector3(-.08,-.4,0),
            new THREE.Vector3(.06,.35,0),new THREE.Vector3(0,1.12,.04),
          ]);
          mesh(new THREE.TubeGeometry(stem,40,.035,8,false),stemMaterial);
          const leaves = [
            {y:-.48,angle:1.02,length:1.28,width:.42,depth:.15},
            {y:-.12,angle:-.96,length:1.24,width:.4,depth:-.28},
            {y:.46,angle:.75,length:1.03,width:.34,depth:.1},
            {y:.8,angle:-.52,length:.91,width:.3,depth:.22},
          ];
          leaves.forEach(({y,angle,length,width,depth}) => {
            const positions:number[] = [], indices:number[] = [];
            for(let row=0;row<=24;row++) {
              const t=row/24;
              for(let col=0;col<=10;col++) {
                const s=col/5-1;
                positions.push(s*Math.sin(Math.PI*t)*width,t*length,.2*Math.sin(Math.PI*t)-.16*s*s*Math.sin(Math.PI*t));
                if(row<24&&col<10){const n=row*11+col;indices.push(n,n+1,n+11,n+1,n+12,n+11);}
              }
            }
            const geometry=new THREE.BufferGeometry();
            geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
            geometry.setIndex(indices);geometry.computeVertexNormals();
            const leaf=mesh(geometry,leafMaterial);leaf.position.copy(stem.getPoint((y+1.13)/2.25));leaf.rotation.set(.18,depth,angle);
            const veinCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,.008),new THREE.Vector3(0,length*.5,.208),new THREE.Vector3(0,length,.008)]);
            const vein=mesh(new THREE.TubeGeometry(veinCurve,20,.009,5,false),stemMaterial);
            vein.position.copy(leaf.position);vein.rotation.copy(leaf.rotation);
            leafSway.push(time => {
              leaf.rotation.x = .18 + Math.sin(time*.001 + y*2)*.045;
              vein.rotation.x = leaf.rotation.x;
            });
          });
        } else if (variant === "bloom") {
          for (let i = 0; i < 8; i++) {
            const petal = mesh(new THREE.TorusGeometry(.72,.11,12,60),i % 2 ? gold : ivory);
            const angle = i * Math.PI / 4;
            petal.position.set(Math.cos(angle)*.7,Math.sin(angle)*.7,Math.sin(angle*2)*.18);
            petal.rotation.set(.4,angle,.25);
          }
          mesh(new THREE.SphereGeometry(.5,28,18),darkGold);
        } else {
          const platform = mesh(new THREE.CylinderGeometry(1.65,1.75,.2,64),wine); platform.position.y = -.8;
          mesh(new THREE.SphereGeometry(.65,28,18),darkGold).position.y = .25;
          const ring = mesh(new THREE.TorusGeometry(.95,.035,10,70),ivory); ring.rotation.x = .65; ring.position.y = .25;
          for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 + seed * .15;
            const block = mesh(new THREE.BoxGeometry(.35,.48,.22),i === seed % 6 ? ivory : gold);
            block.position.set(Math.cos(angle)*1.2,-.45,Math.sin(angle)*1.2);
            block.rotation.y = -angle;
          }
          group.rotation.x = .18;
        }

        let frame = 0, visible = true, lost = false, previous = 0, rotation = .15 + seed * .3;
        const pointer = {x: 0, y: 0}, current = {x: 0, y: 0};
        const render = () => {
          current.x += (pointer.x - current.x) * .08;
          current.y += (pointer.y - current.y) * .08;
          group.rotation.y = rotation + current.x * .38;
          group.rotation.x = (variant === "assembly" ? .18 : -.08) + current.y * .25;
          renderer.render(scene, camera);
        };
        const animate = (time: number) => {
          frame = 0;
          if (lost || !visible || document.hidden || pausedRef.current || reduced) return;
          if (time - previous >= 1000 / 30) {
            if (variant === "growth") {
              rotation = .15 + Math.sin(time * .00028) * .14;
              leafSway.forEach(sway => sway(time));
            } else rotation += Math.min(time - previous, 60) * .00012;
            group.position.y = variant === "growth" ? 0 : Math.sin(time * .0007) * .055;
            render(); previous = time;
          }
          frame = requestAnimationFrame(animate);
        };
        const resume = () => {
          if (cancelled || lost) return;
          render();
          if (!frame && visible && !document.hidden && !pausedRef.current && !reduced) {
            previous = performance.now(); frame = requestAnimationFrame(animate);
          } else if (frame && (pausedRef.current || reduced || !visible || document.hidden)) {
            cancelAnimationFrame(frame); frame = 0;
          }
        };
        const resize = () => {
          const {width, height} = element.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width,height,false);
          camera.aspect = width / height;
          // Keep the whole sculpture in frame on narrow mobile containers.
          camera.position.z = camera.aspect < .9 ? 8.3 : 7.2;
          camera.updateProjectionMatrix(); render();
        };
        const move = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
          pointer.y = (event.clientY - rect.top) / rect.height * 2 - 1;
          if (reduced || pausedRef.current) { current.x = pointer.x; current.y = pointer.y; render(); }
        };
        const leave = () => { pointer.x = 0; pointer.y = 0; if (reduced || pausedRef.current) {current.x = 0; current.y = 0; render();} };
        const contextLost = (event: Event) => { event.preventDefault(); lost = true; if (frame) cancelAnimationFrame(frame); frame = 0; setReady(false); };
        const contextRestored = () => { lost = false; resize(); resume(); setReady(true); };
        const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); });
        visibility.observe(element);
        const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
        element.addEventListener("pointermove",move);
        element.addEventListener("pointerleave",leave);
        renderer.domElement.addEventListener("webglcontextlost",contextLost);
        renderer.domElement.addEventListener("webglcontextrestored",contextRestored);
        document.addEventListener("visibilitychange",resume);
        wake.current = resume;
        resize(); resume(); setReady(true);
        dispose = () => {
          cancelAnimationFrame(frame); visibility.disconnect(); resizeObserver.disconnect();
          element.removeEventListener("pointermove",move); element.removeEventListener("pointerleave",leave);
          document.removeEventListener("visibilitychange",resume);
          renderer.domElement.removeEventListener("webglcontextlost",contextLost);
          renderer.domElement.removeEventListener("webglcontextrestored",contextRestored);
          geometries.forEach(geometry => geometry.dispose());
          [gold,darkGold,ivory,wine,leafMaterial,stemMaterial,soilMaterial,lineMaterial].forEach(material => material.dispose());
          renderer.dispose(); renderer.domElement.remove(); wake.current = undefined;
        };
      } catch {
        // The sculptural CSS fallback remains visible on devices without WebGL.
        if (!cancelled) setReady(false);
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { void start(); observer.disconnect(); }
    }, {rootMargin: "150px"});
    observer.observe(element);
    return () => {cancelled = true; observer.disconnect(); dispose?.();};
  }, [variant, seed, reduced]);

  return <div className={`sculpture-scene ${className}`} role="group" aria-label={variant === "growth" ? "A green sapling with curved leaves growing from an ivory planter" : "Interactive sculptural illustration"}>
    <div className="sculpture-canvas" ref={host} />
    {!ready && <div className={`sculpture-fallback sculpture-fallback-${variant}`} aria-hidden="true"><span /><span /><span /></div>}
    {controls && ready && !reduced && <button type="button" className="sculpture-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? "Resume 3D animation" : "Pause 3D animation"}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
  </div>;
}
