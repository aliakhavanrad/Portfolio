//import './css/style.css'
import './Sass/main.scss'
import * as THREE from 'three'
import gsap from 'gsap';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 0
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Particles
 */

const particlesCount = 1000;
const particlesPositions = new Float32Array(particlesCount * 3);
const particlesNoise = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount; i++){

    let i3 = i * 3;

    particlesPositions[i3 + 0] = (Math.random() - 0.5) * 6
    particlesPositions[i3 + 1] = (Math.random() - 0.5) * 6
    particlesPositions[i3 + 2] = (Math.random() - 0.5) * 3 - 3

    particlesNoise[i3 + 0] = (Math.random() * 0.3)
    particlesNoise[i3 + 1] = (Math.random() * 0.3)
    particlesNoise[i3 + 2] = (Math.random() * 0.3)
}

const particlesPositionAttribute = new THREE.BufferAttribute(particlesPositions, 3);
const particlesNoiseAttribute = new THREE.BufferAttribute(particlesNoise, 3);

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', particlesPositionAttribute);
particlesGeometry.setAttribute('aNoise', particlesNoiseAttribute);

// const particleMaterial = new THREE.PointsMaterial({color: '#ffffff'});

// particleMaterial.alphaTest = 0.001;
// particleMaterial.size = 0.01;

const particlesUniforms = {
    uTime: { value : 0 }
};

const particleMaterial = new THREE.ShaderMaterial(
    {
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        uniforms: particlesUniforms,
        vertexShader:
        `
            uniform float uTime;

            attribute vec3 aNoise;    

            varying vec3 vNoise;

            void main()
            {
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                
                modelPosition.x += sin(aNoise.x * uTime * 0.5) * 0.01;
                modelPosition.y += sin(aNoise.y * uTime * 0.5) * 0.01;
                modelPosition.z += sin(aNoise.z * uTime * 0.5) * 0.01;

                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                gl_Position = projectionPosition;
                gl_PointSize = (12.0 + sin(uTime * length(aNoise) * 10.0)) / gl_Position.z;
                
                vNoise = aNoise;
            }
        `,
        fragmentShader:
        `
            uniform float uTime;


            varying vec3 vNoise;

            void main()
            {
                float strength = distance(gl_PointCoord.xy , vec2(0.5));
                
                strength = 1.0 - strength;
                
                strength = pow(strength, 5.0);

                vec3 baseColor = vec3(1.0, 0.2, 0.3);
                // baseColor.r += sin(uTime * 0.1) * 0.3;
                // baseColor.g += sin(uTime * 0.1) * 0.2;
                // baseColor.b += sin(uTime * 0.1) * 0.5;

                //baseColor.r += vNoise.x* 2.0;
                baseColor.g += vNoise.y* 3.0;
                //baseColor.b += vNoise.z* 5.0;

                gl_FragColor = vec4(strength * baseColor , 1.0);
            
            }
        `
    }
);

const particles = new THREE.Points(particlesGeometry, particleMaterial);

scene.add(particles);

/**
 * Mouse Move
 */

const mousePosition = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (event)=> {
    mousePosition.x = event.clientX / sizes.width - 0.5;
    mousePosition.y = -(event.clientY / sizes.height - 0.5);

})

const scroll = {
    y: 0
}

window.addEventListener('scroll', (event) => {
    scroll.y = window.scrollY;
})



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    particlesUniforms.uTime.value = elapsedTime;


    gsap.to(camera.position, { x: mousePosition.x * 0.06, duration: 2 })
    gsap.to(camera.position, { y: mousePosition.y * 0.06, duration: 2 })

    camera.position.z = - scroll.y * 0.0008
    
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()