gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

ScrollTrigger.normalizeScroll(true)

const dots = document.querySelectorAll('.dot');
const texts = document.querySelectorAll('.text');
const icons = document.querySelectorAll('.icon');
const controlBar = document.getElementById('procedure__slider-control-bar');
const controlBarActive = document.getElementById('procedure__slider-control-bar-active');
const mainPath = document.getElementById('path');
const activePath = document.getElementById('active-path');
const svgContainer = document.getElementById('svg');
const content = document.getElementById('content')
const pathLength = mainPath.getTotalLength();
const procedureSlide = document.querySelectorAll('.procedure__slide');
const procedureSlideDisplay = document.querySelectorAll('.procedure__slider-display')[0];
const firstProcedureSlide = procedureSlide[0];
let isContentCentered = false;

let currentDotIndex = 0;
var lastScroll = 0;
const viewportCenter = window.innerHeight / 2;
const viewportBottom = window.innerHeight;
const procedureSlideDisplayHeight = procedureSlideDisplay.getBoundingClientRect().height;
const additionalDistance = (viewportBottom - viewportCenter) <= pathLength ? (viewportBottom - viewportCenter) : pathLength;

const controlBarHeight = controlBar.offsetHeight;
const controlBarActiveHeight = controlBarHeight / 10;
const dotCoordinates = [];

controlBarActive.style.height = controlBarActiveHeight + 'px';
const pathData = mainPath.getAttribute('d');
let isTouchMove = false;
var touchPos;
const startCoordMatch = pathData.match(/^M\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/);
const lastPoint = mainPath.getPointAtLength(pathLength);

let startX = 0, endX = 0;
let startY = 0, endY = 0;
startX = parseFloat(startCoordMatch[1]);
startY = parseFloat(startCoordMatch[2]);
endX = lastPoint.x;
endY = lastPoint.y;

ScrollTrigger.create({
    trigger: content,
    pin: true,
    start: 'center center',
    end: () => {
        return window.innerWidth > 996 ? `+=${pathLength} bottom` : `+=${pathLength * 3} bottom`;
    },
    scrub: 1,
    onUpdate: (self) => {
        if (self.progress === 1 || self.progress === 0) {
            isContentCentered = false
        }

        if ((self.progress > 0 && self.progress < 1) && isContentCentered != true) {
            isContentCentered = true;
        }
    }
})

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

const circles = document.querySelectorAll('circle.dot');

circles.forEach(circle => {
    const cx = parseFloat(circle.getAttribute('cx'));
    const cy = parseFloat(circle.getAttribute('cy'));
    dotCoordinates.push({ x: cx, y: cy });
});

dotCoordinates.unshift({ x: startX, y: startY });
dotCoordinates.push({ x: endX, y: endY });
const distances = [];
let activePathLength = 0;
let sum = 0;
let scrollOfDots = new Map();
let totalScrollTrigger = procedureSlideDisplayHeight * 3;

for (let i = 0; i < dotCoordinates.length - 1; i++) {
    let distance = 0;
    let x1, y1, x2, y2;

    x1 = dotCoordinates[i].x;
    y1 = dotCoordinates[i].y;
    x2 = dotCoordinates[i + 1].x;
    y2 = dotCoordinates[i + 1].y;

    if (i !== 3 && i !== 6) {
        distance = calculateDistance(x1, y1, x2, y2);
    }

    distances.push(distance);
    sum += distance;
}

const curveDistance = (pathLength - sum) / 2;
distances[3] = curveDistance;
distances[6] = curveDistance;

const stopPoints = distances.reduce((acc, distance) => {
    const lastStopPoint = acc[acc.length - 1] || 0;
    acc.push(lastStopPoint + distance);
    return acc;
}, []);

let isUpdatingDotIndex = false;

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentDotIndex = index;
        activePath.style.strokeDashoffset = pathLength - stopPoints[currentDotIndex]
        updateElements(currentDotIndex);
        const scrollY = window.scrollY;
        if (scrollOfDots.has(currentDotIndex) !== true) {
            scrollOfDots.set(currentDotIndex, scrollY);
        }
        window.scroll(0, scrollOfDots.get(currentDotIndex))
        gsap.to(content, {
            scrollTo: {
                y: scrollOfDots.get(currentDotIndex),
                autoKill: false
            },
            duration: 1
        });
    });
});

const dotDistances = dotCoordinates.map((coord, index) => {
    const point = activePath.getPointAtLength(index * (pathLength / (dots.length - 1)));
    const distance = Math.sqrt(
        Math.pow(point.x - coord.x, 2) +
        Math.pow(point.y - coord.y, 2)
    );
    return distance;
});

activePath.style.strokeDasharray = pathLength;
activePath.style.strokeDashoffset = pathLength - stopPoints[0];

function startAnimation() {
    if (isContentCentered) {
        let currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
        if (currentScroll > 0 && lastScroll <= currentScroll) {
            lastScroll = currentScroll;
            currentDotIndex = Math.min(currentDotIndex + 1, 10);
        } else {
            lastScroll = currentScroll;
            currentDotIndex = Math.max(currentDotIndex - 1, 0);
        }
        const scrollY = window.scrollY;
        console.log("scrollY:::", scrollY);
        if (scrollOfDots.has(currentDotIndex) !== true) {
            scrollOfDots.set(currentDotIndex, scrollY);
        }


        gsap.to(activePath, {
            strokeDashoffset: pathLength - stopPoints[currentDotIndex],
            duration: 0.5,
        });

        updateElements(currentDotIndex);
    }
}

function updateElements(currentDotIndex) {

    dots.forEach((dot, index) => {
        if (index > currentDotIndex) {
            dot.style.fill = '#CECECE';
        } else {
            dot.style.fill = '#F9841A';
        }
    });

    texts.forEach((text, index) => {
        if (index > currentDotIndex) {
            text.style.fill = '#585858';
        } else {
            text.style.fill = '#297A4F';
        }
    });

    icons.forEach((icon, index) => {
        const paths = icon.querySelectorAll('path');
        paths.forEach(path => {
            if (index > currentDotIndex) {
                path.setAttribute('fill', '#CECECE');
            } else {
                path.setAttribute('fill', '#297A4F');
            }
        });
    });

    firstProcedureSlide.style.marginTop = `-${(Math.min(currentDotIndex, 8)) * procedureSlideDisplayHeight}px`;
    controlBarActive.style.top = `${(Math.min(currentDotIndex, 9)) * controlBarActiveHeight}px`;
}

window.addEventListener('wheel', startAnimation);

document.body.ontouchstart = function(e){
    touchPos = e.changedTouches[0].clientY;
}

document.body.ontouchend = function(e){
    if (isTouchMove === true) {
        let newTouchPos = e.changedTouches[0].clientY;
        const scrollY = Math.abs(newTouchPos - touchPos);
        if (scrollY > 300) {
            if(newTouchPos > touchPos) {
                currentDotIndex = Math.max(currentDotIndex - 1, 0);
            }
            if(newTouchPos < touchPos) {
                currentDotIndex = Math.min(currentDotIndex + 1, 10);
            }

            if (scrollOfDots.has(currentDotIndex) !== true) {
                scrollOfDots.set(currentDotIndex, scrollY);
            }
            gsap.to(activePath, {
                strokeDashoffset: pathLength - stopPoints[currentDotIndex],
                duration: 0.5,
            });

            updateElements(currentDotIndex);
        }

    }
    isTouchMove = false;

}

document.body.ontouchmove = function(e){
    isTouchMove = true;
    console.log("move");
}
