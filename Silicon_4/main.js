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

    const axisFormula = "PN[R1E-30][R1E-25][R1E-19][R1E-14][R1E-8][R1E-3][R1E3][R1E8][R1E14][R1E19][R1E25][R1E30]NP";
    const cameraDistance = parseFloat("50") || 50;
    const title = "14";

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
    const regex = /(P|N|X|\[R\d+E-?\d+\])/g;
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

        else if (part === 'X') {
            z += 2;
        }

        else if (part.startsWith('[R') && part.endsWith(']')) {
            const match = part.match(/\[R(\d+)E(-?\d+)\]/);
            if (!match) continue;

            const count = parseInt(match[1]);
            const tiltDeg = parseFloat(match[2]);
            const tiltRad = tiltDeg * Math.PI / 180;
            const radius = 3.5;

            const wrapper = new THREE.Object3D();
            wrapper.position.z = z - 1;  // חשוב: הטבעת ממוקמת סביב אותו z, לא מזיזה את הציר

            const thisRing = new THREE.Object3D();
            thisRing.rotation.x = tiltRad;

            for (let j = 0; j < count; j++) {
                const angle = j * Math.PI * 2 / count;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                const neutron = createSphere(0x66ccff);
                neutron.position.set(x, y, 0);
                thisRing.add(neutron);

                const px = Math.cos(angle) * (radius + 2.2);
                const py = Math.sin(angle) * (radius + 2.2);
                const proton = createSphere(0xff9933);
                proton.position.set(px, py, 0);
                thisRing.add(proton);
            }

            wrapper.add(thisRing);
            ringGroup.add(wrapper);

            // אין קידום z לטבעות!
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
