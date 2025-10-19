'use strict';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const fov = 40;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    const axisFormula = "PN[R5N6E-1F12]N[R8N8E1F12]P";
    const cameraDistance = parseFloat("30") || 40;
    const title = "Phosphorus 15   P-31";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('white');

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    const centralGroup = new THREE.Object3D();
    scene.add(centralGroup);

    const ringGroup = new THREE.Object3D();
    centralGroup.add(ringGroup);

    const sphereRadius = 1;

    function createSphere(color) {
        const geometry = new THREE.SphereGeometry(sphereRadius, 64, 32);
        const material = new THREE.MeshPhongMaterial({ color });
        return new THREE.Mesh(geometry, material);
    }

    function createFieldDisk(innerR, outerR, color = 0x00aaff, opacity = 0.15) {
        const geometry = new THREE.RingGeometry(innerR, outerR, 64);
        const material = new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity
        });
        const disk = new THREE.Mesh(geometry, material);
        //disk.rotation.x = Math.PI / 2;
        return disk;
    }

    const regex = /(P|N|X|\[R\d+N\d+E-?\d+(?:\.\d+)?F?\d*\])/g;
    const parts = axisFormula.match(regex) || [];

    const zParts = parts.filter(p => p === 'P' || p === 'N' || p === 'X');
    let z = -((zParts.length - 1) / 2) * 2;

    const get = (idx) => (idx >= 0 && idx < parts.length ? parts[idx] : '');
    const isP = (p) => p === 'P';
    const isN = (p) => p === 'N';
    const isRing = (p) => typeof p === 'string' && p.startsWith('[R') && p.endsWith(']');

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part === 'P' || part === 'N') {
            const color = part === 'N' ? 0x66ccff : 0xff9933;
            const sphere = createSphere(color);
            sphere.position.set(0, 0, z);
            centralGroup.add(sphere);

            if (part === 'P') {
                const fieldDisk = createFieldDisk(2.5, 5.0, 0xffaa00, 0.12);
                fieldDisk.position.set(0, 0, z);
                centralGroup.add(fieldDisk);
            }
            z += 2;
        }

        else if (isRing(part)) {
            const match = part.match(/\[R(\d+)N(\d+)E(-?\d+(?:\.\d+)?)F?(\d*)\]/);
            if (!match) continue;

            const protons = parseInt(match[1]);
            const neutrons = parseInt(match[2]);
            const zOffset = parseFloat(match[3]);
            const fieldOuter = match[4] ? parseFloat(match[4]) : 0;
            const tiltRad = 0;

            let offset = -2;
            const prev2 = get(i - 2), prev1 = get(i - 1), next1 = get(i + 1), next2 = get(i + 2);
            if (isN(prev1) && isP(prev2) && isN(next1) && isP(next2)) offset = -1;
            else if (isN(prev1) && isP(prev2) && isRing(next1)) offset = -3.5;
            else if (isRing(prev1) && isP(next1)) offset = -0.5;

            const wrapper = new THREE.Object3D();
            wrapper.position.z = z + offset;

            const thisRing = new THREE.Object3D();

            const outerRing = new THREE.Object3D();
            outerRing.position.z += zOffset;

            for (let j = 0; j < protons; j++) {
                const angle = j * Math.PI * 2 / protons;
                const r = 3.8;
                const x = Math.cos(angle) * r * Math.cos(tiltRad);
                const y = Math.sin(angle) * r * Math.cos(tiltRad);
                const z_local = r * Math.sin(tiltRad);
                const proton = createSphere(0xff9933);
                proton.position.set(x, y, z_local);
                outerRing.add(proton);
            }

            if (fieldOuter > 0) {
                const r_inner = 4.8;
                const r_outer = fieldOuter;
                const fieldDisk = createFieldDisk(r_inner, r_outer, 0x00ffff, 0.10);
                outerRing.add(fieldDisk);
            }

            thisRing.add(outerRing);

            const innerRing = new THREE.Object3D();
            for (let j = 0; j < neutrons; j++) {
                const angle = j * Math.PI * 2 / neutrons;
                const r = 1.4;
                const x = Math.cos(angle) * r * Math.cos(tiltRad);
                const y = Math.sin(angle) * r * Math.cos(tiltRad);
                const z_local = r * Math.sin(tiltRad);
                const neutron = createSphere(0x66ccff);
                neutron.position.set(x, y, z_local);
                innerRing.add(neutron);
            }
            thisRing.add(innerRing);

            wrapper.add(thisRing);
            ringGroup.add(wrapper);
        }
    }

    if (title && title.trim()) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '10px';
        div.style.width = '100%';
        div.style.textAlign = 'center';
        div.style.color = 'white';
        div.style.font = 'bold 28px sans-serif';
        div.style.textShadow = '1px 1px 4px black';
        div.innerText = title;
        document.body.appendChild(div);
    }

    let paused = false;
    let accumulatedTime = 0;
    let lastFrameTime = null;

    window.addEventListener('click', () => {
        paused = !paused;
        if (!paused) {
            lastFrameTime = performance.now();
            requestAnimationFrame(render);
        }
    });

    function render(currentTime) {
        if (paused) return;

        if (lastFrameTime === null) lastFrameTime = currentTime;

        const delta = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        accumulatedTime += delta;

        const t = accumulatedTime * 0.001;

        camera.position.x = Math.sin(t * 0.3) * cameraDistance;
        camera.position.z = Math.cos(t * 0.3) * cameraDistance;
        camera.lookAt(0, 0, 0);

        ringGroup.rotation.z = t * 1.5;

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();