function tint(img, color, its) {
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;

    let tempCx = tempCanvas.getContext("2d");
    tempCx.drawImage(img, 0, 0);
    tempCx.globalCompositeOperation = "overlay";
    tempCx.fillStyle = color;
    its = its || 1;
    for(let i = 0; i < its; i++) {
        tempCx.fillRect(0, 0, img.width, img.height);
    }
    tempCx.globalCompositeOperation = "destination-atop";
    tempCx.drawImage(img, 0, 0);
    return tempCanvas;
}
function recolor(img, color) {
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    let tempCx = tempCanvas.getContext("2d");
    tempCx.fillStyle = color;
    tempCx.fillRect(0, 0, img.width, img.height);
    tempCx.globalCompositeOperation = "destination-atop";
    tempCx.drawImage(img, 0, 0);
    return tempCanvas;
}
function rotate(img, degrees) {
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    let tempCx = tempCanvas.getContext("2d");
    tempCx.translate(img.width / 2, img.height / 2);
    tempCx.save();
    tempCx.rotate(degrees * Math.PI / 180);
    tempCx.translate(-img.width / 2, -img.height / 2);
    tempCx.drawImage(img, 0, 0);
    tempCx.restore();
    return tempCanvas;
}
function colorToString(color) {
    let string = "#";
    color.map(function(x) {
        let add = x.toString(16);
        if(add.length === 1) {string += "0";}
        string += add;
    });
    return string;
}
function stringToColor(string) {
    let color = new Array(3);
    for(let i = 0; i < 3; i++) {
        color[i] = parseInt(string.substring(i * 2 + 1, i * 2 + 3), 16);
    }
    return color;
}
