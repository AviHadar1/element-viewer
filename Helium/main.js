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

    const axisFormula = "PN[R0N0E0]NP";
    const cameraDistance = parseFloat("45") || 40;
    const title = "Helium 2   He-4";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

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

    // --- parse formula ---
    const regex = /(P|N|X|\[R\d+N\d+E-?\d+\])/g;
    const parts = axisFormula.match(regex) || [];
    const zParts = parts.filter(p => p === 'P' || p === 'N' || p === 'X');
    let z = -((zParts.length - 1) / 2) * 2;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part === 'P' || part === 'N') {
            const color = part === 'N' ? 0x66ccff : 0xff9933;
            const sphere = createSphere(color);
            sphere.position.set(0, 0, z);
            centralGroup.add(sphere);
            z += 2;
        }

        else if (part.startsWith('[R') && part.endsWith(']')) {
            const match = part.match(/\[R(\d+)N(\d+)E(-?\d+)\]/);
            if (!match) continue;

            const protons = parseInt(match[1]);
            const neutrons = parseInt(match[2]);
            const tiltDeg = parseFloat(match[3]);
            const tiltRad = tiltDeg * Math.PI / 180;
            const radius = 2.0;
            const neutronOffset = -1.1; // מקרב את הניוטרון למרכז

            let offset = -2;
            if (parts[i - 1] === 'N' && parts[i - 2] === 'P' && parts[i + 1] === 'N' && parts[i + 2] === 'P') {
                offset = -1;
                console.log("Ring offset applied at index", i);
            }
            if (parts[i - 1] === 'N' && parts[i + 1] === 'N' && parts[i + 2] === 'N') {
                offset = -1;
                console.log("Ring offset applied at index", i);
            }
            //if (parts[i + 1] === 'N' || parts[i + 2] === 'N') {
            //    offset = 2;
            //    console.log("Ring offset applied at index", i);
            //}
            //if (parts[i].startsWith('[R0')) {
            //    offset = 1;
            //    console.log("Ring offset applied at index", i);
            //}

            const wrapper = new THREE.Object3D();
            //wrapper.position.z = z - 1 + offset;
            wrapper.position.z = z + offset;

            const thisRing = new THREE.Object3D();

            // פרוטונים - טבעת חיצונית
            for (let j = 0; j < protons; j++) {
                const angle = j * Math.PI * 2 / protons;
                const r = 3.8;
                const x = Math.cos(angle) * r * Math.cos(tiltRad);
                const y = Math.sin(angle) * r * Math.cos(tiltRad);
                const z_local = r * Math.sin(tiltRad);
                const proton = createSphere(0xff9933);
                proton.position.set(x, y, z_local);
                thisRing.add(proton);
            }

            // ניוטרונים - טבעת פנימית
            for (let j = 0; j < neutrons; j++) {
                const angle = j * Math.PI * 2 / neutrons;
                const r = 1.4;
                const x = Math.cos(angle) * r * Math.cos(tiltRad);
                const y = Math.sin(angle) * r * Math.cos(tiltRad);
                const z_local = r * Math.sin(tiltRad);
                const neutron = createSphere(0x66ccff);
                neutron.position.set(x, y, z_local);
                thisRing.add(neutron);
            }

            wrapper.add(thisRing);
            ringGroup.add(wrapper);
        }
    }

    // --- TITLE OVERLAY ---
    if (title.trim()) {
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

    // --- CONTROL TIME ---
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

        if (lastFrameTime === null) {
            lastFrameTime = currentTime;
        }

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
