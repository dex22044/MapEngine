let mainCanvas;
let canvasContext;
let canvasMouseX = 0;
let canvasMouseY = 0;
let canvasMouseIsIn = false;
let questionBoxElem;
let objNameShowBoxElem;
let objNameShowBoxTextElem;
let questionId = 0;
let prevWrongQuestionId = -1;

let totalQuestionsBox;
let rightQuestionsBox;
let markBox;

let totalQuestions = 0;
let rightQuestions = 0;

let mode = 'test';

function max(a, b) { return a > b ? a : b; }
function min(a, b) { return a < b ? a : b; }

let mapConfig;
let mapObjects = [];

//#region Intersection math shit
function area(a, b, c) {
	return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
 
function intersect_1(a, b, c, d) {
	let aa = min(a, b); let bb = max(a, b);
	let cc = min(c, d); let dd = max(c, d);
	return max(aa,cc) <= min(bb,dd);
}
 
function intersect(a, b, c, d) {
	return intersect_1 (a[0], b[0], c[0], d[0])
		&& intersect_1 (a[1], b[1], c[1], d[1])
		&& area(a,b,c) * area(a,b,d) <= 0
		&& area(c,d,a) * area(c,d,b) <= 0;
}

function pointToSegmentDist(x, y, x1, y1, x2, y2) {

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;
  
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;
  
    var xx, yy;
  
    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
  
    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
//#endregion

window.addEventListener('load', async function() {
    mainCanvas = this.document.querySelector('#MapEngine_Display');
    questionBoxElem = this.document.querySelector('#MapEngine_QuestionText');
    objNameShowBoxElem = this.document.querySelector('#MapEngine_ObjectShow');
    objNameShowBoxTextElem = this.document.querySelector('#MapEngine_ObjectShowText');
    
    totalQuestionsBox = this.document.querySelector('.MapEngine_Marks_QuesTotal');
    rightQuestionsBox = this.document.querySelector('.MapEngine_Marks_QuesRight');
    markBox = this.document.querySelector('.MapEngine_Marks_FinalMark');

    canvasContext = mainCanvas.getContext('2d');
    this.setInterval(updateCanvasSize, 100);
    this.setInterval(canvasRender, 20);
    this.setInterval(updateStats, 100);
    mainCanvas.addEventListener('mousemove', canvasMouseMoved);
    mainCanvas.addEventListener('mouseover', canvasMouseOver);
    mainCanvas.addEventListener('mouseout', canvasMouseOut);
    mainCanvas.addEventListener('click', canvasClicked);
    mainCanvas.addEventListener('contextmenu', canvasRightClick);

    let response = await fetch('configs/Map7/AfricaFis.json');

    if(response.ok) {
        mapConfig = await response.json();
        mapObjects = mapConfig.objects;
    } else {
        this.alert('Loading error');
    }
});

//#region Events and timed shit
function updateCanvasSize() {
    mainCanvas.width = mainCanvas.clientWidth;
    mainCanvas.height = mainCanvas.clientHeight;
}

function canvasMouseMoved(ev) {
    canvasMouseX = ev.clientX - mainCanvas.getBoundingClientRect().left;
    canvasMouseY = ev.clientY - mainCanvas.getBoundingClientRect().top;
}

function canvasMouseOver(ev) {
    canvasMouseIsIn = true;
}

function canvasMouseOut(ev) {
    canvasMouseIsIn = false;
}

function updateStats() {
    totalQuestionsBox.innerText = totalQuestions;
    rightQuestionsBox.innerText = rightQuestions;

    if(totalQuestions == 0) markBox.innerText = "0%";
    else markBox.innerText = `${Math.round(rightQuestions * 1000 / totalQuestions) / 10}%`;
}

function canvasClicked() {
    if(mode == 'test') {
        let objectId = -1;
        for(let i = 0; i < mapObjects.length; i++) {
            if(mapObjects[i].type == 'contour') {
                let tpos = mapObjects[i].transform.position;
                let intersectCount = 0;
                let cc = mapObjects[i].contours;

                for(let cidx = 0; cidx < cc.length; cidx++) {
                    let c = cc[cidx];
                    for(let j = 0; j < c.length; j++) {
                        if(intersect([canvasMouseX, canvasMouseY + 0.1], [canvasMouseX + 1000, canvasMouseY + 0.1],
                                        [c[j][0] + tpos[0], c[j][1] + tpos[1]], [c[(j + 1) % c.length][0] + tpos[0], c[(j + 1) % c.length][1] + tpos[1]])) intersectCount++;
                    }
                }
                
                if(intersectCount % 2 == 1) {
                    objectId = i;
                    break;
                }
            }

            if(mapObjects[i].type == 'point') {
                let dx = canvasMouseX - mapObjects[i].position[0];
                let dy = canvasMouseY - mapObjects[i].position[1];
                let distance = Math.sqrt(dx * dx + dy * dy);
                if(distance <= mapObjects[i].position[2]) {
                    objectId = i;
                    break;
                }
            }

            if(mapObjects[i].type == 'line') {
                let tpos = mapObjects[i].transform.position;
                let ll = mapObjects[i].lines;
                let lw = mapObjects[i].lineWidth;

                for(let lidx = 0; lidx < ll.length; lidx++) {
                    let l = ll[lidx];
                    for(let j = 0; j < l.length - 1; j++) {
                        if(pointToSegmentDist(canvasMouseX, canvasMouseY, l[j][0] + tpos[0], l[j][1] + tpos[1], l[j + 1][0] + tpos[0], l[j + 1][1] + tpos[1]) <= lw) {
                            objectId = i;
                            break;
                        }
                    }
                }
            }
        }

        if(objectId == -1) return;

        if(objectId == questionId) {
            if(questionId != prevWrongQuestionId) {
                rightQuestions++;
                totalQuestions++;
            }
            questionId++;
            prevWrongQuestionId = -1;
            if(questionId >= mapObjects.length) questionId = 0;
        } else {
            mode = 'wrong';
            if(questionId != prevWrongQuestionId) totalQuestions++;
            prevWrongQuestionId = questionId;
        }
        return;
    }

    if(mode == 'wrong') mode = 'test';
}

function canvasRightClick() {
    console.log(canvasMouseX + ' ' + canvasMouseY);
    return false;
}
//#endregion

//#region All the rendering shit
function canvasRender() {
    if(mode == 'test') {
        canvasContext.clearRect(0, 0, 5000, 5000);

        questionBoxElem.innerText = `Где ${mapObjects[questionId].shortName}?`;
        objNameShowBoxElem.style.visibility = `hidden`;

        if(canvasMouseIsIn) {
            let objectId = -1;
            for(let i = 0; i < mapObjects.length; i++) {
                if(mapObjects[i].type == 'contour') {
                    let tpos = mapObjects[i].transform.position;
                    let intersectCount = 0;
                    let cc = mapObjects[i].contours;

                    for(let cidx = 0; cidx < cc.length; cidx++) {
                        let c = cc[cidx];
                        for(let j = 0; j < c.length; j++) {
                            if(intersect([canvasMouseX, canvasMouseY + 0.1], [canvasMouseX + 1000, canvasMouseY + 0.1],
                                            [c[j][0] + tpos[0], c[j][1] + tpos[1]], [c[(j + 1) % c.length][0] + tpos[0], c[(j + 1) % c.length][1] + tpos[1]])) intersectCount++;
                        }
                    }
                    
                    if(intersectCount % 2 == 1) {
                        objectId = i;
                        break;
                    }
                }

                if(mapObjects[i].type == 'point') {
                    let dx = canvasMouseX - mapObjects[i].position[0];
                    let dy = canvasMouseY - mapObjects[i].position[1];
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if(distance <= mapObjects[i].position[2]) {
                        objectId = i;
                        break;
                    }
                }

                if(mapObjects[i].type == 'line') {
                    let tpos = mapObjects[i].transform.position;
                    let ll = mapObjects[i].lines;
                    let lw = mapObjects[i].lineWidth;

                    for(let lidx = 0; lidx < ll.length; lidx++) {
                        let l = ll[lidx];
                        for(let j = 0; j < l.length - 1; j++) {
                            if(pointToSegmentDist(canvasMouseX, canvasMouseY, l[j][0] + tpos[0], l[j][1] + tpos[1], l[j + 1][0] + tpos[0], l[j + 1][1] + tpos[1]) <= lw) {
                                objectId = i;
                                break;
                            }
                        }
                    }
                }
            }

            console.log(objectId);

            if(objectId != -1) {
                if(mapObjects[objectId].type == 'contour') {
                    let tpos = mapObjects[objectId].transform.position;
                    
                    canvasContext.lineWidth = 2;
                    canvasContext.strokeStyle = '#FF0000';
                    let cc = mapObjects[objectId].contours;

                    for(let cidx = 0; cidx < cc.length; cidx++) {
                        let c = cc[cidx];
                        canvasContext.beginPath();
                        canvasContext.moveTo(c[0][0] + tpos[0], c[0][1] + tpos[1]);
                        for(let j = 0; j < c.length; j++) {
                            canvasContext.lineTo(c[j][0] + tpos[0], c[j][1] + tpos[1]);
                        }
                        canvasContext.lineTo(c[0][0] + tpos[0], c[0][1] + tpos[1]);
                        canvasContext.stroke();
                    }
                }

                if(mapObjects[objectId].type == 'point') {
                    let p = mapObjects[objectId].position;
                    canvasContext.fillStyle = '#FF0000';
                    canvasContext.beginPath();
                    canvasContext.arc(p[0], p[1], p[2], 0, 2 * Math.PI, false);
                    canvasContext.fill();
                }

                if(mapObjects[objectId].type == 'line') {
                    let tpos = mapObjects[objectId].transform.position;
                    let ll = mapObjects[objectId].lines;
                    let lw = mapObjects[objectId].lineWidth;

                    canvasContext.lineWidth = lw * 2;
                    canvasContext.strokeStyle = '#FF0000';

                    for(let lidx = 0; lidx < ll.length; lidx++) {
                        let l = ll[lidx];
                        canvasContext.beginPath();
                        canvasContext.moveTo(l[0][0] + tpos[0], l[0][1] + tpos[1]);
                        for(let j = 0; j < l.length; j++) {
                            canvasContext.lineTo(l[j][0] + tpos[0], l[j][1] + tpos[1]);
                        }
                        canvasContext.stroke();
                    }
                }
            }
        }
    }

    if(mode == 'wrong') {
        canvasContext.clearRect(0, 0, 5000, 5000);
        
        let objectId = questionId;

        let minX = 9999;
        let maxX = 0;
        let maxY = 0;

        if(objectId != -1) {
            objNameShowBoxTextElem.innerText = mapObjects[objectId].name;

            if(mapObjects[objectId].type == 'contour') {
                let tpos = mapObjects[objectId].transform.position;
                
                canvasContext.lineWidth = 2;
                canvasContext.strokeStyle = '#FF0000';
                let cc = mapObjects[objectId].contours;

                for(let cidx = 0; cidx < cc.length; cidx++) {
                    let c = cc[cidx];
                    canvasContext.beginPath();
                    canvasContext.moveTo(c[0][0] + tpos[0], c[0][1] + tpos[1]);
                    for(let j = 0; j < c.length; j++) {
                        canvasContext.lineTo(c[j][0] + tpos[0], c[j][1] + tpos[1]);

                        minX = min(minX, c[j][0] + tpos[0]);
                        maxX = max(maxX, c[j][0] + tpos[0]);
                        maxY = max(maxY, c[j][1] + tpos[1]);
                    }
                    canvasContext.lineTo(c[0][0] + tpos[0], c[0][1] + tpos[1]);
                    canvasContext.stroke();
                }
            }

            if(mapObjects[objectId].type == 'point') {
                let p = mapObjects[objectId].position;
                canvasContext.fillStyle = '#FF0000';
                canvasContext.beginPath();
                canvasContext.arc(p[0], p[1], p[2], 0, 2 * Math.PI, false);
                minX = p[0];
                maxX = p[0];
                maxY = p[1] + p[2];
                canvasContext.fill();
            }

            if(mapObjects[objectId].type == 'line') {
                let tpos = mapObjects[objectId].transform.position;
                let ll = mapObjects[objectId].lines;
                let lw = mapObjects[objectId].lineWidth;

                canvasContext.lineWidth = lw * 2;
                canvasContext.strokeStyle = '#FF0000';

                for(let lidx = 0; lidx < ll.length; lidx++) {
                    let l = ll[lidx];
                    canvasContext.beginPath();
                    canvasContext.moveTo(l[0][0] + tpos[0], l[0][1] + tpos[1]);
                    for(let j = 0; j < l.length; j++) {
                        canvasContext.lineTo(l[j][0] + tpos[0], l[j][1] + tpos[1]);

                        minX = min(minX, l[j][0] + tpos[0]);
                        maxX = max(maxX, l[j][0] + tpos[0]);
                        maxY = max(maxY, l[j][1] + tpos[1]);
                    }
                    canvasContext.stroke();
                }
            }

            objNameShowBoxElem.style.left = `${(minX + maxX) / 2 + mainCanvas.getBoundingClientRect().left - 200}px`;
            objNameShowBoxElem.style.top = `${maxY + 10 + mainCanvas.getBoundingClientRect().top}px`;
            objNameShowBoxElem.style.visibility = `visible`;
        }
    }
}
//#endregion