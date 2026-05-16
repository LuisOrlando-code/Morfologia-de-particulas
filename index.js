// ─── Configuración ───────────────────────────────────────────────────────────
const numeroDePArticulas = 6000;

const imagenDeParticula = 'https://motionarray.imgix.net/preview-34649aJ93evd9dG_0008.jpg?w=660&q=60&fit=max&auto=format';
const colorDeParticula  = 0xFFFFFF;
const tamanoDeParticula = 0.2;

const velocidadAnimacionPorDefecto = 1;
const velocidadAnimacionMorph      = 3;

// ─── Disparadores UI ─────────────────────────────────────────────────────────
const disparadores = document.querySelector('.triggers').querySelectorAll('span');

// ─── Stats ───────────────────────────────────────────────────────────────────
var estadisticas = new Stats();
estadisticas.showPanel(0);
document.body.appendChild(estadisticas.dom);

// ─── Renderizador ────────────────────────────────────────────────────────────
var renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(window.devicePixelRatio);
renderizador.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderizador.domElement);

// ─── Cámara ──────────────────────────────────────────────────────────────────
var camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
camara.position.y = 25;
camara.position.z = 36;

// ─── Controles ───────────────────────────────────────────────────────────────
var controles = new THREE.OrbitControls(camara, renderizador.domElement);
controles.update();

// ─── Escena ──────────────────────────────────────────────────────────────────
var escena = new THREE.Scene();

// ─── Resize ──────────────────────────────────────────────────────────────────
function pantallaCompleta() {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', pantallaCompleta, false);

// ─── Material ────────────────────────────────────────────────────────────────
var cargadorDeTextura = new THREE.TextureLoader();
var materialDeParticulas = new THREE.PointsMaterial({
    color:       colorDeParticula,
    size:        tamanoDeParticula,
    map:         cargadorDeTextura.load(imagenDeParticula),
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false
});

// ─── Helper: crear BufferGeometry vacía ──────────────────────────────────────
function crearGeometriaVacia(n) {
    var posiciones = new Float32Array(n * 3);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    return geo;
}

// ─── Helper: rellenar BufferGeometry con puntos ──────────────────────────────
function rellenarGeometria(geo, puntos, desplazamientoY) {
    desplazamientoY = desplazamientoY || 0;
    var attr = geo.getAttribute('position');
    for (var i = 0; i < puntos.length; i++) {
        attr.setXYZ(i, puntos[i].x, puntos[i].y - desplazamientoY, puntos[i].z);
    }
    attr.needsUpdate = true;
}

// ─── Helper: puntos aleatorios en BufferGeometry ─────────────────────────────
// Reemplaza THREE.GeometryUtils.randomPointsInGeometry (eliminado en r125)
function puntosAleatoriosEnGeometria(bufferGeo, n) {
    var posAttr = bufferGeo.getAttribute('position');
    var index   = bufferGeo.index;
    var triangulos = [];
    var areaTotal  = 0;

    var vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    var triCount = index ? index.count / 3 : posAttr.count / 3;

    for (var t = 0; t < triCount; t++) {
        var iA, iB, iC;
        if (index) {
            iA = index.getX(t * 3);
            iB = index.getX(t * 3 + 1);
            iC = index.getX(t * 3 + 2);
        } else {
            iA = t * 3; iB = t * 3 + 1; iC = t * 3 + 2;
        }
        vA.fromBufferAttribute(posAttr, iA);
        vB.fromBufferAttribute(posAttr, iB);
        vC.fromBufferAttribute(posAttr, iC);

        var area = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone()).getArea();
        areaTotal += area;
        triangulos.push({ vA: vA.clone(), vB: vB.clone(), vC: vC.clone(), area: area });
    }

    var puntos = [];
    for (var p = 0; p < n; p++) {
        var r = Math.random() * areaTotal;
        var acum = 0;
        for (var j = 0; j < triangulos.length; j++) {
            acum += triangulos[j].area;
            if (r <= acum) {
                var tri = triangulos[j];
                var u = Math.random(), v = Math.random();
                if (u + v > 1) { u = 1 - u; v = 1 - v; }
                var punto = tri.vA.clone()
                    .addScaledVector(tri.vB.clone().sub(tri.vA), u)
                    .addScaledVector(tri.vC.clone().sub(tri.vA), v);
                puntos.push(punto);
                break;
            }
        }
    }
    return puntos;
}

// ─── Geometrías ──────────────────────────────────────────────────────────────
var conteoDeParticulas = numeroDePArticulas;

var geoParticulas = crearGeometriaVacia(conteoDeParticulas);
var geoEsfera     = crearGeometriaVacia(conteoDeParticulas);
var geoCubo       = crearGeometriaVacia(conteoDeParticulas);
var geoCohete     = crearGeometriaVacia(conteoDeParticulas);
var geoAstronauta = crearGeometriaVacia(conteoDeParticulas);

// Esfera
(function() {
    var geo = new THREE.SphereGeometry(5, 30, 30);
    rellenarGeometria(geoEsfera, puntosAleatoriosEnGeometria(geo, conteoDeParticulas), 0);
    disparadores[0].setAttribute('data-disabled', false);
})();

// Cubo
(function() {
    var geo = new THREE.BoxGeometry(9, 9, 9);
    rellenarGeometria(geoCubo, puntosAleatoriosEnGeometria(geo, conteoDeParticulas), 0);
    disparadores[1].setAttribute('data-disabled', false);
})();

// ─── Carga OBJ ───────────────────────────────────────────────────────────────
const urlDeRecursos = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/605067/';
var cargadorOBJ = new THREE.OBJLoader();
cargadorOBJ.setPath(urlDeRecursos);

cargadorOBJ.load('CartoonRocket.obj', function(objeto) {
    objeto.traverse(function(hijo) {
        if (hijo instanceof THREE.Mesh) {
            var escala = 2.1;
            hijo.geometry.scale(escala, escala, escala);
            var caja = new THREE.Box3().setFromObject(hijo);
            var desplazamientoY = caja.max.y / 2;
            rellenarGeometria(geoCohete, puntosAleatoriosEnGeometria(hijo.geometry, conteoDeParticulas), desplazamientoY);
            disparadores[2].setAttribute('data-disabled', false);
        }
    });
});

cargadorOBJ.load('Astronaut.obj', function(objeto) {
    objeto.traverse(function(hijo) {
        if (hijo instanceof THREE.Mesh) {
            var escala = 4.6;
            hijo.geometry.scale(escala, escala, escala);
            var caja = new THREE.Box3().setFromObject(hijo);
            var desplazamientoY = caja.max.y / 2;
            rellenarGeometria(geoAstronauta, puntosAleatoriosEnGeometria(hijo.geometry, conteoDeParticulas), desplazamientoY);
            disparadores[3].setAttribute('data-disabled', false);
        }
    });
});

// ─── Sistema de partículas ───────────────────────────────────────────────────
var sistemaDePArticulas = new THREE.Points(geoParticulas, materialDeParticulas);
escena.add(sistemaDePArticulas);

// ─── Animación ───────────────────────────────────────────────────────────────
const velocidadNormal   = velocidadAnimacionPorDefecto / 100;
const velocidadCompleta = velocidadAnimacionMorph / 100;
var variablesDeAnimacion = { velocidad: velocidadNormal };

function animar() {
    estadisticas.begin();
    sistemaDePArticulas.rotation.y += variablesDeAnimacion.velocidad;
    estadisticas.end();
    controles.update();
    window.requestAnimationFrame(animar);
    renderizador.render(escena, camara);
}
animar();

// ─── Morph ───────────────────────────────────────────────────────────────────
function morphHacia(geoDestino, color) {
    color = color || 0xffffff;

    TweenMax.to(variablesDeAnimacion, 0.3, {
        ease: Power4.easeIn,
        velocidad: velocidadCompleta,
        onComplete: reducirVelocidad
    });

    sistemaDePArticulas.material.color.setHex(color);

    var attrOrigen  = geoParticulas.getAttribute('position');
    var attrDestino = geoDestino.getAttribute('position');

    for (var i = 0; i < conteoDeParticulas; i++) {
        var obj = {
            x: attrOrigen.getX(i),
            y: attrOrigen.getY(i),
            z: attrOrigen.getZ(i)
        };
        (function(idx, o) {
            TweenMax.to(o, 4, {
                ease: Elastic.easeOut.config(1, 0.75),
                x: attrDestino.getX(idx),
                y: attrDestino.getY(idx),
                z: attrDestino.getZ(idx),
                onUpdate: function() {
                    attrOrigen.setXYZ(idx, o.x, o.y, o.z);
                    attrOrigen.needsUpdate = true;
                }
            });
        })(i, obj);
    }
}

function reducirVelocidad() {
    TweenMax.to(variablesDeAnimacion, 4, {
        ease: Power2.easeOut,
        velocidad: velocidadNormal,
        delay: 1
    });
}

// ─── Formas ──────────────────────────────────────────────────────────────────
function aEsfera()     { manejarDisparadores(0); morphHacia(geoEsfera); }
function aCubo()       { manejarDisparadores(1); morphHacia(geoCubo); }
function aCohete()     { manejarDisparadores(2); morphHacia(geoCohete); }
function aAstronauta() { manejarDisparadores(3); morphHacia(geoAstronauta); }

function manejarDisparadores(deshabilitado) {
    for (var x = 0; x < disparadores.length; x++) {
        disparadores[x].setAttribute('data-disabled', deshabilitado === x);
    }
}

// ─── Eventos ─────────────────────────────────────────────────────────────────
disparadores[0].addEventListener('click', aEsfera);
disparadores[1].addEventListener('click', aCubo);
disparadores[2].addEventListener('click', aCohete);
disparadores[3].addEventListener('click', aAstronauta);

setTimeout(aEsfera, 500);