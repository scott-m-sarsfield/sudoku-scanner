import React from 'react';
import {getOrientation,findConnectedGroups,getGroupInfo,adjustGroup,determineSudokuGrid} from '../utils/Utils';
import {grayscale,minMaxGray,binaryBlackAndWhite} from '../utils/CanvasUtils';

var Masks = require('../utils/Masks');

var canvas,context;

class CameraInput extends React.Component{
    constructor(props){
        super(props);

        this.handleFiles = this.handleFiles.bind(this);
    }

    renderImage(file,metadata){

        // Create a file reader
        var reader = new FileReader();

        // Set the image once loaded into file reader
        reader.onload = (e)=>{
            var _camerainput = this;
            var img = new Image();
            img.onload = function(){
                _camerainput.props.onReady(this,metadata.orientation);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleFiles(){
        //console.log("hi");
        var filesToUpload = this.refs.input.files;
        var file = filesToUpload[0];

        getOrientation(file, (orientation)=> {
            this.renderImage(file,{
                orientation: orientation
            });
        });

    }

    render(){
        return (
            <div>
                <input ref="input" id="input" type="file" onChange={this.handleFiles} />
                <label htmlFor="input">Upload Photo</label>
            </div>
        );
    }
}




class Main extends React.Component{

    constructor(props){
        super(props);
        this.state = {};
    }

    componentDidMount(){
        canvas = document.getElementById("canvas");
        canvas.width = 400;// window.innerWidth;
        canvas.height = 400;//window.innerHeight;
        context = canvas.getContext("2d");
    }

    handleClick(){
        //window.alert("I was clicked.");
    }

    drawOnCanvas(img,orientation){
        //console.log(img,orientation);
        //console.log(img.naturalWidth,img.naturalHeight);

        var imgWidth = (orientation>=5 && orientation <= 8)? img.naturalHeight : img.naturalWidth;
        var imgHeight = (orientation>=5 && orientation <= 8)? img.naturalWidth : img.naturalHeight;

        canvas.width = imgWidth;
        canvas.height = imgHeight;

        switch(orientation){

            case 8:
            context.rotate(-45*Math.PI/180);
            break;
            case 3:
            context.rotate(180*Math.PI/180);
            break;
            case 6:
            context.translate(imgWidth,0);
            context.rotate(90*Math.PI/180);
            break;
            default:
            break;

        }

        context.drawImage(img,0,0,img.naturalWidth,img.naturalHeight);

        context.setTransform(1,0,0,1,0,0);


    }

    scaleDownTo(width,height){
        // intermediary
        let cvs = document.createElement('canvas');

        let currentWidth = canvas.width, currentHeight = canvas.height;

        cvs.width = currentWidth;
        cvs.height = currentHeight;

        let cxt = cvs.getContext('2d');
        cxt.drawImage(canvas,0,0,cvs.width,cvs.height);

        while(currentWidth > 2*width && currentHeight > 2*height){
            cxt.drawImage(cvs,0,0,currentWidth,currentHeight,0,0,currentWidth/2,currentHeight/2);
            currentWidth /= 2;
            currentHeight /= 2;
        }

        // direct scale.
        canvas.width = width;
        canvas.height = height;
        context.drawImage(cvs,0,0,currentWidth,currentHeight,0,0,width,height);

    }

    getAspectRatio(){
        return canvas.width / canvas.height;
    }

    getBooleanGrid(canvas){
        let context = canvas.getContext('2d');
        let imgData = context.getImageData(0,0,canvas.width,canvas.height);
        let data = imgData.data;
        let i,l=data.length,arr= [];
        for(i=0;i<l;i+=4){
            let black = data[i] === 0;
            arr.push(black);
        }
        return arr;
    }

    colorGroup(data,group,r,g,b){
        // for each pixel in the group.
        let j,ll = group.length;
        for(j=0;j<ll;j++){

            let iii = group[j]*4;
            data[iii] = r;
            data[iii+1] = g;
            data[iii+2] = b;
        }
        return data;
    }

    reflectGroups(groups){
        //console.log(groups);

        let imgData = context.getImageData(0,0,canvas.width,canvas.height);
        let data = imgData.data;

        let gIndexes = Object.keys(groups);

        // filtering...
        gIndexes = gIndexes.filter((v)=>{
            return groups[v].length > 20; // more than 20 pixels.
        });
        //

        let i,l=gIndexes.length;

        // for each group.
        for(i=0;i<l;i++){

            let g = groups[gIndexes[i]];
            if(gIndexes[i] == -1) continue; // don't bother with white.

            data = this.colorGroup(data,g,255,0,0);

        }

        context.putImageData(imgData,0,0);
    }

    isolateGroup(canvas,group){
        //console.log(group);
        let context = canvas.getContext('2d');

        // paint a white backdrop.
        context.fillStyle = 'white';
        context.fillRect(0,0,canvas.width,canvas.height);

        let imgData = context.getImageData(0,0,canvas.width,canvas.height);
        let data = imgData.data;
        data = this.colorGroup(data, group, 0, 0, 0);

        data; // absolutely pointless.

        context.putImageData(imgData,0,0);
    }

    copyToResult(imgData){
        var cvs = this.refs.result;
        cvs.width = imgData.width;
        cvs.height = imgData.height;
        var cxt = cvs.getContext('2d');
        cxt.putImageData(imgData,0,0);
    }

    handleStageOne(img,or){
        this.drawOnCanvas(img,or);
        let aspect = this.getAspectRatio();
        this.scaleDownTo(400,400/aspect);
        grayscale(canvas);
        minMaxGray(canvas);
        binaryBlackAndWhite(canvas);
    }

    handleStageTwo(groups){


        //let info = getGroupInfo(groups[132017],canvas.width,canvas.height);

        this.copyToResult(context.getImageData(0,0,canvas.width,canvas.height));

        let gIndexes = Object.keys(groups);
        var sorted = gIndexes.sort((a,b)=>{
            if(groups[a].length > groups[b].length) return -1;
            if(groups[a].length < groups[b].length) return 1;
            return 0;
        });
        this.isolateGroup( this.refs.result, groups[sorted[0]] );

    }

    handleSelectChange(e){
        let val = e.target.value;
        //console.log(val);
        this.isolateGroup(this.refs.result,this.state.groups[val]);
        this.renderToOutputCanvas(this.state.groups[val],this.refs.result,this.refs.output);
        let this_is = this.classifyGroup(this.state.groups[val],this.refs.result);
        if(this_is){
            //console.log("this is ",this_is);
        }
    }

    classifyGroup(group,srcCanvas){
        var canvas_initial = document.createElement('canvas');

        var rc = srcCanvas;

        var info = getGroupInfo(group,rc.width,rc.height);
        //console.log(info);
        var width = 1+info.x[1]-info.x[0],
            height= 1+info.y[1]-info.y[0];

        //console.log(width,height);

        group = adjustGroup(group,info,rc.width);

        canvas_initial.width = width;
        canvas_initial.height = height;

        canvas_initial.getContext('2d').fillRect(0,0,width,height);

        this.isolateGroup(canvas_initial,group);

        var canvas_100x100 = document.createElement('canvas');
        canvas_100x100.width = 100;
        canvas_100x100.height = 100;

        var context = canvas_100x100.getContext('2d');
        context.drawImage(canvas_initial,0,0,100,100);

        let bgrid = this.getBooleanGrid(canvas_100x100);

        function compareToMask(bgrid,mask){
            return 1 - (
                bgrid.map((v,i)=>{ return v ^ mask[i];}).filter((v)=>v).length / 10000.0
            );
        }

        var arr = [
            {mask:Masks.ONE_MASK,msg:"one"},
            {mask:Masks.TWO_MASK,msg:"two"},
            {mask:Masks.THREE_MASK,msg:"three"},
            {mask:Masks.FOUR_MASK,msg:"four"},
            {mask:Masks.FIVE_MASK,msg:"five"},
            {mask:Masks.SIX_MASK,msg:"six"},
            {mask:Masks.SEVEN_MASK,msg:"seven"},
            {mask:Masks.EIGHT_MASK,msg:"eight"},
            {mask:Masks.NINE_MASK,msg:"nine"},
        ];

        let i;
        var scores = [];
        for(i=0;i<9;i++){
            scores.push(compareToMask(bgrid,arr[i].mask));
        }
        var indMaxScore = 0;
        for(i=1;i<9;i++){
            if(scores[i] > scores[indMaxScore]) indMaxScore = i;
        }
        if(scores[indMaxScore] < 0.7){
            return null;
        }else{
            return arr[indMaxScore].msg;
        }

    }

    renderToOutputCanvas(group,srcCanvas,destCanvas){
        var canvas = document.createElement('canvas');

        var rc = srcCanvas;

        var info = getGroupInfo(group,rc.width,rc.height);
        var width = 1+info.x[1]-info.x[0],
            height= 1+info.y[1]-info.y[0];

        group = adjustGroup(group,info,rc.width);

        canvas.width = width;
        canvas.height = height;

        canvas.getContext('2d').fillRect(0,0,width,height);

        this.isolateGroup(canvas,group);

        var context = destCanvas.getContext('2d');
        context.drawImage(canvas,0,0,100,100);

        //console.log(this.getBooleanGrid(destCanvas));


    }

    render(){

        let groups = this.state.groups || {};
        let gIndexes = Object.keys(groups);

        let options = gIndexes.map((v,i)=>{
            return (<option value={v} key={i}>{"unknown"}</option>);
        });

        return (
            <div>
                <CameraInput onReady={(img,or)=>{
                    this.handleStageOne(img,or);


                    let booleanGrid = this.getBooleanGrid(canvas);

                    let groups = findConnectedGroups(booleanGrid,canvas.width,canvas.height);
                    //window.GROUPS = groups;
                    this.reflectGroups(groups);

                    function project(map,fn){
                        return Object.keys(map).reduce((a,b)=>{
                            a[b] = fn(map[b],b);
                            return a;
                        },{});
                    }

                    let group_info = project(groups,(v)=>{
                        var info = getGroupInfo(v,canvas.width,canvas.height);
                        info.classification = this.classifyGroup(v,canvas);
                        return info;
                    });

                    console.log(group_info);
                    let sudgrid = determineSudokuGrid(group_info);

                    // hook into sudoku.
                    let o = {};
                    let _cells = sudgrid.map((v,i)=>{
                        return {
                            id:i,
                            value:v,
                            notes:{
                                given:true,
                                options:[]
                            }
                        };
                    });
                    o.cells = [];
                    for(let i=0;i<81;i+=9){
                        o.cells.push(_cells.slice(i,i+9));
                    }

                    localStorage.setItem('game_in_progress',JSON.stringify(o));

                    alert("Done!");
                }}/>

                <a href="./..">Back to Sudoku</a>
                <canvas style={{float:'left'}} id="canvas" height="500" width="500"></canvas>
                <canvas style={{float:'left'}} ref="result" id="result" height="500" width="500"></canvas>
            </div>
        );
    }
}

export default Main;
