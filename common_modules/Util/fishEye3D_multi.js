function Fisheye3D() {
  var camera, 
  scene, 
  renderer,
  texture_placeholder,
  isUserInteracting = false,
  onMouseDownMouseX = 0, 
  onMouseDownMouseY = 0,  
  onMouseDownLon = 0,
  onMouseDownLat = 0,
  lon = 0,
  lat = 0, 
  phi = 0, 
  theta = 0,
  distance = 230,
  distanceNear = 500,
  resol = 2992.0,
  initFov = 45,
  fov = initFov,
  mindist = 0.0000000001,
  tex,
  minimapCamera,
  cameraHelper;

  var meshVertex = (function () {
    function meshVertex(vertex) {
      var _this = this;
      if (((vertex != null && vertex instanceof meshVertex) || vertex === null)) {
        this.u = 0;
        this.v = 0;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        (function () {
          _this.x = vertex.x;
          _this.y = vertex.y;
          _this.z = vertex.z;
          _this.u = vertex.u;
          _this.v = vertex.v;
        })();
      }
      else if (vertex === undefined) {
        this.u = 0;
        this.v = 0;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        (function () {
          _this.v = 0.0;
          _this.u = 0.0;
          _this.z = 0.0;
          _this.y = 0.0;
          _this.x = 0.0;
        })();
      }
      else
        throw new Error('invalid overload');
    }
    return meshVertex;
  }());

  var GridMesh = (function () {
    function GridMesh() {
      this.m_InvertX = false;
      this.m_InvertY = false;
      this.m_FisheyeHeight = 0;
      this.m_FisheyeWidth = 0;
      this.m_NumTriangles = 0;
      this.m_TextureHeight = 0;
      this.m_TextureWidth = 0;
    }
    GridMesh.prototype.ClipToCircle = function (vertex) {
      var centerX = this.m_FisheyeConfig.GetCenterX();
      var centerY = this.m_FisheyeConfig.GetCenterY();
      var maxRadius = this.m_FisheyeConfig.GetMaxRadius();
      var var8 = Math.sqrt((vertex.u - centerX) * (vertex.u - centerX) + (vertex.v - centerY) * (vertex.v - centerY));
      var var10;
      if (var8 < maxRadius) {
        var10 = true;
      }
      else {
        var10 = false;
      }
      if (!var10) {
        maxRadius /= var8;
        vertex.u = (vertex.u - centerX) * maxRadius + centerX;
        vertex.v = (vertex.v - centerY) * maxRadius + centerY;
      }
      return var10;
    };
    GridMesh.prototype.CreateTriangle = function (var1, var2, var3) {
      var1 = new meshVertex(var1);
      var2 = new meshVertex(var2);
      var3 = new meshVertex(var3);

      var v1 = this.ClipToCircle(var1);
      var v2 = this.ClipToCircle(var2);
      var v3 = this.ClipToCircle(var3);
      var n1 = this.Normalize(var1);
      var n2 = this.Normalize(var2);
      var n3 = this.Normalize(var3);

      if ((v1 || v2 || v3) && (n1 || n2 || n3)) {
        this.Find3DPos(var1);
        this.Find3DPos(var2);
        this.Find3DPos(var3);
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 0 + 0] = var1.x;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 0 + 1] = var1.y;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 0 + 2] = var1.z;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 0 + 3] = var1.u;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 0 + 4] = var1.v;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 5 + 0] = var2.x;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 5 + 1] = var2.y;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 5 + 2] = var2.z;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 5 + 3] = var2.u;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 5 + 4] = var2.v;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 10 + 0] = var3.x;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 10 + 1] = var3.y;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 10 + 2] = var3.z;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 10 + 3] = var3.u;
        this.m_Triangles[this.m_NumTriangles * 5 * 3 + 10 + 4] = var3.v;
        ++this.m_NumTriangles;
      }
    };
    GridMesh.prototype.Find3DPos = function (vertex) {
      var var6 = vertex.u;
      var textureWidth = this.m_TextureWidth;
      var var2 = vertex.v;
      var textureHeight = this.m_TextureHeight;
      var6 = var6 * textureWidth - this.m_FisheyeConfig.GetCenterX();
      textureHeight = var2 * textureHeight - this.m_FisheyeConfig.GetCenterY();
      var2 = textureHeight;
      if (this.m_InvertY) {
        var2 = -textureHeight;
      }
      textureHeight = var6;
      if (this.m_InvertX) {
        textureHeight = -var6;
      }
      textureWidth = this.m_FisheyeConfig.GetMaxRadius();
      var var10 = Math.sqrt(textureHeight * textureHeight + var2 * var2);
      var6 = var10;
      if (var10 > textureWidth) {
        var6 = textureWidth;
      }
      var6 = 0.017453293 * this.m_FisheyeConfig.GetFOV(var6) / 2.0;
      var2 = Math.atan2(var2, textureHeight);
      vertex.z = Math.cos(var6);
      vertex.y = Math.sin(var6) * Math.sin(var2);
      vertex.x = Math.sin(var6) * Math.cos(var2);
    };
    GridMesh.prototype.GenerateMesh = function (var1, fisheyeConfig, fisheyeWidth, fisheyeHeight, textureWidth, textureHeight, invertX, invertY) {
      this.m_InvertX = invertX;
      this.m_InvertY = invertY;
      this.m_FisheyeConfig = fisheyeConfig;
      this.m_FisheyeWidth = fisheyeWidth;
      this.m_FisheyeHeight = fisheyeHeight;
      this.m_TextureWidth = textureWidth;
      this.m_TextureHeight = textureHeight;
      var var10 = 3.0 * var1 / 4.0;
      var maxRadius = this.m_FisheyeConfig.GetMaxRadius();
      var var19 = new meshVertex();
      var var16 = new meshVertex();
      var var17 = new meshVertex();
      var var18 = new meshVertex();
      this.m_NumTriangles = 0;
      textureWidth = (Math.ceil(maxRadius / var1 + 0.5) | 0) * 2;
      var var12 = this.m_FisheyeConfig.GetCenterX() - ((textureWidth / 2 | 0)) * var1;
      textureHeight = (Math.ceil(maxRadius / var10) | 0) * 2;
      maxRadius = this.m_FisheyeConfig.GetCenterY() - ((textureHeight / 2 | 0)) * var10;
      this.m_Triangles = new Array(textureWidth * 30 * textureHeight);
      for (fisheyeWidth = 0; fisheyeWidth < textureHeight; ++fisheyeWidth) {
        for (fisheyeHeight = 0; fisheyeHeight < textureWidth; ++fisheyeHeight) {
          var19.v = fisheyeWidth * var10 + maxRadius;
          var16.v = fisheyeWidth * var10 + maxRadius;
          var17.v = (fisheyeWidth + 1) * var10 + maxRadius;
          var18.v = (fisheyeWidth + 1) * var10 + maxRadius;
          if (fisheyeWidth % 2 === 0) {
            var16.u = (fisheyeHeight + 1) * var1 + var12;
            var19.u = fisheyeHeight * var1 + var12;
            var17.u = var1 / 2.0 + fisheyeHeight * var1 + var12;
            var18.u = var1 / 2.0 + (fisheyeHeight + 1) * var1 + var12;
            this.CreateTriangle(var19, var17, var16);
            this.CreateTriangle(var16, var17, var18);
          }
          else {
            var19.u = var1 / 2.0 + var12 + fisheyeHeight * var1;
            var16.u = var1 / 2.0 + var12 + (fisheyeHeight + 1) * var1;
            var17.u = fisheyeHeight * var1 + var12;
            var18.u = (fisheyeHeight + 1) * var1 + var12;
            this.CreateTriangle(var19, var18, var16);
            this.CreateTriangle(var19, var17, var18);
          }
        }
      }
    };
    GridMesh.prototype.GetTriangleCount = function () {
      return this.m_NumTriangles;
    };
    GridMesh.prototype.GetTriangles = function () {
      return this.m_Triangles;
    };
    GridMesh.prototype.Normalize = function (vertex) {
      var var2 = true;
      vertex.u /= this.m_FisheyeWidth;
      vertex.v /= this.m_FisheyeHeight;
      if (vertex.u < 0.0) {
        vertex.u = 0.0;
        var2 = false;
      }
      if (vertex.u > 1.0) {
        vertex.u = 1.0;
        var2 = false;
      }
      if (vertex.v < 0.0) {
        vertex.v = 0.0;
        var2 = false;
      }
      if (vertex.v > 1.0) {
        vertex.v = 1.0;
        var2 = false;
      }
      vertex.u *= this.m_FisheyeWidth / this.m_TextureWidth;
      vertex.v *= this.m_FisheyeHeight / this.m_TextureHeight;
      return var2;
    };    
    GridMesh.DEGREETORAD = 0.017453293;
    return GridMesh;
  }());

  var FisheyeConfig = (function () {
    function FisheyeConfig(centerX, centerY, circleMaxFOV, circleFOV, circleRadius) {
      this.m_CenterX = 0;
      this.m_CenterY = 0;
      this.m_CircleFOV = 0;
      this.m_CircleRadius = 0;
      this.m_FOVToRadius = 0;
      this.m_MaxFOV = 0;
      this.m_MaxRadius = 0;
      this.m_RadiusToFOV = 0;
      this.m_CircleFOV = circleFOV;
      this.m_CircleRadius = circleRadius;
      this.m_CenterX = centerX;
      this.m_CenterY = centerY;
      circleFOV = this.m_CircleFOV;
      if (circleFOV > circleMaxFOV) {
        this.m_MaxFOV = circleMaxFOV;
      }
      else {
        this.m_MaxFOV = circleFOV;
      }
      this.m_MaxRadius = this.m_CircleRadius;
      this.m_RadiusToFOV = this.m_MaxFOV / this.m_MaxRadius;
      this.m_FOVToRadius = this.m_MaxRadius / this.m_MaxFOV;
    }
    FisheyeConfig.prototype.GetCenterX = function () {
      return this.m_CenterX;
    };
    FisheyeConfig.prototype.GetCenterY = function () {
      return this.m_CenterY;
    };
    FisheyeConfig.prototype.GetCircleFOV = function () {
      return this.m_CircleFOV;
    };
    FisheyeConfig.prototype.GetCircleRadius = function () {
      return this.m_CircleRadius;
    };
    FisheyeConfig.prototype.GetFOV = function (var1) {
      return var1 <= this.m_MaxRadius ? this.m_RadiusToFOV * var1 : -1.0;
    };
    FisheyeConfig.prototype.GetHeight = function () {
      return this.GetMaxRadius() * 2.0;
    };
    FisheyeConfig.prototype.GetMaxFOV = function () {
      return this.m_MaxFOV;
    };
    FisheyeConfig.prototype.GetMaxRadius = function () {
      return this.m_MaxRadius;
    };
    FisheyeConfig.prototype.GetRadius = function (var1) {
      return var1 <= this.m_MaxFOV ? this.m_FOVToRadius * var1 : -1.0;
    };
    FisheyeConfig.prototype.GetWidth = function () {
      return this.GetMaxRadius() * 2.0;
    };
    FisheyeConfig.DEFAULT_MAX_FOV = 170.0;
    FisheyeConfig.DEFAULT_MAX_RADIUS = 823.12506;
    return FisheyeConfig;
  }());

  var GEN = (function () {
    function GEN() {
      this.mNumTriangles = 0;
    }
    GEN.prototype.generateVertices = function () {
      var fisheyeConfig = new FisheyeConfig(resol/2, resol/2, 170.0, 170.0, resol/2);
      var gridMesh = new GridMesh();
      gridMesh.GenerateMesh(124.0, fisheyeConfig, resol, resol, resol, resol, false, true);
      this.mNumTriangles = gridMesh.GetTriangleCount();
      var triangles = gridMesh.GetTriangles();
      var numPoints = this.mNumTriangles * 3;
      this.position = new Float32Array(numPoints * 3);
      this.textureCoords = new Float32Array(numPoints * 2);
      for (var i = 0; i < this.mNumTriangles; ++i) {
        this.textureCoords[i * 6 + 0] = triangles[i * 15 + 3];
        this.textureCoords[i * 6 + 1] = triangles[i * 15 + 4];
        this.position[i * 9 + 0] = triangles[i * 15];
        this.position[i * 9 + 1] = triangles[i * 15 + 1];
        this.position[i * 9 + 2] = triangles[i * 15 + 2];
        this.textureCoords[i * 6 + 2] = triangles[i * 15 + 10 + 3];
        this.textureCoords[i * 6 + 3] = triangles[i * 15 + 10 + 4];
        this.position[i * 9 + 3] = triangles[i * 15 + 10];
        this.position[i * 9 + 4] = triangles[i * 15 + 10 + 1];
        this.position[i * 9 + 5] = triangles[i * 15 + 10 + 2];
        this.textureCoords[i * 6 + 4] = triangles[i * 15 + 5 + 3];
        this.textureCoords[i * 6 + 5] = triangles[i * 15 + 5 + 4];
        this.position[i * 9 + 6] = triangles[i * 15 + 5];
        this.position[i * 9 + 7] = triangles[i * 15 + 5 + 1];
        this.position[i * 9 + 8] = triangles[i * 15 + 5 + 2];
      }
    };
    return GEN;
  }());

  function Constructor() {}

  Constructor.prototype = {
    init: function(videoElement) {

      var container, mesh;

      container = document.getElementById( 'mi-full-camera' );

      //camera = new THREE.PerspectiveCamera( initFov, container.clientWidth / container.clientHeight, 1, 4400 );
      camera = new THREE.PerspectiveCamera( initFov, window.innerWidth / window.innerHeight, 1, 4400 );
      camera.target = new THREE.Vector3( 0, 0, 0 );

      scene = new THREE.Scene();

      //var g = new GEN();
      //g.generateVertices();
      var g = new (function()
      {
        this.mNumTriangles = 8;
        this.position = [];
        this.textureCoords = [];
/*
        var numMulti = 4;
        var pw = 2 / numMulti;
        var tw = 1 / numMulti;

        for(var i = 0 ; i < numMulti*2 ; i+=2)
        {
          var x1 = -1.0 + (pw * i / 2);
          var u1 = (tw * i / 2);  

          this.position[i * 9 + 0] = x1;              this.position[i * 9 + 1] =  1.0;        this.position[i * 9 + 2] = 0.0;
          this.position[i * 9 + 3] = x1;              this.position[i * 9 + 4] = -1.0;        this.position[i * 9 + 5] = 0.0;
          this.position[i * 9 + 6] = x1 + pw;         this.position[i * 9 + 7] =  1.0;        this.position[i * 9 + 8] = 0.0;

          this.textureCoords[i * 6 + 0] = u1;         this.textureCoords[i * 6 + 1] = 1.0;
          this.textureCoords[i * 6 + 2] = u1;         this.textureCoords[i * 6 + 3] = 0.0;
          this.textureCoords[i * 6 + 4] = u1 + tw;    this.textureCoords[i * 6 + 5] = 1.0;

          this.position[(i+1) * 9+0] = x1 + pw;       this.position[(i+1) * 9+1] =  1.0;      this.position[(i+1) * 9+2] = 0.0;
          this.position[(i+1) * 9+3] = x1;            this.position[(i+1) * 9+4] = -1.0;      this.position[(i+1) * 9+5] = 0.0;
          this.position[(i+1) * 9+6] = x1 + pw;       this.position[(i+1) * 9+7] = -1.0;      this.position[(i+1) * 9+8] = 0.0;
   
          this.textureCoords[(i+1) * 6+0] = u1 + tw;  this.textureCoords[(i+1) * 6+1] = 1.0;
          this.textureCoords[(i+1) * 6+2] = u1;       this.textureCoords[(i+1) * 6+3] = 0.0;
          this.textureCoords[(i+1) * 6+4] = u1 + tw;  this.textureCoords[(i+1) * 6+5] = 0.0;
        }
        */

        var numRect = 32;
        this.mNumTriangles = numRect * 2;

        var RAD_GAP = Math.PI / numRect;
        var ratio = videoElement.height / videoElement.width * Math.PI / 2;// 1.0;
        var texWidth = 1.0 / numRect;
        for(var i = 0 ; i < numRect ; i++)
        {
          var pos = i *18;
          var tex = i *12;

          var radFrom = RAD_GAP * (numRect - i);
          var radTo   = RAD_GAP * (numRect - 1 - i);
          var x1 = Math.cos(radFrom);
          var x2 = Math.cos(radTo);
          var z1 = Math.sin(radFrom);
          var z2 = Math.sin(radTo);

          this.position[pos++] = x1; this.position[pos++] = ratio; this.position[pos++] = -z1;
          this.position[pos++] = x1; this.position[pos++] =-ratio; this.position[pos++] = -z1;
          this.position[pos++] = x2; this.position[pos++] = ratio; this.position[pos++] = -z2;

          this.position[pos++] = x2; this.position[pos++] = ratio; this.position[pos++] = -z2;
          this.position[pos++] = x1; this.position[pos++] =-ratio; this.position[pos++] = -z1;
          this.position[pos++] = x2; this.position[pos++] =-ratio; this.position[pos++] = -z2;

          this.textureCoords[tex++] = texWidth * i;              this.textureCoords[tex++] = 1.0;
          this.textureCoords[tex++] = texWidth * i;              this.textureCoords[tex++] = 0.0;
          this.textureCoords[tex++] = texWidth * i + texWidth;   this.textureCoords[tex++] = 1.0;
          this.textureCoords[tex++] = texWidth * i + texWidth;   this.textureCoords[tex++] = 1.0;
          this.textureCoords[tex++] = texWidth * i;              this.textureCoords[tex++] = 0.0;
          this.textureCoords[tex++] = texWidth * i + texWidth;   this.textureCoords[tex++] = 0.0;
        }




      //videoElement.width = 4096;
      //videoElement.height = 1800;
      })();

      

      var geo = new THREE.Geometry();
      geo.verticesNeedUpdate = true;
      geo.elementsNeedUpdate = true;
      geo.uvsNeedUpdate = true;

      for(var i = 0 ; i < g.mNumTriangles ; i++)
      {
        geo.vertices.push(
          new THREE.Vector3( g.position[i*9+0] * 200,  g.position[i*9+1] * 200, g.position[i*9+2] * 200 ),
          new THREE.Vector3( g.position[i*9+3] * 200,  g.position[i*9+4] * 200, g.position[i*9+5] * 200 ),
          new THREE.Vector3( g.position[i*9+6] * 200,  g.position[i*9+7] * 200, g.position[i*9+8] * 200 )
          );
       // geo.vertices.push(
       //   new THREE.Vector3( g.textureCoords[i*6 + 1] * 200 - 100 , g.textureCoords[i*6 + 0] * 200 - 100, 0),
       //   new THREE.Vector3( g.textureCoords[i*6 + 3] * 200 - 100 , g.textureCoords[i*6 + 2] * 200 - 100, 0),
       //   new THREE.Vector3( g.textureCoords[i*6 + 5] * 200 - 100 , g.textureCoords[i*6 + 4] * 200 - 100, 0 )
       //   );

        geo.faces.push( new THREE.Face3( i*3+0, i*3+1, i*3+2 ) );

        geo.faceVertexUvs[0].push([
          new THREE.Vector2( g.textureCoords[i*6 + 0] ,  g.textureCoords[i*6 + 1] ),
          new THREE.Vector2( g.textureCoords[i*6 + 2] ,  g.textureCoords[i*6 + 3] ),
          new THREE.Vector2( g.textureCoords[i*6 + 4] ,  g.textureCoords[i*6 + 5] )
          ]);
      }


      var geometry = new THREE.BufferGeometry();
      geometry.fromGeometry(geo);

      var texture;
      if( videoElement instanceof HTMLVideoElement)
      {
        videoElement.play();

        videoElement.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );      
        texture = new THREE.VideoTexture( videoElement );
        tex = null;
      }else{
        texture = new THREE.CanvasTexture( videoElement );
        tex = texture;

      }
      


      texture.minFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;

      var material   = new THREE.MeshBasicMaterial( { map : texture } );

      mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );



      var helper = new THREE.GridHelper( 1000, 50 , 0xff0000,0x000000);
      helper.position.y = - 199;
      helper.material.opacity = 0.25;
      helper.material.transparent = true;


      scene.add( helper );



      renderer = new THREE.WebGLRenderer();

      //renderer.setFaceCulling( THREE.CullFaceFront );
      //renderer.setClearColor(0x000000);
      //renderer.setClearColor(0xb0b0b0);
      renderer.setClearColor(0xf0f0f0 );
      
      renderer.setPixelRatio( window.devicePixelRatio );
      //renderer.setSize( container.clientWidth , container.clientHeight );
      renderer.setSize( window.innerWidth , window.innerHeight );


      minimapCamera = new THREE.PerspectiveCamera( 20, 1, 1, 10000 );

      minimapCamera.position.y = 50;
      minimapCamera.position.z = 1800;

      scene.add(minimapCamera);
            
      renderer.autoClear = false;
      //cameraHelper = new THREE.CameraHelper( camera );      
      //scene.add(  cameraHelper );


      container.appendChild( renderer.domElement );

      document.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
      document.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
      document.addEventListener( 'mouseup', this.onDocumentMouseUp, false );
      document.addEventListener( 'dblclick', this.onDocumentMouseDbClick, false );
      document.addEventListener( 'mousewheel', this.onDocumentMouseWheel, false );
      document.addEventListener( 'MozMousePixelScroll', this.onDocumentMouseWheel, false);

      window.addEventListener( 'resize', this.onWindowResize, false );

    },
    onWindowResize: function() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( container.clientWidth, container.clientHeight );
    },
    onDocumentMouseDown: function(event) {
      event.preventDefault();
      isUserInteracting = true;
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    },
    onDocumentMouseMove: function(event) {
      if ( isUserInteracting === true ) {
          lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
          lat = ( onPointerDownPointerY - event.clientY  ) * 0.1 + onPointerDownLat;

      }
    },
    onDocumentMouseUp: function(event) {
      isUserInteracting = false;
    },
    onDocumentMouseDbClick: function(event) {
      if(distance > mindist){
        distance = mindist;
      }else{
        distance = 500;
      }
    },
    onDocumentMouseWheel: function(event) {
      if ( event.wheelDeltaY ) {
        distance -= event.wheelDeltaY * 0.005;
      } else if ( event.wheelDelta ) {
        distance -= event.wheelDelta * 0.005;
      } else if ( event.detail ) {
        distance += event.detail * 0.5;
      }

      if(distance < mindist) {
        distance = mindist;
        if(fov > 1) {
          fov -= 1;
        }
      } else {
        if(fov < initFov) {
          distance = mindist;
          fov += 1;
        }
      }      
    },
    animate: function() {
      window.requestAnimationFrame(this.animate.bind(this));
      this.update();
    },
    update: function() {      
      if(tex) {
        tex.needsUpdate = true;
      }

      camera.up.set(0,1,0);

      var limit = 0.0;
      if(distance < distanceNear) {
        //limit = (fov * camera.aspect / 2);


        limit = Math.atan( Math.tan( fov * Math.PI / 180 / 2 ) * camera.aspect ) * 180 / Math.PI; 
        //limit = (fov / 2);
        if(distance > mindist) {
          limit *= (1.0 - ( 1.0* distance / distanceNear));
        }
      }

      lat = Math.max( - 75, Math.min( 75 , lat ) );
      phi = THREE.Math.degToRad( lat - 90 );
      if(limit > 90)lon = 0;
      else lon = Math.max(limit - 90, Math.min( 90 - limit, lon ) );
      //else lon = Math.max(- 90, Math.min( 90, lon ) );
      theta = THREE.Math.degToRad( lon - 90 );

      camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
      camera.position.y = distance * Math.cos( phi );
      camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );
      if(camera.fov != fov)
      {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      //console.log("ratio:"+camera.aspect+",\nlimit:"+limit+",\nfov ratio:"+camera.fov * camera.aspect+", \nfov:"+camera.fov+",distance:"+distance+","+Math.sin(THREE.Math.degToRad(90))+","+Math.cos(THREE.Math.degToRad(0))+"\n"+"lon:"+lon.toFixed(3)+" lat:"+lat.toFixed(3)+"\np:" + phi.toFixed(3) +" t:"+ theta.toFixed(3) + "\nx:"+camera.position.x.toFixed(3)+" y:"+camera.position.y.toFixed(3)+" z:"+camera.position.z.toFixed(3));
      camera.lookAt( camera.target );

      renderer.clear();
      
      //cameraHelper.visible = false;
      //renderer.setViewport( 0, 0, container.clientWidth, container.clientHeight );
      renderer.render( scene, camera );

      //cameraHelper.visible = true;
      //renderer.setViewport( container.clientWidth - 200, container.clientHeight - 200, 200, 200 );
      //renderer.render( scene, minimapCamera );
            
    }
  };
  return new Constructor();
}