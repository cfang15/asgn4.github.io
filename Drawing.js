class Rectangle {
    constructor() {
        this.type = 'rectangle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the size of a point to the u_Size variable
        gl.uniform1f(u_Size, size);


        // Draw Two Flipped Triangles That Can Form A Rectangle
        var d = this.size / 200; // delta
        // Slightly change the color of the first triangle, to distinguish it from the others
        rgba = [1.0, 0.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);
        // Slightly change the color of the second triangle, to distinguish it from the others
        rgba = [0.5, 0.5, 0.5, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([-xy[0], -xy[1], -xy[0] - d, -xy[1], -xy[0], -xy[1] - d]);
        // Slightly change the color of the third triangle, to distinguish it from the others
        rgba = [1.0, 1.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([-xy[0], -xy[1], -xy[0] - d, xy[1], xy[0], xy[1] + d]);
        // Slightly change the color of the fourth triangle, to distinguish it from the others
        rgba = [0.0, 1.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([xy[0], xy[1], xy[0] + d, -xy[1], -xy[0], -xy[1] - d]);
    }
}

function drawTriangle(vertices) {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}
