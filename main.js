let mainCanvas;
let canvasContext;
let canvasMouseX = 0;
let canvasMouseY = 0;
let canvasMouseIsIn = false;
let questionBoxElem;
let questionId = 0;

let totalQuestionsBox;
let rightQuestionsBox;
let markBox;

let totalQuestions = 0;
let rightQuestions = 0;

function max(a, b) { return a > b ? a : b; }
function min(a, b) { return a < b ? a : b; }

let mapObjects = [
    {
        'name': 'amogus',
        'contour': [
            [10.0, 10.0],
            [100.0, 10.0],
            [100.0, 100.0],
            [10.0, 100.0]
        ]
    },
    {
        'name': 'sugomgus',
        'contour': [
            [100.0, 100.0],
            [200.0, 50.0],
            [300.0, 100.0],
            [200.0, 150.0],
            [100.0, 200.0],
        ]
    }
];


function area (a, b, c) {
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


window.addEventListener('load', function() {
    mainCanvas = this.document.querySelector('#MapEngine_Display');
    questionBoxElem = this.document.querySelector('#MapEngine_QuestionText');
    
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
});

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
    let objectId = -1;
    for(let i = 0; i < mapObjects.length; i++) {
        let intersectCount = 0;
        let c = mapObjects[i].contour;
        for(let j = 0; j < c.length; j++) {
            if(intersect([canvasMouseX, canvasMouseY], [canvasMouseX + 1000, canvasMouseY],
                            c[j], c[(j + 1) % c.length])) intersectCount++;
        }
        if(intersectCount % 2 == 1) {
            objectId = i;
            break;
        }
    }

    if(objectId == -1) return;

    totalQuestions++;

    if(objectId == questionId) {
        rightQuestions++;
        questionId++;
        if(questionId >= mapObjects.length) questionId = 0;
    }
}

function canvasRender() {
    questionBoxElem.innerText = `Где ${mapObjects[questionId].name}?`;

    canvasContext.clearRect(0, 0, 5000, 5000);

    if(canvasMouseIsIn) {
        let objectId = -1;
        for(let i = 0; i < mapObjects.length; i++) {
            let intersectCount = 0;
            let c = mapObjects[i].contour;
            for(let j = 0; j < c.length; j++) {
                if(intersect([canvasMouseX, canvasMouseY], [canvasMouseX + 1000, canvasMouseY],
                                c[j], c[(j + 1) % c.length])) intersectCount++;
            }
            if(intersectCount % 2 == 1) {
                objectId = i;
                break;
            }
        }

        if(objectId != -1) {
            let c = mapObjects[objectId].contour;
            
            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = '#FF0000';
            canvasContext.beginPath();
            canvasContext.moveTo(c[objectId][0], c[objectId][1]);
            for(let j = 0; j < c.length; j++) {
                canvasContext.lineTo(c[j][0], c[j][1]);
            }
            canvasContext.lineTo(c[0][0], c[0][1]);
            canvasContext.stroke();
        }
    }
}