var gl;
var triangleStripCount = 0;
var wirePointCount = 0;
var colors = [];
var points = [];
var wireframe;
var theta = 0.0;
var thetaLoc;
var rotateType = -1.0;
var rotateLoc;
var gridEnabled = false;
var gridLoc;

var nLow = 5;
var nHigh = 100;
var nBool = true;

var baseColors = [
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0),
    vec3(1.0, 0.0, 1.0),
    vec3(0.0, 1.0, 1.0),
    vec3(0.0, 0.0, 0.0),
];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // generate object vertices/colors
    sphere(0.5, nHigh);

    // line wireframe array for buffer (from house triangle points)
    wireFrame = wireMeshFromTriangleStrip(points, nHigh);

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU

    // theta
    thetaLoc = gl.getUniformLocation(program, "theta");
    gl.uniform1f(thetaLoc, theta);

    // rotate type
    rotateLoc = gl.getUniformLocation(program, "rotate");
    gl.uniform1f(rotateLoc, rotateType);

    // grid enabled
    gridLoc = gl.getUniformLocation(program, "grid");
    gl.uniform1i(gridLoc, rotateType);

    // colors buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    // points buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // radio button
    document.getElementById("xAxis").onclick = function () {
        if (this.checked == true) {
            rotateType = 0.0;
        } else {
            rotateType = -1.0;
        };

        theta = 0;
    };

    document.getElementById("yAxis").onclick = function () {
        if (this.checked == true) {
            rotateType = 1.0;
        } else {
            rotateType = -1.0;
        };
        
        theta = 0;
    };

    document.getElementById("zAxis").onclick = function () {
        if (this.checked == true) {
            rotateType = 2.0;
        } else {
            rotateType = -1.0;
        };
        
        theta = 0;
    };

    document.getElementById("none").onclick = function () {
        rotateType = -1.0;
        theta = 0;
    };

    // swap buffer between points and wireframe on button click
    document.getElementById("wireButton").onclick = function () {
        gridEnabled = !gridEnabled;
        if (gridEnabled) {
            gl.bufferData( gl.ARRAY_BUFFER, flatten(wireFrame), gl.STATIC_DRAW );
        } else {
            gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
        }
    };

    // swap buffer between points and wireframe on button click
    document.getElementById("nButton").onclick = function () {
        nBool = !nBool;
        points = [];
        colors = [];
        var nCount;
        if (nBool) {
            nCount = nHigh;
        } else {
            nCount = nLow;
        }

        triangleStripCount = 0;
        wirePointCount = 0;
        sphere(0.5, nCount);
        wireFrame = wireMeshFromTriangleStrip(points, nCount);

        if (gridEnabled) {
            gl.bufferData( gl.ARRAY_BUFFER, flatten(wireFrame), gl.STATIC_DRAW );
        } else {
            gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
        }
    };

    render();
};

// genrates array for sphere with triangle_strip
function sphere(radius, n) {
    var thetaCount = 0;
    var phiCount;
    var thetaStep = (2*Math.PI)/(n+1);
    var phiStep = Math.PI/(n+1);
    var colorIndex = 0;
    var thetaAdd;

    for (var i = 0; i <= n; i++) {
        if (i == n) {
            thetaAdd = 0;
        } else {
            thetaAdd = thetaCount+thetaStep;
        }
        phiCount = 0;
        // longitudanel strip
        points.push(vec3(0.0,radius,0.0));
        colors.push(baseColors[(colorIndex++)%7]);
        for (var j = 1; j <= n; j++) {
            phiCount += phiStep;
            points.push(vec3(radius*Math.cos(thetaCount)*Math.sin(phiCount), radius*Math.cos(phiCount), radius*Math.sin(thetaCount)*Math.sin(phiCount)));
            colors.push(baseColors[(colorIndex++)%7]);
            points.push(vec3(radius*Math.cos(thetaAdd)*Math.sin(phiCount), radius*Math.cos(phiCount), radius*Math.sin(thetaAdd)*Math.sin(phiCount)));
            colors.push(baseColors[(colorIndex++)%7]);
            triangleStripCount += 2;
        }
        points.push(vec3(0.0,-1*radius,0.0));
        colors.push(baseColors[(colorIndex++)%7]);
        triangleStripCount += 2;
        thetaCount += thetaStep
    }
}

// convert traingle strip array of sphere to line points array
function wireMeshFromTriangleStrip(triangleStripArray, n) {
    var linesArray = [];
    var index = 0;
    for (var i = 0; i <= n; i++) {
        linesArray.push(triangleStripArray[index++]);
        for (var j = 1; j <= n; j++) {
            linesArray.push(triangleStripArray[index]);

            linesArray.push(triangleStripArray[index]);
            linesArray.push(triangleStripArray[index+2]);

            linesArray.push(triangleStripArray[index]);
            linesArray.push(triangleStripArray[index+1]);

            linesArray.push(triangleStripArray[index+1]);

            index += 2;
            wirePointCount += 6;
        }
        linesArray.push(triangleStripArray[index++]);
        wirePointCount += 2;
    }

    return linesArray;
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta += 0.01;
    gl.uniform1f(thetaLoc, theta);
    gl.uniform1f(rotateLoc, rotateType);
    gl.uniform1i(gridLoc, gridEnabled);
    if (gridEnabled) {
            gl.drawArrays( gl.LINES, 0, wirePointCount );
        } else {
            gl.drawArrays( gl.TRIANGLE_STRIP, 0, triangleStripCount );
        }

    window.requestAnimFrame(render);
}
