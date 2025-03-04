class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -1;
        this.cubeVerts32 = new Float32Array([
            0, 0, 0,  1, 1, 0,  1, 0, 0,
            0, 0, 0,  0, 1, 0,  1, 1, 0,
            0, 1, 0,  0, 1, 1,  1, 1, 1,
            0, 1, 0,  1, 1, 1,  1, 1, 0,
            1, 1, 0,  1, 1, 1,  1, 0, 0,
            1, 0, 0,  1, 1, 1,  1, 0, 1,
            0, 1, 0,  0, 1, 1,  0, 0, 0,
            0, 0, 0,  0, 1, 1,  0, 0, 1,
            0, 0, 0,  0, 0, 1,  1, 0, 1,
            0, 0, 0,  1, 0, 1,  1, 0, 0,
            0, 0, 1,  1, 1, 1,  1, 0, 1,
            0, 0, 1,  0, 1, 1,  1, 1, 1
        ]);
        this.vertexBuffer = null;
    }

    render() {
        var rgba = this.color;

        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Front side of the cube
        drawTriangle3DUVNormal(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],
            [0, 0, 1, 1, 1, 0],
            [0, 0, -1, 0, 0, -1, 0, 0, -1]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 1, 0, 1, 1, 0], [0,0,0,1,1,1], [0, 0, -1, 0, 0, -1, 0, 0, -1]);

        // Top side of the cube
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3DUVNormal([0, 1, 0, 0, 1, 1, 1, 1, 1], [0,0,0,1,1,1], [0, 1, 0, 0, 1, 0, 0, 1, 0]);
        drawTriangle3DUVNormal([0, 1, 0, 1, 1, 1, 1, 1, 0], [0,0,1,1,1,0], [0, 1, 0, 0, 1, 0, 0, 1, 0]);
        
        // Right side of the cube
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        // gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVNormal([1, 1, 0, 1, 1, 1, 1, 0, 0], [0,0,0,1,1,1], [1, 0, 0, 1, 0, 0, 1, 0, 0]);
        drawTriangle3DUVNormal([1, 0, 0, 1, 1, 1, 1, 0, 1], [0,0,1,1,1,0], [1, 0, 0, 1, 0, 0, 1, 0, 0]);
        
        // Left side of the cube
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3DUVNormal([0, 1, 0, 0, 1, 1, 0, 0, 0], [0,0,0,1,1,1], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 1, 1, 0, 0, 1], [0,0,1,1,1,0], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);

        // Bottom side of the cube
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 0, 1, 1, 0, 1], [0,0,0,1,1,1], [0, -1, 0, 0, -1, 0, 0, -1, 0]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 0, 1, 1, 0, 0], [0,0,1,1,1,0], [0, -1, 0, 0, -1, 0, 0, -1, 0]);

        // Back side of the cube
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.5, rgba[1] * 0.5, rgba[2] * 0.5, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 1, 1, 1, 1, 1, 0, 1], [0,0,0,1,1,1], [0, 0, 1, 0, 0, 1, 0, 0, 1]);
        drawTriangle3DUVNormal([0, 0, 1, 0, 1, 1, 1, 1, 1], [0,0,1,1,1,0], [0, 0, 1, 0, 0, 1, 0, 0, 1]);
    }
    renderfast() { // TODO: Fix this function
        var rgba = this.color;

        // Pass the texture number for colors
        gl.uniform1i(u_whichTexture, -2);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Array for all sides of the cube
        var allverts = [];

        // Front side of the cube
        allverts = allverts.concat([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        allverts = allverts.concat([0, 0, 0, 0, 1, 0, 1, 1, 0]);
        // Pass the color of a point to u_FragColor uniform variable
        // gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // Top side of the cube
        allverts = allverts.concat([0, 1, 0, 0, 1, 1, 1, 1, 1]);
        allverts = allverts.concat([0, 1, 0, 1, 1, 1, 1, 1, 0]);

        // Right side of the cube
        allverts = allverts.concat([1, 1, 0, 1, 1, 1, 1, 0, 0]);
        allverts = allverts.concat([1, 0, 0, 1, 1, 1, 1, 0, 1]);

        // Left side of the cube
        allverts = allverts.concat([0, 1, 0, 0, 1, 1, 0, 0, 0]);
        allverts = allverts.concat([0, 0, 0, 0, 1, 1, 0, 0, 1]);

        // Bottom side of the cube
        allverts = allverts.concat([0, 0, 0, 0, 0, 1, 1, 0, 1]);
        allverts = allverts.concat([0, 0, 0, 1, 0, 1, 1, 0, 0]);

        // Right side of the cube
        allverts = allverts.concat([0, 0, 1, 1, 1, 1, 1, 0, 1]);
        allverts = allverts.concat([0, 0, 1, 0, 1, 1, 1, 1, 1]);
    
        // Draw all sides of the cube
        drawTriangle3D(allverts);
    }

    renderfaster() {
        // Pass the texture number
        gl.uniform1i(u_whichTexture, -2);

        // Pass the color of a point to u_FragColor variable
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        // Initialize the buffer with the vertices
        gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.DYNAMIC_DRAW);

        // Create a buffer object
        this.vertexBuffer = gl.createBuffer();
        if (this.vertexBuffer === null) {
            console.log('Failed to create the buffer object');
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
        }


        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
        
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);


        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw the 12 triangles that make up a cube
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}