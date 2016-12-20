function grayscale(canvas){
    let context = canvas.getContext('2d');
    let imgData = context.getImageData(0,0,canvas.width,canvas.height);
    let data = imgData.data;

    for(var i = 0; i < data.length;i+=4){
        var avg = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = avg;
        data[i+1] = avg;
        data[i+2] = avg;
    }
    context.putImageData(imgData,0,0);
}

function minMaxGray(canvas){
    let context = canvas.getContext('2d');
    let imgData = context.getImageData(0,0,canvas.width,canvas.height);
    let data = imgData.data;

    let i, l = data.length;
    let min = 255, max = 0;
    for(i=0;i<l;i+=4){
        let gray = data[i];
        if(gray > max) max = gray;
        if(gray < min) min = gray;
    }

    let m = 256.0 / (max-min);
    for(i=0;i<l;i+=4){
        let gray = (data[i]-min)*m;
        data[i] = gray;
        data[i+1] = gray;
        data[i+2] = gray;
    }
    context.putImageData(imgData,0,0);
}

function binaryBlackAndWhite(canvas){
    let context = canvas.getContext('2d');
    let imgData = context.getImageData(0,0,canvas.width,canvas.height);
    let data = imgData.data;
    let i,l=data.length;
    for(i=0;i<l;i+=4){
        let blackOrWhite = (data[i] > 160) ? 255 : 0;
        data[i] = blackOrWhite;
        data[i+1] = blackOrWhite;
        data[i+2] = blackOrWhite;
    }
    context.putImageData(imgData,0,0);
}

export {
    grayscale,
    minMaxGray,
    binaryBlackAndWhite
};
