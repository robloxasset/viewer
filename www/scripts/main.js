import * as THREE from '../build/three.module.js';

import { DDSLoader } from '../jsm/loaders/DDSLoader.js';
import { MTLLoader } from '../jsm/loaders/MTLLoader.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';

let camera, scene, renderer;

let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let velocity = 0;
let newFov = 45;
window.activeModel = undefined;

let randomIds = [
    2025110,
    339310190,
    123247,
    1848960,
    63700903,
    29622
];


init();
animate();


function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 250;
    camera.fov = 45;

    // scene

    scene = new THREE.Scene();

    //Load background texture
    const loader = new THREE.TextureLoader();
    loader.load("https://i.imgur.com/kOMEJUq.png", function (texture) {
        scene.background = texture;
    });

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // model

    const onProgress = function (xhr) {

        if (xhr.lengthComputable) {

            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');

        }

    };

    const onError = function () { };

    const manager = new THREE.LoadingManager();
    manager.addHandler(/\.dds$/i, new DDSLoader());

    // comment in the following line and import TGALoader if your asset uses TGA textures
    // manager.addHandler( /\.tga$/i, new TGALoader() );

    window.loadAvatar = function (id) {
        scene.remove(scene.children[2]);
        document.getElementById("loading").style.display = "";
        // Load profile data
        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://users.roblox.com/v1/users/${id}`)}`)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.log("Looks like there was a problem. Status Code: " + response.status);
                        return;
                    }

                    response.json().then(function (data) {
                        let json = JSON.parse(data.contents);
                        console.log(json);
                        document.getElementById("username").innerText = json.name;
                        document.getElementById("userId").innerText = id;
                    });
                }
            )
            .catch(function (err) {
                console.log("Fetch Error: ", err);
            });
        // Load model data
        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.roblox.com/avatar-thumbnail-3d/json?userId=${id}`)}`)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.log("Looks like there was a problem. Status Code: " + response.status);
                        return;
                    }

                    response.json().then(function (data) {
                        let json = JSON.parse(data.contents);
                        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(json.Url)}`)
                            .then(
                                function (response) {
                                    if (response.status !== 200) {
                                        console.log("Looks like there was a problem. Status Code: " + response.status);
                                        return;
                                    }

                                    response.json().then(function (data) {
                                        let json = JSON.parse(data.contents);
                                        console.log(json);
                                        renderAvatar(json.mtl, json.obj, json.textures);
                                    });
                                }
                            )
                            .catch(function (err) {
                                console.log("Fetch Error: ", err);
                            });
                    });
                }
            )
            .catch(function (err) {
                console.log("Fetch Error: ", err);
            });

        function renderAvatar(mtl, obj, img) {
            new MTLLoader(manager)
                .setPath(getHashPath(mtl))
                .load(mtl, function (materials) {

                    console.log("e");
                    console.log(materials);

                    /*
                    materials.materialsInfo.Player1Mtl.map_d = getHashPath(img[1]) + img[1];
                    materials.materialsInfo.Player1Mtl.map_ka = getHashPath(img[1]) + img[1];
                    materials.materialsInfo.Player1Mtl.map_kd = getHashPath(img[1]) + img[1];

                    materials.materialsInfo.Player2Mtl.map_d = getHashPath(img[0]) + img[0];
                    materials.materialsInfo.Player2Mtl.map_ka = getHashPath(img[0]) + img[0];
                    materials.materialsInfo.Player2Mtl.map_kd = getHashPath(img[0]) + img[0];
                    */

                    for (let key of Object.keys(materials.materialsInfo)) {
                        console.log(key);
                        let ind = Object.keys(materials.materialsInfo).length - getNumber(key);
                        let map = getHashPath(img[ind]) + img[ind];
                        console.log(map);
                        materials.materialsInfo[key].map_d = map;
                        materials.materialsInfo[key].map_ka = map;
                        materials.materialsInfo[key].map_kd = map;
                    }

                    materials.preload();
                    console.log(materials);

                    for (let key of Object.keys(materials.materials)) {
                        materials.materials[key].blending = 0;
                    }

                    /*
                    new THREE.TextureLoader()
                        .setPath(getHashPath(img))
                        .load(img, function (texture) {
                            //Update Texture
                            materials.materials.Player1Mtl.map = texture;
                            materials.materials.Player1Mtl.needsUpdate = true;
                        }, onProgress, onError);
                    */

                    new OBJLoader(manager)
                        .setMaterials(materials)
                        .setPath(getHashPath(obj))
                        .load(obj, function (object) {

                            object.scale.set(16, 16, 16);
                            var box = new THREE.Box3().setFromObject(object);
                            object.position.y = -(object.scale.y * 100) - (box.getSize().y / 2);
                            console.log(object.position);
                            object.rotateY(THREE.Math.degToRad(180));

                            activeModel = object;

                            scene.add(object);
                            document.getElementById("loading").style.display = "none";

                        }, onProgress, onError);

                }, onProgress, onError);
        }

        function getHashPath(n) {
            for (var i = 31, t = 0; t < 32; t++) {
                i ^= n[t].charCodeAt(0);
            }
            return "https://t" + (i % 8).toString() + ".rbxcdn.com/";
        }

        function getNumber(str) {
            return parseFloat((str).replace(/\D/g, ""));
        }
    }

    //

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove);

    //

    window.addEventListener('resize', onWindowResize);

    //

    window.loadAvatar(randomIds[Math.floor(Math.random() * randomIds.length)]);

    window.addEventListener("wheel", function (event) {
        if (event.deltaY < 0) {
            if (newFov - 3 > 0) {
                newFov += -3;
            }
        } else if (event.deltaY > 0) {
            if (newFov + 3 < 90) {
                newFov += 3;
            }
        }
    });

    (function () {
        let keys = {
            left: false,
            right: false
        }
        document.addEventListener("keydown", function (event) {
            if ((event.key == "a" || event.key == "ArrowLeft") && keys.left == false) {
                keys.left = true;
                console.log(activeModel);
                console.log(THREE.Math.radToDeg(activeModel.rotation.y));
                velocity = 0.05;
            }
            if ((event.key == "d" || event.key == "ArrowRight") && keys.right == false) {
                keys.right = true;
                velocity = -0.05;
            }
        });
        document.addEventListener("keyup", function (event) {
            if ((event.key == "a" || event.key == "ArrowLeft") && keys.left == true) {
                keys.left = false;
                if (keys.right == false) {
                    velocity = 0;
                }
            }
            if ((event.key == "d" || event.key == "ArrowRight") && keys.right == true) {
                keys.right = false;
                if (keys.left == false) {
                    velocity = 0;
                }
            }
        });
    })();

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;

}

//

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {

    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (- mouseY - camera.position.y) * .05;

    camera.fov += (newFov - camera.fov) * .05;
    camera.updateProjectionMatrix();

    if (activeModel) {
        activeModel.rotation.y = velocity + activeModel.rotation.y;
    }

    camera.lookAt(scene.position);

    renderer.render(scene, camera);

}