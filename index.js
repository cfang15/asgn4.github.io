"use strict";

// --- Vertex Shader Program ---
const VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }
`;

// --- Fragment Shader Program ---
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform bool u_lightsOn;
  uniform vec3 u_cameraPos;
  uniform vec3 u_normalLightPos;
  uniform vec3 u_normalLightColor;
  uniform bool u_normalLightOn;
  uniform vec3 u_spotlightPos;
  uniform vec3 u_spotlightDir;
  uniform vec3 u_spotlightColor;
  uniform float u_spotlightCutoffAngle;
  uniform bool u_spotlightOn;
  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else {
      gl_FragColor = vec4(1,0.2,0.2,1);
    }

    if (u_lightsOn) {
      vec3 spotlightVector = u_spotlightPos - vec3(v_VertPos);
      float theta = dot(normalize(-u_spotlightDir), spotlightVector);
      if (u_spotlightOn) {
        if (theta > u_spotlightCutoffAngle) {
          float r = length(spotlightVector);
          vec3 spotL = normalize(spotlightVector);
          vec3 spotN = normalize(v_Normal);
          float spotnDotL = max(dot(spotN, spotL), 0.0);
          vec3 spotR = reflect(-spotL, spotN);
          vec3 spotE = normalize(u_cameraPos - vec3(v_VertPos));
          float spotSpecular = pow(max(dot(spotE, spotR), 0.0), 64.0) * 0.8;
          vec3 spotDiffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * spotnDotL * 0.7;
          vec3 spotAmbient = vec3(gl_FragColor) * 0.2;
          if (u_whichTexture == 0 || u_whichTexture == 1) {
            gl_FragColor = vec4(spotSpecular+spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
          } else if (u_whichTexture == 1) {
            gl_FragColor = vec4(spotSpecular+spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
          } else {
            gl_FragColor = vec4(spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
          }
        }
      }
      if (u_normalLightOn) {
        vec3 lightVector = u_normalLightPos - vec3(v_VertPos);
        float r = length(lightVector);
        vec3 L = normalize(lightVector);
        vec3 N = normalize(v_Normal);
        float nDotL = max(dot(N, L), 0.0);
        vec3 R = reflect(-L, N);
        vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
        float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;
        vec3 diffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * nDotL * 0.7;
        vec3 ambient = vec3(gl_FragColor) * 0.2;
        if (u_whichTexture == 0 || u_whichTexture == 1) {
          gl_FragColor = vec4(specular+diffuse+ambient * vec3(u_normalLightColor), 1.0);
        } else if (u_whichTexture == 1) {
          gl_FragColor = vec4(specular+diffuse+ambient * vec3(u_normalLightColor), 1.0);
        } else {
          gl_FragColor = vec4(diffuse+ambient * vec3(u_normalLightColor), 1.0);
        }
      }
    }
  }
`;

// --- Global Variables ---
let canvas, gl;
let a_Position, a_UV, a_Normal;
let u_FragColor, u_ModelMatrix, u_NormalMatrix, u_ProjectionMatrix, u_ViewMatrix, u_GlobalRotateMatrix;
let u_Sampler0, u_Sampler1, u_whichTexture;
let u_lightsOn, u_cameraPos, u_normalLightOn, u_normalLightPos, u_normalLightColor;
let u_spotlightOn, u_spotlightPos, u_spotlightDir, u_spotlightColor, u_spotlightCutoffAngle;

let g_globalAngle = 0;
let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
const fps = 60, fpsDelta = 1000 / fps;
let previous = performance.now(), start;

const g_camera = new Camera();
const g_eye = g_camera.eye.elements;
const g_at  = g_camera.at.elements;
const g_up  = g_camera.up.elements;
const rotateDelta = -0.2;

let g_shapesList = [];
const projMat = new Matrix4();

// --- Blocky Animal Globals ---
let g_frontLeftLegThighAngle = 0, g_frontLeftLegPawAngle = 0;
let g_frontLeftLegThighAnimation = false, g_frontLeftLegPawAnimation = false;
let g_frontRightLegThighAngle = 0, g_frontRightLegPawAngle = 0;
let g_frontRightLegThighAnimation = false, g_frontRightLegPawAnimation = false;
let g_backLeftLegThighAngle = 0, g_backLeftLegPawAngle = 0;
let g_backLeftLegThighAnimation = false, g_backLeftLegPawAnimation = false;
let g_backRightLegThighAngle = 0, g_backRightLegPawAngle = 0;
let g_backRightLegThighAnimation = false, g_backRightLegPawAnimation = false;
let g_tailAngle = 0, g_tailAnimation = false;

// --- Lighting Globals ---
let g_normalOn = false;
let g_lightsOn = true;
let g_normalLightOn = true;
let g_normalLightPos = [0, 1, -2];
let g_normalLightColor = [1, 1, 1];
let g_normalLightAnimationOn = true;
let g_spotlightOn = true;
let g_spotlightPos = [0, 1, -2];
let g_spotlightDir = [0, -1, 0];
let g_spotlightColor = [1, 1, 1];
let g_spotlightCutoffAngle = Math.cos(Math.PI / 9);

// --- Function Definitions ---

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) { console.log('Failed to get a_Position'); return; }
  
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) { console.log('Failed to get a_UV'); return; }
  
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) { console.log('Failed to get a_Normal'); return; }
  
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) { console.log('Failed to get u_FragColor'); return; }
  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { console.log('Failed to get u_ModelMatrix'); return; }
  
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) { console.log('Failed to get u_NormalMatrix'); return; }
  
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) { console.log('Failed to get u_ViewMatrix'); return; }
  
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) { console.log('Failed to get u_ProjectionMatrix'); return; }
  
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) { console.log('Failed to get u_GlobalRotateMatrix'); return; }
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) { console.log('Failed to get u_Sampler0'); return; }
  
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) { console.log('Failed to get u_Sampler1'); return; }
  
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) { console.log('Failed to get u_whichTexture'); return; }
  
  u_lightsOn = gl.getUniformLocation(gl.program, 'u_lightsOn');
  if (!u_lightsOn) { console.log('Failed to get u_lightsOn'); return; }
  
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) { console.log('Failed to get u_cameraPos'); return; }
  
  u_normalLightOn = gl.getUniformLocation(gl.program, 'u_normalLightOn');
  if (!u_normalLightOn) { console.log('Failed to get u_normalLightOn'); return; }
  
  u_normalLightPos = gl.getUniformLocation(gl.program, 'u_normalLightPos');
  if (!u_normalLightPos) { console.log('Failed to get u_normalLightPos'); return; }
  
  u_normalLightColor = gl.getUniformLocation(gl.program, 'u_normalLightColor');
  if (!u_normalLightColor) { console.log('Failed to get u_normalLightColor'); return; }
  
  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if (!u_spotlightOn) { console.log('Failed to get u_spotlightOn'); return; }
  
  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  if (!u_spotlightPos) { console.log('Failed to get u_spotlightPos'); return; }
  
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  if (!u_spotlightDir) { console.log('Failed to get u_spotlightDir'); return; }
  
  u_spotlightColor = gl.getUniformLocation(gl.program, 'u_spotlightColor');
  if (!u_spotlightColor) { console.log('Failed to get u_spotlightColor'); return; }
  
  u_spotlightCutoffAngle = gl.getUniformLocation(gl.program, 'u_spotlightCutoffAngle');
  if (!u_spotlightCutoffAngle) { console.log('Failed to get u_spotlightCutoffAngle'); return; }
  
  // Initialize u_ModelMatrix and u_NormalMatrix to the identity.
  const identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identityM.elements);
}

function addActionsForHTMLUI() {
  // --- Front-Left Leg Buttons ---
  document.getElementById('animationfrontLeftLegThighOffButton').onclick = () => { g_frontLeftLegThighAnimation = false; };
  document.getElementById('animationfrontLeftLegThighOnButton').onclick  = () => { g_frontLeftLegThighAnimation = true; };
  document.getElementById('animationfrontLeftLegPawOffButton').onclick   = () => { g_frontLeftLegPawAnimation = false; };
  document.getElementById('animationfrontLeftLegPawOnButton').onclick    = () => { g_frontLeftLegPawAnimation = true; };

  // --- Front-Right Leg Buttons ---
  document.getElementById('animationfrontRightLegThighOffButton').onclick = () => { g_frontRightLegThighAnimation = false; };
  document.getElementById('animationfrontRightLegThighOnButton').onclick  = () => { g_frontRightLegThighAnimation = true; };
  document.getElementById('animationfrontRightLegPawOffButton').onclick   = () => { g_frontRightLegPawAnimation = false; };
  document.getElementById('animationfrontRightLegPawOnButton').onclick    = () => { g_frontRightLegPawAnimation = true; };

  // --- Back-Left Leg Buttons ---
  document.getElementById('animationbackLeftLegThighOnButton').onclick = () => { g_backLeftLegThighAnimation = true; };
  document.getElementById('animationbackLeftLegThighOffButton').onclick = () => { g_backLeftLegThighAnimation = false; };
  document.getElementById('animationbackLeftLegPawOffButton').onclick = () => { g_backLeftLegPawAnimation = false; };
  document.getElementById('animationbackLeftLegPawOnButton').onclick = () => { g_backLeftLegPawAnimation = true; };

  // --- Back-Right Leg Buttons ---
  document.getElementById('animationbackRightLegThighOffButton').onclick = () => { g_backRightLegThighAnimation = false; };
  document.getElementById('animationbackRightLegThighOnButton').onclick = () => { g_backRightLegThighAnimation = true; };
  document.getElementById('animationbackRightLegPawOffButton').onclick = () => { g_backRightLegPawAnimation = false; };
  document.getElementById('animationbackRightLegPawOnButton').onclick = () => { g_backRightLegPawAnimation = true; };

  // --- Tail Buttons ---
  document.getElementById('animationTailOffButton').onclick = () => { g_tailAnimation = false; };
  document.getElementById('animationTailOnButton').onclick = () => { g_tailAnimation = true; };

  // --- Normals Buttons ---
  document.getElementById('normalOn').onclick = () => { g_normalOn = true; };
  document.getElementById('normalOff').onclick = () => { g_normalOn = false; };

  // --- Lights Buttons ---
  document.getElementById('lightsOn').onclick = () => { g_lightsOn = true; };
  document.getElementById('lightsOff').onclick = () => { g_lightsOn = false; };

  // --- Normal Light Buttons ---
  document.getElementById('normalLightOn').onclick = () => { g_lightsOn = true; };
  document.getElementById('normalLightOff').onclick = () => { g_lightsOn = false; };
  document.getElementById('normalLightAnimationOnButton').onclick = () => { g_normalLightAnimationOn = true; };
  document.getElementById('normalLightAnimationOffButton').onclick = () => { g_normalLightAnimationOn = false; };

  // --- Spotlight Buttons ---
  document.getElementById('spotlightOn').onclick = () => { g_spotlightOn = true; };
  document.getElementById('spotlightOff').onclick = () => { g_spotlightOn = false; };

  // --- Slider Events ---
  document.getElementById('frontLeftLegPawSlide').addEventListener('mousemove', function () {
    g_frontLeftLegPawAngle = this.value; renderScene();
  });
  document.getElementById('frontLeftLegThighSlide').addEventListener('mousemove', function () {
    g_frontLeftLegThighAngle = this.value; renderScene();
  });
  document.getElementById('frontRightLegPawSlide').addEventListener('mousemove', function () {
    g_frontRightLegPawAngle = this.value; renderScene();
  });
  document.getElementById('frontRightLegThighSlide').addEventListener('mousemove', function () {
    g_frontRightLegThighAngle = this.value; renderScene();
  });
  document.getElementById('backLeftLegPawSlide').addEventListener('mousemove', function () {
    g_backLeftLegPawAngle = this.value; renderScene();
  });
  document.getElementById('backLeftLegThighSlide').addEventListener('mousemove', function () {
    g_backLeftLegThighAngle = this.value; renderScene();
  });
  document.getElementById('backRightLegPawSlide').addEventListener('mousemove', function () {
    g_backRightLegPawAngle = this.value; renderScene();
  });
  document.getElementById('backRightLegThighSlide').addEventListener('mousemove', function () {
    g_backRightLegThighAngle = this.value; renderScene();
  });
  document.getElementById('tailSlide').addEventListener('mousemove', function () {
    g_tailAngle = this.value; renderScene();
  });
  document.getElementById('angleSlide').addEventListener('mousemove', function () {
    g_globalAngle = this.value; renderScene();
  });

  // --- Normal Light Slider Events ---
  document.getElementById('normalLightPositionSlideX').addEventListener('mousemove', function () {
    g_normalLightPos[0] = this.value / 100; renderScene();
  });
  document.getElementById('normalLightPositionSlideY').addEventListener('mousemove', function () {
    g_normalLightPos[1] = this.value / 100; renderScene();
  });
  document.getElementById('normalLightPositionSlideZ').addEventListener('mousemove', function () {
    g_normalLightPos[2] = this.value / 100; renderScene();
  });
  document.getElementById('normalLightColorRedSlide').addEventListener('mousemove', function () {
    g_normalLightColor[0] = parseFloat(this.value); renderScene();
  });
  document.getElementById('normalLightColorBlueSlide').addEventListener('mousemove', function () {
    g_normalLightColor[1] = parseFloat(this.value); renderScene();
  });
  document.getElementById('normalLightColorGreenSlide').addEventListener('mousemove', function () {
    g_normalLightColor[2] = parseFloat(this.value); renderScene();
  });

  // --- Spotlight Slider Events ---
  document.getElementById('spotlightPositionSlideX').addEventListener('mousemove', function () {
    g_spotlightPos[0] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightPositionSlideY').addEventListener('mousemove', function () {
    g_spotlightPos[1] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightPositionSlideZ').addEventListener('mousemove', function () {
    g_spotlightPos[2] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightDirectionSlideX').addEventListener('mousemove', function () {
    g_spotlightDir[0] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightDirectionSlideY').addEventListener('mousemove', function () {
    g_spotlightDir[1] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightDirectionSlideZ').addEventListener('mousemove', function () {
    g_spotlightDir[2] = this.value / 100; renderScene();
  });
  document.getElementById('spotlightColorRedSlide').addEventListener('mousemove', function () {
    g_spotlightColor[0] = parseFloat(this.value); renderScene();
  });
  document.getElementById('spotlightColorBlueSlide').addEventListener('mousemove', function () {
    g_spotlightColor[1] = parseFloat(this.value); renderScene();
  });
  document.getElementById('spotlightColorGreenSlide').addEventListener('mousemove', function () {
    g_spotlightColor[2] = parseFloat(this.value); renderScene();
  });
  document.getElementById('spotlightCutoffAngleSlide').addEventListener('mousemove', function () {
    g_spotlightCutoffAngle = parseFloat(Math.cos(Math.PI / 180 * this.value)); renderScene();
  });
}

function initTextures(gl, n) {
  const image0 = new Image();
  if (!image0) {
    console.log('Failed to create image0 object');
    return false;
  }
  const image1 = new Image();
  if (!image1) {
    console.log('Failed to create image1 object');
    return false;
  }
  image0.onload = () => {
    sendImageToTEXTURE0(image0);
    image1.onload = () => {
      sendImageToTEXTURE1(image1);
    };
    image1.src = 'marble.jpg';
  };
  image0.src = 'marble.jpg';
  return true;
}

function sendImageToTEXTURE0(image) {
  const texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
  console.log("Finished loading texture for TEXTURE0");
}

function sendImageToTEXTURE1(image) {
  const texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
  console.log("Finished loading texture for TEXTURE1");
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHTMLUI();
  document.onkeydown = keydown;

  // --- Mouse Interaction ---
  let dragging = false, lastX = -1, lastY = -1, theta = 0, phi = Math.PI / 2;
  canvas.addEventListener('mousedown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  canvas.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('mousemove', (event) => {
    if (dragging) {
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      theta -= deltaX * 0.005;
      phi   -= deltaY * 0.005;
      g_camera.updateCamera(theta, phi);
      gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
    }
    lastX = event.clientX;
    lastY = event.clientY;
  });

  initTextures(gl, 0);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  start = previous;
  renderScene();
  requestAnimationFrame(tick);
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  requestAnimationFrame(tick);
  const current = performance.now();
  const delta = current - previous;
  if (delta > fpsDelta) {
    previous = current - (delta % fpsDelta);
    renderScene();
  }
}

function updateAnimationAngles() {
  g_frontLeftLegThighAngle = g_frontLeftLegThighAnimation ? (30 * Math.sin(g_seconds)) : 0;
  g_frontLeftLegPawAngle   = g_frontLeftLegPawAnimation   ? (30 * Math.sin(3 * g_seconds)) : 0;
  g_frontRightLegThighAngle = g_frontRightLegThighAnimation ? (30 * Math.cos(g_seconds)) : 0;
  g_frontRightLegPawAngle   = g_frontRightLegPawAnimation   ? (30 * Math.cos(3 * g_seconds)) : 0;
  g_backLeftLegThighAngle   = g_backLeftLegThighAnimation   ? (30 * Math.sin(g_seconds)) : 0;
  g_backLeftLegPawAngle     = g_backLeftLegPawAnimation     ? (30 * Math.sin(3 * g_seconds)) : 0;
  g_backRightLegThighAngle  = g_backRightLegThighAnimation  ? (30 * Math.cos(g_seconds)) : 0;
  g_backRightLegPawAngle    = g_backRightLegPawAnimation    ? (30 * Math.cos(3 * g_seconds)) : 0;
  g_tailAngle               = g_tailAnimation             ? (60 * Math.cos(g_seconds)) : 0;

  if (g_normalLightAnimationOn) {
    g_normalLightPos[0] = Math.cos(g_seconds) * 16;
    g_normalLightPos[2] = Math.cos(g_seconds) * 16;
  }
}

function keydown(ev) {
  switch(ev.keyCode) {
    case 68: g_camera.right(); break;
    case 65: g_camera.left(); break;
    case 87: g_camera.forward(); break;
    case 83: g_camera.back(); break;
    case 81: g_camera.panLeft(); break;
    case 69: g_camera.panRight(); break;
  }
  renderScene();
}

function renderScene() {
  const startTime = performance.now();

  projMat.setIdentity();
  projMat.setPerspective(50, canvas.width / canvas.height, 1, 200);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  const viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  
  const cameraRotMat = new Matrix4().rotate(rotateDelta, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, cameraRotMat.elements);
  
  const normalMat = new Matrix4();
  normalMat.setInverseOf(cameraRotMat);
  normalMat.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  
  const globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // --- Set Light Attributes ---
  gl.uniform1i(u_lightsOn, g_lightsOn);
  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
  
  gl.uniform1i(u_normalLightOn, g_normalLightOn);
  gl.uniform3f(u_normalLightPos, g_normalLightPos[0], g_normalLightPos[1], g_normalLightPos[2]);
  gl.uniform3f(u_normalLightColor, g_normalLightColor[0], g_normalLightColor[1], g_normalLightColor[2]);
  
  gl.uniform1i(u_spotlightOn, g_spotlightOn);
  gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  gl.uniform3f(u_spotlightDir, g_spotlightDir[0], g_spotlightDir[1], g_spotlightDir[2]);
  gl.uniform3f(u_spotlightColor, g_spotlightColor[0], g_spotlightColor[1], g_spotlightColor[2]);
  gl.uniform1f(u_spotlightCutoffAngle, g_spotlightCutoffAngle);
  
  // --- Render Objects ---
  // Normal Light Cube
  const normalLight = new Cube();
  normalLight.color = [2, 2, 0, 1];
  normalLight.textureNum = g_normalOn ? -3 : -2;
  normalLight.matrix.translate(g_normalLightPos[0], g_normalLightPos[1], g_normalLightPos[2]);
  normalLight.matrix.scale(-0.1, -0.1, -0.1);
  normalLight.matrix.translate(-0.5, -0.5, -0.5);
  normalLight.normalMatrix.setInverseOf(normalLight.matrix).transpose();
  normalLight.render();

  // Spotlight Cube
  const spotlight = new Cube();
  spotlight.color = [2, 0, 0, 1];
  spotlight.textureNum = g_normalOn ? -3 : -2;
  spotlight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  spotlight.matrix.scale(-0.1, -0.1, -0.1);
  spotlight.matrix.translate(-0.5, -0.5, -0.5);
  spotlight.normalMatrix.setInverseOf(spotlight.matrix).transpose();
  spotlight.render();
  
  // Sphere
  const sphere = new Sphere();
  sphere.textureNum = g_normalOn ? -3 : -2;
  sphere.matrix.translate(-2, 0.25, 0);
  sphere.matrix.scale(0.1, 0.1, 0.1);
  sphere.render();

  // Ground Cube
  const ground = new Cube();
  ground.color = [0, 1, 0, 1];
  ground.textureNum = g_normalOn ? -3 : -2;
  ground.matrix.translate(0, -0.75, 0);
  ground.matrix.scale(32, 0.0001, 32);
  ground.matrix.translate(-0.5, -0.001, -0.5);
  ground.render();

  // Sky Cube
  const sky = new Cube();
  sky.color = [0, 0, 1, 1];
  sky.textureNum = g_normalOn ? -3 : 0;
  sky.matrix.scale(100, 100, 100);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // Statue Foot Cube
  const statueFoot = new Cube();
  statueFoot.textureNum = g_normalOn ? -3 : 0;
  statueFoot.matrix.translate(-0.425, -0.65, 0);
  statueFoot.matrix.scale(0.7, 0.5, 0.7);
  statueFoot.render();

  // Body Cube
  const body = new Cube();
  body.color = [1, 0.662, 0, 1];
  body.textureNum = g_normalOn ? -3 : -2;
  body.matrix.translate(0.25, 0.825, 0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.7, 0.5, 0.7);
  body.render();

  // Front-Left Leg (Thigh & Paw)
  const frontLeftThigh = new Cube();
  frontLeftThigh.textureNum = g_normalOn ? -3 : -2;
  frontLeftThigh.color = [1, 0.662, 0, 1];
  frontLeftThigh.matrix.setTranslate(0.38, 0.85, 0);
  frontLeftThigh.matrix.rotate(-5, 1, 0, 0);
  frontLeftThigh.matrix.rotate(-g_frontLeftLegThighAngle, 0, 0, 1);
  frontLeftThigh.matrix.scale(0.5, -0.5, 0.5);
  const fltCoordMat = new Matrix4(frontLeftThigh.matrix);
  frontLeftThigh.matrix.scale(0.25, 0.75, 0.25);
  frontLeftThigh.matrix.translate(-0.5, 0, 0);
  frontLeftThigh.normalMatrix = normalMat;
  frontLeftThigh.render();

  const frontLeftPaw = new Cube();
  frontLeftPaw.textureNum = g_normalOn ? -3 : -2;
  frontLeftPaw.color = [0.5, 0.25, 0.1, 1];
  frontLeftPaw.matrix = fltCoordMat;
  frontLeftPaw.matrix.translate(0, 0.65, 0);
  frontLeftPaw.matrix.rotate(-g_frontLeftLegPawAngle, 0, 0, 1);
  frontLeftPaw.matrix.scale(0.20, 0.25, 0.20);
  frontLeftPaw.matrix.translate(-0.5, 0.45, -0.001);
  frontLeftPaw.normalMatrix = normalMat;
  frontLeftPaw.render();

  // Front-Right Leg (Thigh & Paw)
  const frontRightLeg = new Cube();
  frontRightLeg.textureNum = g_normalOn ? -3 : -2;
  frontRightLeg.color = [1, 0.662, 0, 1];
  frontRightLeg.matrix.setTranslate(0.38, 0.85, 0.5);
  frontRightLeg.matrix.rotate(-5, 1, 0, 0);
  frontRightLeg.matrix.rotate(-g_frontRightLegThighAngle, 0, 0, 1);
  frontRightLeg.matrix.scale(0.5, -0.5, 0.5);
  const frtCoordMat = new Matrix4(frontRightLeg.matrix);
  frontRightLeg.matrix.scale(0.25, 0.75, 0.25);
  frontRightLeg.matrix.translate(-0.5, 0, 0);
  frontRightLeg.normalMatrix = normalMat;
  frontRightLeg.render();

  const frontRightPaw = new Cube();
  frontRightPaw.textureNum = g_normalOn ? -3 : -2;
  frontRightPaw.color = [0.5, 0.25, 0.1, 1];
  frontRightPaw.matrix = frtCoordMat;
  frontRightPaw.matrix.translate(0, 0.65, 0);
  frontRightPaw.matrix.rotate(-g_frontRightLegPawAngle, 0, 0, 1);
  frontRightPaw.matrix.scale(0.20, 0.25, 0.20);
  frontRightPaw.matrix.translate(-0.5, 0.45, -0.001);
  frontRightPaw.normalMatrix = normalMat;
  frontRightPaw.render();

  // Back-Left Leg (Thigh & Paw)
  const backLeftThigh = new Cube();
  backLeftThigh.textureNum = g_normalOn ? -3 : -2;
  backLeftThigh.color = [1, 0.662, 0, 1];
  backLeftThigh.matrix.setTranslate(0.75, 0.85, 0);
  backLeftThigh.matrix.rotate(-5, 1, 0, 0);
  backLeftThigh.matrix.rotate(-g_backLeftLegThighAngle, 0, 0, 1);
  backLeftThigh.matrix.scale(0.5, -0.5, 0.5);
  const bltCoordMat = new Matrix4(backLeftThigh.matrix);
  backLeftThigh.matrix.scale(0.25, 0.75, 0.25);
  backLeftThigh.matrix.translate(-0.5, 0, 0);
  backLeftThigh.normalMatrix = normalMat;
  backLeftThigh.render();

  const backLeftPaw = new Cube();
  backLeftPaw.textureNum = g_normalOn ? -3 : -2;
  backLeftPaw.color = [0.5, 0.25, 0.1, 1];
  backLeftPaw.matrix = bltCoordMat;
  backLeftPaw.matrix.translate(0, 0.65, 0);
  backLeftPaw.matrix.rotate(-g_backLeftLegPawAngle, 0, 0, 1);
  backLeftPaw.matrix.scale(0.20, 0.25, 0.20);
  backLeftPaw.matrix.translate(-0.5, 0.45, -0.001);
  backLeftPaw.normalMatrix = normalMat;
  backLeftPaw.render();

  // Back-Right Leg (Thigh & Paw)
  const backRightThigh = new Cube();
  backRightThigh.textureNum = g_normalOn ? -3 : -2;
  backRightThigh.color = [1, 0.662, 0, 1];
  backRightThigh.matrix.setTranslate(0.75, 0.85, 0.5);
  backRightThigh.matrix.rotate(-5, 1, 0, 0);
  backRightThigh.matrix.rotate(-g_backRightLegThighAngle, 0, 0, 1);
  backRightThigh.matrix.scale(0.5, -0.5, 0.5);
  const brtCoordMat = new Matrix4(backRightThigh.matrix);
  backRightThigh.matrix.scale(0.25, 0.75, 0.25);
  backRightThigh.matrix.translate(-0.5, 0, 0);
  backRightThigh.normalMatrix = normalMat;
  backRightThigh.render();

  const backRightPaw = new Cube();
  backRightPaw.textureNum = g_normalOn ? -3 : -2;
  backRightPaw.color = [0.5, 0.25, 0.1, 1];
  backRightPaw.matrix = brtCoordMat;
  backRightPaw.matrix.translate(0, 0.65, 0);
  backRightPaw.matrix.rotate(-g_backRightLegPawAngle, 0, 0, 1);
  backRightPaw.matrix.scale(0.20, 0.25, 0.20);
  backRightPaw.matrix.translate(-0.5, 0.45, -0.001);
  backRightPaw.normalMatrix = normalMat;
  backRightPaw.render();

  // Head and Snout
  const head = new Cube();
  head.textureNum = g_normalOn ? -3 : -2;
  head.color = [1, 0.662, 0, 1];
  head.matrix.translate(0.1, 1.35, 0.15);
  head.matrix.scale(0.25, 0.85, 0.25);
  head.render();

  const snout = new Cube();
  snout.textureNum = g_normalOn ? -3 : -2;
  snout.color = [1, 0.662, 0, 1];
  snout.matrix.translate(-0.2, 1.8, 0.15);
  snout.matrix.scale(0.35, 0.25, 0.25);
  snout.render();

  // Tail
  const tail = new Cube();
  tail.textureNum = g_normalOn ? -3 : -2;
  tail.color = [1, 0.662, 0, 1];
  tail.matrix.translate(0.95, 1.35, 0.15);
  tail.matrix.rotate(-0.75, 1, 0, 0);
  tail.matrix.rotate(-g_tailAngle, 0, 0, 1);
  tail.matrix.scale(0.1, 0.4, 0.1);
  tail.normalMatrix = normalMat;
  tail.render();

  const duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
}

function sendTextToHTML(text, htmlID) {
  const htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get element: " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}
