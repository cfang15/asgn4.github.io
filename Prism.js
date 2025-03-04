class Prism {
    constructor() {
        this.type = 'prism';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Base side of the triangular prism
        drawTriangle3D([0, 0, 0, 0.5, 0, 0, 0.25, 0.5, 0]);
        drawTriangle3D([0, 0, 0, 0.25, 0.5, 0, 0.5, 0, 0]);

        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // Top side of the triangular prism
        drawTriangle3D([0, 0, 1, 0.5, 0, 1, 0.25, 0.5, 1]);
        drawTriangle3D([0, 0, 1, 0.25, 0.5, 1, 0.5, 0, 1]);

        // Other sides of the triangular prism
        drawTriangle3D([0, 0, 0, 0.5, 0, 0, 0, 0, 1]);
        drawTriangle3D([0.5, 0, 0, 0.25, 0.5, 0, 0.5, 0, 1]);
        drawTriangle3D([0.25, 0.5, 0, 0, 0, 0, 0.25, 0.5, 1]);
        drawTriangle3D([0.5, 0, 0, 0.5, 0, 1, 0.25, 0.5, 1]);
    }
}