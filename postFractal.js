// Big thanks to Indigo Code (youtube) 
// for walking through the boilerplate Web GL stuff :)
// Fractal Drawer by Andrew Oakes
var vertexShaderText = [
    'precision highp float;',
    'attribute vec3 vertColor;',
    'attribute vec2 vertPosition;',
    'uniform vec2 resolution;',
    'uniform float zoom;',
    'uniform vec2 shift;',
    'uniform vec2 start;',
    'varying float fzoom;',
    'varying vec2 fshift;',
    'varying vec3 fragColor;',
    'varying vec2 fstart;',
    'varying vec2 res;',
    'varying float ratio;',
    'void main(){',
    '   ratio = resolution.x/resolution.y;',
    '   fzoom = zoom;',
    '   fshift = shift;',
    '   fstart = start;',
    '   res = resolution;',
    '   fragColor = vertColor;',
    '   gl_Position = vec4(vec2(vertPosition.x*2.0,vertPosition.y*2.0), 0.0, 1.0);',
    '}',
].join('\n');

var fragmentShaderText = [
    'precision highp float;',
    'varying vec3 fragColor;',
    'varying vec2 res;',
    'varying float ratio;',
    'varying float fzoom;',
    'varying vec2 fshift;',
    'varying vec2 fstart;',
    'vec2 pos;',
    'vec4 fractalColor(vec2 pos) {',
    '   vec2 result = vec2(fstart.x,fstart.y);',
    '   vec2 save = vec2(pos.x,pos.y);',
    '   float intensity = 1.0;',
    '   float rlength;',
    '   for(float i = 0.0; i < 500.0; i += 1.0){',
    '       save = vec2(result.x,result.y);',
    '       result = result*result;',
    '       result.x -= result.y-pos.x;',
    '       result.y = (2.0*save.x)*save.y+pos.y;',
   // '       result = result+pos;',
    '       rlength = length(result);',
    '       if(rlength > 100.0){',    // Codetrain had this great idea in his Mandelbrot code challenge video.
    '           intensity = i/500.0;',       
    '           break;',
    '       }',
    '   }',
    '   float c = 1.0-intensity;',
    '   vec4 color = vec4(vec3(c,c*c/fzoom,sqrt(c)),intensity*3.0);',
    '   return color;',
    '}',
    'void main() {',
    '   pos = vec2((((gl_FragCoord.x)*(1.0/res.x))+(-.5))*ratio+(fshift.x*fzoom),((gl_FragCoord.y)*(1.0/res.y))+((-.5)-fshift.y*fzoom));',
    '',
    '   gl_FragColor = fractalColor(pos*2.0/fzoom);',
    '}',
].join('\n');



function initialization(){
    var canvas = document.getElementById("canvas1");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight
    console.log(canvas);
    var gl = canvas.getContext("webgl");
    if(!gl){
        console.log("Experimental webgl");
        gl = canvas.getContext("experimental-webgl");
    }

    if(!gl){
        alert("Browser does not support webgl");
    }

    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program,vertexShader);
    gl.attachShader(program,fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        console.error("Error linking program", gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
        console.error("ERROR validating program!", gl.getProgramInfoLog(program));
        return;
    }

    var triangleVertices = [
        // x, y
        -.5, .5, 1.0, 0.0, 0.0,
        -.5,-.5, 0.0, 1.0, 0.0,
        .5,-.5, 0.0, 0.0, 1.0,
        .5, .5, 1.0, 0.0, 0.0,
        -.5,.5, 0.0, 1.0, 0.0,
        .5,-.5, 0.0, 0.0, 1.0
    ];
    var screenRatio = canvas.height/canvas.width;
    if(canvas.height >= canvas.width){
        screenRatio = canvas.height/canvas.width;
    }else{
        screenRatio = canvas.width/canvas.height;
    }
    var triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    var positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttributeLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        colorAttributeLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
    );

    var shift = [0.0,0.0];
    var zoom = 1.0;

    gl.useProgram(program);

    var resolutionUniformLocation = gl.getUniformLocation(program, "resolution");
    var shiftLoc = gl.getUniformLocation(program, "shift");
    var zoomLoc = gl.getUniformLocation(program, "zoom");
    var startLoc = gl.getUniformLocation(program,"start");
    
    var res = [canvas.width,canvas.height];
    var start = [0.0,0.0];
    gl.uniform2fv(resolutionUniformLocation,res);
    gl.uniform2fv(shiftLoc, shift);
    gl.uniform1f(zoomLoc, zoom);
    gl.uniform2fv(startLoc, start);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);
    // Uses the currently bound buffer.
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);

    var pressed = false;
    var out = false;
    var up = false;
    var down = false;
    var left = false;
    var right = false;
    var incStart = false;
    var decStart = false;
    var incStarti = false;
    var decStarti = false;
    function updateHTML(){
        let shift_text = document.getElementById("shift");
        let zoom_text = document.getElementById("zoom");
        let start_text = document.getElementById("start");
        shift_text.innerHTML = "Shift: "+shift.toString(); 
        zoom_text.innerHTML = "Zoom: "+zoom; 
        start_text.innerHTML = "Start: "+start.toString(); 
    }
    var loop_callback = function (){
        if(pressed){
            zoom *= 1.01;
        }if(out){
            zoom /= 1.01;
        }if(up){
           shift[1] -= .025/zoom;
        }if(down){
           shift[1] += .025/zoom;
        }if(left){
            shift[0] -= .025/zoom;
        }if(right){
            shift[0] += .025/zoom;
        }if(incStart){
            start[0] += .001/Math.sqrt(zoom);
        }if(decStart){
            start[0] -= .001/Math.sqrt(zoom);
        }if(incStarti){
            start[1] += .001/Math.sqrt(zoom);
        }if(decStarti){
            start[1] -= .001/Math.sqrt(zoom);
        }
        updateHTML();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight
        screenRatio = canvas.height/canvas.width;
        if(canvas.height >= canvas.width){
            screenRatio = canvas.height/canvas.width;
        }else{
            screenRatio = canvas.width/canvas.height;
        }
        positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
        colorAttributeLocation = gl.getAttribLocation(program, 'vertColor');
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            gl.FALSE,
            5 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.vertexAttribPointer(
            colorAttributeLocation,
            3,
            gl.FLOAT,
            gl.FALSE,
            5 * Float32Array.BYTES_PER_ELEMENT,
            2 * Float32Array.BYTES_PER_ELEMENT
        );
        gl.useProgram(program);
        resolutionUniformLocation = gl.getUniformLocation(program, "resolution");
        shiftLoc = gl.getUniformLocation(program, "shift");
        zoomLoc = gl.getUniformLocation(program, "zoom");
        startLoc = gl.getUniformLocation(program,"start");

        res = [canvas.width,canvas.height];

        gl.uniform2fv(resolutionUniformLocation, res);
        gl.uniform2fv(shiftLoc, shift);
        gl.uniform1f(zoomLoc, zoom);
        gl.uniform2fv(startLoc, start);

        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.enableVertexAttribArray(colorAttributeLocation);
        // Uses the currently bound buffer.
        gl.drawArrays(gl.TRIANGLE_FAN,0,6);
        //Game loop
        requestAnimationFrame(loop_callback);
    }
    
    document.addEventListener('mousedown',function(event){
        //shift = [shift[0]+(event.clientX/res[0])-.5, shift[1]+(event.clientY/res[1])-.5];
        pressed = true;
        //shift = [0.0,0.0];
        //loop_callback();
        console.log("clicked: ",shift);
    });
    document.addEventListener('mouseup',function(event){
        pressed = false;
    });
    document.addEventListener('keydown',function(event){
        shift = [shift[0], shift[1]];
        //shift = [0.0,0.0];
        //zoom += 3.0;
        //loop_callback(shift, zoom);
        if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
            event.preventDefault();
        }
        let code = event.keyCode;
        if(code == 37){
            left = true;
        }else if(code == 38){
            up = true;
        }else if(code == 39){
            right = true;
        }else if(code == 40){
            down = true;
        }else if(code == 16){
            out = true;
        }else if(code == 13){
            pressed = true;
        }else if(code == 17){
            incStart = true;
        }else if(code == 18){
            decStart = true;
        }else if(code == 90){
            incStarti = true;
        }else if(code == 88){
            decStarti = true;
        }

        console.log(code);
    });
    document.addEventListener('keyup',function(event){
        up = false;
        left = false;
        down = false;
        right = false;
        out = false;
        pressed = false;
        incStart = false;
        decStart = false;
        incStarti = false;
        decStarti = false;
    });
    requestAnimationFrame(loop_callback);
}
initialization();

// TODO Setup onclick callback to zoom in where clicked.

