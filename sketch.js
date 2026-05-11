let capture;
let facemesh;
let predictions = [];

function preload() {
  // 初始化 ml5.js FaceMesh 模型
  facemesh = ml5.faceMesh();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設的 HTML 影片元素，只在畫布上繪製

  // 開始偵測並監聽預測結果
  facemesh.detectStart(capture, results => {
    predictions = results;
  });
}

function draw() {
  background('#e7c6ff');
  
  let imgWidth = windowWidth * 0.5;
  let imgHeight = windowHeight * 0.5;
  
  push();
  translate(windowWidth / 2, windowHeight / 2); // 將原點移到視窗正中央
  scale(-1, 1); // 左右翻轉畫布
  imageMode(CENTER);
  image(capture, 0, 0, imgWidth, imgHeight);

  // 繪製耳垂辨識點
  drawEarlobes(imgWidth, imgHeight);
  pop();
}

function drawEarlobes(imgWidth, imgHeight) {
  // 確保已經抓取到臉部且攝影機已經準備好長寬屬性
  if (predictions.length > 0 && capture.width > 0) {
    let keypoints = predictions[0].keypoints;

    // 在 MediaPipe FaceMesh 中，節點 177 與 401 約略對應左耳垂與右耳垂
    let leftEar = keypoints[177];
    let rightEar = keypoints[401];

    // 由於我們調整了影像比例並將其移到了畫布中央 (imageMode CENTER)，
    // 必須將偵測到的原始座標映射到當前對應的縮放比例及座標軸上。
    let mapX = (x) => map(x, 0, capture.width, -imgWidth / 2, imgWidth / 2);
    let mapY = (y) => map(y, 0, capture.height, -imgHeight / 2, imgHeight / 2);

    fill(255, 255, 0); // 設定為黃色
    noStroke();
    circle(mapX(leftEar.x), mapY(leftEar.y), 20); // 畫左耳垂
    circle(mapX(rightEar.x), mapY(rightEar.y), 20); // 畫右耳垂
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
