/* global DataView */

function getOrientation(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {

    var view = new DataView(e.target.result);
    if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
    var length = view.byteLength, offset = 2;
    while (offset < length) {
      var marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
        var little = view.getUint16(offset += 6, false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        var tags = view.getUint16(offset, little);
        offset += 2;
        for (var i = 0; i < tags; i++)
          if (view.getUint16(offset + (i * 12), little) == 0x0112)
            return callback(view.getUint16(offset + (i * 12) + 8, little));
      }
      else if ((marker & 0xFF00) != 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
}


function findConnectedGroups(data,width,height){

    function getIndex(x,y){
        return y*width+x;
    }

    let visited = [];
    let connectedNeighbors = {};

    function getNeighborCells(i){
        let x = i % width;
        let y = (i-x) / width;

        let cellsToInspect = [];

        // "box selection", from top left
        let PIXEL_DISTANCE = 1;

        let d = PIXEL_DISTANCE;

        let _x,_y,dX,dY;
        for(_y = y-d, dY = -d; _y < height && dY <= d; _y++,dY++){
            if(_y < 0 || _y >= height) continue;
            for(_x = x-d, dX = -d; _x < width && dX <= d; _x++,dX++){
                if(_x < 0 || _x >= width) continue;
                cellsToInspect.push( getIndex(_x,_y) );
            }
        }
        //cellsToInspect.shift();

        return cellsToInspect;
    }

    let i,l=data.length;
    for(i=0;i<l;i++){

        // white
        if(!data[i]){
             visited[i] = true;
             continue;
        }

        let cellsToInspect = getNeighborCells(i);

        connectedNeighbors[i] = cellsToInspect.filter((v)=>{
            return data[v];
        });
    }

    let groups = {};

    i = 0;
    while(i < l){
        if(visited[i]){i++; continue;}

        let to_visit = [i];
        let current_group = groups[i] = [];
        while(to_visit.length){

            let v = to_visit.shift();
            if(visited[v]) continue;
            visited[v] = true;
            current_group.push(v);
            to_visit = to_visit.concat(connectedNeighbors[v]);
        }
    }

    return groups;
}

function getGroupInfo(group,width,height){
    //console.log(group,width,height);

    let i, l = group.length;

    let minX = width,maxX = 0;
    let minY = height, maxY = 0;

    let x,y;
    for(i=0;i<l;i++){
        x = group[i] % width;
        y = (group[i]-x) / width;
        if(x > maxX) maxX = x;
        if(x < minX) minX = x;
        if(y > maxY) maxY = y;
        if(y < minY) minY = y;
    }

    let info = {
        x:[minX,maxX],
        y:[minY,maxY],
        width:(1+maxX-minX),
        height:(1+maxY-minY)
    };
    //console.log(info);
    return info;
}

function adjustGroup(group,info,oWidth){
    let w = oWidth;
    let y_min = info.y[0];
    let x_min = info.x[0];
    let x_max = info.x[1];
    let getY = function(i){
        return (i - i % w) / w;
    };

    return group.map((i)=>{
        let y = getY(i);
        return i - w*y_min - x_min*(1+y-y_min) - (w-1-x_max)*(y-y_min);
    });
}



function determineSudokuGrid(groups){
    var arr = Object.keys(groups).reduce((a,b)=>{
        a.push(groups[b]);
        return a;
    },[]);

    // validation
    let num_arr = arr.filter((v)=>{
        if(!v.classification) return false; // no nulls
        if(v.width < 5 || v.height < 5) return false; // too small
        if(v.width > 100 || v.height > 100) return false; // too big
        return true;
    });

    // get median height & width.
    let widths = num_arr.map((v)=>v.width).sort();
    let heights = num_arr.map((v)=>v.height).sort();

    let medW = widths[Math.floor(num_arr.length / 2)];
    let medH = heights[Math.floor(num_arr.length / 2)];

    //console.log("medians",medW,medH);

    let grid_arr = arr.filter((v)=>{
        return (v.width > 9*medW) && (v.height > 9*medH);
    });

    //console.log(grid_arr);

    if(grid_arr.length > 1){
        alert("I'm stuck.");
        return;
    }

    var grid_info = grid_arr[0];

    num_arr = num_arr.filter((v)=>{
        if(v.x[0] < grid_info.x[0]) return false;
        if(v.x[1] > grid_info.x[1]) return false;
        if(v.y[0] < grid_info.y[0]) return false;
        if(v.y[1] > grid_info.y[1]) return false;
        return true;
    });

    let _left = grid_info.x[0], _top = grid_info.y[0];
    let dX = grid_info.width / 9, dY = grid_info.height / 9;

    let i, sudoku = [];
    for(i=0;i<81;i++){
        sudoku.push(null);
    }

    let l = num_arr.length;
    for(i=0;i<l;i++){
        // evaluate on center of the number...
        let cx = (num_arr[i].x[0] + num_arr[i].x[1]) / 2;
        let cy = (num_arr[i].y[0] + num_arr[i].y[1]) / 2;
        let _x = Math.floor((cx - _left) / dX);
        let _y = Math.floor((cy - _top) / dY);
        sudoku[_x+_y*9] = num_arr[i].classification;
    }

    ///for(i=0;i<9;i++){
    //    console.log(sudoku.slice(i*9,(i+1)*9).join(" "));
    //}

    //console.log(sudoku);

    let num = {
        "one":1,
        "two":2,
        "three":3,
        "four":4,
        "five":5,
        "six":6,
        "seven":7,
        "eight":8,
        "nine":9
    };
    return sudoku.map((v)=>num[v]||null);
}




export {getOrientation,findConnectedGroups,getGroupInfo,adjustGroup,determineSudokuGrid};
