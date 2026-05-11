let capture;
let facemesh;
let predictions = [];
let handpose;
let handPredictions = [];
let earringImgs = [];
let currentEarringIndex = 1; // 預設顯示第一副耳環
let maskImg;

function preload() {
  // 初始化 ml5.js FaceMesh 模型
  facemesh = ml5.faceMesh();
  // 初始化 ml5.js HandPose 模型
  handpose = ml5.handPose();
  // 依照手勢指定的檔名載入耳環圖片
  earringImgs[1] = loadImage('pic/acc1_ring.png');
  earringImgs[2] = loadImage('pic/acc2_pearl.png');
  earringImgs[3] = loadImage('pic/acc3_tassel.png');
  earringImgs[4] = loadImage('pic/acc4_jade.png');
  earringImgs[5] = loadImage('pic/acc5_phoenix.png');
  // 載入臉部面具圖片
  maskImg = loadImage('pic/mask/4379901.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設的 HTML 影片元素，只在畫布上繪製

  // 開始偵測並監聽預測結果
  facemesh.detectStart(capture, results => {
    predictions = results;
  });

  // 開始偵測並監聽手勢結果
  handpose.detectStart(capture, results => {
    handPredictions = results;
  });
}

function draw() {
  background('#e7c6ff');
  
  // 偵測手勢，如果比出 1~5，就將目前的耳環索引換成該數字
  let fingers = countFingers();
  if (fingers >= 1 && fingers <= 5) {
    currentEarringIndex = fingers;
  }
  
  let imgWidth = windowWidth * 0.5;
  let imgHeight = windowHeight * 0.5;
  
  push();
  translate(windowWidth / 2, windowHeight / 2); // 將原點移到視窗正中央
  scale(-1, 1); // 左右翻轉畫布
  imageMode(CENTER);
  image(capture, 0, 0, imgWidth, imgHeight);

  // 繪製臉部面具
  drawMask(imgWidth, imgHeight);
  // 繪製耳垂辨識點
  drawEarlobes(imgWidth, imgHeight);
  pop();
}

function drawEarlobes(imgWidth, imgHeight) {
  // 確保已經抓取到臉部且攝影機已經準備好長寬屬性
  if (predictions.length > 0 && capture.width > 0) {
    let keypoints = predictions[0].keypoints;

    // 在 MediaPipe FaceMesh 中，節點 177 與 401 約略對應左耳垂與右耳垂
    let leftEar = keypoints[132]; //132 , 177
    let rightEar = keypoints[361];  //361 ,401

    // 由於我們調整了影像比例並將其移到了畫布中央 (imageMode CENTER)，
    // 必須將偵測到的原始座標映射到當前對應的縮放比例及座標軸上。
    let mapX = (x) => map(x, 0, capture.width, -imgWidth / 2, imgWidth / 2);
    let mapY = (y) => map(y, 0, capture.height, -imgHeight / 2, imgHeight / 2);

    // 繪製耳環圖片 (設定寬高為 40x40，您可以視耳環圖檔的比例自行調整大小)
    let earringSize = 40;
    let currentImg = earringImgs[currentEarringIndex];
    image(currentImg, mapX(leftEar.x), mapY(leftEar.y), earringSize, earringSize); 
    image(currentImg, mapX(rightEar.x), mapY(rightEar.y), earringSize, earringSize); 
  }
}

function drawMask(imgWidth, imgHeight) {
  if (predictions.length > 0 && capture.width > 0) {
    let keypoints = predictions[0].keypoints;

    // 取鼻尖為中心 (節點 1)
    let nose = keypoints[1];
    // 取臉頰左右兩側來計算臉部寬度 (節點 234, 454)
    let leftCheek = keypoints[234];
    let rightCheek = keypoints[454];
    // 取額頭與下巴來計算臉部高度 (節點 10, 152)
    let topEdge = keypoints[10];
    let bottomEdge = keypoints[152];

    let mapX = (x) => map(x, 0, capture.width, -imgWidth / 2, imgWidth / 2);
    let mapY = (y) => map(y, 0, capture.height, -imgHeight / 2, imgHeight / 2);

    // 計算對應的寬高，並稍微放大 (1.3倍) 以確保能完美覆蓋整個臉部
    let faceWidth = dist(mapX(leftCheek.x), mapY(leftCheek.y), mapX(rightCheek.x), mapY(rightCheek.y)) * 1.3;
    let faceHeight = dist(mapX(topEdge.x), mapY(topEdge.y), mapX(bottomEdge.x), mapY(bottomEdge.y)) * 1.3;

    image(maskImg, mapX(nose.x), mapY(nose.y), faceWidth, faceHeight);
  }
}

function countFingers() {
  // 尋找偵測到的手勢中，是否有右手
  for (let i = 0; i < handPredictions.length; i++) {
    let hand = handPredictions[i];
    if (hand.handedness === 'Left') {
      let kp = hand.keypoints;
      let fingers = 0;
      let d = (idx1, idx2) => dist(kp[idx1].x, kp[idx1].y, kp[idx2].x, kp[idx2].y);
      
      // 判斷大拇指：如果「拇指指尖(4)」到「小指根部(17)」的距離，大於「拇指關節(3)」到「小指根部」的距離，代表大拇指伸直
      if (d(4, 17) > d(3, 17)) fingers++;
      // 判斷其他四指：如果「指尖」到「手腕(0)」的距離，大於「第二關節」到「手腕」的距離，代表手指伸直
      if (d(8, 0) > d(6, 0)) fingers++; // 食指
      if (d(12, 0) > d(10, 0)) fingers++; // 中指
      if (d(16, 0) > d(14, 0)) fingers++; // 無名指
      if (d(20, 0) > d(18, 0)) fingers++; // 小指
      
      return fingers;
    }
  }
  return -1; // 沒偵測到右手時回傳 -1
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
